<template>
  <section ref="rootEl" class="activities-table">
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
        <!-- Re-query loading overlay (filter change, not initial) -->
        <div v-if="loading" class="loading-container loading-container--overlay" role="status" aria-live="polite">
          <div class="spinner-border spinner-large">
            <span class="visually-hidden">{{ t('calendar.messages.loadingMore') }}</span>
          </div>
        </div>

        <div class="card">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead ref="theadEl" class="table-light">
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
                  <th v-if="showLocationColumn">Location</th>
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
                <template v-for="(group, groupIndex) in groupedItems" :key="group.key">
                  <!-- Sentinel to detect when the sticky header becomes stuck -->
                  <tr
                    :ref="(el) => trackStickySentinel(groupIndex, el as HTMLElement | null)"
                    :data-group-index="groupIndex"
                    class="sticky-sentinel"
                    aria-hidden="true"
                  >
                    <td :colspan="columnCount" />
                  </tr>
                  <!-- Month group header row -->
                  <tr class="month-group-header">
                    <td :colspan="columnCount">
                      <div class="month-group-header__content">
                        <span class="month-group-header__label">{{ groupLabel(group) }}</span>
                        <span
                          v-if="groupIndex === stickyGroupIndex && visibleLoadingMore"
                          class="month-group-header__loading"
                          role="status"
                          aria-live="polite"
                        >
                          <span class="spinner-border spinner-border-sm ms-5" />
                        </span>
                        <span
                          v-if="groupIndex === stickyGroupIndex && total > 0"
                          class="month-group-header__count"
                          role="status"
                          aria-live="polite"
                        >
                          {{ t('calendar.messages.showingResults', { count: docs.length, total }) }}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <template v-for="doc in group.items" :key="doc.id">
                  <tr class="main-row" :class="{ 'row-expanded': isExpanded(doc), 'row-cpb-highlight': isCpbHighlighted(doc) }" @click="toggleRow(doc)">
                    <td class="expand-cell">
                      <button class="btn btn-sm btn-link" type="button" :aria-label="isExpanded(doc) ? 'Collapse' : 'Expand'">
                        <span class="expand-icon" :class="{ 'expand-icon--open': isExpanded(doc) }">
                          <FontAwesomeIcon icon="chevron-right" />
                        </span>
                      </button>
                    </td>
                    <td class="date-cell">
                      <div class="date-range"><HighlightText :text="formatGridDateRange(doc)" :query="searchText" /></div>
                    </td>
                    <td>
                      <span class="type-badge" :style="getTypeStyle(doc)">
                        <HighlightText :text="getTypeLabel(doc)" :query="searchText" />
                      </span>
                    </td>
                    <td>
                      <div class="title-cell">
                        <span class="title-text"><HighlightText :text="getTitle(doc)" :query="searchText" /></span>
                        <div v-if="getDocumentSymbol(doc)" class="symbol-text"><HighlightText :text="getDocumentSymbol(doc)" :query="searchText" /></div>
                      </div>
                    </td>
                    <td v-if="showLocationColumn">
                      <span v-if="getMeetingLocation(doc)" class="location-text"><HighlightText :text="getMeetingLocation(doc)" :query="searchText" /></span>
                    </td>
                    <td>
                      <div class="status-cell">
                        <span v-if="showActionBadge(doc)" class="badge bg-danger me-1">
                          {{ t('calendar.labels.actionRequiredByParties') }}
                        </span>
                        <span v-else-if="isNotification(doc) && isActionDeadlinePast(doc)" class="badge bg-success me-1">
                          {{ t('calendar.status.completed') }}
                        </span>
                        <span v-if="getStatusLabel(doc)" class="badge" :class="`bg-${getStatusColor(doc)}`">
                          <HighlightText :text="getStatusLabel(doc)" :query="searchText" />
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="isExpanded(doc)" class="details-row">
                    <td colspan="6" class="details-cell">
                      <div class="details-container">
                        <!-- Notification-specific details -->
                        <CalendarAccordianDetailsNotification
                          v-if="isNotification(doc)"
                          :symbol="getDocumentSymbol(doc)"
                          :description="getDescription(doc)"
                          :themes="getThemeLabels(doc)"
                          :subject-labels="getSubjectLabels(doc)"
                          :subsidiary-bodies="getSubsidiaryBodies(doc)"
                          :governing-bodies="getGoverningBodies(doc)"
                          :gbf-sections="getGbfSections(doc)"
                          :global-targets="getGlobalTargets(doc)"
                          :decision-entries="getDecisionEntries(doc)"
                          :recipients="getRecipients(doc)"
                          :attachments="getAttachments(doc)"
                          :notification-link="getNotificationLink(doc)"
                          :action-required="isActionRequired(doc)"
                          :action-deadline="getActionDeadline(doc)"
                          :responsible-unit="getResponsibleUnit(doc)"
                          :responsible-officer="getResponsibleOfficer(doc)"
                          :show-responsible="Boolean(getResponsibleUnit(doc) || getResponsibleOfficer(doc))"
                          :related-meetings="getRelatedMeetings(doc)"
                          :related-activities="getRelatedActivities(doc)"
                          :unresolved-meeting-refs="getUnresolvedMeetingRefs(doc)"
                          :unresolved-activity-refs="getUnresolvedActivityRefs(doc)"
                        />

                        <!-- Meeting-specific details -->
                        <CalendarAccordianDetailsMeeting
                          v-else-if="isMeetingDoc(doc)"
                          :status-narrative="getStatusNarrative(doc)"
                          :symbol="getDocumentSymbol(doc)"
                          :description="getDescription(doc)"
                          :location="getMeetingLocation(doc)"
                          :themes="getThemeLabels(doc)"
                          :subject-labels="getSubjectLabels(doc)"
                          :subsidiary-bodies="getSubsidiaryBodies(doc)"
                          :governing-bodies="getGoverningBodies(doc)"
                          :gbf-sections="getGbfSections(doc)"
                          :global-targets="getGlobalTargets(doc)"
                          :decision-entries="getDecisionEntries(doc)"
                          :meeting-urls="getMeetingUrls(doc)"
                          :responsible-unit="getResponsibleUnit(doc)"
                          :responsible-officer="getResponsibleOfficer(doc)"
                          :show-responsible="Boolean(getResponsibleUnit(doc) || getResponsibleOfficer(doc))"
                        />

                        <!-- Activity-specific details -->
                        <CalendarAccordianDetailsActivity
                          v-else
                          :status-narrative="getStatusNarrative(doc)"
                          :symbol="getDocumentSymbol(doc)"
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

                        <!-- Related sections (non-notification docs; notifications render related items inside their details) -->
                        <template v-if="!isNotification(doc)">
                          <RelatedActivities
                            :activities="getRelatedActivities(doc)"
                            :unresolved-refs="getUnresolvedActivityRefs(doc)"
                          />
                          <RelatedMeetings
                            :meetings="getRelatedMeetings(doc)"
                            :unresolved-refs="getUnresolvedMeetingRefs(doc)"
                          />
                        </template>

                        <RelatedNotifications
                          :notifications="getAllNotificationEntries(doc)"
                          :all-docs="docs"
                        />
                      </div>
                    </td>
                  </tr>
                  </template>
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

        <!-- Manual load-more button (fallback when infinite scroll doesn't trigger) -->
        <div v-if="hasMore && !loadingMore" class="text-center py-3">
          <button class="btn btn-outline-primary btn-sm" @click="loadMore()">
            {{ t('calendar.messages.loadMore', { remaining: total - docs.length }) }}
          </button>
        </div>
      </div>
    </div>

    <BackToTop />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { DateTime } from 'luxon';
import { useI18n } from '#imports';
import { useRoute, useRouter } from '#app';
import CalendarFilters from './calendar-filters.vue';
import CalendarFilters2 from './calendar-filters-2.vue';
import CalendarAccordianDetailsActivity from './accordian/details-activity.vue';
import CalendarAccordianDetailsMeeting from './accordian/details-meeting.vue';
import CalendarAccordianDetailsNotification from './accordian/details-notification.vue';
import RelatedActivities from './accordian/related-activities.vue';
import RelatedMeetings from './accordian/related-meetings.vue';
import RelatedNotifications from './accordian/related-notifications.vue';
import HighlightText from '../highlight-text.vue';
import { useCalendarData } from '../../composables/use-calendar-data';
import {
  configureStatusLocalization,
  normalizeStatusKey,
  normalizeStatusLabel,
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
import type { CalendarDoc, FilterState, GroupedItem } from 'shared/types/calendar';
import type { LocaleCode } from 'shared/services/solr';
import { getTitleFieldForLocale, normalizeSolrFieldName } from 'shared/services/solr';
import { formatDateRange, formatNotificationDate, formatGridDateRange, formatGridDate } from 'shared/utils/date';
import {
  getDocBooleanValue,
  getDocFiles,
  getDocRaw,
  getDocRecipients,
  getDocStringValue,
  getDocSubjects,
  getDocSubsidiaryBodies,
  getDocGoverningBodies,
  getDocGbfSections,
  getDocGlobalTargets,
  getDocThemes,
} from 'shared/utils/document-processing';
import { getTypeColor, normalizeTypeKey } from 'shared/utils/type-colors';
import {
  buildNotificationLink,
  notificationDisplayEntries,
  parseNotificationAttachments,
  resolveNotificationUrl,
  getRelatedNotificationsForMeeting,
} from 'shared/utils/notifications';
import type { NotificationAttachment } from 'shared/utils/notifications';
import { extractDecisionEntries, type DecisionEntry } from 'shared/utils/decision-links';
import { displaySubjectLabels, resolveSubjectLabel, fallbackSubjectLabel, subjectLabelMap } from 'shared/utils/subjects';
import { normalizeSolrDocument } from 'shared/services/solr';
import { fetchRelatedDocsBySchema, LEGACY_MEETING_ID_MAP } from 'shared/services/solr-index';
import { useBodyLabels } from '~/composables/use-body-labels';

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
const { resolveGoverningBodyLabels, resolveSubsidiaryBodyLabels } = useBodyLabels();
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
  groupedItems,
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

/** Current free-text search query for highlighting visible row text. */
const searchText = computed(() => currentFilters.value?.searchText?.trim() || '');

const expandedRows = ref<Record<string, boolean>>({});
const currentSortField = ref<string>('startDate');
const currentSortDirection = ref<'asc' | 'desc'>('asc');
const rootEl = ref<HTMLElement | null>(null);
const theadEl = ref<HTMLElement | null>(null);

// --- Delayed loading-more flag (stays visible for 1 s after data loads) ----
const visibleLoadingMore = ref(false);

let loadingMoreTimer: ReturnType<typeof setTimeout> | null = null;

watch(loadingMore, (isLoading) => {
  if (isLoading) {
    if (loadingMoreTimer) {
      clearTimeout(loadingMoreTimer);
      loadingMoreTimer = null;
    }
    visibleLoadingMore.value = true;
  } else {
    loadingMoreTimer = setTimeout(() => {
      visibleLoadingMore.value = false;
      loadingMoreTimer = null;
    }, 1000);
  }
});

// --- Sticky group tracking -------------------------------------------------
// Detects which group header is currently stuck at the top via position:sticky
// so the results count / loading spinner appear only on that header.
const stickyGroupIndex = ref(0);
const stickySentinelMap = new Map<number, HTMLElement>();

let stickyObserver: IntersectionObserver | null = null;
const passedGroupIndices = new Set<number>();

const trackStickySentinel = (index: number, el: HTMLElement | null) => {
  if (el) {
    stickySentinelMap.set(index, el);
  } else {
    stickySentinelMap.delete(index);
  }
};

const setupStickyObserver = () => {
  stickyObserver?.disconnect();
  passedGroupIndices.clear();

  stickyObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const idx = Number((entry.target as HTMLElement).dataset.groupIndex
          ?? (entry.target.closest('[data-group-index]') as HTMLElement | null)?.dataset.groupIndex);

        if (Number.isNaN(idx)) continue;

        // Sentinel scrolled above the viewport → its group header is now stuck
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          passedGroupIndices.add(idx);
        } else {
          passedGroupIndices.delete(idx);
        }
      }

      stickyGroupIndex.value = passedGroupIndices.size > 0
        ? Math.max(...passedGroupIndices)
        : 0;
    },
    { threshold: [0] },
  );

  for (const el of stickySentinelMap.values()) {
    stickyObserver.observe(el);
  }
};

// Re-observe whenever the group list changes (load-more adds groups)
watch(
  () => groupedItems.value.length,
  () => {
    nextTick(() => setupStickyObserver());
  },
);

/** Number of visible columns (varies when Location column is shown). */
const columnCount = computed(() => showLocationColumn.value ? 6 : 5);

const groupLabel = (group: GroupedItem): string => {
  if (!group.label || group.label.toLowerCase() === 'unknown date') {
    return t('calendar.labels.unknownDate') as string;
  }
  return group.label;
};

/**
 * Show the Location column only when exclusively meetings are displayed.
 * If no schema types are selected (all shown) or any non-meeting type is
 * selected, hide the column since only meetings carry location data.
 */
const showLocationColumn = computed(() => {
  const selectedTypes = currentFilters.value?.types ?? [];
  const tabType = props.activeTabType;

  // Tab selector overrides — show location only when the meeting tab is active
  if (tabType) {
    return tabType === 'meeting';
  }

  // No filter selected means all types visible — show location column
  if (selectedTypes.length === 0) {
    return true;
  }

  // Show only when every selected type is 'meeting'
  return selectedTypes.every((type) => type === 'meeting');
});

// ---------------------------------------------------------------------------
// Fetched related docs (separate SOLR calls per schema, keyed by doc id)
// ---------------------------------------------------------------------------
const fetchedRelatedActivities = ref<Record<string, CalendarDoc[]>>({});
const fetchedRelatedMeetings = ref<Record<string, CalendarDoc[]>>({});
const fetchedActivityFlags = ref<Record<string, boolean>>({});
const fetchedMeetingFlags = ref<Record<string, boolean>>({});

/**
 * When a row is expanded, fetch related activities and meetings via
 * dedicated SOLR calls (one per schema type). This applies to
 * notifications and calendarActivity documents so the related docs
 * don't depend on whether the target is already in the paged docs.
 */
const fetchRelatedDocsForRow = async (doc: CalendarDoc) => {
  const docId = doc.id;

  const activityRefs = doc.activities;
  const meetingRefs = doc.meetings;

  // Fetch related activities (one call for calendarActivity schema)
  if (
    !fetchedActivityFlags.value[docId] &&
    Array.isArray(activityRefs) &&
    activityRefs.length > 0
  ) {
    fetchedActivityFlags.value[docId] = true;

    try {
      const results = await fetchRelatedDocsBySchema(activityRefs, 'calendarActivity');

      fetchedRelatedActivities.value = { ...fetchedRelatedActivities.value, [docId]: results };
    } catch (err) {
      console.error('Failed to fetch related activities for grid row', err);
      fetchedRelatedActivities.value = { ...fetchedRelatedActivities.value, [docId]: [] };
    }
  }

  // Fetch related meetings (one call for meeting schema)
  if (
    !fetchedMeetingFlags.value[docId] &&
    Array.isArray(meetingRefs) &&
    meetingRefs.length > 0
  ) {
    fetchedMeetingFlags.value[docId] = true;

    try {
      const results = await fetchRelatedDocsBySchema(meetingRefs, 'meeting');

      fetchedRelatedMeetings.value = { ...fetchedRelatedMeetings.value, [docId]: results };
    } catch (err) {
      console.error('Failed to fetch related meetings for grid row', err);
      fetchedRelatedMeetings.value = { ...fetchedRelatedMeetings.value, [docId]: [] };
    }
  }
};

const isExpanded = (doc: CalendarDoc): boolean => Boolean(expandedRows.value[doc.id]);

const toggleRow = (doc: CalendarDoc) => {
  expandedRows.value[doc.id] = !expandedRows.value[doc.id];

  // Trigger SOLR fetches when expanding
  if (expandedRows.value[doc.id]) {
    void fetchRelatedDocsForRow(doc);
  }
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

/** Locale-aware normalized description field name (e.g. `descriptionEn`). */
const descriptionField = computed(() =>
  normalizeSolrFieldName(`description_${(locale.value as string).toUpperCase()}_t`),
);

const getTitle = (doc: CalendarDoc): string => {
  const value = getDocStringValue(doc, titleField.value, 'title', 'titleEn');

  if (value) {
    return value;
  }
  return t('calendar.labels.untitled') as string;
};

const getTypeLabel = (doc: CalendarDoc): string => {
  const schema = (doc.schema ?? '').toLowerCase();

  // Meetings and notifications: use the i18n label as-is (no "Activity" suffix)
  if (schema === 'meeting' || schema === 'notification') {
    const raw = getDocStringValue(doc, 'type') || getDocStringValue(doc, 'schema');
    const translationKey = `calendar.types.${normalizeTypeKey(raw)}`;

    if (te(translationKey)) {
      return t(translationKey) as string;
    }

    return raw ?? '';
  }

  // Calendar activities: derive label from CAL-ACTIVITY-TYPE-* identifier + "Activity" suffix
  const typeValue = getDocStringValue(doc, 'type') ?? '';
  const activitySuffix = t('calendar.types.activity') as string;

  // Special-case overrides for specific activity type identifiers
  const activityLabelOverrides: Record<string, string> = {
    'SUBMISSION-OF-INFORMATION': 'Submission',
    'NOMINATION-REGISTRATION': 'Nomination / Registration',
  };

  const stripped = typeValue.replace(/^CAL-ACTIVITY-TYPE-/i, '');

  if (stripped && stripped !== typeValue) {
    const upperStripped = stripped.toUpperCase();

    // Check for explicit override first
    if (activityLabelOverrides[upperStripped]) {
      return `${activityLabelOverrides[upperStripped]} ${activitySuffix}`;
    }

    // Default: convert hyphens to spaces for display
    // e.g. "MEETING" → "Meeting Activity", "PEER-REVIEW" → "Peer Review Activity"
    const humanLabel = stripped
      .toLowerCase()
      .split('-')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `${humanLabel} ${activitySuffix}`;
  }

  // Fallback: try the i18n translation for the type and append "Activity"
  const raw = typeValue || getDocStringValue(doc, 'schema');
  const translationKey = `calendar.types.${normalizeTypeKey(raw)}`;

  if (te(translationKey)) {
    const label = t(translationKey) as string;

    if (label && !label.toLowerCase().endsWith(activitySuffix.toLowerCase())) {
      return `${label} ${activitySuffix}`;
    }

    return label;
  }

  return activitySuffix;
};

const getTypeStyle = (doc: CalendarDoc) => {
  const palette = getTypeColor(normalizeTypeKey(getDocStringValue(doc, 'type') || getDocStringValue(doc, 'schema')));

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
  const city = getDocStringValue(doc, 'city', 'cityEn', 'eventCity');
  const rawCountry = getDocStringValue(doc, 'eventCountry', 'hostCountry', 'hostGovernment', 'country', 'countryCode');
  const providedCountry = getDocStringValue(doc, 'hostCountryEn', 'hostGovernmentEn', 'countryEn', 'countryName');
  const hostGovernment = rawCountry
    ? resolveCountryLabel(rawCountry, providedCountry)
    : (providedCountry ?? '');
  const parts = [city, hostGovernment].filter((part): part is string => Boolean(part && part.trim()));
  const result = parts.join(', ');

  return result.toLowerCase() === 'online' ? 'ONLINE' : result;
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

  if (normalizedStatusKey === 'NOT_SET' || normalizedStatusKey === 'PUBLISHED' || normalizedStatusKey === 'NODATE') {
    return '';
  }

  return normalizeStatusLabel(normalizedStatusKey, rawStatus ?? undefined);
};

const getStatusColor = (doc: CalendarDoc): string => statusColor(doc);

const isActionRequired = (doc: CalendarDoc): boolean => {
  // All record types now have actionRequiredByPartiesCOA_b (aliased to actionRequiredByParties)
  if (isNotification(doc)) {
    return Boolean(getDocStringValue(doc, 'actionDate'));
  }

  return getDocBooleanValue(doc, 'actionRequired', 'actionRequiredByParties', 'actionRequiredByPartiesCOA') === true;
};

/** True when the notification action deadline is in the past. */
const isActionDeadlinePast = (doc: CalendarDoc): boolean => {
  if (!isNotification(doc)) {
    return false;
  }

  const deadline = getDocStringValue(doc, 'actionDate') ?? getDocStringValue(doc, 'deadline');

  if (!deadline) {
    return false;
  }

  const dt = DateTime.fromISO(String(deadline));

  return dt.isValid && dt.toUTC().endOf('day') < DateTime.utc();
};

/** True when the document's effective status is "completed". */
const isStatusCompleted = (doc: CalendarDoc): boolean => {
  const rawStatus = getDocStringValue(doc, 'status');
  const statusKey = getDocStringValue(doc, 'statusKey');
  const normalizedKey = normalizeStatusKey(statusKey ?? rawStatus);

  return normalizedKey === 'COMPLETED';
};

/** Show action badge only when the deadline is still active (not past) and status is not completed. */
const showActionBadge = (doc: CalendarDoc): boolean => isActionRequired(doc) && !isActionDeadlinePast(doc) && !isStatusCompleted(doc);

const isCpbHighlighted = (doc: CalendarDoc): boolean => {
  const subjects = getDocSubjects(doc);
  const governingBodies = getDocGoverningBodies(doc);
  const targets = getDocGlobalTargets(doc);

  return (
    subjects.includes('CBD-SUBJECT-CPB') ||
    governingBodies.includes('CBD-SUBJECT-CPB') ||
    targets.includes('GBF-TARGET-17') ||
    subjects.includes('CBD-SUBJECT-SYNBIO')
  );
};

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

const getDescription = (doc: CalendarDoc): string => {
  // For notifications, mirror the list-view logic: use fulltext (first 3 sentences)
  // then fall back to locale-specific description fields.
  if (isNotification(doc)) {
    const fulltext = getDocStringValue(doc, 'fulltext');

    if (fulltext) {
      const sentences = fulltext.match(/[^.!?]+[.!?]+/g) || [];
      const firstThree = sentences.slice(0, 3).join(' ').trim();

      return firstThree || '';
    }
  }

  return getDocStringValue(doc, descriptionField.value, 'description', 'descriptionTxt', 'descriptionText') ?? '';
};

const getSubjectLabels = (doc: CalendarDoc): string[] => displaySubjectLabels(doc);

const getSubsidiaryBodies = (doc: CalendarDoc): string[] => resolveSubsidiaryBodyLabels(getDocSubsidiaryBodies(doc));

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
  return fetchedRelatedActivities.value[doc.id] ?? [];
};

const getRelatedMeetings = (doc: CalendarDoc): CalendarDoc[] => {
  return fetchedRelatedMeetings.value[doc.id] ?? [];
};

/**
 * Activity identifiers from activities_ss that could not be resolved
 * by the dedicated SOLR fetch. Displayed as simple labels so users
 * still see that a relation exists.
 */
const getUnresolvedActivityRefs = (doc: CalendarDoc): string[] => {
  const refs = doc.activities;

  if (!refs || !Array.isArray(refs) || refs.length === 0) {
    return [];
  }

  // Until the fetch completes, show nothing (not raw IDs)
  if (!fetchedActivityFlags.value[doc.id]) {
    return [];
  }

  const resolved = getRelatedActivities(doc);
  const resolvedIds = new Set(resolved.map(d => d.id));
  const resolvedIdentifiers = new Set(resolved.map(d => d.identifier));

  return refs.filter(r => !resolvedIds.has(r) && !resolvedIdentifiers.has(r));
};

/**
 * Meeting identifiers from meetings_ss that could not be resolved
 * by the dedicated SOLR fetch. Displayed as simple labels so users
 * still see that a relation exists.
 */
const getUnresolvedMeetingRefs = (doc: CalendarDoc): string[] => {
  const refs = doc.meetings;

  if (!refs || !Array.isArray(refs) || refs.length === 0) {
    return [];
  }

  // Until the fetch completes, show nothing (not raw IDs)
  if (!fetchedMeetingFlags.value[doc.id]) {
    return [];
  }

  const resolved = getRelatedMeetings(doc);
  const resolvedIds = new Set(resolved.map(d => d.id));
  const resolvedIdentifiers = new Set(resolved.map(d => d.identifier));
  const resolvedCodes = new Set(
    resolved
      .map(d => (d as Record<string, unknown>).meetingCode as string | undefined)
      .filter(Boolean),
  );
  const resolvedSymbols = new Set(
    resolved
      .map(d => (d as Record<string, unknown>).symbol as string | undefined)
      .filter(Boolean),
  );

  return refs.filter(r => {
    if (resolvedIds.has(r) || resolvedIdentifiers.has(r) || resolvedCodes.has(r) || resolvedSymbols.has(r)) {
      return false;
    }

    const mapped = LEGACY_MEETING_ID_MAP[r];

    if (mapped && (resolvedIds.has(mapped) || resolvedIdentifiers.has(mapped) || resolvedCodes.has(mapped) || resolvedSymbols.has(mapped))) {
      return false;
    }

    return true;
  });
};

const getGoverningBodies = (doc: CalendarDoc): string[] => resolveGoverningBodyLabels(getDocGoverningBodies(doc));

const getGbfSections = (doc: CalendarDoc): string[] => getDocGbfSections(doc);

const getGlobalTargets = (doc: CalendarDoc): string[] => getDocGlobalTargets(doc);

const isActivityDoc = (doc: CalendarDoc): boolean => !isMeetingDoc(doc) && !isNotification(doc);

/** Resolve theme identifiers to human-readable labels (meetings & notifications). */
const getThemeLabels = (doc: CalendarDoc): string[] => {
  const identifiers = getDocThemes(doc);
  const labels = subjectLabelMap.value;
  const seen = new Set<string>();

  return identifiers
    .map(id => resolveSubjectLabel(id, labels) || fallbackSubjectLabel(id))
    .filter(label => {
      if (!label || !label.trim()) {
        return false;
      }
      const normalized = label.trim();

      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
};

/** Notification recipients. */
const getRecipients = (doc: CalendarDoc): string[] => {
  if (!isNotification(doc)) {
    return [];
  }
  return getDocRecipients(doc);
};

/** Notification file attachments. */
const getAttachments = (doc: CalendarDoc): NotificationAttachment[] => {
  if (!isNotification(doc)) {
    return [];
  }
  return parseNotificationAttachments(getDocFiles(doc));
};

/** Direct link to a notification on the CBD website. */
const getNotificationLink = (doc: CalendarDoc): string => {
  if (!isNotification(doc)) {
    return '';
  }
  const symbol = getDocStringValue(doc, 'symbol') ?? '';

  return symbol ? buildNotificationLink(symbol) : '';
};

/** Action deadline for a notification (actionDate or submission deadline). */
const getActionDeadline = (doc: CalendarDoc): string | null => {
  if (!isNotification(doc)) {
    return null;
  }
  return getDocStringValue(doc, 'actionDate') ?? getDocStringValue(doc, 'deadline') ?? null;
};

/** Extract meeting URL links from the document. */
const meetingLinksCache = new WeakMap<CalendarDoc, string[]>();

const getMeetingUrls = (doc: CalendarDoc): string[] => {
  if (!isMeetingDoc(doc)) {
    return [];
  }

  const cached = meetingLinksCache.get(doc);

  if (cached) {
    return cached;
  }

  const record = doc as Record<string, unknown>;
  const candidateFields = [
    'links', 'link', 'meetingLinks', 'meetingLink',
    'meetingUrl', 'meetingUrls', 'url', 'urls', 'documents',
  ] as const;

  const collected: string[] = [];

  const collectFromSource = (source: Record<string, unknown>) => {
    candidateFields.forEach(field => {
      const value = source[field];

      if (!value) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(entry => {
          if (typeof entry === 'string') {
            const trimmed = entry.trim();

            if (trimmed) {
              collected.push(trimmed);
            }
          }
        });
      } else if (typeof value === 'string') {
        const trimmed = value.trim();

        if (trimmed) {
          collected.push(trimmed);
        }
      }
    });
  };

  collectFromSource(record);

  const raw = getDocRaw(doc);

  if (raw) {
    collectFromSource(normalizeSolrDocument(raw));
  }

  const normalized = Array.from(new Set(
    collected.map(link => resolveNotificationUrl(link)),
  )).filter(link => /^https?:/i.test(link));

  meetingLinksCache.set(doc, normalized);
  return normalized;
};

/** Document symbol: meeting code, notification symbol, or activity identifier. */
const getDocumentSymbol = (doc: CalendarDoc): string => {
  if (isMeetingDoc(doc)) {
    return getMeetingSymbol(doc);
  }
  if (isNotification(doc)) {
    const symbol = getNotificationSymbol(doc);

    return symbol ? `NTF-${symbol}` : '';
  }
  return getDocStringValue(doc, 'identifier') ?? '';
};

/** Related notifications for meetings (via getRelatedNotificationsForMeeting). */
const getRelatedNotifications = (doc: CalendarDoc) => {
  if (!isMeetingDoc(doc)) {
    return [];
  }
  return getRelatedNotificationsForMeeting(doc, docs.value);
};

/**
 * All notification entries combining direct entries and related notification entries.
 * Used by activities and meetings (notifications show related activities/meetings instead).
 */
const getAllNotificationEntries = (doc: CalendarDoc) => {
  if (isNotification(doc)) {
    return [];
  }
  const direct = notificationDisplayEntries(doc);
  const related = getRelatedNotifications(doc).flatMap(n => notificationDisplayEntries(n));
  const combined = [...direct, ...related];
  const seen = new Set<string>();

  return combined.filter(entry => {
    if (seen.has(entry.key)) {
      return false;
    }
    seen.add(entry.key);
    return true;
  });
};

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

function setupScrollObserver(el: HTMLElement | null) {
  observer?.disconnect();
  observer = null;

  if (!el) {
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
  observer.observe(el);
}

/**
 * Re-check sentinel visibility after a load-more cycle completes.
 * Waits for two animation frames so the browser has actually painted
 * the new DOM content before measuring. This prevents a cascade of
 * load-more calls that fire before content pushes the sentinel down.
 */
const checkSentinelVisibility = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!scrollSentinel.value || !hasMore.value || loading.value || loadingMore.value) {
        return;
      }

      const rect = scrollSentinel.value.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight + 200;

      if (inViewport) {
        void loadMore();
      }
    });
  });
};

// Pause the IntersectionObserver while a load-more is in progress so stale
// intersection entries don't queue duplicate requests. When loading finishes,
// re-observe and then check if the sentinel is still in viewport.
watch(loadingMore, (isLoading, wasLoading) => {
  if (isLoading && observer && scrollSentinel.value) {
    observer.unobserve(scrollSentinel.value);
  }

  if (wasLoading && !isLoading) {
    nextTick(() => {
      if (observer && scrollSentinel.value) {
        observer.observe(scrollSentinel.value);
      }
      checkSentinelVisibility();
    });
  }
});

/**
 * Measure the pilot banner and thead heights, then set CSS custom properties
 * on the root element so sticky offsets are always pixel-accurate.
 */
const updateStickyOffsets = () => {
  if (!rootEl.value) {
    return;
  }

  const banner = document.querySelector('.pilot-banner') as HTMLElement | null;
  const bannerH = banner ? banner.getBoundingClientRect().height : 0;
  const theadH = theadEl.value ? theadEl.value.getBoundingClientRect().height : 0;

  rootEl.value.style.setProperty('--calendar-group-header-offset', `${bannerH}px`);
  rootEl.value.style.setProperty('--calendar-thead-height', `${theadH}px`);
};

// Re-measure whenever the thead appears (it lives inside a v-else block)
watch(theadEl, () => {
  nextTick(() => updateStickyOffsets());
});

// The sentinel lives inside a v-else block that only renders after data loads,
// so it is null at mount time. Watch the ref to attach the observer once the
// element actually appears in the DOM.
watch(scrollSentinel, (el) => {
  setupScrollObserver(el);
});

onMounted(() => {
  // Handle the (rare) case where the element already exists at mount time.
  setupScrollObserver(scrollSentinel.value);
  updateStickyOffsets();
  nextTick(() => setupStickyObserver());
  window.addEventListener('resize', updateStickyOffsets);
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
  stickyObserver?.disconnect();
  stickyObserver = null;
  if (loadingMoreTimer) {
    clearTimeout(loadingMoreTimer);
    loadingMoreTimer = null;
  }
  window.removeEventListener('resize', updateStickyOffsets);
});
</script>

<style scoped>
.activities-table {
  --calendar-primary: #0d6efd;
  --calendar-group-header-offset: 1.95rem;
  --calendar-thead-height: 2.55rem;
}

.month-group-header td {
  position: sticky;
  top: calc(var(--calendar-group-header-offset) + var(--calendar-thead-height));
  z-index: 3;
  padding: 0 !important;
  border: none;
  background-color: #6c757d;
}

.month-group-header__content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  color: #fff;
}

.month-group-header__label {
  font-family: -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 1.35rem;
  font-weight: 500;
  line-height: 1.2;
}

.month-group-header__count {
  font-size: 0.95rem;
  font-weight: 400;
  color: #fff;
  white-space: nowrap;
}

.month-group-header__loading {
  display: inline-flex;
  align-items: center;
  margin: 0 auto;
  color: #fff;
}

.sticky-sentinel td {
  padding: 0 !important;
  border: none;
  height: 0;
  line-height: 0;
  font-size: 0;
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
  overflow-x: clip;
  overflow-y: visible;
}

.table {
  font-size: 0.9rem;
}

.table thead th {
  position: sticky;
  top: var(--calendar-group-header-offset);
  z-index: 4;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
  background-color: #f8f9fa;
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

.main-row.row-cpb-highlight {
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

.expand-icon--open {
  transform: rotate(90deg);
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

.badge :deep(.search-highlight) {
  background-color: transparent;
  color: #ffd700;
  box-shadow: 0 0 6px 2px rgba(255, 215, 0, 0.6);
  border-radius: 3px;
  padding: 0.1em 0.2em;
}
</style>
