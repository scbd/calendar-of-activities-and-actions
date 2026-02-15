<template>
  <div class="calendar-filters">
    <div class="row g-3">
      <!-- Free Text Search -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="search-filter" class="form-label">{{ t('calendar.filters.labels.search') }}</label>
        <input
          id="search-filter"
          v-model="searchText"
          type="search"
          :placeholder="t('calendar.filters.placeholders.search')"
          class="form-control form-control-lg"
        >
      </div>

      <!-- Record Type Filter -->
      <div v-if="!hideTypeFilter" class="col-12 col-md-6 col-lg-3">
        <label for="type-filter" class="form-label">{{ t('calendar.filters.labels.schemas') }}</label>
        <Multiselect
          id="type-filter"
          v-model="selectedTypes"
          :options="recordTypeOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.schemas')"
        >
          <template #tag="{ option, remove }">
            <span class="multiselect__tag">
              <span>{{ option.label }}</span>
              <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
              <i class="multiselect__tag-icon" tabindex="0" @click="remove(option)" @keydown.enter="remove(option)" />
            </span>
          </template>
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
          </template>
        </Multiselect>
      </div>

      <!-- Activity Types Filter (only when calendarActivity is in selected types) -->
      <div v-if="showActivityTypesFilter" class="col-12 col-md-6 col-lg-3">
        <label for="activity-types-filter" class="form-label">{{ t('calendar.filters.labels.activityTypes') }}</label>
        <Multiselect
          id="activity-types-filter"
          v-model="selectedActivityTypes"
          :options="activityTypeOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.activityTypes')"
        >
          <template #tag="{ option, remove }">
            <span class="multiselect__tag">
              <span>{{ option.label }}</span>
              <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
              <i class="multiselect__tag-icon" tabindex="0" @click="remove(option)" @keydown.enter="remove(option)" />
            </span>
          </template>
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
          </template>
        </Multiselect>
      </div>

      <!-- GBF Sections & Targets Filter (grouped) -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="gbf-filter" class="form-label">{{ t('calendar.filters.labels.gbfTargetsAndSections') }}</label>
        <Multiselect
          id="gbf-filter"
          v-model="selectedGbfItems"
          :options="gbfFilterOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          group-values="options"
          group-label="groupLabel"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.gbfTargetsAndSections')"
        >
          <template #tag="{ option, remove }">
            <span class="multiselect__tag">
              <span>{{ option.label }}</span>
              <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
              <i class="multiselect__tag-icon" tabindex="0" @click="remove(option)" @keydown.enter="remove(option)" />
            </span>
          </template>
          <template #option="slotProps">
            <span v-if="slotProps?.option?.$groupLabel">
              {{ slotProps.option.$groupLabel }}
            </span>
            <span v-else>
              {{ slotProps?.option?.label }}
              <span v-if="slotProps?.option?.count != null" class="badge rounded-pill bg-secondary ms-1">{{ slotProps.option.count }}</span>
            </span>
          </template>
        </Multiselect>
      </div>

      <!-- Countries Filter -->
      <div v-show="false" class="col-12 col-md-6 col-lg-3">
        <label for="countries-filter" class="form-label">{{ t('calendar.filters.labels.countries') }}</label>
        <Multiselect
          id="countries-filter"
          v-model="selectedCountries"
          :options="countryOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.countries')"
        >
          <template #tag="{ option, remove }">
            <span class="multiselect__tag">
              <span>{{ option.label }}</span>
              <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
              <i class="multiselect__tag-icon" tabindex="0" @click="remove(option)" @keydown.enter="remove(option)" />
            </span>
          </template>
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
          </template>
        </Multiselect>
      </div>

      <!-- Subject Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="subject-filter" class="form-label">{{ t('calendar.filters.labels.subjects') }}</label>
        <Multiselect
          id="subject-filter"
          v-model="selectedSubjects"
          :options="subjectOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.subjects')"
        >
          <template #tag="{ option, remove }">
            <span class="multiselect__tag">
              <span>{{ option.label }}</span>
              <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
              <i class="multiselect__tag-icon" tabindex="0" @click="remove(option)" @keydown.enter="remove(option)" />
            </span>
          </template>
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
          </template>
        </Multiselect>
      </div>

      <!-- Status Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="status-filter" class="form-label">{{ t('calendar.filters.labels.statuses') }}</label>
        <Multiselect
          id="status-filter"
          v-model="selectedStatuses"
          :options="statusOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.statuses')"
        >
          <template #tag="{ option, remove }">
            <span class="multiselect__tag">
              <span>{{ option.label }}</span>
              <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
              <i class="multiselect__tag-icon" tabindex="0" @click="remove(option)" @keydown.enter="remove(option)" />
            </span>
          </template>
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
          </template>
        </Multiselect>
      </div>

      <!-- Governing & Subsidiary Bodies Filter (grouped) -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="bodies-filter" class="form-label">{{ t('calendar.filters.labels.governingAndSubsidiaryBodies') }}</label>
        <Multiselect
          id="bodies-filter"
          v-model="selectedBodies"
          :options="bodyFilterOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          group-values="options"
          group-label="groupLabel"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.governingAndSubsidiaryBodies')"
        >
          <template #tag="{ option, remove }">
            <span class="multiselect__tag">
              <span>{{ option.label }}</span>
              <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
              <i class="multiselect__tag-icon" tabindex="0" @click="remove(option)" @keydown.enter="remove(option)" />
            </span>
          </template>
          <template #option="slotProps">
            <span v-if="slotProps?.option?.$groupLabel">
              {{ slotProps.option.$groupLabel }}
            </span>
            <span v-else>
              {{ slotProps?.option?.label }}
              <span v-if="slotProps?.option?.count != null" class="badge rounded-pill bg-secondary ms-1">{{ slotProps.option.count }}</span>
            </span>
          </template>
        </Multiselect>
      </div>

      <!-- COP Decision Filter -->
      <div v-show="false" class="col-12 col-md-6 col-lg-3">
        <label for="cop-decision-filter" class="form-label">{{ t('calendar.filters.labels.decisions') }}</label>
        <Multiselect
          id="cop-decision-filter"
          v-model="selectedCopDecisions"
          :options="decisionOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.decisions')"
        >
          <template #tag="{ option, remove }">
            <span class="multiselect__tag">
              <span>{{ option.label }}</span>
              <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
              <i class="multiselect__tag-icon" tabindex="0" @click="remove(option)" @keydown.enter="remove(option)" />
            </span>
          </template>
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="badge rounded-pill bg-secondary ms-1">{{ option.count }}</span>
          </template>
        </Multiselect>
      </div>

      <!-- Date Range Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label">{{ t('calendar.filters.labels.dateRange') }}</label>
        <div class="row g-2">
          <div class="col-12">
            <input
              v-model="startDate"
              type="date"
              class="form-control form-control-sm"
              :placeholder="t('calendar.filters.labels.startDate')"
              @input="updateFilters"
            >
          </div>
          <div class="col-12">
            <input
              v-model="endDate"
              type="date"
              class="form-control form-control-sm"
              :placeholder="t('calendar.filters.labels.endDate')"
              @input="updateFilters"
            >
          </div>
        </div>
      </div>

      <!-- Action Required Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label">{{ t('calendar.filters.labels.actionRequired') }}</label>
        <div class="form-check">
          <input
            id="action-required-filter"
            v-model="actionRequired"
            class="form-check-input"
            type="checkbox"
            @change="updateFilters"
          >
          <label class="form-check-label" for="action-required-filter">
            {{ t('calendar.filters.toggles.actionRequiredOnly') }}
          </label>
        </div>
      </div>

      <!-- Sort Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="sort-filter" class="form-label">{{ t('calendar.filters.labels.sort') }}</label>
        <Multiselect
          id="sort-filter"
          v-model="selectedSorts"
          :options="sortOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.sort')"
        />
      </div>

      <!-- Clear Filters Button -->
      <div class="col-12">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          :disabled="!hasActiveFilters"
          @click="clearFilters"
        >
          {{ t('calendar.filters.actions.clearAll') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, nextTick, onMounted, type Ref, type ComputedRef } from 'vue';
import Multiselect from 'vue-multiselect';
import { useThesaurusFilters } from '../../composables/use-thesaurus-filters';
import type { FilterOption, FilterState, ParsedFacets } from 'shared/types/calendar';

// Nuxt auto-imports
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

// ---------------------------------------------------------------------------
// Props & Emits
// ---------------------------------------------------------------------------

interface Props {
  /** Parsed SOLR facet counts — drives filter option visibility & counts. */
  facets: ParsedFacets;
  /** Default start date for the date range filter. */
  initialStartDate?: string;
  /** Hide the record type filter (used in tab view mode). */
  hideTypeFilter?: boolean;
  /** Active tab type in tab view mode — empty string when not in tab view. */
  activeTabType?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialStartDate: '',
  hideTypeFilter: false,
  activeTabType: '',
});

const emit = defineEmits<{
  'update:filters': [filters: FilterState];
}>();

// ---------------------------------------------------------------------------
// Thesaurus filter options (merged with SOLR facet counts)
// ---------------------------------------------------------------------------

const facetsRef = computed<ParsedFacets>(() => props.facets ?? {});

const {
  recordTypeOptions,
  subjectOptions,
  governingBodyOptions,
  subsidiaryBodyOptions,
  activityTypeOptions,
  globalTargetOptions,
  gbfSectionOptions,
  countryOptions,
  statusOptions,
  decisionOptions,
} = useThesaurusFilters({
  locale: computed(() => locale.value),
  facets: facetsRef,
});

// ---------------------------------------------------------------------------
// Constants & types
// ---------------------------------------------------------------------------

type FilterSelectionValue = FilterOption | string;

interface BodyFilterOption extends FilterOption {
  bodyGroup: 'governingBodies' | 'subsidiaryBodies';
}

interface BodyFilterGroup {
  groupLabel: string;
  options: BodyFilterOption[];
}

interface GbfFilterOption extends FilterOption {
  gbfGroup: 'gbfSections' | 'globalTargets';
}

interface GbfFilterGroup {
  groupLabel: string;
  options: GbfFilterOption[];
}

const DEFAULT_SORT_VALUES = Object.freeze(['startDate:asc']);

// ---------------------------------------------------------------------------
// Reactive filter selections
// ---------------------------------------------------------------------------

const selectedTypes = ref<FilterSelectionValue[]>([]);
const selectedSubjects = ref<FilterSelectionValue[]>([]);
const selectedStatuses = ref<FilterSelectionValue[]>([]);
const selectedBodies = ref<BodyFilterOption[]>([]);
const selectedCopDecisions = ref<FilterSelectionValue[]>([]);
const selectedActivityTypes = ref<FilterSelectionValue[]>([]);
const selectedGbfItems = ref<GbfFilterOption[]>([]);
const selectedCountries = ref<FilterSelectionValue[]>([]);
const selectedSorts = ref<FilterSelectionValue[]>([...DEFAULT_SORT_VALUES]);
const startDate = ref<string>(props.initialStartDate ?? '');
const endDate = ref<string>('');
const actionRequired = ref<boolean>(false);
const searchText = ref<string>('');

// Track if any filter has been manually selected
const hasUserInteracted = ref<boolean>(false);

// Track if we are loading from URL to prevent circular updates
const isLoadingFromUrl = ref<boolean>(false);

// Track if we have completed the initial mount (to only apply initialStartDate once)
const hasCompletedInitialMount = ref<boolean>(false);

// ---------------------------------------------------------------------------
// Computed helpers
// ---------------------------------------------------------------------------

/** Check if any filters are active (controls Clear button state). */
const hasActiveFilters = computed<boolean>(() => {
  const activeSorts = extractSelectedValues(selectedSorts.value);

  return (
    selectedTypes.value.length > 0 ||
    selectedSubjects.value.length > 0 ||
    selectedStatuses.value.length > 0 ||
    selectedBodies.value.length > 0 ||
    selectedCopDecisions.value.length > 0 ||
    selectedActivityTypes.value.length > 0 ||
    selectedGbfItems.value.length > 0 ||
    selectedCountries.value.length > 0 ||
    startDate.value !== '' ||
    endDate.value !== '' ||
    actionRequired.value ||
    searchText.value.trim().length > 0 ||
    !areSortSelectionsDefault(activeSorts)
  );
});

/**
 * Activity Types filter visibility:
 * - Tab view: only on the calendarActivity tab
 * - Non-tab view: when calendarActivity is selected or no types are selected
 */
const showActivityTypesFilter = computed<boolean>(() => {
  if (props.activeTabType !== '') {
    return props.activeTabType === 'calendarActivity';
  }

  const typeValues = extractSelectedValues(selectedTypes.value);

  return typeValues.length === 0 || typeValues.includes('calendarActivity');
});

/** Grouped options for the combined governing / subsidiary bodies multiselect. */
const bodyFilterOptions = computed<BodyFilterGroup[]>(() => {
  const groups: BodyFilterGroup[] = [];

  if (governingBodyOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.governingBodies') as string,
      options: governingBodyOptions.value.map((opt) => ({ ...opt, bodyGroup: 'governingBodies' as const })),
    });
  }

  if (subsidiaryBodyOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.subsidiaryBodies') as string,
      options: subsidiaryBodyOptions.value.map((opt) => ({ ...opt, bodyGroup: 'subsidiaryBodies' as const })),
    });
  }

  return groups;
});

/** Grouped options for the combined GBF sections / targets multiselect. */
const gbfFilterOptions = computed<GbfFilterGroup[]>(() => {
  const groups: GbfFilterGroup[] = [];

  if (gbfSectionOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.gbfSections') as string,
      options: gbfSectionOptions.value.map((opt) => ({ ...opt, gbfGroup: 'gbfSections' as const })),
    });
  }

  if (globalTargetOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.globalTargets') as string,
      options: globalTargetOptions.value.map((opt) => ({ ...opt, gbfGroup: 'globalTargets' as const })),
    });
  }

  return groups;
});

/** Sort options — mutually exclusive directions for each date field. */
const sortOptions = computed<FilterOption[]>(() => {
  const selectedValues = extractSelectedValues(selectedSorts.value);
  const hasStartDateAsc = selectedValues.includes('startDate:asc');
  const hasStartDateDesc = selectedValues.includes('startDate:desc');
  const hasEndDateAsc = selectedValues.includes('endDate:asc');
  const hasEndDateDesc = selectedValues.includes('endDate:desc');

  const options: FilterOption[] = [];

  if (!hasStartDateDesc) {
    options.push({ value: 'startDate:asc', label: t('calendar.filters.sortOptions.startDateAsc') as string });
  }
  if (!hasStartDateAsc) {
    options.push({ value: 'startDate:desc', label: t('calendar.filters.sortOptions.startDateDesc') as string });
  }
  if (!hasEndDateDesc) {
    options.push({ value: 'endDate:asc', label: t('calendar.filters.sortOptions.endDateAsc') as string });
  }
  if (!hasEndDateAsc) {
    options.push({ value: 'endDate:desc', label: t('calendar.filters.sortOptions.endDateDesc') as string });
  }

  options.push({ value: 'title:asc', label: t('calendar.filters.sortOptions.titleAsc') as string });
  options.push({ value: 'schema:asc', label: t('calendar.filters.sortOptions.schemaAsc') as string });
  options.push({ value: 'actionRequired:desc', label: t('calendar.filters.sortOptions.actionRequired') as string });

  return options;
});

// ---------------------------------------------------------------------------
// Value extraction & matching
// ---------------------------------------------------------------------------

function extractSelectedValues(selection: FilterSelectionValue[]): string[] {
  return selection
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }
      const raw = item?.value ?? '';

      return typeof raw === 'string' ? raw.trim() : String(raw);
    })
    .filter((value) => value.length > 0);
}

function findOptionsFromValues(values: string[], availableOptions: FilterOption[]): FilterOption[] {
  if (!values.length || !availableOptions.length) return [];

  const optionMap = new Map(availableOptions.map((opt) => [opt.value, opt]));

  return values
    .map((value) => optionMap.get(value))
    .filter((option): option is FilterOption => Boolean(option));
}

function areSortSelectionsDefault(values: string[]): boolean {
  if (values.length !== DEFAULT_SORT_VALUES.length) return false;

  return values.every((value, index) => value === DEFAULT_SORT_VALUES[index]);
}

/**
 * Create provisional FilterOption objects from raw URL string values.
 * These will be replaced with proper thesaurus-labeled options once
 * `syncSelectionWithOptions` runs after options finish loading.
 */
function toProvisionalOptions(values: string[]): FilterOption[] {
  return values.map((v) => ({ value: v, label: v }));
}

function toProvisionalBodyOptions(values: string[], bodyGroup: 'governingBodies' | 'subsidiaryBodies'): BodyFilterOption[] {
  return values.map((v) => ({ value: v, label: v, bodyGroup }));
}

function toProvisionalGbfOptions(values: string[], gbfGroup: 'gbfSections' | 'globalTargets'): GbfFilterOption[] {
  return values.map((v) => ({ value: v, label: v, gbfGroup }));
}

function extractGbfValuesByGroup(items: GbfFilterOption[], group: 'gbfSections' | 'globalTargets'): string[] {
  return items
    .filter((item) => item.gbfGroup === group)
    .map((item) => item.value);
}

function extractBodyValuesByGroup(bodies: BodyFilterOption[], group: 'governingBodies' | 'subsidiaryBodies'): string[] {
  return bodies
    .filter((item) => item.bodyGroup === group)
    .map((item) => item.value);
}

// ---------------------------------------------------------------------------
// URL query string management
// ---------------------------------------------------------------------------

function parseQueryArray(param: string | string[] | undefined): string[] {
  if (!param) return [];
  if (Array.isArray(param)) return param.filter(Boolean);

  return param.split(',').filter(Boolean);
}

// Keys managed by this component — everything else in the URL is preserved.
const MANAGED_QUERY_KEYS = new Set([
  'types', 'subjects', 'statuses', 'subsidiaryBodies', 'governingBodies',
  'copDecisions', 'activityTypes', 'globalTargets', 'gbfSections',
  'countries', 'sort', 'startDate', 'endDate', 'actionRequired', 'search',
]);

function updateUrlQuery(): void {
  if (isLoadingFromUrl.value) return;

  // Preserve query params not managed by this component (e.g. tab-view-toggle)
  const preserved: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(route.query)) {
    if (!MANAGED_QUERY_KEYS.has(key) && value != null) {
      preserved[key] = value as string | string[];
    }
  }

  const query: Record<string, string | undefined> = { ...preserved } as Record<string, string | undefined>;

  const types = extractSelectedValues(selectedTypes.value);

  if (types.length > 0) query.types = types.join(',');

  const subjects = extractSelectedValues(selectedSubjects.value);

  if (subjects.length > 0) query.subjects = subjects.join(',');

  const statuses = extractSelectedValues(selectedStatuses.value);

  if (statuses.length > 0) query.statuses = statuses.join(',');

  const subsidiaryBodies = extractBodyValuesByGroup(selectedBodies.value, 'subsidiaryBodies');

  if (subsidiaryBodies.length > 0) query.subsidiaryBodies = subsidiaryBodies.join(',');

  const governingBodies = extractBodyValuesByGroup(selectedBodies.value, 'governingBodies');

  if (governingBodies.length > 0) query.governingBodies = governingBodies.join(',');

  const copDecisions = extractSelectedValues(selectedCopDecisions.value);

  if (copDecisions.length > 0) query.copDecisions = copDecisions.join(',');

  const activityTypes = extractSelectedValues(selectedActivityTypes.value);

  if (activityTypes.length > 0) query.activityTypes = activityTypes.join(',');

  const globalTargets = extractGbfValuesByGroup(selectedGbfItems.value, 'globalTargets');

  if (globalTargets.length > 0) query.globalTargets = globalTargets.join(',');

  const gbfSections = extractGbfValuesByGroup(selectedGbfItems.value, 'gbfSections');

  if (gbfSections.length > 0) query.gbfSections = gbfSections.join(',');

  const countries = extractSelectedValues(selectedCountries.value);

  if (countries.length > 0) query.countries = countries.join(',');

  const sortSelections = extractSelectedValues(selectedSorts.value);

  if (!areSortSelectionsDefault(sortSelections)) {
    query.sort = sortSelections.join(',');
  }

  if (startDate.value && startDate.value !== props.initialStartDate) {
    query.startDate = startDate.value;
  }

  if (endDate.value) query.endDate = endDate.value;

  if (actionRequired.value) query.actionRequired = 'true';

  const normalizedSearch = searchText.value.trim();

  if (normalizedSearch.length > 0) {
    query.search = normalizedSearch;
  }

  router.replace({ query });
}

function loadFiltersFromUrl(): void {
  isLoadingFromUrl.value = true;

  const query = route.query;

  const types = parseQueryArray(query.types as string | string[] | undefined);
  const subjects = parseQueryArray(query.subjects as string | string[] | undefined);
  const statuses = parseQueryArray(query.statuses as string | string[] | undefined);
  const subsidiaryBodies = parseQueryArray(query.subsidiaryBodies as string | string[] | undefined);
  const governingBodies = parseQueryArray(query.governingBodies as string | string[] | undefined);
  const copDecisions = parseQueryArray(query.copDecisions as string | string[] | undefined);
  const activityTypes = parseQueryArray(query.activityTypes as string | string[] | undefined);
  const globalTargets = parseQueryArray(query.globalTargets as string | string[] | undefined);
  const gbfSections = parseQueryArray(query.gbfSections as string | string[] | undefined);
  const countries = parseQueryArray(query.countries as string | string[] | undefined);
  const sortOrder = parseQueryArray(query.sort as string | string[] | undefined);
  const searchParam = typeof query.search === 'string'
    ? query.search
    : Array.isArray(query.search) ? query.search[0] ?? '' : '';

  // Restore selections as provisional FilterOption objects.
  // syncSelectionWithOptions replaces these with proper thesaurus-labelled
  // options once the composable finishes loading.
  const restoreSelection = (
    values: string[],
    selection: Ref<FilterSelectionValue[]>,
  ): void => {
    if (values.length > 0) {
      selection.value = toProvisionalOptions(values);
      hasUserInteracted.value = true;
    } else {
      selection.value = [];
    }
  };

  restoreSelection(types, selectedTypes);
  restoreSelection(subjects, selectedSubjects);
  restoreSelection(statuses, selectedStatuses);
  // Restore combined governing + subsidiary bodies
  const provisionalBodies: BodyFilterOption[] = [
    ...toProvisionalBodyOptions(governingBodies, 'governingBodies'),
    ...toProvisionalBodyOptions(subsidiaryBodies, 'subsidiaryBodies'),
  ];

  if (provisionalBodies.length > 0) {
    selectedBodies.value = provisionalBodies;
    hasUserInteracted.value = true;
  } else {
    selectedBodies.value = [];
  }
  restoreSelection(copDecisions, selectedCopDecisions);
  restoreSelection(activityTypes, selectedActivityTypes);
  // Restore combined GBF sections + targets
  const provisionalGbf: GbfFilterOption[] = [
    ...toProvisionalGbfOptions(gbfSections, 'gbfSections'),
    ...toProvisionalGbfOptions(globalTargets, 'globalTargets'),
  ];

  if (provisionalGbf.length > 0) {
    selectedGbfItems.value = provisionalGbf;
    hasUserInteracted.value = true;
  } else {
    selectedGbfItems.value = [];
  }
  restoreSelection(countries, selectedCountries);

  // Sort options are local computed — always available immediately
  if (sortOrder.length > 0) {
    selectedSorts.value = findOptionsFromValues(sortOrder, sortOptions.value);
    hasUserInteracted.value = true;
  } else {
    selectedSorts.value = [...DEFAULT_SORT_VALUES];
  }

  if (searchParam) {
    searchText.value = searchParam;
    hasUserInteracted.value = true;
  } else {
    searchText.value = '';
  }

  // Date filters
  if (query.startDate && typeof query.startDate === 'string') {
    startDate.value = query.startDate;
    hasUserInteracted.value = true;
  } else if (!hasCompletedInitialMount.value) {
    // First mount: use the initial start date prop (today) if no URL param
    startDate.value = props.initialStartDate || '';
  }
  // After initial mount, leave startDate unchanged when URL has no startDate param.
  // clearFilters() handles resetting startDate to '' explicitly.
  if (query.endDate && typeof query.endDate === 'string') {
    endDate.value = query.endDate;
    hasUserInteracted.value = true;
  } else {
    endDate.value = '';
  }

  // Action required
  if (query.actionRequired === 'true') {
    actionRequired.value = true;
    hasUserInteracted.value = true;
  } else {
    actionRequired.value = false;
  }

  nextTick(() => {
    isLoadingFromUrl.value = false;
  });
}

// ---------------------------------------------------------------------------
// Filter state emission
// ---------------------------------------------------------------------------

function updateFilters(): void {
  const normalizedSearch = searchText.value.trim();

  const filters: FilterState = {
    types: extractSelectedValues(selectedTypes.value),
    subjects: extractSelectedValues(selectedSubjects.value),
    statuses: extractSelectedValues(selectedStatuses.value),
    subsidiaryBodies: extractBodyValuesByGroup(selectedBodies.value, 'subsidiaryBodies'),
    governingBodies: extractBodyValuesByGroup(selectedBodies.value, 'governingBodies'),
    copDecisions: extractSelectedValues(selectedCopDecisions.value),
    activityTypes: extractSelectedValues(selectedActivityTypes.value),
    globalTargets: extractGbfValuesByGroup(selectedGbfItems.value, 'globalTargets'),
    gbfSections: extractGbfValuesByGroup(selectedGbfItems.value, 'gbfSections'),
    countries: extractSelectedValues(selectedCountries.value),
    startDate: startDate.value,
    endDate: endDate.value,
    actionRequired: actionRequired.value,
    searchText: normalizedSearch,
    sort: extractSelectedValues(selectedSorts.value),
  };

  emit('update:filters', filters);
  updateUrlQuery();
}

function clearFilters(): void {
  selectedTypes.value = [];
  selectedSubjects.value = [];
  selectedStatuses.value = [];
  selectedBodies.value = [];
  selectedCopDecisions.value = [];
  selectedActivityTypes.value = [];
  selectedGbfItems.value = [];
  selectedCountries.value = [];
  selectedSorts.value = [...DEFAULT_SORT_VALUES];
  startDate.value = '';
  endDate.value = '';
  actionRequired.value = false;
  searchText.value = '';
  hasUserInteracted.value = false;

  updateFilters();
}

// ---------------------------------------------------------------------------
// Selection <-> option synchronization
// ---------------------------------------------------------------------------

/**
 * Watches an options list and re-maps selected items to match the latest
 * options. Handles:
 * - URL-loaded provisional FilterOption objects -> proper thesaurus options
 * - Facet count changes that alter the available options
 *
 * When options are empty (still loading), selections are preserved so
 * URL-loaded values survive until the composable finishes loading.
 */
function syncSelectionWithOptions(
  selection: Ref<FilterSelectionValue[]>,
  options: Ref<FilterOption[]> | ComputedRef<FilterOption[]>,
): void {
  watch(
    options,
    (newOptions) => {
      // Preserve URL-loaded selections while thesaurus options are loading
      if (newOptions.length === 0) {
        return;
      }

      const optionMap = new Map(newOptions.map((opt) => [opt.value, opt]));
      const filtered = selection.value
        .map((item) => optionMap.get(typeof item === 'string' ? item : item.value))
        .filter((option): option is FilterOption => Boolean(option));

      const selectionChanged =
        filtered.length !== selection.value.length ||
        filtered.some((option, index) => {
          const current = selection.value[index];

          if (!current || typeof current === 'string') {
            return true;
          }

          return current.value !== option.value || current.label !== option.label;
        });

      if (selectionChanged) {
        selection.value = filtered;
        updateFilters();
      }
    },
    { immediate: true },
  );
}

// Register sync watchers for all filter selections
syncSelectionWithOptions(selectedTypes, recordTypeOptions);
syncSelectionWithOptions(selectedSubjects, subjectOptions);
syncSelectionWithOptions(selectedStatuses, statusOptions);
// Sync combined bodies selection with both governing and subsidiary options
watch(
  [governingBodyOptions, subsidiaryBodyOptions],
  ([newGovOptions, newSubOptions]) => {
    if (newGovOptions.length === 0 && newSubOptions.length === 0) return;

    const govMap = new Map(newGovOptions.map((opt) => [opt.value, { ...opt, bodyGroup: 'governingBodies' as const }]));
    const subMap = new Map(newSubOptions.map((opt) => [opt.value, { ...opt, bodyGroup: 'subsidiaryBodies' as const }]));

    const filtered = selectedBodies.value
      .map((item) => {
        if (item.bodyGroup === 'governingBodies') return govMap.get(item.value);
        if (item.bodyGroup === 'subsidiaryBodies') return subMap.get(item.value);

        return govMap.get(item.value) ?? subMap.get(item.value);
      })
      .filter((opt): opt is BodyFilterOption => Boolean(opt));

    const selectionChanged =
      filtered.length !== selectedBodies.value.length ||
      filtered.some((opt, i) => {
        const current = selectedBodies.value[i];

        return !current || current.value !== opt.value || current.label !== opt.label;
      });

    if (selectionChanged) {
      selectedBodies.value = filtered;
      updateFilters();
    }
  },
  { immediate: true },
);
syncSelectionWithOptions(selectedCopDecisions, decisionOptions);
syncSelectionWithOptions(selectedActivityTypes, activityTypeOptions);
// Sync combined GBF selection with both sections and targets options
watch(
  [gbfSectionOptions, globalTargetOptions],
  ([newSectionOptions, newTargetOptions]) => {
    if (newSectionOptions.length === 0 && newTargetOptions.length === 0) return;

    const sectionMap = new Map(newSectionOptions.map((opt) => [opt.value, { ...opt, gbfGroup: 'gbfSections' as const }]));
    const targetMap = new Map(newTargetOptions.map((opt) => [opt.value, { ...opt, gbfGroup: 'globalTargets' as const }]));

    const filtered = selectedGbfItems.value
      .map((item) => {
        if (item.gbfGroup === 'gbfSections') return sectionMap.get(item.value);
        if (item.gbfGroup === 'globalTargets') return targetMap.get(item.value);

        return sectionMap.get(item.value) ?? targetMap.get(item.value);
      })
      .filter((opt): opt is GbfFilterOption => Boolean(opt));

    const selectionChanged =
      filtered.length !== selectedGbfItems.value.length ||
      filtered.some((opt, i) => {
        const current = selectedGbfItems.value[i];

        return !current || current.value !== opt.value || current.label !== opt.label;
      });

    if (selectionChanged) {
      selectedGbfItems.value = filtered;
      updateFilters();
    }
  },
  { immediate: true },
);
syncSelectionWithOptions(selectedCountries, countryOptions);
syncSelectionWithOptions(selectedSorts, sortOptions);

// ---------------------------------------------------------------------------
// Lifecycle & watchers
// ---------------------------------------------------------------------------

onMounted(() => {
  loadFiltersFromUrl();
  hasCompletedInitialMount.value = true;
});

// Watch for URL query changes (e.g., tab view sets the type filter)
watch(() => route.query, () => {
  loadFiltersFromUrl();
}, { deep: true });

// Watch for first user interaction with any filter
watch(
  [
    selectedTypes,
    selectedSubjects,
    selectedStatuses,
    selectedBodies,
    selectedCopDecisions,
    selectedActivityTypes,
    selectedGbfItems,
    selectedCountries,
    selectedSorts,
    actionRequired,
    searchText,
  ],
  () => {
    if (!hasUserInteracted.value) {
      const hasAnySelection =
        selectedTypes.value.length > 0 ||
        selectedSubjects.value.length > 0 ||
        selectedStatuses.value.length > 0 ||
        selectedBodies.value.length > 0 ||
        selectedCopDecisions.value.length > 0 ||
        selectedActivityTypes.value.length > 0 ||
        selectedGbfItems.value.length > 0 ||
        selectedCountries.value.length > 0 ||
        searchText.value.trim().length > 0 ||
        !areSortSelectionsDefault(extractSelectedValues(selectedSorts.value)) ||
        actionRequired.value;

      if (hasAnySelection) {
        hasUserInteracted.value = true;
        // Clear the default start date on first interaction
        if (startDate.value === props.initialStartDate) {
          startDate.value = '';
        }
      }
    }
  },
  { deep: true },
);

// Emit updates whenever relevant filter state changes
watchEffect(() => {
  // Touch all filter refs to create dependency tracking
  void selectedTypes.value;
  void selectedSubjects.value;
  void selectedStatuses.value;
  void selectedBodies.value;
  void selectedCopDecisions.value;
  void selectedActivityTypes.value;
  void selectedGbfItems.value;
  void selectedCountries.value;
  void selectedSorts.value;
  void startDate.value;
  void endDate.value;
  void actionRequired.value;
  void searchText.value;
  updateFilters();
});
</script>

<style scoped>
.calendar-filters {
  .form-label {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .form-control-sm {
    font-size: 0.875rem;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }
}

.facet-badge {
  font-size: 0.75em;
  vertical-align: middle;
}

#search-filter.form-control-lg {
  height: calc(var(--bs-body-line-height) * 1em + 1rem + calc(var(--bs-border-width) * 2) - 5px);
}
</style>
