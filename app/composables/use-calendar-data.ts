import { computed, onMounted, ref, watch } from 'vue';
import { DateTime } from 'luxon';
import {
  buildCalendarQuery,
  normalizeCalendarDoc,
  parseFacets,
  type LocaleCode,
} from 'shared/services/solr';
import {
  loadSubjectOptions,
  buildSubjectLabelMap,
  type SubjectOption,
  setSubjectLabelMap as setSubjectLabelMapSubjects,
} from 'shared/utils/subjects';
import {
  getNotificationKeys,
  notificationDisplayEntries,
  setNotificationStores,
} from 'shared/utils/notifications';
import type { NotificationDetails, NotificationKey } from 'shared/utils/notifications';
import { fetchNotificationDetails } from 'shared/services/solr-index';
import type {
  CalendarDoc,
  FilterState,
  GroupedItem,
  ParsedFacets,
} from 'shared/types/calendar';
import type { SolrResponse } from 'shared/types/solr';
import { getSolrSelectUrl } from 'shared/utils/api-config';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 300;

const DEFAULT_SORT_VALUES = ['startDate:asc'] as const;

/** Solr function sort that picks startDate_dt for meetings/activities, deadline_dt for notifications. */
const SOLR_DEFAULT_SORT = 'def(startDate_dt,deadline_dt) asc';

const defaultFilters: FilterState = {
  types: [],
  subjects: [],
  statuses: [],
  subsidiaryBodies: [],
  governingBodies: [],
  copDecisions: [],
  activityTypes: [],
  globalTargets: [],
  gbfSections: [],
  countries: [],
  startDate: '',
  endDate: '',
  actionRequired: false,
  searchText: '',
  sort: [...DEFAULT_SORT_VALUES],
};

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface UseCalendarDataOptions {
  initialStartDate?: string;
  locale?: LocaleCode;
  messages?: {
    notificationNotFound?: () => string;
    notificationLoadFailed?: () => string;
  };
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useCalendarData(options: UseCalendarDataOptions = {}) {
  // --- Core state ----------------------------------------------------------
  const docs = ref<CalendarDoc[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const initialLoading = ref(true);
  const total = ref(0);
  const start = ref(0);
  const error = ref<string | null>(null);
  const facets = ref<ParsedFacets>({});

  const locale = ref<LocaleCode>(options.locale ?? 'en');
  const subjectOptions = ref<SubjectOption[]>([]);

  const currentFilters = ref<FilterState>({
    ...defaultFilters,
    startDate: options.initialStartDate ?? '',
    sort: [...DEFAULT_SORT_VALUES],
  });

  // --- Derived state -------------------------------------------------------
  const hasMore = computed(() => start.value + PAGE_SIZE < total.value);
  const isEmpty = computed(() => !loading.value && docs.value.length === 0 && !error.value);

  // --- Notification enrichment stores --------------------------------------
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

  // --- Subject labels ------------------------------------------------------
  const subjectLabelMap = computed(() => buildSubjectLabelMap(subjectOptions.value));

  watch(subjectLabelMap, (map) => {
    setSubjectLabelMapSubjects(map);
  }, { immediate: true });

  async function ensureSubjectLabels(): Promise<void> {
    if (subjectOptions.value.length > 0) {
      return;
    }

    try {
      subjectOptions.value = await loadSubjectOptions(locale.value);
    } catch (err) {
      console.error('Failed to load subject options', err);
      subjectOptions.value = [];
    }
  }

  // --- SOLR endpoint -------------------------------------------------------
  /** Always uses the centralized SOLR base (hardcoded to api.cbddev.xyz). */
  function getSolrEndpoint(): string {
    return getSolrSelectUrl();
  }

  // --- Sort helpers --------------------------------------------------------
  function buildSolrSort(sortValues: string[]): string {
    const mapped = sortValues
      .map((v) => {
        const [field, dir] = v.split(':');
        const direction = dir === 'desc' ? 'desc' : 'asc';

        // startDate uses def() so notifications (deadline_dt) interleave
        // correctly with meetings/activities (startDate_dt)
        if (field === 'startDate') {
          return `def(startDate_dt,deadline_dt) ${direction}`;
        }

        const solrField = field === 'endDate' ? 'endDate_dt'
          : field === 'title' ? 'title_EN_t'
            : field === 'schema' ? 'schema_s'
              : field === 'actionRequired' ? 'actionRequiredByParties_b'
                : `${field}_s`;

        return `${solrField} ${direction}`;
      })
      .filter(Boolean);

    return mapped.length > 0 ? mapped.join(', ') : SOLR_DEFAULT_SORT;
  }

  // --- Fetch a single page from SOLR --------------------------------------
  async function fetchPage(
    pageStart: number,
  ): Promise<{ docs: CalendarDoc[]; total: number; facets: ParsedFacets }> {
    const filters = currentFilters.value;
    const sort = buildSolrSort(filters.sort?.length ? filters.sort : [...DEFAULT_SORT_VALUES]);

    const body = buildCalendarQuery({
      filters,
      locale: locale.value,
      searchText: filters.searchText?.trim() || undefined,
      start: pageStart,
      rows: PAGE_SIZE,
      sort,
    });

    const endpoint = getSolrEndpoint();

    const response = await $fetch<SolrResponse>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const rawDocs = response?.response?.docs ?? [];
    const normalizedDocs = rawDocs.map((raw) => normalizeCalendarDoc(raw as Record<string, unknown>));
    const parsedFacets = parseFacets(response?.facet_counts);

    return {
      docs: normalizedDocs,
      total: response?.response?.numFound ?? 0,
      facets: parsedFacets,
    };
  }

  // --- Execute query (filter change → full reset) --------------------------
  async function executeQuery(): Promise<void> {
    loading.value = true;
    error.value = null;
    start.value = 0;
    docs.value = [];

    try {
      const result = await fetchPage(0);

      docs.value = result.docs;
      total.value = result.total;
      facets.value = result.facets;
    } catch (err) {
      console.error('SOLR query failed', err);
      error.value = err instanceof Error ? err.message : 'Failed to load calendar data';
      docs.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
      initialLoading.value = false;
    }
  }

  // --- Load more (infinite scroll) ----------------------------------------
  async function loadMore(): Promise<void> {
    if (!hasMore.value || loading.value || loadingMore.value) {
      return;
    }

    loadingMore.value = true;
    const nextStart = start.value + PAGE_SIZE;

    try {
      const result = await fetchPage(nextStart);

      docs.value = [...docs.value, ...result.docs];
      start.value = nextStart;
      facets.value = result.facets;

      // If fewer docs than requested, we've reached the end
      if (result.docs.length < PAGE_SIZE) {
        total.value = docs.value.length;
      }
    } catch (err) {
      console.error('Failed to load more results', err);
      error.value = err instanceof Error ? err.message : 'Failed to load more results';
    } finally {
      loadingMore.value = false;
    }
  }

  // --- Retry (re-execute current query) ------------------------------------
  async function retry(): Promise<void> {
    await executeQuery();
  }

  // --- Debounced filter watcher --------------------------------------------
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  watch(
    currentFilters,
    () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        void executeQuery();
      }, DEBOUNCE_MS);
    },
    { deep: true },
  );

  // --- Notification key enrichment -----------------------------------------
  const notificationKeys = computed<NotificationKey[]>(() => {
    const keys = new Set<NotificationKey>();

    docs.value.forEach((doc) => {
      getNotificationKeys(doc).forEach((key) => keys.add(key));
    });

    return Array.from(keys).sort();
  });

  watch(notificationKeys, async (keys) => {
    if (!keys.length) {
      return;
    }

    const missing = keys.filter((key) => {
      return !notificationDetailsMap.value[key]
        && !notificationLoadingMap.value[key]
        && !notificationErrors.value[key];
    });

    if (missing.length === 0) {
      return;
    }

    const nextLoading = { ...notificationLoadingMap.value };

    missing.forEach((key) => {
      nextLoading[key] = true;
    });

    notificationLoadingMap.value = nextLoading;

    await Promise.all(missing.map(async (key) => {
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
      } catch (err) {
        notificationErrors.value = {
          ...notificationErrors.value,
          [key]: err instanceof Error ? err.message : notificationLoadFailed(),
        };
      } finally {
        const { [key]: _removed, ...restLoading } = notificationLoadingMap.value;

        notificationLoadingMap.value = restLoading;
      }
    }));
  }, { immediate: true });

  // --- Grouped items (by year-month) — operates on server-filtered docs ----
  const groupedItems = computed<GroupedItem[]>(() => {
    const buckets = new Map<string, { label: string; items: CalendarDoc[] }>();

    for (const d of docs.value) {
      // Notifications don't have startDate/endDate — use deadline then date
      // (matching the same logic as formatDateRange in shared/utils/date.ts)
      const isNotification = String(d.schema ?? '').toLowerCase() === 'notification';
      const iso = isNotification
        ? (d.deadline || d.date)
        : (d.startDate || d.endDate);
      const dt = iso ? DateTime.fromISO(String(iso)) : null;
      const key = dt?.isValid ? dt.toFormat('yyyy-LL') : 'unknown';
      const label = dt?.isValid ? dt.toFormat('LLLL yyyy') : 'Unknown date';

      if (!buckets.has(key)) {
        buckets.set(key, { label, items: [] });
      }
      buckets.get(key)!.items.push(d);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => ({ key, label: v.label, items: v.items }));
  });

  // --- Filter mutators -----------------------------------------------------
  function setFilters(filters: FilterState): void {
    const normalizedSort = filters.sort?.length
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

  // --- Init ----------------------------------------------------------------
  onMounted(() => {
    void executeQuery();
    void ensureSubjectLabels();
  });

  // --- Public API ----------------------------------------------------------
  return {
    // Core SOLR-driven state
    docs,
    loading,
    loadingMore,
    initialLoading,
    total,
    hasMore,
    loadMore,
    retry,
    error,
    isEmpty,
    facets,

    // Locale & subject labels
    locale,
    subjectOptions,
    subjectLabelMap,
    ensureSubjectLabels,

    // Notification enrichment
    notificationDetailsMap,
    notificationErrors,
    notificationLoadingMap,
    notificationDisplayEntries,

    // Filters
    currentFilters,
    setFilters,
    resetFilters,

    // Grouping
    groupedItems,
  };
}
