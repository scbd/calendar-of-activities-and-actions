<template>
  <div>
    <NuxtRouteAnnouncer />
    <section class="calendar-container">
      <div class="container py-3">
        <!-- View Switcher and Tab View Toggle -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <!-- Tab View Toggle -->
          <div class="form-check form-switch">
            <input
              id="tab-view-toggle"
              v-model="tabViewEnabled"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :aria-label="t('scbd.views.tabView')"
            >
            <label class="form-check-label" for="tab-view-toggle">
              {{ t('scbd.views.tabView') }}
            </label>
          </div>

          <!-- Grid/List View Switcher -->
          <div class="btn-group" role="group" aria-label="View switcher">
            <button
              type="button"
              :aria-label="t('scbd.views.grid')"
              class="btn btn-outline-secondary"
              :class="{ active: currentView === 'grid' }"
              @click="currentView = 'grid'"
            >
              <FontAwesomeIcon icon="grip" />
              <span class="ms-2 d-none d-sm-inline">{{ t('scbd.views.grid') }}</span>
            </button>
            <button
              type="button"
              :aria-label="t('scbd.views.list')"
              class="btn btn-outline-secondary"
              :class="{ active: currentView === 'list' }"
              @click="currentView = 'list'"
            >
              <FontAwesomeIcon icon="list" />
              <span class="ms-2 d-none d-sm-inline">{{ t('scbd.views.list') }}</span>
            </button>
          </div>
        </div>

        <!-- Tab View -->
        <CalendarTabView
          v-if="tabViewEnabled"
          :show-advanced-filters="showAdvancedFilters"
          :current-view="currentView"
          @toggle-filter-mode="toggleFilterMode"
        />

        <!-- Standard Views (Grid/List without tabs) -->
        <template v-else>
          <!-- Grid View (Default) -->
          <CalendarTableView v-if="currentView === 'grid'" :show-advanced-filters="showAdvancedFilters" @toggle-filter-mode="toggleFilterMode" />

          <!-- Table View -->
          <CalendarActivitiesActions v-if="currentView === 'list'" :show-advanced-filters="showAdvancedFilters" @toggle-filter-mode="toggleFilterMode" />
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '#imports';
import CalendarActivitiesActions from '../components/calendar/calendar-activities-actions.vue';
import CalendarTableView from '../components/calendar/calendar-table-view.vue';
import CalendarTabView from '../components/calendar/calendar-tab-view.vue';

const { t } = useI18n();

// State management
const currentView = ref<'grid' | 'list'>('list');
const showAdvancedFilters = ref(false);
const tabViewEnabled = ref(false);

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
