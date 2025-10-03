<template>
  <div class="calendar-filters-2">
    <div class="row g-3">
      <!-- Consolidated Mega Filter Dropdown -->
      <div class="col-12 col-md-6">
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
import { ref, computed, watch, onMounted, watchEffect } from 'vue';
import Multiselect from 'vue-multiselect';
import { loadDomainOptions } from 'shared/services/thesaurus';
import { thesaurusDomains } from 'shared/constants/thesaurus';
import { activityTypeTerms } from 'shared/data/activity-type-terms.js';
import { subsidiaryBodyTerms } from 'shared/data/subsidiary-body-terms.js';
import { copDecisionTerms } from 'shared/data/cop-decision-terms.js';
import { loadSubjectOptions, buildSubjectLabelMap, setSubjectLabelMap } from 'shared/utils/subjects';
import type { ThesaurusTerm } from 'shared/types/thesaurus';

// Nuxt router for URL query string management
const route = useRoute();
const router = useRouter();

// Define filter option types
interface FilterOption {
  value: string;
  label: string;
  group?: string;
}

interface FilterGroup {
  groupLabel: string;
  options: FilterOption[];
}

// Define props
interface Props {
  availableTypes?: string[];
  availableSubjects?: string[];
  availableStatuses?: string[];
  availableSubsidiaryBodies?: string[];
  availableCopDecisions?: string[];
  preloadedCountryOptions?: FilterOption[];
  preloadedGlobalTargetOptions?: FilterOption[];
  initialStartDate?: string;
}

const props = withDefaults(defineProps<Props>(), {
  availableTypes: () => [],
  availableSubjects: () => [],
  availableStatuses: () => [],
  availableSubsidiaryBodies: () => [],
  availableCopDecisions: () => [],
  preloadedCountryOptions: () => [],
  preloadedGlobalTargetOptions: () => [],
  initialStartDate: '',
});

// Define emits
const emit = defineEmits<{
  'update:filters': [filters: FilterState];
}>();

const { t, te, locale } = useI18n();

// Filter state
interface FilterState {
  types: string[];
  subjects: string[];
  statuses: string[];
  subsidiaryBodies: string[];
  copDecisions: string[];
  activityTypes: string[];
  globalTargets: string[];
  countries: string[];
  startDate: string;
  endDate: string;
  actionRequired: boolean;
  searchText: string;
  sort: string[];
}

type FilterSelectionValue = FilterOption | string;

const DEFAULT_SORT_VALUES = Object.freeze(['startDate:asc']);

// Reactive filter values
const selectedFilters = ref<FilterSelectionValue[]>([]);
const selectedSorts = ref<FilterSelectionValue[]>([...DEFAULT_SORT_VALUES]);
const startDate = ref<string>(props.initialStartDate ?? '');
const endDate = ref<string>('');
const actionRequired = ref<boolean>(false);

// Track if any filter has been manually selected
const hasUserInteracted = ref<boolean>(false);

// Options storage
const subjectOptions = ref<FilterOption[]>([]);
const remoteCountryOptions = ref<FilterOption[]>([]);
const remoteGlobalTargetOptions = ref<FilterOption[]>([]);

const providedCountryOptions = computed(() => props.preloadedCountryOptions);
const providedGlobalTargetOptions = computed(() => props.preloadedGlobalTargetOptions);

const countryOptions = computed<FilterOption[]>(() =>
  mergeOptions(remoteCountryOptions.value, providedCountryOptions.value).map(opt => ({
    ...opt,
    group: 'countries',
  })),
);

const globalTargetOptions = computed<FilterOption[]>(() =>
  mergeOptions(remoteGlobalTargetOptions.value, providedGlobalTargetOptions.value).map(opt => ({
    ...opt,
    group: 'globalTargets',
  })),
);

const sortOptions = computed<FilterOption[]>(() => [
  { value: 'startDate:asc', label: t('calendar.filters.sortOptions.startDateAsc') as string },
  { value: 'startDate:desc', label: t('calendar.filters.sortOptions.startDateDesc') as string },
  { value: 'endDate:asc', label: t('calendar.filters.sortOptions.endDateAsc') as string },
  { value: 'endDate:desc', label: t('calendar.filters.sortOptions.endDateDesc') as string },
  { value: 'status:asc', label: t('calendar.filters.sortOptions.statusAsc') as string },
  { value: 'schema:asc', label: t('calendar.filters.sortOptions.schemaAsc') as string },
  { value: 'actionRequired:desc', label: t('calendar.filters.sortOptions.actionRequired') as string },
]);

// Schemas are constrained to the canonical keys provided by the activity index service.
const SCHEMA_FILTER_KEYS = ['meeting', 'notification', 'activity'] as const;

const schemaOptions = computed<FilterOption[]>(() =>
  SCHEMA_FILTER_KEYS.map((key) => {
    const normalizedKey = key.toLowerCase();
    const translationKey = `calendar.types.${normalizedKey}`;
    const label = te(translationKey) ? (t(translationKey) as string) : formatSchemaLabel(normalizedKey);

    return { value: normalizedKey, label, group: 'schemas' };
  }),
);

function statusKeyToLabel(status: string): string {
  if (!status) return '';
  const raw = String(status).trim();
  const normalizedKey = raw.replace(/\s+/g, '_').toLowerCase();
  const translationKey = `calendar.status.${normalizedKey}`;

  if (te(translationKey)) {
    return t(translationKey) as string;
  }
  if (normalizedKey === 'confirmed') {
    return t('calendar.status.confirmed') as string;
  }
  if (normalizedKey === 'tentative') {
    return t('calendar.status.tentative') as string;
  }
  const isAllCapsOrUnderscore = /^[A-Z0-9_]+$/.test(raw);

  if (!isAllCapsOrUnderscore) return raw;
  return raw
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const statusOptions = computed<FilterOption[]>(() =>
  props.availableStatuses.map(statusKey => ({ 
    value: statusKey, 
    label: statusKeyToLabel(statusKey),
    group: 'statuses',
  }))
);

const subsidiaryBodyOptions = computed<FilterOption[]>(() => {
  const options = props.availableSubsidiaryBodies.length > 0
    ? props.availableSubsidiaryBodies.map(body => ({ value: body, label: body }))
    : subsidiaryBodyTerms
      .map(term => mapLocalCalendarTermToOption(term))
      .sort((a, b) => a.label.localeCompare(b.label));

  return options.map(opt => ({ ...opt, group: 'subsidiaryBodies' }));
});

const copDecisionOptions = computed<FilterOption[]>(() => {
  const options = props.availableCopDecisions.length > 0
    ? props.availableCopDecisions.map(decision => ({ value: decision, label: decision }))
    : copDecisionTerms
      .map(term => mapLocalCalendarTermToOption(term))
      .sort((a, b) => a.label.localeCompare(b.label));

  return options.map(opt => ({ ...opt, group: 'copDecisions' }));
});

const activityTypeOptions = computed<FilterOption[]>(() =>
  activityTypeTerms
    .map(term => mapLocalCalendarTermToOption(term))
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(opt => ({ ...opt, group: 'activityTypes' }))
);

const subjectOptionsWithGroup = computed<FilterOption[]>(() =>
  subjectOptions.value.map(opt => ({ ...opt, group: 'subjects' }))
);

// Consolidated filter options with groups
const filterOptions = computed<FilterGroup[]>(() => {
  const groups: FilterGroup[] = [];

  if (schemaOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.schemas') as string,
      options: schemaOptions.value,
    });
  }

  if (activityTypeOptions.value.length > 0) {
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

  if (countryOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.countries') as string,
      options: countryOptions.value,
    });
  }

  if (subjectOptionsWithGroup.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.subjects') as string,
      options: subjectOptionsWithGroup.value,
    });
  }

  if (statusOptions.value.length > 0) {
    groups.push({
      groupLabel: t('calendar.filters.labels.statuses') as string,
      options: statusOptions.value,
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

// Computed property to check if any filters are active
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

// Function to add custom tags (free text search)
function addTag(newTag: string): void {
  const trimmedTag = newTag.trim();

  if (trimmedTag.length > 0) {
    const tagOption: FilterOption = {
      value: `search:${trimmedTag}`,
      label: trimmedTag,
      group: 'search',
    };

    selectedFilters.value.push(tagOption);
    updateFilters();
  }
}

// Function to parse query string array parameter
function parseQueryArray(param: string | string[] | undefined): string[] {
  if (!param) return [];
  if (Array.isArray(param)) return param.filter(Boolean);
  return param.split(',').filter(Boolean);
}

// Function to update URL query string
function updateUrlQuery(): void {
  const query: Record<string, string | undefined> = {};

  // Extract values by group
  const filtersByGroup = extractFiltersByGroup(selectedFilters.value);

  if (filtersByGroup.types.length > 0) query.types = filtersByGroup.types.join(',');
  if (filtersByGroup.subjects.length > 0) query.subjects = filtersByGroup.subjects.join(',');
  if (filtersByGroup.statuses.length > 0) query.statuses = filtersByGroup.statuses.join(',');
  if (filtersByGroup.subsidiaryBodies.length > 0) query.subsidiaryBodies = filtersByGroup.subsidiaryBodies.join(',');
  if (filtersByGroup.copDecisions.length > 0) query.copDecisions = filtersByGroup.copDecisions.join(',');
  if (filtersByGroup.activityTypes.length > 0) query.activityTypes = filtersByGroup.activityTypes.join(',');
  if (filtersByGroup.globalTargets.length > 0) query.globalTargets = filtersByGroup.globalTargets.join(',');
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

function extractFiltersByGroup(selection: FilterSelectionValue[]): {
  types: string[];
  subjects: string[];
  statuses: string[];
  subsidiaryBodies: string[];
  copDecisions: string[];
  activityTypes: string[];
  globalTargets: string[];
  countries: string[];
  searchTerms: string[];
} {
  const result = {
    types: [] as string[],
    subjects: [] as string[],
    statuses: [] as string[],
    subsidiaryBodies: [] as string[],
    copDecisions: [] as string[],
    activityTypes: [] as string[],
    globalTargets: [] as string[],
    countries: [] as string[],
    searchTerms: [] as string[],
  };

  for (const item of selection) {
    if (typeof item === 'string') {
      // Handle string values
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
      } else if (group === 'copDecisions') {
        result.copDecisions.push(value);
      } else if (group === 'activityTypes') {
        result.activityTypes.push(value);
      } else if (group === 'globalTargets') {
        result.globalTargets.push(value);
      } else if (group === 'countries') {
        result.countries.push(value);
      }
    }
  }

  return result;
}

// Function to load filters from URL query string
function loadFiltersFromUrl(): void {
  const query = route.query;

  // Load filter selections from URL
  const types = parseQueryArray(query.types as string | string[] | undefined);
  const subjects = parseQueryArray(query.subjects as string | string[] | undefined);
  const statuses = parseQueryArray(query.statuses as string | string[] | undefined);
  const subsidiaryBodies = parseQueryArray(query.subsidiaryBodies as string | string[] | undefined);
  const copDecisions = parseQueryArray(query.copDecisions as string | string[] | undefined);
  const activityTypes = parseQueryArray(query.activityTypes as string | string[] | undefined);
  const globalTargets = parseQueryArray(query.globalTargets as string | string[] | undefined);
  const countries = parseQueryArray(query.countries as string | string[] | undefined);
  const sortOrder = parseQueryArray(query.sort as string | string[] | undefined);
  const searchParam = typeof query.search === 'string'
    ? query.search
    : Array.isArray(query.search) ? query.search[0] ?? '' : '';

  // Rebuild selectedFilters from URL params
  const filters: FilterSelectionValue[] = [];

  // Add schemas
  for (const typeValue of types) {
    const option = schemaOptions.value.find(opt => opt.value === typeValue);

    if (option) filters.push(option);
  }

  // Add activity types
  for (const activityTypeValue of activityTypes) {
    const option = activityTypeOptions.value.find(opt => opt.value === activityTypeValue);

    if (option) filters.push(option);
  }

  // Add global targets
  for (const targetValue of globalTargets) {
    const option = globalTargetOptions.value.find(opt => opt.value === targetValue);

    if (option) filters.push(option);
  }

  // Add countries
  for (const countryValue of countries) {
    const option = countryOptions.value.find(opt => opt.value === countryValue);

    if (option) filters.push(option);
  }

  // Add subjects
  for (const subjectValue of subjects) {
    const option = subjectOptionsWithGroup.value.find(opt => opt.value === subjectValue);

    if (option) filters.push(option);
  }

  // Add statuses
  for (const statusValue of statuses) {
    const option = statusOptions.value.find(opt => opt.value === statusValue);

    if (option) filters.push(option);
  }

  // Add subsidiary bodies
  for (const bodyValue of subsidiaryBodies) {
    const option = subsidiaryBodyOptions.value.find(opt => opt.value === bodyValue);

    if (option) filters.push(option);
  }

  // Add cop decisions
  for (const decisionValue of copDecisions) {
    const option = copDecisionOptions.value.find(opt => opt.value === decisionValue);

    if (option) filters.push(option);
  }

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

  if (filters.length > 0) {
    selectedFilters.value = filters;
    hasUserInteracted.value = true;
  }

  if (sortOrder.length > 0) {
    selectedSorts.value = sortOrder;
    hasUserInteracted.value = true;
  } else {
    selectedSorts.value = [...DEFAULT_SORT_VALUES];
  }

  // Load date filters
  if (query.startDate && typeof query.startDate === 'string') {
    startDate.value = query.startDate;
    hasUserInteracted.value = true;
  }
  if (query.endDate && typeof query.endDate === 'string') {
    endDate.value = query.endDate;
    hasUserInteracted.value = true;
  }

  // Load action required filter
  if (query.actionRequired === 'true') {
    actionRequired.value = true;
    hasUserInteracted.value = true;
  }
}

onMounted(async () => {
  await Promise.all([
    loadSubjectOptions(locale.value).then(options => {
      subjectOptions.value = options;
      const labelMap = buildSubjectLabelMap(options);

      setSubjectLabelMap(labelMap);
    }),
    loadDomainOptions(thesaurusDomains.COUNTRIES, locale.value).then(options => {
      remoteCountryOptions.value = options;
    }),
    loadDomainOptions(thesaurusDomains.GBF_GLOBAL_TARGETS, locale.value).then(options => {
      remoteGlobalTargetOptions.value = options;
    }),
  ]);

  // Load filters from URL after options are loaded
  loadFiltersFromUrl();
});

// Watch for locale changes and reload options
watch(() => locale.value, async (newLocale) => {
  try {
    const options = await loadSubjectOptions(newLocale);

    subjectOptions.value = options;
    const labelMap = buildSubjectLabelMap(options);

    setSubjectLabelMap(labelMap);
    
    remoteCountryOptions.value = await loadDomainOptions(thesaurusDomains.COUNTRIES, newLocale);
    remoteGlobalTargetOptions.value = await loadDomainOptions(thesaurusDomains.GBF_GLOBAL_TARGETS, newLocale);
  } catch (error) {
    console.error('Failed to reload options for locale', newLocale, error);
    subjectOptions.value = [];
    remoteCountryOptions.value = [];
    remoteGlobalTargetOptions.value = [];
  }
});

function extractSelectedValues(selection: FilterSelectionValue[]): string[] {
  return selection
    .map(item => {
      if (typeof item === 'string') {
        return item.trim();
      }
      const raw = item?.value ?? '';

      return typeof raw === 'string' ? raw.trim() : String(raw);
    })
    .filter(value => value.length > 0);
}

function updateFilters(): void {
  const filtersByGroup = extractFiltersByGroup(selectedFilters.value);

  const filters: FilterState = {
    types: filtersByGroup.types,
    subjects: filtersByGroup.subjects,
    statuses: filtersByGroup.statuses,
    subsidiaryBodies: filtersByGroup.subsidiaryBodies,
    copDecisions: filtersByGroup.copDecisions,
    activityTypes: filtersByGroup.activityTypes,
    globalTargets: filtersByGroup.globalTargets,
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

function mapLocalCalendarTermToOption(term: ThesaurusTerm): FilterOption {
  const label = (term.title && term.title['en']) || term.name || term.identifier;
  const value = term.name || term.identifier;

  return { value, label };
}

function mergeOptions(primary: FilterOption[], fallback: FilterOption[]): FilterOption[] {
  const merged = new Map<string, FilterOption>();

  for (const option of fallback) {
    if (!option?.value) continue;
    merged.set(option.value, { value: option.value, label: option.label });
  }

  for (const option of primary) {
    if (!option?.value) continue;
    merged.set(option.value, { value: option.value, label: option.label });
  }

  return Array.from(merged.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function areSortSelectionsDefault(values: string[]): boolean {
  if (values.length !== DEFAULT_SORT_VALUES.length) {
    return false;
  }

  return values.every((value, index) => value === DEFAULT_SORT_VALUES[index]);
}

function formatSchemaLabel(key: string): string {
  return key
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

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
</style>
