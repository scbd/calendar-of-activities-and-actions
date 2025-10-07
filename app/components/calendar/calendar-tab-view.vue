<template>
  <section class="calendar-tab-view">
    <!-- Record Type Tabs -->
    <div class="mb-3">
      <label class="form-label">{{ t('calendar.filters.labels.schemas') }}</label>
      <ul class="nav nav-pills" role="tablist">
        <li v-for="recordType in recordTypes" :key="recordType.value" class="nav-item" role="presentation">
          <button
            :class="['nav-link', { active: activeTab === recordType.value }]"
            type="button"
            role="tab"
            :aria-selected="activeTab === recordType.value"
            @click="setActiveTab(recordType.value)"
          >
            {{ recordType.label }}
          </button>
        </li>
      </ul>
    </div>

    <!-- Content based on active tab and view (includes its own filter card) -->
    <div>
      <component
        :is="currentView === 'grid' ? CalendarTableView : CalendarActivitiesActions"
        :key="`tab-${activeTab}-view-${currentView}`"
        :show-advanced-filters="showAdvancedFilters"
        :hide-type-filter="true"
        @toggle-filter-mode="$emit('toggle-filter-mode')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from '#imports';
import { useRouter, useRoute } from '#app';
import CalendarActivitiesActions from './calendar-activities-actions.vue';
import CalendarTableView from './calendar-table-view.vue';

// Props
defineProps<{
  showAdvancedFilters?: boolean;
  currentView: 'grid' | 'list';
}>();

// Emits
defineEmits<{
  'toggle-filter-mode': [];
}>();

const { t, te } = useI18n();
const router = useRouter();
const route = useRoute();

// Record types based on SCHEMA_FILTER_KEYS from calendar-filters.vue
const SCHEMA_FILTER_KEYS = ['meeting', 'notification', 'activity'] as const;

const recordTypes = computed(() =>
  SCHEMA_FILTER_KEYS.map((key) => {
    const normalizedKey = key.toLowerCase();
    const translationKey = `calendar.types.${normalizedKey}`;
    const label = te(translationKey) ? (t(translationKey) as string) : key.charAt(0).toUpperCase() + key.slice(1);

    return { value: normalizedKey, label };
  }),
);

// Initialize active tab from URL or default to 'meeting'
const getInitialTab = (): string => {
  const typesFromUrl = route.query.types;
  const typeValue = Array.isArray(typesFromUrl) ? typesFromUrl[0] : typesFromUrl;
  
  // Check if the type from URL is valid
  if (typeValue && (SCHEMA_FILTER_KEYS as readonly string[]).includes(typeValue)) {
    return typeValue;
  }
  
  return 'meeting';
};

// State
const activeTab = ref<string>(getInitialTab());

// Methods
const setActiveTab = (tabValue: string) => {
  console.log('[TabView] setActiveTab called with:', tabValue);
  activeTab.value = tabValue;
  updateTypeFilter(tabValue);
};

const updateTypeFilter = (type: string) => {
  console.log('[TabView] updateTypeFilter called with:', type);
  console.log('[TabView] Current route.query:', route.query);
  console.log('[TabView] Current activeTab:', activeTab.value);
  
  // Preserve other query params but update types
  const query: Record<string, string | string[]> = {
    ...route.query,
    types: type
  };

  console.log('[TabView] Setting query to:', query);

  // Use push to navigate
  router.push({ query }).then(() => {
    console.log('[TabView] Navigation complete');
    console.log('[TabView] New route.query.types:', route.query.types);
  });
};

// Set initial filter on mount
onMounted(() => {
  updateTypeFilter(activeTab.value);
});

// Watch for external URL changes (e.g., browser back button)
watch(() => route.query.types, (newTypes) => {
  const typeValue = Array.isArray(newTypes) ? newTypes[0] : newTypes;
  
  if (typeValue && (SCHEMA_FILTER_KEYS as readonly string[]).includes(typeValue) && typeValue !== activeTab.value) {
    activeTab.value = typeValue;
  }
});
</script>

<style scoped>
.nav-pills {
  gap: 0.5rem;
}

.nav-pills .nav-link {
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  color: #6c757d;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  transition: all 0.2s ease;
}

.nav-pills .nav-link:hover {
  color: #495057;
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.nav-pills .nav-link.active {
  color: white;
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
}
</style>
