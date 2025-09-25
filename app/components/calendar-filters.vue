<template>
  <div class="calendar-filters">
    <div class="row g-3">
      <!-- Type Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="type-filter" class="form-label">{{ t('calendar.filters.labels.typeActivity') }}</label>
        <Multiselect
          id="type-filter"
          v-model="selectedTypes"
          :options="schemaOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          :group-values="'options'"
          :group-label="'label'"
          label="label"
          track-by="value"
          :placeholder="t('calendar.filters.placeholders.typeActivity')"
        />
      </div>

      <!-- Activity Types Filter -->
      <div class="col-12 col-md-6 col-lg-3">
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
        <label for="subsidiary-body-filter" class="form-label">{{ t('calendar.filters.labels.subsidiaryBodies') }}</label>
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
      <div class="col-12 col-md-6 col-lg-3">
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
              @input="updateFilters"
            >
          </div>
          <div class="col-6">
            <input
              v-model="endDate"
              type="date"
              class="form-control form-control-sm"
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

      <!-- Clear Filters Button -->
      <div class="col-12">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          @click="clearFilters"
        >
          {{ t('calendar.filters.actions.clearAll') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, watchEffect, type Ref, type ComputedRef } from 'vue';
import Multiselect from 'vue-multiselect';
import type { ThesaurusTerm } from 'shared/types/thesaurus';
import { getDomainTerms } from 'shared/services/thesaurus';
import { THESAURUS, type ThesaurusDomainIdentifier } from 'shared/constants/thesaurus';
import { activityTypeTerms } from 'shared/data/activity-type-terms.js';
import { subsidiaryBodyTerms } from 'shared/data/subsidiary-body-terms.js';
import { copDecisionTerms } from 'shared/data/cop-decision-terms.js';
import { loadSubjectOptions, buildSubjectLabelMap, resolveSubjectLabel } from 'shared/utils/subjects';

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
}

const props = withDefaults(defineProps<Props>(), {
  availableTypes: () => [],
  availableSubjects: () => [],
  availableStatuses: () => [],
  availableSubsidiaryBodies: () => [],
  availableCopDecisions: () => [],
  preloadedCountryOptions: () => [],
  preloadedGlobalTargetOptions: () => [],
});

// Define emits
const emit = defineEmits<{
  'update:filters': [filters: FilterState];
}>();

const { t, te } = useI18n();

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
}

type FilterSelectionValue = FilterOption | string;

// Reactive filter values
const selectedTypes = ref<FilterSelectionValue[]>([]);
const selectedSubjects = ref<FilterSelectionValue[]>([]);
const selectedStatuses = ref<FilterSelectionValue[]>([]);
const selectedSubsidiaryBodies = ref<FilterSelectionValue[]>([]);
const selectedCopDecisions = ref<FilterSelectionValue[]>([]);
const selectedActivityTypes = ref<FilterSelectionValue[]>([]);
const selectedGlobalTargets = ref<FilterSelectionValue[]>([]);
const selectedCountries = ref<FilterSelectionValue[]>([]);
const startDate = ref<string>('');
const endDate = ref<string>('');
const actionRequired = ref<boolean>(false);

const remoteSubjectOptions = ref<FilterOption[]>([]);
const remoteCountryOptions = ref<FilterOption[]>([]);
const remoteGlobalTargetOptions = ref<FilterOption[]>([]);

const remoteSubjectLabelMap = computed(() => buildSubjectLabelMap(remoteSubjectOptions.value));

const fallbackSubjectOptions = computed<FilterOption[]>(() => {
  if (props.availableSubjects.length === 0) {
    return [];
  }

  const uniqueSubjects = Array.from(new Set(props.availableSubjects));

  return uniqueSubjects.map(subject => ({
    value: subject,
    label: resolveSubjectLabel(subject, remoteSubjectLabelMap.value),
  }));
});

const subjectOptions = computed<FilterOption[]>(() =>
  mergeOptions(remoteSubjectOptions.value, fallbackSubjectOptions.value),
);

const providedCountryOptions = computed(() => props.preloadedCountryOptions);
const providedGlobalTargetOptions = computed(() => props.preloadedGlobalTargetOptions);

const countryOptions = computed<FilterOption[]>(() =>
  mergeOptions(remoteCountryOptions.value, providedCountryOptions.value),
);

const globalTargetOptions = computed<FilterOption[]>(() =>
  mergeOptions(remoteGlobalTargetOptions.value, providedGlobalTargetOptions.value),
);

// Computed schema options (formerly typeOptions). Requirement: fixed schema 'meeting'.
// We ignore provided availableTypes now per change request and present a single option whose
// value is the schema key ('meeting') and label is translated (calendar.types.meeting) falling
// back to the raw key if translation missing.
const schemaOptions = computed<FilterOption[]>(() => {
  const key = 'meeting';
  const translationKey = 'calendar.types.meeting';
  const label = te(translationKey) ? (t(translationKey) as string) : key;

  return [{ value: key, label }];
});

function statusKeyToLabel(status: string): string {
  if (!status) return '';
  const raw = String(status).trim();
  const normalizedKey = raw.replace(/\s+/g, '_').toLowerCase();
  const translationKey = `calendar.status.${normalizedKey}`;

  if (te(translationKey)) {
    return t(translationKey) as string;
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
    .map(term => mapLocalCalendarTermToOption(term))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const copDecisionOptions = computed<FilterOption[]>(() => {
  if (props.availableCopDecisions.length > 0) {
    return props.availableCopDecisions.map(decision => ({ value: decision, label: decision }));
  }
  return copDecisionTerms
    .map(term => mapLocalCalendarTermToOption(term))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const activityTypeOptions = computed<FilterOption[]>(() =>
  activityTypeTerms
    .map(term => mapLocalCalendarTermToOption(term))
    .sort((a, b) => a.label.localeCompare(b.label))
);

onMounted(async () => {
  await Promise.all([
    loadSubjectOptions().then(options => {
      remoteSubjectOptions.value = options;
    }),
    loadDomainOptions(THESAURUS.COUNTRIES).then(options => {
      remoteCountryOptions.value = options;
    }),
    loadDomainOptions(THESAURUS.GBF_GLOBAL_TARGETS).then(options => {
      remoteGlobalTargetOptions.value = options;
    }),
  ]);
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
  };

  emit('update:filters', filters);
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
  startDate.value = '';
  endDate.value = '';
  actionRequired.value = false;

  updateFilters();
}

function mapThesaurusTermToOption(term: ThesaurusTerm): FilterOption {
  if (term.title) {
    const english = term.title['en'];

    if (english) {
      return { value: term.identifier, label: english };
    }
    for (const value of Object.values(term.title)) {
      if (value) {
        return { value: term.identifier, label: value };
      }
    }
  }

  return { value: term.identifier, label: term.name || term.identifier };
}

async function loadDomainOptions(domain: ThesaurusDomainIdentifier): Promise<FilterOption[]> {
  try {
    const terms = await getDomainTerms(domain);

    return terms
      .map(mapThesaurusTermToOption)
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error(`Failed to load thesaurus terms for ${domain}`, error);
    return [];
  }
}

interface LocalCalendarTerm {
  identifier: string;
  name?: string;
  title?: Record<string, string>;
}

function mapLocalCalendarTermToOption(term: LocalCalendarTerm): FilterOption {
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

syncSelectionWithOptions(selectedTypes, schemaOptions);
syncSelectionWithOptions(selectedSubjects, subjectOptions);
syncSelectionWithOptions(selectedStatuses, statusOptions);
syncSelectionWithOptions(selectedSubsidiaryBodies, subsidiaryBodyOptions);
syncSelectionWithOptions(selectedCopDecisions, copDecisionOptions);
syncSelectionWithOptions(selectedActivityTypes, activityTypeOptions);
syncSelectionWithOptions(selectedGlobalTargets, globalTargetOptions);
syncSelectionWithOptions(selectedCountries, countryOptions);

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
  void startDate.value;
  void endDate.value;
  void actionRequired.value;
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
