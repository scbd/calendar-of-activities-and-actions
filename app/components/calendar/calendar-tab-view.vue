<template>
  <section class="calendar-tab-view">
    <!-- Content based on active tab and view (includes its own filter card and tabs) -->
    <div>
      <component
        :is="currentView === 'grid' ? CalendarTableView : CalendarActivitiesActions"
        :key="`view-${currentView}`"
        :show-advanced-filters="showAdvancedFilters"
        :hide-type-filter="true"
        :active-tab-type="activeTab"
        :show-tab-selector="showTabSelector"
        @toggle-filter-mode="$emit('toggle-filter-mode')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from '#app';
import CalendarActivitiesActions from './calendar-activities-actions.vue';
import CalendarTableView from './calendar-table-view.vue';

// Props
defineProps<{
  showAdvancedFilters?: boolean;
  currentView: 'grid' | 'list';
  showTabSelector?: boolean;
}>();

// Emits
defineEmits<{
  'toggle-filter-mode': [];
}>();

const router = useRouter();
const route = useRoute();

// Record types — calendarActivity replaces 'activity'
const SCHEMA_FILTER_KEYS = ['meeting', 'notification', 'calendarActivity'] as const;

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

const updateTypeFilter = (type: string) => {
  // Preserve other query params but update types
  const query: Record<string, string | string[]> = {
    ...route.query,
    types: type,
  };

  router.push({ query });
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
