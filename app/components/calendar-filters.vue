<template>
  <div class="calendar-filters">
    <div class="row g-3">
      <!-- Type Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="type-filter" class="form-label">Type</label>
        <Multiselect
          id="type-filter"
          v-model="selectedTypes"
          :options="typeOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          placeholder="Select types"
          label="label"
          track-by="value"
        />
      </div>

      <!-- Global Goals Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="global-goals-filter" class="form-label">Global Goals</label>
        <Multiselect
          id="global-goals-filter"
          v-model="selectedGlobalGoals"
          :options="globalGoalOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          placeholder="Select global goals"
          label="label"
          track-by="value"
        />
      </div>

      <!-- Global Targets Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="global-targets-filter" class="form-label">Global Targets</label>
        <Multiselect
          id="global-targets-filter"
          v-model="selectedGlobalTargets"
          :options="globalTargetOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          placeholder="Select global targets"
          label="label"
          track-by="value"
        />
      </div>

      <!-- Countries Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="countries-filter" class="form-label">Countries</label>
        <Multiselect
          id="countries-filter"
          v-model="selectedCountries"
          :options="countryOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          placeholder="Select countries"
          label="label"
          track-by="value"
        />
      </div>

      <!-- Subject Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="subject-filter" class="form-label">Subject</label>
        <Multiselect
          id="subject-filter"
          v-model="selectedSubjects"
          :options="subjectOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          placeholder="Select subjects"
          label="label"
          track-by="value"
        />
      </div>

      <!-- Status Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="status-filter" class="form-label">Status</label>
        <Multiselect
          id="status-filter"
          v-model="selectedStatuses"
          :options="statusOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          placeholder="Select statuses"
          label="label"
          track-by="value"
        />
      </div>

      <!-- Subsidiary Body Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="subsidiary-body-filter" class="form-label">Subsidiary Body</label>
        <Multiselect
          id="subsidiary-body-filter"
          v-model="selectedSubsidiaryBodies"
          :options="subsidiaryBodyOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          placeholder="Select subsidiary bodies"
          label="label"
          track-by="value"
        />
      </div>

      <!-- COP Decision Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label for="cop-decision-filter" class="form-label">COP Decision</label>
        <Multiselect
          id="cop-decision-filter"
          v-model="selectedCopDecisions"
          :options="copDecisionOptions"
          :multiple="true"
          :close-on-select="false"
          :clear-on-select="false"
          :preserve-search="true"
          placeholder="Select COP decisions"
          label="label"
          track-by="value"
        />
      </div>

      <!-- Date Range Filter -->
      <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label">Date Range</label>
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
        <label class="form-label">Action Required</label>
        <div class="form-check">
          <input
            id="action-required-filter"
            v-model="actionRequired"
            class="form-check-input"
            type="checkbox"
            @change="updateFilters"
          >
          <label class="form-check-label" for="action-required-filter">
            Show only items requiring action
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
          Clear All Filters
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, watchEffect, type Ref, type ComputedRef } from 'vue';
import Multiselect from 'vue-multiselect';
import type { ThesaurusTerm } from '../../shared/types/thesaurus';
import { getDomainTerms } from '../../shared/services/thesaurus';
import { THESAURUS, type ThesaurusDomainIdentifier } from '../../shared/constants/thesaurus';

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
}

const props = withDefaults(defineProps<Props>(), {
  availableTypes: () => [],
  availableSubjects: () => [],
  availableStatuses: () => [],
  availableSubsidiaryBodies: () => [],
  availableCopDecisions: () => [],
});

// Define emits
const emit = defineEmits<{
  'update:filters': [filters: FilterState];
}>();

// Filter state
interface FilterState {
  types: string[];
  subjects: string[];
  statuses: string[];
  subsidiaryBodies: string[];
  copDecisions: string[];
  globalGoals: string[];
  globalTargets: string[];
  countries: string[];
  startDate: string;
  endDate: string;
  actionRequired: boolean;
}

// Reactive filter values
const selectedTypes = ref<string[]>([]);
const selectedSubjects = ref<string[]>([]);
const selectedStatuses = ref<string[]>([]);
const selectedSubsidiaryBodies = ref<string[]>([]);
const selectedCopDecisions = ref<string[]>([]);
const selectedGlobalGoals = ref<string[]>([]);
const selectedGlobalTargets = ref<string[]>([]);
const selectedCountries = ref<string[]>([]);
const startDate = ref<string>('');
const endDate = ref<string>('');
const actionRequired = ref<boolean>(false);

const thesaurusSubjectOptions = ref<FilterOption[]>([]);
const countryOptions = ref<FilterOption[]>([]);
const globalGoalOptions = ref<FilterOption[]>([]);
const globalTargetOptions = ref<FilterOption[]>([]);

// Computed filter options
const typeOptions = computed<FilterOption[]>(() =>
  props.availableTypes.map(type => ({ value: type, label: type }))
);

const subjectOptions = computed<FilterOption[]>(() => {
  if (props.availableSubjects.length > 0) {
    return props.availableSubjects.map(subject => ({ value: subject, label: subject }));
  }
  return thesaurusSubjectOptions.value;
});

const statusOptions = computed<FilterOption[]>(() =>
  props.availableStatuses.map(status => ({ value: status, label: status }))
);

const subsidiaryBodyOptions = computed<FilterOption[]>(() =>
  props.availableSubsidiaryBodies.map(body => ({ value: body, label: body }))
);

const copDecisionOptions = computed<FilterOption[]>(() =>
  props.availableCopDecisions.map(decision => ({ value: decision, label: decision }))
);

onMounted(async () => {
  await Promise.all([
    loadDomainOptions(THESAURUS.CBD_SUBJECTS).then(options => {
      thesaurusSubjectOptions.value = options;
    }),
    loadDomainOptions(THESAURUS.COUNTRIES).then(options => {
      countryOptions.value = options;
    }),
    loadDomainOptions(THESAURUS.GBF_GLOBAL_GOALS).then(options => {
      globalGoalOptions.value = options;
    }),
    loadDomainOptions(THESAURUS.GBF_GLOBAL_TARGETS).then(options => {
      globalTargetOptions.value = options;
    }),
  ]);
});

function updateFilters(): void {
  const filters: FilterState = {
    types: selectedTypes.value,
    subjects: selectedSubjects.value,
    statuses: selectedStatuses.value,
    subsidiaryBodies: selectedSubsidiaryBodies.value,
    copDecisions: selectedCopDecisions.value,
    globalGoals: selectedGlobalGoals.value,
    globalTargets: selectedGlobalTargets.value,
    countries: selectedCountries.value,
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
  selectedGlobalGoals.value = [];
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

function syncSelectionWithOptions(
  selection: Ref<string[]>,
  options: Ref<FilterOption[]> | ComputedRef<FilterOption[]>,
): void {
  watch(
    options,
    (newOptions) => {
      const validValues = new Set(newOptions.map(option => option.value));
      const filtered = selection.value.filter(value => validValues.has(value));
      if (filtered.length !== selection.value.length) {
        selection.value = filtered;
        updateFilters();
      }
    },
    { immediate: true },
  );
}

syncSelectionWithOptions(selectedTypes, typeOptions);
syncSelectionWithOptions(selectedSubjects, subjectOptions);
syncSelectionWithOptions(selectedStatuses, statusOptions);
syncSelectionWithOptions(selectedSubsidiaryBodies, subsidiaryBodyOptions);
syncSelectionWithOptions(selectedCopDecisions, copDecisionOptions);
syncSelectionWithOptions(selectedGlobalGoals, globalGoalOptions);
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
  void selectedGlobalGoals.value;
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
