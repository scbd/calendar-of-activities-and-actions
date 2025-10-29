<template>
  <section class="activities-explorer">
    <div class="container-fluid py-3">
      <div class="card mb-3">
        <div class="card-body">
          <CalendarFilters2
            :available-types="availableTypes"
            :available-subjects="availableSubjects"
            :available-statuses="availableStatuses"
            :available-subsidiary-bodies="availableSubsidiaryBodies"
            :available-cop-decisions="availableCopDecisions"
            :preloaded-country-options="availableCountryOptions"
            :preloaded-global-target-options="availableGlobalTargetOptions"
            :initial-start-date="initialStartDate"
            @update:filters="handleFiltersUpdate"
          />
      </div>
    </div>

      <div v-if="loading" class="loading-container">
        <div class="spinner-border spinner-large" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else>
        <div v-if="groupedItems.length === 0" class="alert alert-warning">{{ t('calendar.messages.noResults') }}</div>        <div v-for="group in groupedItems" :key="group.key" class="mb-4">
          <div class="dg-sep"><h3 class="m-0">{{ groupLabel(group) }}</h3></div>

          <div :id="`accordion-${group.key}`" class="accordion">
            <CalendarAccordionItem
              v-for="doc in group.items"
              :key="itemKey(doc)"
              :doc="doc"
              :all-docs="allDocsFlat"
              :is-open="isItemOpen(doc)"
              :heading-id="headingId(doc)"
              :collapse-id="collapseId(doc)"
              :fade-others="anyItemOpen"
              @toggle="toggleAccordion(doc)"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { DateTime } from 'luxon';
import { useI18n } from '#imports';
import { useRoute } from '#app';
import CalendarFilters2 from './calendar-filters-2.vue';
import CalendarAccordionItem from './calendar-accordion-item.vue';
import { useCalendarData } from '../../composables/use-calendar-data';
import { configureStatusLocalization } from 'shared/utils/status';
import { configureLabelLocalization, setRegionDisplayNames } from 'shared/utils/labels';
import type { CalendarDoc, FilterState, GroupedItem } from 'shared/types/calendar';
import type { LocaleCode } from 'shared/services/solr';

const { t, te, locale } = useI18n();
const route = useRoute();

configureStatusLocalization({ t, te });
configureLabelLocalization({ t, te });

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

const defaultStartDateIso = DateTime.now().startOf('day').toISO();

// Check for startDate in query params - use it to override default
const queryStartDate = route.query.startDate as string;
const initialStartDate = queryStartDate || defaultStartDateIso;

console.log('[Filters] Default start date:', defaultStartDateIso);
console.log('[Filters] Query start date:', queryStartDate);
console.log('[Filters] Using initial start date:', initialStartDate);

const {
  loading,
  docs,
  locale: calendarLocale,
  groupedItems,
  availableTypes,
  availableSubjects,
  availableStatuses,
  availableSubsidiaryBodies,
  availableCopDecisions,
  availableCountryOptions,
  availableGlobalTargetOptions,
  setFilters,
} = useCalendarData({
  initialStartDate,
  locale: locale.value as LocaleCode,
  messages: {
    notificationNotFound: () => t('calendar.notifications.notFound') as string,
    notificationLoadFailed: () => t('calendar.notifications.loadFailed') as string,
  },
});

const allDocsFlat = computed(() => {
  return docs.value;
});

setRegionDisplayNames(createRegionDisplayNames(locale.value));

watch(() => locale.value, (nextLocale) => {
  calendarLocale.value = nextLocale as LocaleCode;
  setRegionDisplayNames(createRegionDisplayNames(nextLocale));
});

const openItems = ref<Record<string, boolean>>({});

const anyItemOpen = computed(() => Object.values(openItems.value).some(isOpen => isOpen));

const itemKey = (doc: CalendarDoc): string => String(doc.id ?? '');
const isItemOpen = (doc: CalendarDoc): boolean => Boolean(openItems.value[itemKey(doc)]);
const toggleAccordion = (doc: CalendarDoc) => {
  const key = itemKey(doc);

  openItems.value[key] = !openItems.value[key];
};
const headingId = (doc: CalendarDoc): string => `heading-${itemKey(doc)}`;
const collapseId = (doc: CalendarDoc): string => `collapse-${itemKey(doc)}`;

const groupLabel = (group: GroupedItem): string => {
  if (!group.label || group.label.toLowerCase() === 'unknown date') {
    return t('calendar.labels.unknownDate') as string;
  }
  return group.label;
};

const handleFiltersUpdate = (filters: FilterState) => {
  setFilters(filters);
};

// Handle auto-expand from query parameter
const autoExpandId = route.query.autoExpand as string;

console.log('[AutoExpand] Query params:', route.query);
console.log('[AutoExpand] Target ID:', autoExpandId);

if (autoExpandId) {
  // Watch for loading to complete
  const stopWatch = watch(
    () => ({ isLoading: loading.value, docsCount: docs.value.length }),
    ({ isLoading, docsCount }) => {
      console.log('[AutoExpand] Watch triggered - Loading:', isLoading, 'Docs count:', docsCount);
      console.log('[AutoExpand] Grouped items count:', groupedItems.value.length);
      
      if (!isLoading && docsCount > 0) {
        console.log('[AutoExpand] Data loaded, stopping watcher');
        // Stop watching once we've found the right moment
        stopWatch();
        
        // Get all visible docs from grouped items (filtered results)
        const visibleDocs = groupedItems.value.flatMap(group => group.items);
        
        // Log all doc IDs for debugging
        console.log('[AutoExpand] All doc IDs:', docs.value.map(d => d.id));
        console.log('[AutoExpand] Visible (filtered) doc IDs:', visibleDocs.map(d => d.id));
        
        // Wait for DOM to update
        nextTick(() => {
          setTimeout(() => {
            // Find the item in visible (filtered) docs
            const docExists = visibleDocs.some(doc => String(doc.id) === autoExpandId);
            
            console.log('[AutoExpand] Doc exists?', docExists);
            
            if (docExists) {
              console.log('[AutoExpand] Expanding item:', autoExpandId);
              openItems.value[autoExpandId] = true;
              
              console.log('[AutoExpand] openItems state:', openItems.value);
              
              // Wait for accordion animation, then scroll
              setTimeout(() => {
                const element = document.getElementById(`heading-${autoExpandId}`);
                
                console.log('[AutoExpand] Found element?', !!element, `#heading-${autoExpandId}`);
                
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  console.log('[AutoExpand] Scrolled to element');
                }
              }, 400);
            } else {
              console.error('[AutoExpand] Could not find doc with ID:', autoExpandId);
            }
          }, 200);
        });
      }
    },
    { immediate: true }
  );
} else {
  console.log('[AutoExpand] No autoExpand query parameter');
}
</script>

<style lang="scss">
@use '../../assets/styles/main.scss' as *;
</style>
<style scoped>
.activities-explorer {
  --calendar-group-header-offset: 0px;
  --calendar-group-header-bg: var(--bs-body-bg, #fff);
}

.dg-sep {
  position: sticky;
  top: var(--calendar-group-header-offset);
  z-index: 3;
  padding: 0.75rem 0;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  margin: 1.5rem 0 1rem;
  background-color: var(--calendar-group-header-bg);
  scroll-margin-top: calc(var(--calendar-group-header-offset) + 1rem);
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}
h3 {
  font-family: -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 28px;
  font-weight: 500;
  line-height: 33.6px;
  margin-bottom: 8px;
  margin-top: 0px;
}

.calendar-accordion__summary {
  padding-left: 1rem;
  text-align: left;
}

.calendar-accordion__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  text-align: left;
}

.calendar-accordion__meta {
  margin-top: 0.25rem;
  text-align: left;
}

.calendar-row__type-text {
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* New top banner style replacing the old left strip */
.calendar-row__type-banner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.5rem;
  margin: -0.5rem -0.75rem 0.75rem; /* bleed to edges of button */
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
  text-transform: uppercase;
  color: #fff;
}

.calendar-accordion__meta-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.calendar-accordion__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.calendar-accordion__footer--has-link {
  justify-content: space-between;
}

.calendar-accordion__status-badges {
  display: flex;
  gap: 0.5rem;
}

.calendar-accordion__cta {
  font-weight: 600;
}

.calendar-accordion__cta--documents {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bs-primary);
  color: #fff;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 600;
  text-decoration: none;
}

.calendar-accordion__status-badge {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-subjects {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calendar-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.calendar-pill-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6c757d;
}

.calendar-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #f1f3f5;
  color: #1f1f1f;
  font-size: 0.875rem;
}

.calendar-pill--muted {
  background-color: #eef2f6;
  color: #4b5563;
}

.calendar-notifications {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
}

.calendar-notifications__header {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e5e5;
  background-color: #f9fafb;
}

.calendar-notification-card {
  padding: 1rem;
  border-bottom: 1px solid #f1f3f5;
}

.calendar-notification-card:last-child {
  border-bottom: none;
}

.calendar-notification-card__pill-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.calendar-notification-card__pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #0f7abd;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}

.calendar-notification-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #fef3c7;
  color: #92400e;
  font-weight: 600;
}

.calendar-notification-card__badge-deadline {
  font-weight: 400;
}

.calendar-notification-card__meta {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.calendar-notification-card__status {
  margin-top: 0.75rem;
  font-weight: 600;
}

.calendar-notification-card__status--error {
  color: #b91c1c;
}

.calendar-notification-card__title {
  display: inline-block;
  margin-top: 1rem;
  font-weight: 600;
  color: #0f172a;
  text-decoration: none;
}

.calendar-notification-card__section {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calendar-notification-card__attachments {
  gap: 0.25rem;
}

.calendar-notification-card__actions {
  margin-top: 1rem;
}

.calendar-notification-card__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #0f7abd;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 768px) {
  .calendar-accordion__summary {
    padding-left: 0.75rem;
  }
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
  color: #0d6efd;
}
</style>
