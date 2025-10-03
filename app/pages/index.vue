<template>
  <div>
    <NuxtRouteAnnouncer />
    <section class="calendar-container">
      <div class="container py-3">
        <!-- View Switcher -->
        <div class="d-flex justify-content-end mb-3">
          <div class="btn-group" role="group" aria-label="View switcher">
            <button
              type="button"
              :aria-label="t('calendar.views.grid')"
              class="btn btn-outline-secondary"
              :class="{ active: currentView === 'grid' }"
              @click="currentView = 'grid'"
            >
              <FontAwesomeIcon icon="grip" />
              <span class="ms-2 d-none d-sm-inline">{{ t('calendar.views.grid') }}</span>
            </button>
            <button
              type="button"
              :aria-label="t('calendar.views.list')"
              class="btn btn-outline-secondary"
              :class="{ active: currentView === 'list' }"
              @click="currentView = 'list'"
            >
              <FontAwesomeIcon icon="list" />
              <span class="ms-2 d-none d-sm-inline">{{ t('calendar.views.list') }}</span>
            </button>
          </div>
        </div>

        <!-- Grid View (Default) -->
        <CalendarTableView v-if="currentView === 'grid'" :show-advanced-filters="showAdvancedFilters" @toggle-filter-mode="toggleFilterMode" />

        <!-- Table View -->
        <CalendarActivitiesActions v-if="currentView === 'list'" :show-advanced-filters="showAdvancedFilters" @toggle-filter-mode="toggleFilterMode" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '#imports';
import CalendarActivitiesActions from '../components/calendar/calendar-activities-actions.vue';
import CalendarTableView from '../components/calendar/calendar-table-view.vue';

const { t } = useI18n();

// State management
const currentView = ref<'grid' | 'list'>('list');
const showAdvancedFilters = ref(false);

// Methods
const toggleFilterMode = () => {
  showAdvancedFilters.value = !showAdvancedFilters.value;
};
</script>

<style scoped>
.btn-group .btn.active {
  background-color: var(--bs-primary);
  color: white;
  border-color: var(--bs-primary);
}
</style>
