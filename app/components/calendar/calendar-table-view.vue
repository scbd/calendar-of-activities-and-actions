<template>
  <section class="activities-table">
    <div class="container-fluid py-3">
      <div v-if="!hideFilterCard" class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <h2 class="h5 mb-0">{{ t('calendar.filters.title') }}</h2>
            <button
              type="button"
              class="btn btn-link btn-sm text-decoration-none p-0"
              @click="$emit('toggle-filter-mode')"
            >
              {{ showAdvancedFilters ? t('calendar.filters.showBasic') : t('calendar.filters.showAdvanced') }}
            </button>
          </div>

          <component
            :is="currentFilterComponent"
            :facets="facets"
            :initial-start-date="initialStartDate"
            :hide-type-filter="hideTypeFilter"
            :active-tab-type="activeTabType"
            @update:filters="handleFiltersUpdate"
          />
        </div>
      </div>

      <!-- Record Type Tabs -->
      <div v-if="showTabSelector" class="mb-3">
        <label class="form-label">{{ t('calendar.filters.labels.schemas') }}</label>
        <ul class="nav nav-tabs" role="tablist">
          <li v-for="recordType in recordTypes" :key="recordType.value" class="nav-item" role="presentation">
            <button
              :class="['nav-link', { active: activeTabType === recordType.value }]"
              type="button"
              role="tab"
              :aria-selected="activeTabType === recordType.value"
              @click="setActiveTab(recordType.value)"
            >
              {{ recordType.label }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Initial loading state -->
      <div v-if="initialLoading" class="loading-container" role="status" aria-live="polite">
        <div class="spinner-border spinner-large">
          <span class="visually-hidden">{{ t('calendar.messages.loadingMore') }}</span>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
        <span>{{ t('calendar.messages.loadError') }}</span>
        <button type="button" class="btn btn-outline-danger btn-sm ms-3" @click="handleRetry">
          {{ t('calendar.messages.retry') }}
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="isEmpty" class="alert alert-warning" role="status" aria-live="polite">
        {{ t('calendar.messages.noResults') }}
      </div>

      <!-- Results -->
      <div v-else>
        <!-- Results count -->
        <p v-if="total > 0" class="text-muted small mb-3" role="status" aria-live="polite">
          {{ t('calendar.messages.showingResults', { count: docs.length, total }) }}
        </p>

        <!-- Re-query loading overlay (filter change, not initial) -->
        <div v-if="loading" class="loading-container loading-container--overlay" role="status" aria-live="polite">
          <div class="spinner-border spinner-large">
            <span class="visually-hidden">{{ t('calendar.messages.loadingMore') }}</span>
          </div>
        </div>

        <div class="card">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th/>
                  <th style="width: 180px;">
                    <button class="sort-header" @click="toggleSort('startDate')">
                      Date
                      <span class="sort-arrow" :class="getSortClass('startDate')">
                        <span v-if="currentSortField === 'startDate'">
                          {{ currentSortDirection === 'asc' ? '▲' : '▼' }}
                        </span>
                        <span v-else class="sort-both">⇅</span>
                      </span>
                    </button>
                  </th>
                  <th>
                    <button class="sort-header" @click="toggleSort('type')">
                      Type
                      <span class="sort-arrow" :class="getSortClass('type')">
                        <span v-if="currentSortField === 'type'">
                          {{ currentSortDirection === 'asc' ? '▲' : '▼' }}
                        </span>
                        <span v-else class="sort-both">⇅</span>
                      </span>
                    </button>
                  </th>
                  <th>
                    <button class="sort-header" @click="toggleSort('title')">
                      Title
                      <span class="sort-arrow" :class="getSortClass('title')">
                        <span v-if="currentSortField === 'title'">
                          {{ currentSortDirection === 'asc' ? '▲' : '▼' }}
                        </span>
                        <span v-else class="sort-both">⇅</span>
                      </span>
                    </button>
                  </th>
                  <th>Location</th>
                  <th>
                    <button class="sort-header" @click="toggleSort('status')">
                      Status
                      <span class="sort-arrow" :class="getSortClass('status')">
                        <span v-if="currentSortField === 'status'">
                          {{ currentSortDirection === 'asc' ? '▲' : '▼' }}
                        </span>
                        <span v-else class="sort-both">⇅</span>
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="doc in docs" :key="doc.id">
                  <tr class="main-row" :class="{ 'row-expanded': isExpanded(doc) }" @click="toggleRow(doc)">
                    <td class="expand-cell">
                      <button class="btn btn-sm btn-link" type="button" :aria-label="isExpanded(doc) ? 'Collapse' : 'Expand'">
                        <span class="expand-icon">{{ isExpanded(doc) ? '▼' : '▶' }}</span>
                      </button>
                    </td>
                    <td class="date-cell">
                      <div class="date-range">{{ formatGridDateRange(doc) }}</div>
                    </td>
                    <td>
                      <span class="type-badge" :style="getTypeStyle(doc)">
                        {{ getTypeLabel(doc) }}
                      </span>
                    </td>
                    <td>
                      <div class="title-cell">
                        <span class="title-text">{{ getTitle(doc) }}</span>
                        <div v-if="getNotificationSymbol(doc)" class="symbol-text">{{ getNotificationSymbol(doc) }}</div>
                      </div>
                    </td>
                    <td>
                      <span v-if="getMeetingLocation(doc)" class="location-text">{{ getMeetingLocation(doc) }}</span>
                    </td>
                    <td>
                      <div class="status-cell">
                        <span v-if="isActionRequired(doc)" class="badge bg-danger me-1">
                          {{ t('calendar.labels.actionRequiredByParties') }}
                        </span>
                        <span v-if="getStatusLabel(doc)" class="badge" :class="`bg-${getStatusColor(doc)}`">
                          {{ getStatusLabel(doc) }}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="isExpanded(doc)" class="details-row">
                    <td colspan="6" class="details-cell">
                      <div class="details-container">
                        <CalendarDocumentDetails
                          :status-narrative="getStatusNarrative(doc)"
                          :symbol="getMeetingSymbol(doc)"
                          :description="getDescription(doc)"
                          :subject-labels="getSubjectLabels(doc)"
                          :subsidiary-bodies="getSubsidiaryBodies(doc)"
                          :governing-bodies="getGoverningBodies(doc)"
                          :gbf-sections="getGbfSections(doc)"
                          :global-targets="getGlobalTargets(doc)"
                          :decision-entries="getDecisionEntries(doc)"
                          :responsible-unit="getResponsibleUnit(doc)"
                          :responsible-officer="getResponsibleOfficer(doc)"
                          :show-responsible="Boolean(getResponsibleUnit(doc) || getResponsibleOfficer(doc))"
                        />

                        <div v-if="getNotificationEntries(doc).length" class="mt-3">
                          <h6 class="fw-bold">{{ t('calendar.labels.notifications') }}</h6>
                          <div class="table-responsive">
                            <table class="table table-sm table-bordered nested-table">
                              <thead class="table-secondary">
                                <tr>
                                  <th>Symbol</th>
                                  <th>Title</th>
                                  <th>Date</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="entry in getNotificationEntries(doc)" :key="entry.key">
                                  <td>{{ entry.details?.symbol || entry.key }}</td>
                                  <td>{{ entry.details?.title || '' }}</td>
                                  <td>{{ entry.details?.publishedOn ? formatGridDate(entry.details.publishedOn) : '' }}</td>
                                  <td>
                                    <a v-if="entry.details?.link" :href="entry.details.link" target="_blank" class="btn btn-sm btn-primary">
                                      View
                                    </a>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div v-if="getRelatedActivities(doc).length" class="mt-3">
                          <h6 class="fw-bold">{{ t('calendar.labels.relatedActivities') }}</h6>
                          <div class="table-responsive">
                            <table class="table table-sm table-bordered nested-table">
                              <thead class="table-secondary">
                                <tr>
                                  <th>Date</th>
                                  <th>Type</th>
                                  <th>Title</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="activity in getRelatedActivities(doc)" :key="activity.id">
                                  <td>{{ formatGridDateRange(activity) }}</td>
                                  <td>
                                    <span class="type-badge-sm" :style="getTypeStyle(activity)">
                                      {{ getTypeLabel(activity) }}
                                    </span>
                                  </td>
                                  <td>{{ getTitle(activity) }}</td>
                                  <td>
                                    <span v-if="getStatusLabel(activity)" class="badge badge-sm" :class="`bg-${getStatusColor(activity)}`">
                                      {{ getStatusLabel(activity) }}
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div v-if="getRelatedMeetings(doc).length" class="mt-3">
                          <h6 class="fw-bold">{{ t('calendar.labels.relatedMeetings') }}</h6>
                          <div class="table-responsive">
                            <table class="table table-sm table-bordered nested-table">
                              <thead class="table-secondary">
                                <tr>
                                  <th>Date</th>
                                  <th>Title</th>
                                  <th>Location</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="meeting in getRelatedMeetings(doc)" :key="meeting.id">
                                  <td>{{ formatGridDateRange(meeting) }}</td>
                                  <td>{{ getTitle(meeting) }}</td>
                                  <td>{{ getMeetingLocation(meeting) }}</td>
                                  <td>
                                    <span v-if="getStatusLabel(meeting)" class="badge badge-sm" :class="`bg-${getStatusColor(meeting)}`">
                                      {{ getStatusLabel(meeting) }}
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Infinite scroll sentinel -->
        <div ref="scrollSentinel" class="scroll-sentinel" aria-hidden="true" />

        <!-- Loading more indicator -->
        <div v-if="loadingMore" class="text-center py-3" role="status" aria-live="polite">
          <div class="spinner-border spinner-border-sm me-2">
            <span class="visually-hidden">{{ t('calendar.messages.loadingMore') }}</span>
          </div>
          <span class="text-muted small">{{ t('calendar.messages.loadingMore') }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { DateTime } from 'luxon';
import { useI18n } from '#imports';
import { useRoute, useRouter } from '#app';
import CalendarFilters from './calendar-filters.vue';
import CalendarFilters2 from './calendar-filters-2.vue';
import CalendarDocumentDetails from './calendar-document-details.vue';
import { useCalendarData } from '../../composables/use-calendar-data';
import {
  configureStatusLocalization,
  normalizeStatusKey,
  normalizeStatusLabel,
  shouldDisplayCompleted,
  statusColor,
} from 'shared/utils/status';
import {
  configureLabelLocalization,
  setRegionDisplayNames,
  normalizeDecisionLabel,
  responsibleOfficerLabel,
  responsibleUnitLabel,
  resolveCountryLabel,
} from 'shared/utils/labels';
import type { CalendarDoc, FilterState } from 'shared/types/calendar';
import type { LocaleCode } from 'shared/services/solr';
import { getTitleFieldForLocale } from 'shared/services/solr';
import { formatDateRange, formatNotificationDate, formatGridDateRange, formatGridDate } from 'shared/utils/date';
import {
  getDocBooleanValue,
  getDocStringValue,
  getDocSubsidiaryBodies,
  getDocGoverningBodies,
  getDocGbfSections,
  getDocGlobalTargets,
} from 'shared/utils/document-processing';
import { getTypeColor, normalizeTypeKey } from 'shared/utils/type-colors';
import {
  notificationDisplayEntries,
  getRelatedActivities as getRelatedActivitiesUtil,
  getRelatedMeetings as getRelatedMeetingsUtil,
  getRelatedActivitiesForMeeting,
} from 'shared/utils/notifications';
import { extractDecisionEntries, type DecisionEntry } from 'shared/utils/decision-links';
import { displaySubjectLabels } from 'shared/utils/subjects';

// Props
const props = defineProps<{
  showAdvancedFilters?: boolean;
  hideTypeFilter?: boolean;
  hideFilterCard?: boolean;
  activeTabType?: string;
  showTabSelector?: boolean;
}>();

// Emits
defineEmits<{
  'toggle-filter-mode': [];
}>();

const { t, te, locale } = useI18n();
const route = useRoute();
const router = useRouter();

configureStatusLocalization({ t, te });
configureLabelLocalization({ t, te });

// Record types — calendarActivity replaces 'activity'
const SCHEMA_FILTER_KEYS = ['meeting', 'notification', 'calendarActivity'] as const;

const recordTypes = computed(() =>
  SCHEMA_FILTER_KEYS.map((key) => {
    const translationKey = `calendar.types.${key}`;
    const label = te(translationKey)
      ? (t(translationKey) as string)
      : key.charAt(0).toUpperCase() + key.slice(1);

    return { value: key, label };
  }),
);

// Tab selection handler
const setActiveTab = (tabValue: string) => {
  const query: Record<string, string | string[]> = {
    ...route.query,
    types: tabValue,
  };

  router.push({ query });
};

// Computed property for current filter component
const currentFilterComponent = computed(() => {
  return props.showAdvancedFilters ? CalendarFilters2 : CalendarFilters;
});

const RegionDisplayNames = (Intl as typeof Intl & { DisplayNames?: typeof Intl.DisplayNames }).DisplayNames;
const createRegionDisplayNames = (code: string) => {
  if (typeof RegionDisplayNames !== 'function') {
    return null;
  }
  try {
    return new RegionDisplayNames([code], { type: 'region' });
  } catch {
    return null;
  }
};

const defaultStartDateIso = DateTime.now().startOf('day').toISODate();
const queryStartDate = route.query.startDate as string;
const initialStartDate = queryStartDate || defaultStartDateIso;

const {
  loading,
  loadingMore,
  initialLoading,
  docs,
  facets,
  total,
  hasMore,
  loadMore,
  retry,
  error,
  isEmpty,
  currentFilters,
  setFilters,
} = useCalendarData({
  initialStartDate,
  locale: locale.value as LocaleCode,
  messages: {
    notificationNotFound: () => t('calendar.notifications.notFound') as string,
    notificationLoadFailed: () => t('calendar.notifications.loadFailed') as string,
  },
});

setRegionDisplayNames(createRegionDisplayNames(locale.value));

const expandedRows = ref<Record<string, boolean>>({});
const currentSortField = ref<string>('startDate');
const currentSortDirection = ref<'asc' | 'desc'>('asc');

const isExpanded = (doc: CalendarDoc): boolean => Boolean(expandedRows.value[doc.id]);

const toggleRow = (doc: CalendarDoc) => {
  expandedRows.value[doc.id] = !expandedRows.value[doc.id];
};

// Sort triggers server-side re-query via FilterState.sort
const toggleSort = (field: string) => {
  if (currentSortField.value === field) {
    currentSortDirection.value = currentSortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortField.value = field;
    currentSortDirection.value = 'asc';
  }
  setFilters({ ...currentFilters.value, sort: [`${currentSortField.value}:${currentSortDirection.value}`] });
};

const getSortClass = (field: string): string => {
  return currentSortField.value === field ? 'active' : '';
};

const titleField = computed(() => getTitleFieldForLocale(locale.value as LocaleCode));

const getTitle = (doc: CalendarDoc): string => {
  const value = getDocStringValue(doc, titleField.value, 'title', 'titleEn');

  if (value) {
    return value;
  }
  return t('calendar.labels.untitled') as string;
};

const getTypeLabel = (doc: CalendarDoc): string => {
  const raw = getDocStringValue(doc, 'type');
  const translationKey = `calendar.types.${normalizeTypeKey(raw)}`;

  if (te(translationKey)) {
    return t(translationKey) as string;
  }
  if (te('calendar.types.default')) {
    return t('calendar.types.default') as string;
  }
  if (!raw && te('calendar.types.calendarActivity')) {
    return t('calendar.types.calendarActivity') as string;
  }
  return raw ?? '';
};

const getTypeStyle = (doc: CalendarDoc) => {
  const palette = getTypeColor(normalizeTypeKey(getDocStringValue(doc, 'type')));

  return {
    backgroundColor: palette.background,
    color: palette.text,
  };
};

const isNotification = (doc: CalendarDoc): boolean => {
  return doc.schema === 'notification';
};

const isMeetingDoc = (doc: CalendarDoc): boolean => {
  const schemaValue = doc.schema ? String(doc.schema).toLowerCase() : getDocStringValue(doc, 'schema')?.toLowerCase();

  if (schemaValue === 'meeting') {
    return true;
  }
  const typeValue = getDocStringValue(doc, 'type');

  return Boolean(typeValue && typeValue.toLowerCase() === 'meeting');
};

const getMeetingLocation = (doc: CalendarDoc): string => {
  if (!isMeetingDoc(doc)) {
    return '';
  }
  const city = getDocStringValue(doc, 'city', 'cityEn');
  const rawCountry = getDocStringValue(doc, 'hostCountry', 'hostGovernment', 'country', 'countryCode');
  const providedCountry = getDocStringValue(doc, 'hostCountryEn', 'hostGovernmentEn', 'countryEn', 'countryName');
  const hostGovernment = rawCountry
    ? resolveCountryLabel(rawCountry, providedCountry)
    : (providedCountry ?? '');
  const parts = [city, hostGovernment].filter((part): part is string => Boolean(part && part.trim()));

  return parts.join(', ');
};

const getNotificationSymbol = (doc: CalendarDoc): string => {
  if (!isNotification(doc)) {
    return '';
  }
  return getDocStringValue(doc, 'symbol') ?? '';
};

const getMeetingSymbol = (doc: CalendarDoc): string => {
  if (!isMeetingDoc(doc)) {
    return '';
  }
  const code = getDocStringValue(doc, 'meetingCode');

  if (code) {
    return code;
  }
  return getDocStringValue(doc, 'symbol') ?? '';
};

const getStatusLabel = (doc: CalendarDoc): string => {
  const rawStatus = getDocStringValue(doc, 'status');
  const statusKey = getDocStringValue(doc, 'statusKey');
  
  // Always normalize the status key to ensure consistent format
  const normalizedStatusKey = normalizeStatusKey(statusKey ?? rawStatus);

  if (normalizedStatusKey === 'NOT_SET' || normalizedStatusKey === 'PUBLISHED') {
    return '';
  }

  if (shouldDisplayCompleted(doc, normalizedStatusKey, rawStatus)) {
    return t('calendar.status.completed') as string;
  }

  return normalizeStatusLabel(normalizedStatusKey, rawStatus ?? undefined);
};

const getStatusColor = (doc: CalendarDoc): string => statusColor(doc);

const isActionRequired = (doc: CalendarDoc): boolean => getDocBooleanValue(doc, 'actionRequired') === true;

const getStatusNarrative = (doc: CalendarDoc): string => {
  if (isNotification(doc)) {
    const fulltext = getDocStringValue(doc, 'fulltext_s');

    if (!fulltext) {
      return '';
    }
    const sentences = fulltext.match(/[^.!?]+[.!?]+/g) || [];
    const firstThree = sentences.slice(0, 3).join(' ').trim();

    return firstThree ? `${firstThree}...` : '';
  }
  return getDocStringValue(doc, 'statusNarrative') ?? '';
};

const getDescription = (doc: CalendarDoc): string => getDocStringValue(doc, 'description', 'descriptionTxt', 'descriptionText') ?? '';

const getSubjectLabels = (doc: CalendarDoc): string[] => displaySubjectLabels(doc);

const getSubsidiaryBodies = (doc: CalendarDoc): string[] => getDocSubsidiaryBodies(doc);

const getResponsibleUnit = (doc: CalendarDoc): string => responsibleUnitLabel(doc);

const getResponsibleOfficer = (doc: CalendarDoc): string => responsibleOfficerLabel(doc);

const getDecisionEntries = (doc: CalendarDoc): DecisionEntry[] => {
  const rawEntries = extractDecisionEntries(doc as Record<string, unknown>);
  const normalized = rawEntries
    .map(entry => {
      const normalizedLabel = normalizeDecisionLabel(entry.label) ?? entry.label;
      const finalLabel = normalizedLabel?.trim() ?? '';

      if (!finalLabel) {
        return null;
      }
      return {
        ...entry,
        label: finalLabel,
      } satisfies DecisionEntry;
    })
    .filter((entry): entry is DecisionEntry => entry !== null);

  if (normalized.length === 0) {
    const fallback = normalizeDecisionLabel(getDocStringValue(doc, 'copDecision'));

    if (fallback) {
      normalized.push({ label: fallback });
    }
  }

  return normalized;
};

const getNotificationEntries = (doc: CalendarDoc) => notificationDisplayEntries(doc);

const getRelatedActivities = (doc: CalendarDoc): CalendarDoc[] => {
  const notificationKey = doc.notificationKey || doc.symbol || null;

  if (isNotification(doc) && notificationKey) {
    return getRelatedActivitiesUtil(notificationKey, docs.value);
  }

  if (isMeetingDoc(doc)) {
    return getRelatedActivitiesForMeeting(doc, docs.value);
  }

  return [];
};

const getRelatedMeetings = (doc: CalendarDoc): CalendarDoc[] => {
  const notificationKey = doc.notificationKey || doc.symbol || null;

  if (!isNotification(doc) || !notificationKey) {
    return [];
  }

  return getRelatedMeetingsUtil(notificationKey, docs.value);
};

const getGoverningBodies = (doc: CalendarDoc): string[] => getDocGoverningBodies(doc);

const getGbfSections = (doc: CalendarDoc): string[] => getDocGbfSections(doc);

const getGlobalTargets = (doc: CalendarDoc): string[] => getDocGlobalTargets(doc);

const handleFiltersUpdate = (filters: FilterState) => {
  // Preserve the sort from column headers
  setFilters({ ...filters, sort: [`${currentSortField.value}:${currentSortDirection.value}`] });
};

const handleRetry = () => {
  void retry();
};

// --- Infinite scroll -------------------------------------------------------
const scrollSentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (!scrollSentinel.value) {
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];

      if (entry?.isIntersecting && hasMore.value && !loading.value && !loadingMore.value) {
        void loadMore();
      }
    },
    { rootMargin: '200px' },
  );
  observer.observe(scrollSentinel.value);
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<style scoped>
.activities-table {
  --calendar-primary: #0d6efd;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 3rem 0;
}

.spinner-large {
  width: 3rem;
  height: 3rem;
  border-width: 0.3em;
  color: var(--calendar-primary);
}

.loading-container--overlay {
  position: relative;
  min-height: 100px;
  background: rgba(255, 255, 255, 0.7);
  z-index: 5;
}

.scroll-sentinel {
  height: 1px;
}

.table-responsive {
  overflow-x: auto;
}

.table {
  font-size: 0.9rem;
}

.table thead th {
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
  position: sticky;
  top: 0;
  background-color: #f8f9fa;
  z-index: 10;
}

.sort-header {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  color: inherit;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
}

.sort-header:hover {
  color: var(--calendar-primary);
}

.sort-arrow {
  font-size: 0.8rem;
  color: #6c757d;
  min-width: 1rem;
  text-align: center;
}

.sort-arrow.active {
  color: var(--calendar-primary);
  font-weight: bold;
}

.sort-both {
  opacity: 0.5;
}

.main-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.main-row:hover {
  background-color: #f8f9fa;
}

.main-row.row-expanded {
  background-color: #e7f1ff;
}

.expand-cell {
  padding: 0.5rem !important;
  text-align: center;
}

.expand-icon {
  display: inline-block;
  font-size: 0.8rem;
  color: #6c757d;
  transition: transform 0.2s ease;
}

.date-cell {
  white-space: nowrap;
}

.date-range {
  font-size: 0.875rem;
  color: #495057;
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.type-badge-sm {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.title-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.title-text {
  font-weight: 500;
}

.symbol-text {
  font-size: 0.875rem;
  color: #6c757d;
}

.location-text {
  font-size: 0.875rem;
  color: #6c757d;
  font-style: italic;
}

.status-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.badge-sm {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
}

.details-row {
  background-color: #f8f9fa;
}

.details-cell {
  padding: 1.5rem !important;
}

.details-container {
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nested-table {
  margin-bottom: 0;
  font-size: 0.85rem;
}

.nested-table thead {
  background-color: #e9ecef;
}

.nested-table th,
.nested-table td {
  padding: 0.5rem;
  vertical-align: middle;
}

/* Prevent wrapping in date columns (always first column in Activities/Meetings tables) */
.nested-table th:first-child,
.nested-table td:first-child {
  white-space: nowrap;
}

/* Prevent wrapping in Symbol and Date columns for Notifications table */
/* Symbol is 1st column, Date is 3rd column */
.nested-table th:nth-child(1),
.nested-table td:nth-child(1),
.nested-table th:nth-child(3),
.nested-table td:nth-child(3) {
  white-space: nowrap;
}
</style>
