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

      <!-- Type Filter -->
      <div v-if="!hideTypeFilter" class="col-12 col-md-6 col-lg-3">
        <label for="type-filter" class="form-label">{{ t('calendar.filters.labels.schemas') }}</label>
        <Multiselect
          id="type-filter"
          v-model="selectedTypes"
          :options="schemaOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.schemas')"
        />
      </div>

      <!-- Activity Types Filter (hidden in tab view unless Activities tab is active) -->
      <div v-if="!hideActivityTypesFilter" class="col-12 col-md-6 col-lg-3">
        <label for="activity-types-filter" class="form-label">{{ t('calendar.filters.labels.activityTypes') }}</label>
        <Multiselect
          id="activity-types-filter"
          v-model="selectedActivityTypes"
          :options="activityTypeOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          :placeholder="t('calendar.filters.placeholders.activityTypes')"
          label="label"
          track-by="value"
        />
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
          :placeholder="t('calendar.filters.placeholders.globalTargets')"
          label="label"
          track-by="value"
        />
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
          :placeholder="t('calendar.filters.placeholders.countries')"
          label="label"
          track-by="value"
        />
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
          :placeholder="t('calendar.filters.placeholders.subjects')"
          label="label"
          track-by="value"
        />
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
          :placeholder="t('calendar.filters.placeholders.statuses')"
          label="label"
          track-by="value"
        />
      </div>

      <!-- Subsidiary Body Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="subsidiary-body-filter" class="form-label">
          <span>Subsidiary</span><br>
          <span>body(ies) / Protocol(s)</span>
        </label>
        <Multiselect
          id="subsidiary-body-filter"
          v-model="selectedSubsidiaryBodies"
          :options="subsidiaryBodyOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          :placeholder="t('calendar.filters.placeholders.subsidiaryBodies')"
          label="label"
          track-by="value"
        />
      </div>

      <!-- COP Decision Filter -->
      <!-- <div class="col-12 col-md-6 col-lg-3">
        <label for="cop-decision-filter" class="form-label">{{ t('calendar.filters.labels.decisions') }}</label>
        <Multiselect
          id="cop-decision-filter"
          v-model="selectedCopDecisions"
          :options="copDecisionOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          :placeholder="t('calendar.filters.placeholders.decisions')"
          label="label"
          track-by="value"
        />
      </div> -->
      
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
import { ref, computed, watch, onMounted, watchEffect, nextTick, type Ref, type ComputedRef } from 'vue';
import Multiselect from 'vue-multiselect';
import { loadDomainOptions } from 'shared/services/thesaurus';
import { thesaurusDomains } from 'shared/constants/thesaurus';
import { activityTypeTerms } from 'shared/data/activity-type-terms.js';
import { subsidiaryBodyTerms } from 'shared/data/subsidiary-body-terms.js';
import { copDecisionTerms } from 'shared/data/cop-decision-terms.js';
import { loadSubjectOptions, buildSubjectLabelMap, setSubjectLabelMap } from 'shared/utils/subjects';

// Nuxt router for URL query string management
const route = useRoute();
const router = useRouter();

// Define filter option types
interface FilterOption {
  value: string;
  label: string;
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
  hideTypeFilter?: boolean;
  activeTabType?: string;
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
  hideTypeFilter: false,
  activeTabType: '',
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

interface LocalCalendarTerm {
  identifier: string;
  name?: string;
  title?: Record<string, string>;
}

type FilterSelectionValue = FilterOption | string;

const DEFAULT_SORT_VALUES = Object.freeze(['startDate:asc']);

// Reactive filter values
const selectedTypes = ref<FilterSelectionValue[]>([]);
const selectedSubjects = ref<FilterSelectionValue[]>([]);
const selectedStatuses = ref<FilterSelectionValue[]>([]);
const selectedSubsidiaryBodies = ref<FilterSelectionValue[]>([]);
const selectedCopDecisions = ref<FilterSelectionValue[]>([]);
const selectedActivityTypes = ref<FilterSelectionValue[]>([]);
const selectedGlobalTargets = ref<FilterSelectionValue[]>([]);
const selectedCountries = ref<FilterSelectionValue[]>([]);
const selectedSorts = ref<FilterSelectionValue[]>([...DEFAULT_SORT_VALUES]);
const startDate = ref<string>(props.initialStartDate ?? '');
const endDate = ref<string>('');
const actionRequired = ref<boolean>(false);
const searchText = ref<string>('');

// Track if any filter has been manually selected
const hasUserInteracted = ref<boolean>(false);

// Track if we're loading from URL to prevent circular updates
const isLoadingFromUrl = ref<boolean>(false);

// Computed property to check if any filters are active
const hasActiveFilters = computed<boolean>(() => {
  const activeSorts = extractSelectedValues(selectedSorts.value);

  return (
    selectedTypes.value.length > 0 ||
    selectedSubjects.value.length > 0 ||
    selectedStatuses.value.length > 0 ||
    selectedSubsidiaryBodies.value.length > 0 ||
    selectedCopDecisions.value.length > 0 ||
    selectedActivityTypes.value.length > 0 ||
    selectedGlobalTargets.value.length > 0 ||
    selectedCountries.value.length > 0 ||
    startDate.value !== '' ||
    endDate.value !== '' ||
    actionRequired.value ||
    searchText.value.trim().length > 0 ||
    !areSortSelectionsDefault(activeSorts)
  );
});

// Hide activity types filter in tab view unless Activities tab is selected
const hideActivityTypesFilter = computed<boolean>(() => {
  // If activeTabType is provided (tab view mode) and it's not 'activity', hide the filter
  return props.activeTabType !== '' && props.activeTabType !== 'activity';
});

const subjectOptions = ref<FilterOption[]>([]);
const remoteCountryOptions = ref<FilterOption[]>([]);
const remoteGlobalTargetOptions = ref<FilterOption[]>([]);

const STATUS_LABEL_OVERRIDES: Record<string, string> = {
  tentat: 'Tentative',
};

const providedCountryOptions = computed(() => props.preloadedCountryOptions);
const providedGlobalTargetOptions = computed(() => props.preloadedGlobalTargetOptions);

const countryOptions = computed<FilterOption[]>(() =>
  mergeOptions(remoteCountryOptions.value, providedCountryOptions.value),
);

const globalTargetOptions = computed<FilterOption[]>(() =>
  mergeOptions(remoteGlobalTargetOptions.value, providedGlobalTargetOptions.value),
);

const sortOptions = computed<FilterOption[]>(() => {
  const selectedValues = extractSelectedValues(selectedSorts.value);
  const hasStartDateAsc = selectedValues.includes('startDate:asc');
  const hasStartDateDesc = selectedValues.includes('startDate:desc');
  const hasEndDateAsc = selectedValues.includes('endDate:asc');
  const hasEndDateDesc = selectedValues.includes('endDate:desc');

  const options: FilterOption[] = [];

  // Only show startDate options if the opposite isn't selected
  if (!hasStartDateDesc) {
    options.push({ value: 'startDate:asc', label: t('calendar.filters.sortOptions.startDateAsc') as string });
  }
  if (!hasStartDateAsc) {
    options.push({ value: 'startDate:desc', label: t('calendar.filters.sortOptions.startDateDesc') as string });
  }

  // Only show endDate options if the opposite isn't selected
  if (!hasEndDateDesc) {
    options.push({ value: 'endDate:asc', label: t('calendar.filters.sortOptions.endDateAsc') as string });
  }
  if (!hasEndDateAsc) {
    options.push({ value: 'endDate:desc', label: t('calendar.filters.sortOptions.endDateDesc') as string });
  }

  // Add title and schema sort options (replacing status)
  options.push({ value: 'title:asc', label: t('calendar.filters.sortOptions.titleAsc') as string });
  options.push({ value: 'schema:asc', label: t('calendar.filters.sortOptions.schemaAsc') as string });
  options.push({ value: 'actionRequired:desc', label: t('calendar.filters.sortOptions.actionRequired') as string });

  return options;
});

// Schemas are constrained to the canonical keys provided by the activity index service.
const SCHEMA_FILTER_KEYS = ['meeting', 'notification', 'activity'] as const;

const schemaOptions = computed<FilterOption[]>(() =>
  SCHEMA_FILTER_KEYS.map((key) => {
    const normalizedKey = key.toLowerCase();
    const translationKey = `calendar.types.${normalizedKey}`;
    const label = te(translationKey) ? (t(translationKey) as string) : formatSchemaLabel(normalizedKey);

    return { value: normalizedKey, label };
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
  if (normalizedKey in STATUS_LABEL_OVERRIDES) {
    return STATUS_LABEL_OVERRIDES[normalizedKey];
  }
  if (normalizedKey === 'confirm') {
    return t('calendar.status.confirmed') as string;
  }
  // Explicit mapping for known keys
  // If already mixed case (likely a label), return as-is
  const isAllCapsOrUnderscore = /^[A-Z0-9_]+$/.test(raw);

  if (!isAllCapsOrUnderscore) return raw;
  // Convert KEY_NAME to "Key name"
  return raw
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const statusOptions = computed<FilterOption[]>(() =>
  props.availableStatuses.map(statusKey => ({ value: statusKey, label: statusKeyToLabel(statusKey) }))
);

const subsidiaryBodyOptions = computed<FilterOption[]>(() => {
  if (props.availableSubsidiaryBodies.length > 0) {
    return props.availableSubsidiaryBodies.map(body => ({ value: body, label: body }));
  }
  return subsidiaryBodyTerms
    .map(term => mapSubsidiaryBodyTermToOption(term))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const copDecisionOptions = computed<FilterOption[]>(() => {
  // Use identifiers as values for exact matching in filter
  // Display names as labels for user-friendly UI
  return copDecisionTerms
    .map(term => ({ value: term.identifier, label: term.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const activityTypeOptions = computed<FilterOption[]>(() =>
  activityTypeTerms
    .map(term => mapActivityTypeTermToOption(term))
    .sort((a, b) => a.label.localeCompare(b.label))
);

// Function to parse query string array parameter
function parseQueryArray(param: string | string[] | undefined): string[] {
  if (!param) return [];
  if (Array.isArray(param)) return param.filter(Boolean);
  return param.split(',').filter(Boolean);
}

// Function to update URL query string
function updateUrlQuery(): void {
  // Don't update URL if we're currently loading from URL
  if (isLoadingFromUrl.value) return;

  const query: Record<string, string | undefined> = {};

  // Only add non-empty filters to query string
  const types = extractSelectedValues(selectedTypes.value);

  if (types.length > 0) query.types = types.join(',');

  const subjects = extractSelectedValues(selectedSubjects.value);

  if (subjects.length > 0) query.subjects = subjects.join(',');

  const statuses = extractSelectedValues(selectedStatuses.value);

  if (statuses.length > 0) query.statuses = statuses.join(',');

  const subsidiaryBodies = extractSelectedValues(selectedSubsidiaryBodies.value);

  if (subsidiaryBodies.length > 0) query.subsidiaryBodies = subsidiaryBodies.join(',');

  const copDecisions = extractSelectedValues(selectedCopDecisions.value);

  if (copDecisions.length > 0) query.copDecisions = copDecisions.join(',');

  const activityTypes = extractSelectedValues(selectedActivityTypes.value);

  if (activityTypes.length > 0) query.activityTypes = activityTypes.join(',');

  const globalTargets = extractSelectedValues(selectedGlobalTargets.value);

  if (globalTargets.length > 0) query.globalTargets = globalTargets.join(',');

  const countries = extractSelectedValues(selectedCountries.value);

  if (countries.length > 0) query.countries = countries.join(',');

  const sortSelections = extractSelectedValues(selectedSorts.value);

  if (!areSortSelectionsDefault(sortSelections)) {
    query.sort = sortSelections.join(',');
  }

  // Only add date filters if they differ from initial default
  if (startDate.value && startDate.value !== props.initialStartDate) {
    query.startDate = startDate.value;
  }

  if (endDate.value) query.endDate = endDate.value;

  if (actionRequired.value) query.actionRequired = 'true';

  const normalizedSearch = searchText.value.trim();

  if (normalizedSearch.length > 0) {
    query.search = normalizedSearch;
  }

  // Update URL without reloading page
  router.replace({ query });
}

// Function to load filters from URL query string
function _loadFiltersFromUrl(): void {
  isLoadingFromUrl.value = true;

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

  // Convert string values to FilterOption objects
  if (types.length > 0) {
    selectedTypes.value = findOptionsFromValues(types, schemaOptions.value);
    hasUserInteracted.value = true;
  } else {
    selectedTypes.value = [];
  }
  
  if (subjects.length > 0) {
    selectedSubjects.value = findOptionsFromValues(subjects, subjectOptions.value);
    hasUserInteracted.value = true;
  } else {
    selectedSubjects.value = [];
  }
  
  if (statuses.length > 0) {
    selectedStatuses.value = findOptionsFromValues(statuses, statusOptions.value);
    hasUserInteracted.value = true;
  } else {
    selectedStatuses.value = [];
  }
  
  if (subsidiaryBodies.length > 0) {
    selectedSubsidiaryBodies.value = findOptionsFromValues(subsidiaryBodies, subsidiaryBodyOptions.value);
    hasUserInteracted.value = true;
  } else {
    selectedSubsidiaryBodies.value = [];
  }
  
  if (copDecisions.length > 0) {
    selectedCopDecisions.value = findOptionsFromValues(copDecisions, copDecisionOptions.value);
    hasUserInteracted.value = true;
  } else {
    selectedCopDecisions.value = [];
  }
  
  if (activityTypes.length > 0) {
    selectedActivityTypes.value = findOptionsFromValues(activityTypes, activityTypeOptions.value);
    hasUserInteracted.value = true;
  } else {
    selectedActivityTypes.value = [];
  }
  
  if (globalTargets.length > 0) {
    selectedGlobalTargets.value = findOptionsFromValues(globalTargets, globalTargetOptions.value);
    hasUserInteracted.value = true;
  } else {
    selectedGlobalTargets.value = [];
  }
  
  if (countries.length > 0) {
    selectedCountries.value = findOptionsFromValues(countries, countryOptions.value);
    hasUserInteracted.value = true;
  } else {
    selectedCountries.value = [];
  }

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

  // Load date filters
  if (query.startDate && typeof query.startDate === 'string') {
    startDate.value = query.startDate;
    hasUserInteracted.value = true;
  } else {
    startDate.value = props.initialStartDate ?? '';
  }
  if (query.endDate && typeof query.endDate === 'string') {
    endDate.value = query.endDate;
    hasUserInteracted.value = true;
  } else {
    endDate.value = '';
  }

  // Load action required filter
  if (query.actionRequired === 'true') {
    actionRequired.value = true;
    hasUserInteracted.value = true;
  } else {
    actionRequired.value = false;
  }

  // Allow updates again after a short delay to ensure all reactive updates complete
  nextTick(() => {
    isLoadingFromUrl.value = false;
  });
}

onMounted(async () => {
  await Promise.all([
    loadSubjectOptions(locale.value).then(options => {
      subjectOptions.value = options;
      // Update the shared label map used by accordion rows
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
  _loadFiltersFromUrl();
});

// Watch for locale changes and reload subject options
watch(() => locale.value, async (newLocale) => {
  try {
    const options = await loadSubjectOptions(newLocale);

    subjectOptions.value = options;
    // Update the shared label map for the new locale
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

// Watch for URL query changes (e.g., when tab view changes the type filter)
watch(() => route.query, () => {
  _loadFiltersFromUrl();
}, { deep: true });

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
  const normalizedSearch = searchText.value.trim();

  const filters: FilterState = {
    types: extractSelectedValues(selectedTypes.value),
    subjects: extractSelectedValues(selectedSubjects.value),
    statuses: extractSelectedValues(selectedStatuses.value),
    subsidiaryBodies: extractSelectedValues(selectedSubsidiaryBodies.value),
    copDecisions: extractSelectedValues(selectedCopDecisions.value),
    activityTypes: extractSelectedValues(selectedActivityTypes.value),
    globalTargets: extractSelectedValues(selectedGlobalTargets.value),
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
  selectedCopDecisions.value = [];
  selectedActivityTypes.value = [];
  selectedGlobalTargets.value = [];
  selectedCountries.value = [];
  selectedSorts.value = [...DEFAULT_SORT_VALUES];
  startDate.value = '';
  endDate.value = '';
  actionRequired.value = false;
  searchText.value = '';
  hasUserInteracted.value = false;

  updateFilters();
}

function mapActivityTypeTermToOption(term: LocalCalendarTerm): FilterOption {
  const label = term.name || (term.title && term.title['en']) || term.identifier;
  const value = term.identifier;

  return { value, label };
}

function mapSubsidiaryBodyTermToOption(term: LocalCalendarTerm): FilterOption {
  const label = term.name || (term.title && term.title['en']) || term.identifier;
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

function findOptionsFromValues(values: string[], availableOptions: FilterOption[]): FilterOption[] {
  if (!values.length || !availableOptions.length) return [];
  
  const optionMap = new Map(availableOptions.map(opt => [opt.value, opt]));
  
  return values
    .map(value => optionMap.get(value))
    .filter((option): option is FilterOption => Boolean(option));
}

function syncSelectionWithOptions(
  selection: Ref<FilterSelectionValue[]>,
  options: Ref<FilterOption[]> | ComputedRef<FilterOption[]>,
): void {
  watch(
    options,
    (newOptions) => {
      const optionMap = new Map(newOptions.map(option => [option.value, option]));
      const filtered = selection.value
        .map(item => optionMap.get(typeof item === 'string' ? item : item.value))
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

// Sync selections with options to ensure FilterOption objects are used
// This is especially important when loading from URL (e.g., tab view setting types)
syncSelectionWithOptions(selectedTypes, schemaOptions);
syncSelectionWithOptions(selectedSubjects, subjectOptions);
syncSelectionWithOptions(selectedStatuses, statusOptions);
syncSelectionWithOptions(selectedSubsidiaryBodies, subsidiaryBodyOptions);
syncSelectionWithOptions(selectedCopDecisions, copDecisionOptions);
syncSelectionWithOptions(selectedActivityTypes, activityTypeOptions);
syncSelectionWithOptions(selectedGlobalTargets, globalTargetOptions);
syncSelectionWithOptions(selectedCountries, countryOptions);
syncSelectionWithOptions(selectedSorts, sortOptions);

// Watch for first user interaction with any filter
watch(
  [
    selectedTypes,
    selectedSubjects,
    selectedStatuses,
    selectedSubsidiaryBodies,
    selectedCopDecisions,
    selectedActivityTypes,
    selectedGlobalTargets,
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
        selectedCopDecisions.value.length > 0 ||
        selectedActivityTypes.value.length > 0 ||
        selectedGlobalTargets.value.length > 0 ||
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
  // touch all filter refs to create dependency
  void selectedTypes.value;
  void selectedSubjects.value;
  void selectedStatuses.value;
  void selectedSubsidiaryBodies.value;
  void selectedCopDecisions.value;
  void selectedActivityTypes.value;
  void selectedGlobalTargets.value;
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
</style>
