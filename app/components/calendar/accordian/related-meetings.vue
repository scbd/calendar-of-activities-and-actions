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
        <strong>{{ totalCount === 1 ? t('calendar.labels.relatedMeeting') : t('calendar.labels.relatedMeetings') }}</strong>
        <span class="badge calendar-related__badge">{{ totalCount }}</span>
      </button>
      <Transition name="collapse">
        <div v-show="isOpen" class="calendar-related__cards">
          <CalendarMeetingCard
            v-for="meeting in sortedMeetings"
            :key="meeting.id"
            :doc="meeting"
            class="mb-2"
          />
          <div
            v-for="ref in unresolvedRefs"
            :key="ref"
            class="calendar-unresolved-ref mb-2"
          >
            <span class="calendar-unresolved-ref__icon">
              <FontAwesomeIcon icon="link" />
            </span>
            <a
              :href="`https://www.cbd.int/meetings/${ref}`"
              target="_blank"
              rel="noopener"
              class="calendar-unresolved-ref__link"
            >
              {{ t('calendar.labels.meetingRef', { ref }) }}
            </a>
            <span class="calendar-unresolved-ref__hint">
              {{ t('calendar.labels.meetingRefHint') }}
            </span>
          </div>
        </div>
      </Transition>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DateTime } from 'luxon';
import { useI18n } from '#imports';
import CalendarMeetingCard from '../calendar-meeting-card.vue';
import type { CalendarDoc } from 'shared/types/calendar';

const props = defineProps<{
  meetings: CalendarDoc[];
  unresolvedRefs?: string[];
}>();

const { t } = useI18n();
const isOpen = ref(false);

const hasItems = computed(
  () => props.meetings.length > 0 || (props.unresolvedRefs?.length ?? 0) > 0,
);

const totalCount = computed(
  () => props.meetings.length + (props.unresolvedRefs?.length ?? 0),
);

/** Meetings sorted by startDate, newest first. */
const sortedMeetings = computed(() =>
  [...props.meetings].sort((a, b) => {
    const da = a.startDate ? DateTime.fromISO(String(a.startDate)) : DateTime.fromMillis(0);
    const db = b.startDate ? DateTime.fromISO(String(b.startDate)) : DateTime.fromMillis(0);

    return db.toMillis() - da.toMillis();
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
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px dashed #dee2e6;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
}

.calendar-unresolved-ref__icon {
  font-size: 0.75rem;
  color: #6c757d;
  flex-shrink: 0;
}

.calendar-unresolved-ref__link {
  font-size: 0.875rem;
  color: #0f7abd;
  font-weight: 500;
  text-decoration: none;
}

.calendar-unresolved-ref__link:hover {
  text-decoration: underline;
}

.calendar-unresolved-ref__hint {
  font-size: 0.75rem;
  color: #6c757d;
  font-style: italic;
  margin-left: auto;
}
</style>
