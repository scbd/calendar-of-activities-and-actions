<template>
  <div>
    <NuxtRouteAnnouncer />
    <div class="pilot-banner">
      {{ t('scbd.pilotRelease') }}
    </div>
    <section class="calendar-container">
      <div class="container-fluid py-3">
        <!-- Page Title and Decision Quote -->
        <h1 class="mb-3">Calendar of Activities and Actions</h1>

        <hr class="mb-4">

        <!-- View Switcher and Tab View Toggle -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <!-- Tab View Toggle -->
          <div class="form-check form-switch">
            <input
              id="tab-view-toggle"
              :checked="tabViewEnabled"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :aria-label="t('scbd.views.tabView')"
              @change="onTabViewToggle"
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
          :show-tab-selector="true"
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
import { ref, watch } from 'vue';
import { useI18n, useRoute, useRouter } from '#imports';
import CalendarActivitiesActions from '../components/calendar/calendar-activities-actions.vue';
import CalendarTableView from '../components/calendar/calendar-table-view.vue';
import CalendarTabView from '../components/calendar/calendar-tab-view.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

const currentView = ref<'grid' | 'list'>('list');
const showAdvancedFilters = ref(false);

// Initialise tabViewEnabled from the URL query param before mount so that
// child components (CalendarTabView, filters) receive the correct prop on
// their first render.
const tabViewEnabled = ref(route.query['tab-view-toggle'] === 'true');

// When tab-view is activated from the URL on initial load, ensure
// `types=meeting` is present in the query string.
if (tabViewEnabled.value) {
  const currentTypes = route.query.types as string | undefined;

  if (!currentTypes || !currentTypes.split(',').includes('meeting')) {
    router.replace({
      query: {
        ...route.query,
        'tab-view-toggle': 'true',
        types: 'meeting',
      },
    });
  }
}

/**
 * Handle the tab-view toggle checkbox change.
 *
 * We update the URL **first** (awaiting the navigation) so that
 * `route.query` already contains `tab-view-toggle` by the time child
 * components mount and their filter `watchEffect` reads the query.
 */
async function onTabViewToggle(event: Event): Promise<void> {
  const checked = (event.target as HTMLInputElement).checked;

  const query: Record<string, string | string[] | undefined> = {
    ...route.query,
  };

  if (checked) {
    query['tab-view-toggle'] = 'true';

    // Add types=meeting when not already present
    const currentTypes = (query.types as string | undefined) ?? '';

    if (!currentTypes.split(',').includes('meeting')) {
      query.types = 'meeting';
    }
  } else {
    delete query['tab-view-toggle'];
  }

  // Await the navigation so route.query is updated before the re-render
  await router.replace({ query: query as Record<string, string | string[]> });

  // Now update the reactive state — this triggers the v-if re-render
  // with route.query already containing the correct params.
  tabViewEnabled.value = checked;
}

// React to external URL changes (e.g. browser back/forward)
watch(
  () => route.query['tab-view-toggle'],
  (val) => {
    const shouldBeEnabled = val === 'true';

    if (tabViewEnabled.value !== shouldBeEnabled) {
      tabViewEnabled.value = shouldBeEnabled;
    }
  },
);

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

const toggleFilterMode = () => {
  showAdvancedFilters.value = !showAdvancedFilters.value;
};
</script>

<style scoped>
.pilot-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1050;
  background-color: #9b59b6;
  color: #fff;
  text-align: center;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.35rem 0;
}

.calendar-container {
  padding-top: 2rem;
  margin-top: var(--pilot-banner-height, 1.95rem);
}

.btn-group .btn.active {
  background-color: var(--bs-primary);
  color: white;
  border-color: var(--bs-primary);
}
</style>
