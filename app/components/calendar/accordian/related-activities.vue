<template>
  <template v-if="hasItems">
    <hr class="calendar-related__separator">
    <div class="calendar-related">
      <button
        type="button"
        class="calendar-related__toggle"
        :aria-expanded="isOpen"
        @click="isOpen = !isOpen"
      >
        <span class="calendar-related__chevron" :class="{ 'calendar-related__chevron--open': isOpen }">
          <FontAwesomeIcon icon="chevron-right" />
        </span>
        <strong>{{ totalCount === 1 ? t('calendar.labels.relatedActivity') : t('calendar.labels.relatedActivities') }}</strong>
        <span class="badge calendar-related__badge">{{ totalCount }}</span>
      </button>
      <Transition name="collapse">
        <div v-show="isOpen" class="calendar-related__cards">
          <CalendarActivityCard
            v-for="activity in sortedActivities"
            :key="activity.id"
            :doc="activity"
            class="mb-2"
          />
          <div
            v-for="ref in unresolvedRefs"
            :key="ref"
            class="calendar-unresolved-ref mb-2"
          >
            <span class="calendar-unresolved-ref__label">{{ ref }}</span>
          </div>
        </div>
      </Transition>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from '#imports';
import CalendarActivityCard from '../calendar-activity-card.vue';
import type { CalendarDoc } from 'shared/types/calendar';

const props = defineProps<{
  activities: CalendarDoc[];
  unresolvedRefs?: string[];
}>();

const { t } = useI18n();
const isOpen = ref(false);

const hasItems = computed(
  () => props.activities.length > 0 || (props.unresolvedRefs?.length ?? 0) > 0,
);

const totalCount = computed(
  () => props.activities.length + (props.unresolvedRefs?.length ?? 0),
);

/** Activities sorted by identifier, newest first (descending). */
const sortedActivities = computed(() =>
  [...props.activities].sort((a, b) => {
    const idA = a.identifier ?? '';
    const idB = b.identifier ?? '';

    return idB.localeCompare(idA);
  }),
);
</script>

<style scoped>
.calendar-related__separator {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid #6c757d;
}

.calendar-related__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  padding: 0;
  margin-bottom: 0.75rem;
  font-size: 1.125rem;
  cursor: pointer;
  color: inherit;
  font-family: inherit;
}

.calendar-related__toggle:hover {
  opacity: 0.75;
}

.calendar-related__chevron {
  display: inline-block;
  font-size: 0.75rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.calendar-related__chevron--open {
  transform: rotate(90deg);
}

.calendar-related__badge {
  background-color: #6c757d;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2em 0.55em;
  border-radius: 999px;
  vertical-align: middle;
}

/* Collapse transition */
.collapse-enter-active,
.collapse-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 2000px;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.calendar-related__cards {
  display: flex;
  flex-direction: column;
}

.calendar-unresolved-ref {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border: 1px dashed #dee2e6;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
}

.calendar-unresolved-ref__label {
  font-size: 0.875rem;
  color: #495057;
  font-weight: 500;
}
</style>
