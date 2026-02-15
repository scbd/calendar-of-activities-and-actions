<template>
  <div class="calendar-filters-2">
    <div class="row g-3">
      <!-- Consolidated Mega Filter Dropdown -->
      <div class="col-12">
        <label for="mega-filter" class="form-label">{{ t('calendar.filters.labels.search') }}</label>
        <Multiselect
          id="mega-filter"
          v-model="selectedFilters"
          :options="filterOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          :taggable="true"
          group-values="options"
          group-label="groupLabel"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.search')"
          @tag="addTag"
        >
          <template #option="slotProps">
            <span v-if="slotProps?.option?.$groupLabel">
              {{ slotProps.option.$groupLabel }}
            </span>
            <span v-else>
              {{ slotProps?.option?.label }}
              <span v-if="slotProps?.option?.count != null" class="facet-count">&nbsp;({{ slotProps.option.count }})</span>
            </span>
          </template>
          <template #noResult>
            {{ t('calendar.messages.noResults') }}
          </template>
          <template #noOptions>
            {{ t('calendar.messages.noResults') }}
          </template>
        </Multiselect>
      </div>

      <!-- Date Range Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label">{{ t('calendar.filters.labels.dateRange') }}</label>
        <div class="row g-2">
          <div class="col-6">
            <input
              v-model="startDate"
              type="date"
              class="form-control form-control-sm"
              :placeholder="t('calendar.filters.labels.startDate')"
              @input="updateFilters"
            >
          </div>
          <div class="col-6">
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
            id="action-required-filter-2"
            v-model="actionRequired"
            class="form-check-input"
            type="checkbox"
            @change="updateFilters"
          >
          <label class="form-check-label" for="action-required-filter-2">
            {{ t('calendar.filters.toggles.actionRequiredOnly') }}
          </label>
        </div>
      </div>

      <!-- Sort Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="sort-filter-2" class="form-label">{{ t('calendar.filters.labels.sort') }}</label>
        <Multiselect
          id="sort-filter-2"
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
import { ref, computed, watch, onMounted, watchEffect, nextTick, type Ref, type ComputedRef } from 'vue';
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

interface MegaFilterOption extends FilterOption {
  group?: string;
}

interface FilterGroup {
  groupLabel: string;
  options: MegaFilterOption[];
}

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
  subjectOptions: thesaurusSubjectOptions,
  governingBodyOptions: thesaurusGoverningBodyOptions,
  subsidiaryBodyOptions: thesaurusSubsidiaryBodyOptions,
  activityTypeOptions: thesaurusActivityTypeOptions,
  globalTargetOptions: thesaurusGlobalTargetOptions,
  gbfSectionOptions: thesaurusGbfSectionOptions,
  countryOptions: thesaurusCountryOptions,
  statusOptions: thesaurusStatusOptions,
  decisionOptions: thesaurusDecisionOptions,
} = useThesaurusFilters({
  locale: computed(() => locale.value),
  facets: facetsRef,
});

// ---------------------------------------------------------------------------
// Constants & types
// ---------------------------------------------------------------------------

type FilterSelectionValue = MegaFilterOption | string;

const DEFAULT_SORT_VALUES = Object.freeze(['startDate:asc']);

// ---------------------------------------------------------------------------
// Reactive filter values
// ---------------------------------------------------------------------------

const selectedFilters = ref<FilterSelectionValue[]>([]);
const selectedSorts = ref<FilterSelectionValue[]>([...DEFAULT_SORT_VALUES]);
const startDate = ref<string>(props.initialStartDate ?? '');
const endDate = ref<string>('');
const actionRequired = ref<boolean>(false);

// Track if any filter has been manually selected
const hasUserInteracted = ref<boolean>(false);

// Track if we are loading from URL to prevent circular updates
const isLoadingFromUrl = ref<boolean>(false);

// Track if we have completed the initial mount (to only apply initialStartDate once)
const hasCompletedInitialMount = ref<boolean>(false);

// ---------------------------------------------------------------------------
// Option adapters — tag each composable option with its group key
// ---------------------------------------------------------------------------

function tagGroup(options: FilterOption[], group: string): MegaFilterOption[] {
  return options.map((opt) => ({ ...opt, group }));
}

const schemaOptions = computed<MegaFilterOption[]>(() =>
  tagGroup(recordTypeOptions.value, 'schemas'),
);

const activityTypeOptions = computed<MegaFilterOption[]>(() =>
  tagGroup(thesaurusActivityTypeOptions.value, 'activityTypes'),
);

const globalTargetOptions = computed<MegaFilterOption[]>(() =>
  tagGroup(thesaurusGlobalTargetOptions.value, 'globalTargets'),
);

const gbfSectionOptions = computed<MegaFilterOption[]>(() =>
  tagGroup(thesaurusGbfSectionOptions.value, 'gbfSections'),
);

const countryOptions = computed<MegaFilterOption[]>(() =>
  tagGroup(thesaurusCountryOptions.value, 'countries'),
);

const subjectOptions = computed<MegaFilterOption[]>(() =>
  tagGroup(thesaurusSubjectOptions.value, 'subjects'),
);

const statusOptions = computed<MegaFilterOption[]>(() =>
  tagGroup(thesaurusStatusOptions.value, 'statuses'),
);

const governingBodyOptions = computed<MegaFilterOption[]>(() =>
  tagGroup(thesaurusGoverningBodyOptions.value, 'governingBodies'),
);

const subsidiaryBodyOptions = computed<MegaFilterOption[]>(() =>
  tagGroup(thesaurusSubsidiaryBodyOptions.value, 'subsidiaryBodies'),
);

const copDecisionOptions = computed<MegaFilterOption[]>(() =>
  tagGroup(thesaurusDecisionOptions.value, 'copDecisions'),
);

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

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
// Consolidated filter options with groups (drives the mega-filter multiselect)
// ---------------------------------------------------------------------------

/**
 * Activity Types filter visibility:
 * - Tab view: only on the calendarActivity tab
 * - Non-tab view: when calendarActivity is selected or no types are selected
 */
const showActivityTypes = computed<boolean>(() => {
  if (props.activeTabType !== '') {
    return props.activeTabType === 'calendarActivity';
  }

  const typeValues = extractFiltersByGroup(selectedFilters.value).types;

  return typeValues.length === 0 || typeValues.includes('calendarActivity');
});

const filterOptions = computed<FilterGroup[]>(() => {
  const groups: FilterGroup[] = [];

  if (!props.hideTypeFilter && schemaOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.schemas') as string,
      options: schemaOptions.value,
    });
  }

  if (showActivityTypes.value && activityTypeOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.activityTypes') as string,
      options: activityTypeOptions.value,
    });
  }

  if (globalTargetOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.globalTargets') as string,
      options: globalTargetOptions.value,
    });
  }

  if (gbfSectionOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.gbfSections') as string,
      options: gbfSectionOptions.value,
    });
  }

  if (countryOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.countries') as string,
      options: countryOptions.value,
    });
  }

  if (subjectOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.subjects') as string,
      options: subjectOptions.value,
    });
  }

  if (statusOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.statuses') as string,
      options: statusOptions.value,
    });
  }

  if (governingBodyOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.governingBodies') as string,
      options: governingBodyOptions.value,
    });
  }

  if (subsidiaryBodyOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.subsidiaryBodies') as string,
      options: subsidiaryBodyOptions.value,
    });
  }

  if (copDecisionOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.decisions') as string,
      options: copDecisionOptions.value,
    });
  }

  return groups;
});

// ---------------------------------------------------------------------------
// Computed helpers
// ---------------------------------------------------------------------------

const hasActiveFilters = computed<boolean>(() => {
  const activeSorts = extractSelectedValues(selectedSorts.value);

  return (
    selectedFilters.value.length > 0 ||
    startDate.value !== '' ||
    endDate.value !== '' ||
    actionRequired.value ||
    !areSortSelectionsDefault(activeSorts)
  );
});

// ---------------------------------------------------------------------------
// Value extraction & grouping
// ---------------------------------------------------------------------------

function extractSelectedValues(selection: FilterSelectionValue[]): string[] {
  return selection
    .map((item) => {
      if (typeof item === 'string') return item.trim();

      const raw = item?.value ?? '';

      return typeof raw === 'string' ? raw.trim() : String(raw);
    })
    .filter((value) => value.length > 0);
}

interface FiltersByGroup {
  types: string[];
  subjects: string[];
  statuses: string[];
  subsidiaryBodies: string[];
  governingBodies: string[];
  copDecisions: string[];
  activityTypes: string[];
  globalTargets: string[];
  gbfSections: string[];
  countries: string[];
  searchTerms: string[];
}

function extractFiltersByGroup(selection: FilterSelectionValue[]): FiltersByGroup {
  const result: FiltersByGroup = {
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
    searchTerms: [],
  };

  for (const item of selection) {
    if (typeof item === 'string') {
      if (item.startsWith('search:')) {
        result.searchTerms.push(item.replace('search:', ''));
      }
    } else if (item && typeof item === 'object') {
      const group = item.group || '';
      const value = item.value;

      if (value.startsWith('search:')) {
        result.searchTerms.push(value.replace('search:', ''));
      } else if (group === 'schemas') {
        result.types.push(value);
      } else if (group === 'subjects') {
        result.subjects.push(value);
      } else if (group === 'statuses') {
        result.statuses.push(value);
      } else if (group === 'subsidiaryBodies') {
        result.subsidiaryBodies.push(value);
      } else if (group === 'governingBodies') {
        result.governingBodies.push(value);
      } else if (group === 'copDecisions') {
        result.copDecisions.push(value);
      } else if (group === 'activityTypes') {
        result.activityTypes.push(value);
      } else if (group === 'globalTargets') {
        result.globalTargets.push(value);
      } else if (group === 'gbfSections') {
        result.gbfSections.push(value);
      } else if (group === 'countries') {
        result.countries.push(value);
      }
    }
  }

  return result;
}

function findOptionsFromValues(values: string[], availableOptions: MegaFilterOption[]): MegaFilterOption[] {
  if (!values.length || !availableOptions.length) return [];

  const optionMap = new Map(availableOptions.map((opt) => [opt.value, opt]));

  return values
    .map((value) => optionMap.get(value))
    .filter((option): option is MegaFilterOption => Boolean(option));
}

function areSortSelectionsDefault(values: string[]): boolean {
  if (values.length !== DEFAULT_SORT_VALUES.length) return false;

  return values.every((value, index) => value === DEFAULT_SORT_VALUES[index]);
}

/**
 * Create provisional MegaFilterOption objects from raw URL string values.
 * These will be replaced once the composable options finish loading and
 * `syncFiltersWithOptions` runs.
 */
function toProvisionalOptions(values: string[], group: string): MegaFilterOption[] {
  return values.map((v) => ({ value: v, label: v, group }));
}

// ---------------------------------------------------------------------------
// Free-text search tags
// ---------------------------------------------------------------------------

function addTag(newTag: string): void {
  const trimmedTag = newTag.trim();

  if (trimmedTag.length > 0) {
    const tagOption: MegaFilterOption = {
      value: `search:${trimmedTag}`,
      label: trimmedTag,
      group: 'search',
    };

    selectedFilters.value.push(tagOption);
    updateFilters();
  }
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
  const filtersByGroup = extractFiltersByGroup(selectedFilters.value);

  if (filtersByGroup.types.length > 0) query.types = filtersByGroup.types.join(',');
  if (filtersByGroup.subjects.length > 0) query.subjects = filtersByGroup.subjects.join(',');
  if (filtersByGroup.statuses.length > 0) query.statuses = filtersByGroup.statuses.join(',');
  if (filtersByGroup.subsidiaryBodies.length > 0) query.subsidiaryBodies = filtersByGroup.subsidiaryBodies.join(',');
  if (filtersByGroup.governingBodies.length > 0) query.governingBodies = filtersByGroup.governingBodies.join(',');
  if (filtersByGroup.copDecisions.length > 0) query.copDecisions = filtersByGroup.copDecisions.join(',');
  if (filtersByGroup.activityTypes.length > 0) query.activityTypes = filtersByGroup.activityTypes.join(',');
  if (filtersByGroup.globalTargets.length > 0) query.globalTargets = filtersByGroup.globalTargets.join(',');
  if (filtersByGroup.gbfSections.length > 0) query.gbfSections = filtersByGroup.gbfSections.join(',');
  if (filtersByGroup.countries.length > 0) query.countries = filtersByGroup.countries.join(',');
  if (filtersByGroup.searchTerms.length > 0) query.search = filtersByGroup.searchTerms.join(' ');

  const sortSelections = extractSelectedValues(selectedSorts.value);

  if (!areSortSelectionsDefault(sortSelections)) {
    query.sort = sortSelections.join(',');
  }

  if (startDate.value && startDate.value !== props.initialStartDate) {
    query.startDate = startDate.value;
  }

  if (endDate.value) query.endDate = endDate.value;
  if (actionRequired.value) query.actionRequired = 'true';

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

  // Rebuild selectedFilters from URL params using provisional options.
  // syncFiltersWithOptions replaces these with proper thesaurus-labelled
  // options once the composable finishes loading.
  const filters: FilterSelectionValue[] = [
    ...toProvisionalOptions(types, 'schemas'),
    ...toProvisionalOptions(activityTypes, 'activityTypes'),
    ...toProvisionalOptions(globalTargets, 'globalTargets'),
    ...toProvisionalOptions(gbfSections, 'gbfSections'),
    ...toProvisionalOptions(countries, 'countries'),
    ...toProvisionalOptions(subjects, 'subjects'),
    ...toProvisionalOptions(statuses, 'statuses'),
    ...toProvisionalOptions(governingBodies, 'governingBodies'),
    ...toProvisionalOptions(subsidiaryBodies, 'subsidiaryBodies'),
    ...toProvisionalOptions(copDecisions, 'copDecisions'),
  ];

  // Add search terms as tags
  if (searchParam) {
    const searchTerms = searchParam.split(' ').filter(Boolean);

    for (const term of searchTerms) {
      filters.push({
        value: `search:${term}`,
        label: term,
        group: 'search',
      });
    }
  }

  selectedFilters.value = filters;

  if (filters.length > 0) {
    hasUserInteracted.value = true;
  }

  // Sort options are local computed — always available immediately
  if (sortOrder.length > 0) {
    selectedSorts.value = findOptionsFromValues(sortOrder, sortOptions.value);
    hasUserInteracted.value = true;
  } else {
    selectedSorts.value = [...DEFAULT_SORT_VALUES];
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
  const filtersByGroup = extractFiltersByGroup(selectedFilters.value);

  const filters: FilterState = {
    types: filtersByGroup.types,
    subjects: filtersByGroup.subjects,
    statuses: filtersByGroup.statuses,
    subsidiaryBodies: filtersByGroup.subsidiaryBodies,
    governingBodies: filtersByGroup.governingBodies,
    copDecisions: filtersByGroup.copDecisions,
    activityTypes: filtersByGroup.activityTypes,
    globalTargets: filtersByGroup.globalTargets,
    gbfSections: filtersByGroup.gbfSections,
    countries: filtersByGroup.countries,
    startDate: startDate.value,
    endDate: endDate.value,
    actionRequired: actionRequired.value,
    searchText: filtersByGroup.searchTerms.join(' '),
    sort: extractSelectedValues(selectedSorts.value),
  };

  emit('update:filters', filters);
  updateUrlQuery();
}

function clearFilters(): void {
  selectedFilters.value = [];
  selectedSorts.value = [...DEFAULT_SORT_VALUES];
  startDate.value = '';
  endDate.value = '';
  actionRequired.value = false;
  hasUserInteracted.value = false;

  updateFilters();
}

// ---------------------------------------------------------------------------
// Selection <-> option synchronization
// ---------------------------------------------------------------------------

/**
 * Watches ALL option lists. When any composable's options finish loading,
 * re-map `selectedFilters` to replace provisional objects with properly
 * labelled MegaFilterOption items (preserving the group tag).
 */
function syncFiltersWithOptions(): void {
  const allGroupOptions: Array<{ group: string; options: Ref<MegaFilterOption[]> | ComputedRef<MegaFilterOption[]> }> = [
    { group: 'schemas', options: schemaOptions },
    { group: 'activityTypes', options: activityTypeOptions },
    { group: 'globalTargets', options: globalTargetOptions },
    { group: 'gbfSections', options: gbfSectionOptions },
    { group: 'countries', options: countryOptions },
    { group: 'subjects', options: subjectOptions },
    { group: 'statuses', options: statusOptions },
    { group: 'governingBodies', options: governingBodyOptions },
    { group: 'subsidiaryBodies', options: subsidiaryBodyOptions },
    { group: 'copDecisions', options: copDecisionOptions },
  ];

  // Create a single watcher for all grouped option computeds
  watch(
    allGroupOptions.map(({ options }) => options),
    () => {
      // Build a global value → MegaFilterOption lookup
      const optionLookup = new Map<string, MegaFilterOption>();

      for (const { options } of allGroupOptions) {
        for (const opt of options.value) {
          optionLookup.set(`${opt.group}:${opt.value}`, opt);
        }
      }

      const updated = selectedFilters.value.map((item) => {
        if (typeof item === 'string') return item;

        // Search tags don't need syncing
        if (item.group === 'search') return item;

        const key = `${item.group}:${item.value}`;
        const resolved = optionLookup.get(key);

        return resolved ?? item;
      });

      // Only update if something actually changed
      const changed = updated.some((item, i) => {
        const prev = selectedFilters.value[i];

        if (typeof item === 'string' || typeof prev === 'string') return item !== prev;

        return item.value !== prev.value || item.label !== prev.label || item.count !== prev.count;
      });

      if (changed) {
        selectedFilters.value = updated;
        updateFilters();
      }
    },
    { immediate: true },
  );
}

syncFiltersWithOptions();

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
  [selectedFilters, selectedSorts, actionRequired],
  () => {
    if (!hasUserInteracted.value) {
      const hasAnySelection =
        selectedFilters.value.length > 0 ||
        !areSortSelectionsDefault(extractSelectedValues(selectedSorts.value)) ||
        actionRequired.value;

      if (hasAnySelection) {
        hasUserInteracted.value = true;
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
  void selectedFilters.value;
  void selectedSorts.value;
  void startDate.value;
  void endDate.value;
  void actionRequired.value;
  updateFilters();
});
</script>

<style scoped>
.calendar-filters-2 {
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
