import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { DateTime } from 'luxon';
import { collectAllFieldNames, type LocaleCode } from 'shared/services/solr';
import { meetings as meetingSnapshot } from 'shared/data/meetings.js';
import activitiesSnapshot from 'shared/data/25-26-activities.js';
import notificationsSnapshot from 'shared/data/notifications.js';
import { loadSubjectOptions, buildSubjectLabelMap, type SubjectOption, setSubjectLabelMap as setSubjectLabelMapSubjects } from 'shared/utils/subjects';
import {
  buildDocsFromActivities,
  normalizeMeetingDoc,
  type SnapshotMeeting,
} from 'shared/utils/calendar-document-normalizer';
import { buildDocsFromNotifications, getNotificationKeys, notificationDisplayEntries, setNotificationStores } from 'shared/utils/notifications';
import type { NotificationDetails, NotificationKey } from 'shared/utils/notifications';
import {
  collectCountryEntries,
  collectGlobalTargetEntries,
  getDocBooleanValue,
  getDocCountries,
  getDocDecisionLabels,
  getDocGlobalTargets,
  getDocStringValue,
  getDocSubjects,
  getDocSubsidiaryBodies,
} from 'shared/utils/document-processing';
import { normalizeStatusKey } from 'shared/utils/status';
import { normalizeTypeKey } from 'shared/utils/type-colors';
import { resolveCountryLabel } from 'shared/utils/labels';
import { safeDate } from 'shared/utils/date';
import { fetchNotificationDetails } from 'shared/services/solr-index';
import type { CalendarDoc, FilterState, GroupedItem } from 'shared/types/calendar';

interface FilterOption {
  value: string;
  label: string;
}

const DEFAULT_SORT_VALUES = ['startDate:asc'] as const;

const defaultFilters: FilterState = {
  types: [],
  subjects: [],
  statuses: [],
  subsidiaryBodies: [],
  copDecisions: [],
  activityTypes: [],
  globalTargets: [],
  countries: [],
  startDate: '',
  endDate: '',
  actionRequired: false,
  sort: [...DEFAULT_SORT_VALUES],
};

export interface UseCalendarDataOptions {
  initialStartDate?: string;
  locale?: LocaleCode;
  messages?: {
    notificationNotFound?: () => string;
    notificationLoadFailed?: () => string;
  };
}

export function useCalendarData(options: UseCalendarDataOptions = {}) {
  const loading = ref<boolean>(true);
  const docs = ref<CalendarDoc[]>([]);
  const allFieldNames = ref<string[]>([]);
  const locale = ref<LocaleCode>(options.locale ?? 'en');
  const subjectOptions = ref<SubjectOption[]>([]);
  const currentFilters = ref<FilterState>({ ...defaultFilters, startDate: options.initialStartDate ?? '', sort: [...DEFAULT_SORT_VALUES] });
  const notificationDetailsMap = ref<Record<NotificationKey, NotificationDetails>>({});
  const notificationErrors = ref<Record<NotificationKey, string>>({});
  const notificationLoadingMap = ref<Record<NotificationKey, boolean>>({});
  const notificationNotFound = options.messages?.notificationNotFound ?? (() => 'Notification not found');
  const notificationLoadFailed = options.messages?.notificationLoadFailed ?? (() => 'Failed to load notification');

  setNotificationStores({
    getDetails: () => notificationDetailsMap.value,
    getLoading: () => notificationLoadingMap.value,
    getErrors: () => notificationErrors.value,
  });

  const subjectLabelMap = computed(() => buildSubjectLabelMap(subjectOptions.value));

  watch(subjectLabelMap, (map) => {
    setSubjectLabelMapSubjects(map);
  }, { immediate: true });

  watchEffect(() => {
    if (docs.value.length === 0) {
      allFieldNames.value = [];
      return;
    }
    allFieldNames.value = collectAllFieldNames(docs.value as Array<Record<string, unknown>>);
  });

  const notificationKeys = computed<NotificationKey[]>(() => {
    const keys = new Set<NotificationKey>();

    docs.value.forEach(doc => {
      getNotificationKeys(doc).forEach(key => keys.add(key));
    });

    return Array.from(keys).sort();
  });

  watch(notificationKeys, async (keys) => {
    if (!keys.length) {
      return;
    }

    const missing = keys.filter(key => {
      return !notificationDetailsMap.value[key]
        && !notificationLoadingMap.value[key]
        && !notificationErrors.value[key];
    });

    if (missing.length === 0) {
      return;
    }

    const nextLoading = { ...notificationLoadingMap.value };

    missing.forEach(key => {
      nextLoading[key] = true;
    });

    notificationLoadingMap.value = nextLoading;

    await Promise.all(missing.map(async key => {
      try {
        const details = await fetchNotificationDetails(key);

        if (details) {
          notificationDetailsMap.value = {
            ...notificationDetailsMap.value,
            [key]: details,
          };

          if (notificationErrors.value[key]) {
            const { [key]: _removed, ...restErrors } = notificationErrors.value;

            notificationErrors.value = restErrors;
          }
        } else {
          notificationErrors.value = {
            ...notificationErrors.value,
            [key]: notificationNotFound(),
          };
        }
      } catch (error) {
        notificationErrors.value = {
          ...notificationErrors.value,
          [key]: error instanceof Error ? error.message : notificationLoadFailed(),
        };
      } finally {
        const { [key]: _removed, ...restLoading } = notificationLoadingMap.value;

        notificationLoadingMap.value = restLoading;
      }
    }));
  }, { immediate: true });

  async function ensureSubjectLabels(): Promise<void> {
    if (subjectOptions.value.length > 0) {
      return;
    }

    try {
      subjectOptions.value = await loadSubjectOptions(locale.value);
    } catch (error) {
      console.error('Failed to load subject options', error);
      subjectOptions.value = [];
    }
  }

  async function loadSnapshotData(): Promise<void> {
    loading.value = true;
    const normalizedMeetings = meetingSnapshot.map((meeting, index) => normalizeMeetingDoc(meeting as SnapshotMeeting, index));
    const notificationSource = Array.isArray(notificationsSnapshot)
      ? notificationsSnapshot
      : [];
    const { docs: notificationDocs, details: notificationDetails } = buildDocsFromNotifications(notificationSource);

    if (Object.keys(notificationDetails).length > 0) {
      const seededDetails = { ...notificationDetailsMap.value };

      for (const [key, detail] of Object.entries(notificationDetails)) {
        if (!seededDetails[key]) {
          seededDetails[key as NotificationKey] = detail;
        }
      }

      notificationDetailsMap.value = seededDetails;
    }

    const activitiesDocs = activitiesSnapshot.length > 0
      ? buildDocsFromActivities(activitiesSnapshot)
      : [];

    docs.value = [...normalizedMeetings, ...activitiesDocs, ...notificationDocs];
    loading.value = false;
  }

  onMounted(() => {
    void loadSnapshotData();
    void ensureSubjectLabels();
  });

  type SortField = 'startDate' | 'endDate' | 'status' | 'schema' | 'actionRequired';
  type SortDirection = 'asc' | 'desc';

  interface SortDirective {
    field: SortField;
    direction: SortDirection;
  }

  const SORT_FIELDS: SortField[] = ['startDate', 'endDate', 'status', 'schema', 'actionRequired'];
  const FALLBACK_SORT_DIRECTIVE: SortDirective = { field: 'startDate', direction: 'asc' };

  const filteredDocs = computed<CalendarDoc[]>(() => {
    let filtered = docs.value;
    const filters = currentFilters.value;

    if (filters.types.length > 0) {
      filtered = filtered.filter(doc => {
        const candidates = new Set<string>();
        const schema = getDocStringValue(doc, 'schema');
        const rawType = getDocStringValue(doc, 'type');

        if (schema) {
          candidates.add(schema.trim().toLowerCase());
        }

        if (rawType) {
          candidates.add(normalizeTypeKey(rawType));
        }

        if (candidates.size === 0) {
          return false;
        }

        return Array.from(candidates).some(candidate => filters.types.includes(candidate));
      });
    }

    if (filters.activityTypes.length > 0) {
      filtered = filtered.filter(doc => {
        const activityType = getDocStringValue(doc, 'activityType');

        return activityType && filters.activityTypes.includes(activityType);
      });
    }

    if (filters.subjects.length > 0) {
      filtered = filtered.filter(doc => {
        const subjects = getDocSubjects(doc);

        return subjects.some(subject => filters.subjects.includes(subject));
      });
    }

    if (filters.globalTargets.length > 0) {
      filtered = filtered.filter(doc => {
        const targets = getDocGlobalTargets(doc);

        return targets.some(target => filters.globalTargets.includes(target));
      });
    }

    if (filters.countries.length > 0) {
      filtered = filtered.filter(doc => {
        const countries = getDocCountries(doc);

        return countries.some(country => filters.countries.includes(country));
      });
    }

    if (filters.statuses.length > 0) {
      filtered = filtered.filter(doc => {
        const key = getDocStringValue(doc, 'statusKey')
          ?? normalizeStatusKey(getDocStringValue(doc, 'status'));

        return !!key && filters.statuses.includes(key);
      });
    }

    if (filters.subsidiaryBodies.length > 0) {
      filtered = filtered.filter(doc => {
        const bodies = getDocSubsidiaryBodies(doc);

        return bodies.some(body => filters.subsidiaryBodies.includes(body));
      });
    }

    if (filters.copDecisions.length > 0) {
      filtered = filtered.filter(doc => {
        const decisions = getDocDecisionLabels(doc);

        return decisions.some(decision => filters.copDecisions.includes(decision));
      });
    }

    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(doc => {
        const startDate = safeDate(getDocStringValue(doc, 'startDate'));
        const endDate = safeDate(getDocStringValue(doc, 'endDate'));
        const docDate = startDate || endDate;

        if (!docDate) return false;
        const docDateIso = docDate.toISODate();

        if (!docDateIso) return false;

        if (filters.startDate) {
          const startFilter = DateTime.fromISO(filters.startDate, { zone: 'utc' }).toISODate();

          if (startFilter && docDateIso < startFilter) return false;
        }

        if (filters.endDate) {
          const endFilter = DateTime.fromISO(filters.endDate, { zone: 'utc' }).toISODate();

          if (endFilter && docDateIso > endFilter) return false;
        }

        return true;
      });
    }

    if (filters.actionRequired) {
      filtered = filtered.filter(doc => {
        const actionRequired = getDocBooleanValue(doc, 'actionRequired');

        return actionRequired === true;
      });
    }

    const sortDirectives = normalizeSortDirectives(filters.sort);

    return [...filtered].sort((a, b) => {
      for (const directive of sortDirectives) {
        const comparison = compareByDirective(a, b, directive);

        if (comparison !== 0) {
          return comparison;
        }
      }

      // Final deterministic fallback by start date then ID
      const fallbackComparison = compareByDirective(a, b, FALLBACK_SORT_DIRECTIVE);

      if (fallbackComparison !== 0) {
        return fallbackComparison;
      }

      return compareStringValues(String(a.id ?? ''), String(b.id ?? ''));
    });
  });

  const groupedItems = computed<GroupedItem[]>(() => {
    const buckets = new Map<string, { label: string; items: CalendarDoc[] }>();

    for (const d of filteredDocs.value) {
      const startDate = getDocStringValue(d, 'startDate');
      const endDate = getDocStringValue(d, 'endDate');
      const iso = startDate || endDate;
      const dt = iso ? DateTime.fromISO(String(iso)) : null;
      const key = dt ? dt.toFormat('yyyy-LL') : 'unknown';
      const label = dt ? dt.toFormat('LLLL yyyy') : 'Unknown date';

      if (!buckets.has(key)) buckets.set(key, { label, items: [] as CalendarDoc[] });
      buckets.get(key)!.items.push(d);
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => ({ key, label: v.label, items: v.items }));
  });

  const availableTypes = computed(() => {
    const types = new Set<string>();

    docs.value.forEach(doc => {
      const type = getDocStringValue(doc, 'type');

      if (type) types.add(String(type).trim());
    });
    return Array.from(types).sort();
  });

  const availableSubjects = computed(() => {
    const subjects = new Set<string>();

    docs.value.forEach(doc => {
      getDocSubjects(doc).forEach(subject => subjects.add(subject));
    });
    return Array.from(subjects).sort();
  });

  const availableStatuses = computed(() => {
    const statuses = new Set<string>();

    docs.value.forEach(doc => {
      const key = getDocStringValue(doc, 'statusKey')
        ?? normalizeStatusKey(getDocStringValue(doc, 'status'));

      if (key) statuses.add(key);
    });
    return Array.from(statuses).sort();
  });

  const availableSubsidiaryBodies = computed(() => {
    const bodies = new Set<string>();

    docs.value.forEach(doc => {
      getDocSubsidiaryBodies(doc).forEach(body => bodies.add(body));
    });
    return Array.from(bodies).sort();
  });

  const availableCopDecisions = computed(() => {
    const decisions = new Set<string>();

    docs.value.forEach(doc => {
      getDocDecisionLabels(doc).forEach(label => {
        if (label) {
          decisions.add(label);
        }
      });
    });
    return Array.from(decisions).sort();
  });

  const availableCountryOptions = computed<FilterOption[]>(() => {
    const map = new Map<string, string>();

    docs.value.forEach(doc => {
      collectCountryEntries(doc).forEach(({ value, label }) => {
        if (!value) {
          return;
        }
        const currentLabel = map.get(value);
        const finalLabel = resolveCountryLabel(value, label ?? currentLabel);

        if (!map.has(value) || (label && label.trim())) {
          map.set(value, finalLabel);
        }
      });
    });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  const availableGlobalTargetOptions = computed<FilterOption[]>(() => {
    const map = new Map<string, string>();

    docs.value.forEach(doc => {
      collectGlobalTargetEntries(doc).forEach(({ value, label }) => {
        if (!value) {
          return;
        }
        if (!map.has(value) || (label && label.trim())) {
          map.set(value, label?.trim() || value);
        }
      });
    });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  function parseSortValue(value: string): SortDirective | null {
    if (!value) {
      return null;
    }

    const [rawField, rawDirection] = value.split(':', 2);

    if (!rawField || !SORT_FIELDS.includes(rawField as SortField)) {
      return null;
    }

    const direction: SortDirection = rawDirection === 'desc' ? 'desc' : 'asc';

    return {
      field: rawField as SortField,
      direction,
    };
  }

  function normalizeSortDirectives(sortValues: string[] | undefined): SortDirective[] {
    const values = sortValues && sortValues.length > 0 ? sortValues : Array.from(DEFAULT_SORT_VALUES);
    const directives = values
      .map(parseSortValue)
      .filter((value): value is SortDirective => value !== null);

    if (directives.length === 0) {
      return [{ ...FALLBACK_SORT_DIRECTIVE }];
    }

    return directives;
  }

  function compareByDirective(a: CalendarDoc, b: CalendarDoc, directive: SortDirective): number {
    let comparison = 0;

    switch (directive.field) {
      case 'startDate':
        comparison = compareDateValues(getStartDateForSort(a), getStartDateForSort(b));
        break;
      case 'endDate':
        comparison = compareDateValues(getEndDateForSort(a), getEndDateForSort(b));
        break;
      case 'status':
        comparison = compareStringValues(getStatusSortValue(a), getStatusSortValue(b));
        break;
      case 'schema':
        comparison = compareStringValues(getSchemaSortValue(a), getSchemaSortValue(b));
        break;
      case 'actionRequired':
        comparison = compareNumberValues(getActionRequiredSortValue(a), getActionRequiredSortValue(b));
        break;
      default:
        comparison = 0;
    }

    return directive.direction === 'desc' ? -comparison : comparison;
  }

  function compareDateValues(aDate: DateTime | null, bDate: DateTime | null): number {
    if (aDate && bDate) {
      if (aDate.toMillis() < bDate.toMillis()) return -1;
      if (aDate.toMillis() > bDate.toMillis()) return 1;
      return 0;
    }
    if (aDate) return -1;
    if (bDate) return 1;
    return 0;
  }

  function compareStringValues(aValue: string, bValue: string): number {
    const a = aValue?.trim().toLowerCase() ?? '';
    const b = bValue?.trim().toLowerCase() ?? '';

    if (a && b) {
      const result = a.localeCompare(b);

      if (result < 0) return -1;
      if (result > 0) return 1;
      return 0;
    }

    if (a) return -1;
    if (b) return 1;
    return 0;
  }

  function compareNumberValues(a: number, b: number): number {
    if (a === b) return 0;
    return a < b ? -1 : 1;
  }

  function getStartDateForSort(doc: CalendarDoc): DateTime | null {
    return safeDate(getDocStringValue(doc, 'startDate'))
      ?? safeDate(getDocStringValue(doc, 'endDate'));
  }

  function getEndDateForSort(doc: CalendarDoc): DateTime | null {
    return safeDate(getDocStringValue(doc, 'endDate'))
      ?? safeDate(getDocStringValue(doc, 'startDate'));
  }

  function getStatusSortValue(doc: CalendarDoc): string {
    return (getDocStringValue(doc, 'statusKey')
      ?? normalizeStatusKey(getDocStringValue(doc, 'status'))
      ?? '').toString();
  }

  function getSchemaSortValue(doc: CalendarDoc): string {
    const schema = getDocStringValue(doc, 'schema');

    if (schema) {
      return schema.toLowerCase();
    }

    const rawType = getDocStringValue(doc, 'type');

    return rawType ? normalizeTypeKey(rawType) : '';
  }

  function getActionRequiredSortValue(doc: CalendarDoc): number {
    return getDocBooleanValue(doc, 'actionRequired') ? 1 : 0;
  }

  function setFilters(filters: FilterState): void {
    const normalizedSort = filters.sort && filters.sort.length > 0
      ? [...filters.sort]
      : Array.from(DEFAULT_SORT_VALUES);

    currentFilters.value = { ...filters, sort: normalizedSort };
  }

  function resetFilters(): void {
    currentFilters.value = {
      ...defaultFilters,
      startDate: options.initialStartDate ?? '',
      sort: Array.from(DEFAULT_SORT_VALUES),
    };
  }

  return {
    loading,
    docs,
    locale,
    allFieldNames,
    subjectOptions,
    subjectLabelMap,
    notificationDetailsMap,
    notificationErrors,
    notificationLoadingMap,
    notificationDisplayEntries,
    ensureSubjectLabels,
    loadSnapshotData,
    currentFilters,
    setFilters,
    resetFilters,
    filteredDocs,
    groupedItems,
    availableTypes,
    availableSubjects,
    availableStatuses,
    availableSubsidiaryBodies,
    availableCopDecisions,
    availableCountryOptions,
    availableGlobalTargetOptions,
  };
}
