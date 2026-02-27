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
        <strong>{{ t('calendar.labels.relatedNotifications') }}</strong>
        <span class="badge calendar-related__badge">{{ totalCount }}</span>
      </button>
      <Transition name="collapse">
        <div v-show="isOpen" class="calendar-related__cards">
          <CalendarNotificationCard
            v-for="notification in sortedNotifications"
            :key="notification.key"
            :entry="notification"
            :all-docs="allDocs"
            class="mb-2"
          />
        </div>
      </Transition>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from '#imports';
import CalendarNotificationCard from '../calendar-notification-card.vue';
import type { NotificationDisplayEntry } from 'shared/utils/notifications';
import type { CalendarDoc } from 'shared/types/calendar';

const props = defineProps<{
  notifications: NotificationDisplayEntry[];
  allDocs?: CalendarDoc[];
}>();

const { t } = useI18n();
const isOpen = ref(false);

const hasItems = computed(() => props.notifications.length > 0);

const totalCount = computed(() => props.notifications.length);

/** Notifications sorted by symbol (key), newest first (descending). */
const sortedNotifications = computed(() =>
  [...props.notifications].sort((a, b) => {
    const keyA = a.key ?? '';
    const keyB = b.key ?? '';

    return keyB.localeCompare(keyA);
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
</style>
