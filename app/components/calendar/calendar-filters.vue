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
          class="form-control form-control-sm"
          :placeholder="t('calendar.filters.placeholders.search')"
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
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="facet-count">&nbsp;({{ option.count }})</span>
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
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="facet-count">&nbsp;({{ option.count }})</span>
          </template>
        </Multiselect>
      </div>

      <!-- Global Targets Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="global-targets-filter" class="form-label">{{ t('calendar.filters.labels.globalTargets') }}</label>
        <Multiselect
          id="global-targets-filter"
          v-model="selectedGlobalTargets"
          :options="globalTargetOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.globalTargets')"
        >
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="facet-count">&nbsp;({{ option.count }})</span>
          </template>
        </Multiselect>
      </div>

      <!-- GBF Sections Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="gbf-sections-filter" class="form-label">{{ t('calendar.filters.labels.gbfSections') }}</label>
        <Multiselect
          id="gbf-sections-filter"
          v-model="selectedGbfSections"
          :options="gbfSectionOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.gbfSections')"
        >
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="facet-count">&nbsp;({{ option.count }})</span>
          </template>
        </Multiselect>
      </div>

      <!-- Countries Filter -->
      <div class="col-12 col-md-6 col-lg-3">
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
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="facet-count">&nbsp;({{ option.count }})</span>
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
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="facet-count">&nbsp;({{ option.count }})</span>
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
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="facet-count">&nbsp;({{ option.count }})</span>
          </template>
        </Multiselect>
      </div>

      <!-- Governing Bodies Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="governing-body-filter" class="form-label">{{ t('calendar.filters.labels.governingBodies') }}</label>
        <Multiselect
          id="governing-body-filter"
          v-model="selectedGoverningBodies"
          :options="governingBodyOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.governingBodies')"
        >
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="facet-count">&nbsp;({{ option.count }})</span>
          </template>
        </Multiselect>
      </div>

      <!-- Subsidiary Body Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="subsidiary-body-filter" class="form-label">{{ t('calendar.filters.labels.subsidiaryBodies') }}</label>
        <Multiselect
          id="subsidiary-body-filter"
          v-model="selectedSubsidiaryBodies"
          :options="subsidiaryBodyOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.subsidiaryBodies')"
        >
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="facet-count">&nbsp;({{ option.count }})</span>
          </template>
        </Multiselect>
      </div>

      <!-- COP Decision Filter -->
      <div class="col-12 col-md-6 col-lg-3">
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
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.count != null" class="facet-count">&nbsp;({{ option.count }})</span>
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

const DEFAULT_SORT_VALUES = Object.freeze(['startDate:asc']);

// ---------------------------------------------------------------------------
// Reactive filter selections
// ---------------------------------------------------------------------------

const selectedTypes = ref<FilterSelectionValue[]>([]);
const selectedSubjects = ref<FilterSelectionValue[]>([]);
const selectedStatuses = ref<FilterSelectionValue[]>([]);
const selectedSubsidiaryBodies = ref<FilterSelectionValue[]>([]);
const selectedGoverningBodies = ref<FilterSelectionValue[]>([]);
const selectedCopDecisions = ref<FilterSelectionValue[]>([]);
const selectedActivityTypes = ref<FilterSelectionValue[]>([]);
const selectedGlobalTargets = ref<FilterSelectionValue[]>([]);
const selectedGbfSections = ref<FilterSelectionValue[]>([]);
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
    selectedSubsidiaryBodies.value.length > 0 ||
    selectedGoverningBodies.value.length > 0 ||
    selectedCopDecisions.value.length > 0 ||
    selectedActivityTypes.value.length > 0 ||
    selectedGlobalTargets.value.length > 0 ||
    selectedGbfSections.value.length > 0 ||
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

// ---------------------------------------------------------------------------
// URL query string management
// ---------------------------------------------------------------------------

function parseQueryArray(param: string | string[] | undefined): string[] {
  if (!param) return [];
  if (Array.isArray(param)) return param.filter(Boolean);

  return param.split(',').filter(Boolean);
}

function updateUrlQuery(): void {
  if (isLoadingFromUrl.value) return;

  const query: Record<string, string | undefined> = {};

  const types = extractSelectedValues(selectedTypes.value);

  if (types.length > 0) query.types = types.join(',');

  const subjects = extractSelectedValues(selectedSubjects.value);

  if (subjects.length > 0) query.subjects = subjects.join(',');

  const statuses = extractSelectedValues(selectedStatuses.value);

  if (statuses.length > 0) query.statuses = statuses.join(',');

  const subsidiaryBodies = extractSelectedValues(selectedSubsidiaryBodies.value);

  if (subsidiaryBodies.length > 0) query.subsidiaryBodies = subsidiaryBodies.join(',');

  const governingBodies = extractSelectedValues(selectedGoverningBodies.value);

  if (governingBodies.length > 0) query.governingBodies = governingBodies.join(',');

  const copDecisions = extractSelectedValues(selectedCopDecisions.value);

  if (copDecisions.length > 0) query.copDecisions = copDecisions.join(',');

  const activityTypes = extractSelectedValues(selectedActivityTypes.value);

  if (activityTypes.length > 0) query.activityTypes = activityTypes.join(',');

  const globalTargets = extractSelectedValues(selectedGlobalTargets.value);

  if (globalTargets.length > 0) query.globalTargets = globalTargets.join(',');

  const gbfSections = extractSelectedValues(selectedGbfSections.value);

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
  restoreSelection(subsidiaryBodies, selectedSubsidiaryBodies);
  restoreSelection(governingBodies, selectedGoverningBodies);
  restoreSelection(copDecisions, selectedCopDecisions);
  restoreSelection(activityTypes, selectedActivityTypes);
  restoreSelection(globalTargets, selectedGlobalTargets);
  restoreSelection(gbfSections, selectedGbfSections);
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
  } else {
    startDate.value = (!hasCompletedInitialMount.value && props.initialStartDate) ? props.initialStartDate : '';
  }
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
    subsidiaryBodies: extractSelectedValues(selectedSubsidiaryBodies.value),
    governingBodies: extractSelectedValues(selectedGoverningBodies.value),
    copDecisions: extractSelectedValues(selectedCopDecisions.value),
    activityTypes: extractSelectedValues(selectedActivityTypes.value),
    globalTargets: extractSelectedValues(selectedGlobalTargets.value),
    gbfSections: extractSelectedValues(selectedGbfSections.value),
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
  selectedSubsidiaryBodies.value = [];
  selectedGoverningBodies.value = [];
  selectedCopDecisions.value = [];
  selectedActivityTypes.value = [];
  selectedGlobalTargets.value = [];
  selectedGbfSections.value = [];
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
syncSelectionWithOptions(selectedSubsidiaryBodies, subsidiaryBodyOptions);
syncSelectionWithOptions(selectedGoverningBodies, governingBodyOptions);
syncSelectionWithOptions(selectedCopDecisions, decisionOptions);
syncSelectionWithOptions(selectedActivityTypes, activityTypeOptions);
syncSelectionWithOptions(selectedGlobalTargets, globalTargetOptions);
syncSelectionWithOptions(selectedGbfSections, gbfSectionOptions);
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
    selectedSubsidiaryBodies,
    selectedGoverningBodies,
    selectedCopDecisions,
    selectedActivityTypes,
    selectedGlobalTargets,
    selectedGbfSections,
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
        selectedSubsidiaryBodies.value.length > 0 ||
        selectedGoverningBodies.value.length > 0 ||
        selectedCopDecisions.value.length > 0 ||
        selectedActivityTypes.value.length > 0 ||
        selectedGlobalTargets.value.length > 0 ||
        selectedGbfSections.value.length > 0 ||
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
  void selectedSubsidiaryBodies.value;
  void selectedGoverningBodies.value;
  void selectedCopDecisions.value;
  void selectedActivityTypes.value;
  void selectedGlobalTargets.value;
  void selectedGbfSections.value;
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

.facet-count {
  color: #6c757d;
  font-size: 0.85em;
}
</style>
