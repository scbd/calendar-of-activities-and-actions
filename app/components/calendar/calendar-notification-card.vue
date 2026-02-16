<template>
  <div class="calendar-notification-card" :class="{ 'calendar-notification-card--cpb-highlight': isCpbHighlighted }" :style="cardBackgroundStyle">
    <div class="calendar-notification-card__header">
      <div class="calendar-notification-card__header-left">
        <a
          :href="notificationLink"
          target="_blank"
          rel="noopener"
          class="calendar-notification-card__pill"
        >
          {{ t('calendar.notifications.notificationLabel', { id: entry.key }) }}
        </a>
      </div>
      <div
        v-if="entry.details?.publishedOn || entry.details?.from"
        class="calendar-notification-card__header-center"
      >
        <div v-if="entry.details?.publishedOn" class="calendar-notification-card__meta-line">
          {{ t('calendar.notifications.publishedOnDate', { date: formattedPublishedOn }) }}
        </div>
        <div v-if="entry.details?.from" class="calendar-notification-card__meta-line">
          {{ t('calendar.notifications.fromSource', { source: entry.details.from }) }}
        </div>
      </div>
      <div class="calendar-notification-card__header-right">
        <span
          v-if="entry.details?.actionRequired"
          class="calendar-notification-card__badge"
          :class="{ 'calendar-notification-card__badge--completed': isDeadlinePast }"
        >
          <template v-if="isDeadlinePast">
            {{ t('calendar.notifications.completedOn', { date: formattedDeadline }) }}
          </template>
          <template v-else>
            {{ t('calendar.labels.actionRequired') }}
            <span v-if="entry.details?.actionDeadline" class="calendar-notification-card__badge-deadline">
              {{ t('calendar.notifications.deadline', { date: formattedDeadline }) }}
            </span>
          </template>
        </span>
      </div>
    </div>

    <div v-if="entry.loading" class="calendar-notification-card__status">
      {{ t('calendar.notifications.loadingDetails') }}
    </div>
    <div v-else-if="entry.error" class="calendar-notification-card__status calendar-notification-card__status--error">
      {{ entry.error }}
    </div>
    <div v-else-if="entry.details" class="calendar-notification-card__content">
      <NuxtLink
        v-if="notificationCalendarLink"
        :to="notificationCalendarLink"
        target="_blank"
        class="calendar-notification-card__title"
      >
        {{ entry.details.title }}
      </NuxtLink>
      <a
        v-else
        :href="entry.details.link"
        target="_blank"
        rel="noopener"
        class="calendar-notification-card__title"
      >
        {{ entry.details.title }}
      </a>

      <div v-if="entry.details.recipients.length" class="calendar-notification-card__section">
        <span class="calendar-pill-label">{{ t('calendar.notifications.recipients') }}</span>
        <ExpandablePillList :items="entry.details.recipients" />
      </div>

      <div v-if="thematicLabels.length" class="calendar-notification-card__section">
        <span class="calendar-pill-label">{{ t('calendar.notifications.themes') }}</span>
        <ExpandablePillList
          :items="thematicLabels"
          pill-class="calendar-pill calendar-pill--muted"
        />
      </div>

      <div
        v-if="entry.details.attachments.length"
        class="calendar-notification-card__section calendar-notification-card__attachments"
      >
        <span class="calendar-pill-label">{{ t('calendar.notifications.attachments') }}</span>
        <a
          v-for="attachment in entry.details.attachments"
          :key="attachment.url"
          :href="attachment.url"
          target="_blank"
          rel="noopener"
        >
          {{ attachment.name }}
        </a>
      </div>

      <div class="calendar-notification-card__actions">
        <a
          :href="entry.details.link"
          target="_blank"
          rel="noopener"
          class="calendar-notification-card__cta"
        >
          {{ t('calendar.notifications.viewNotification') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DateTime } from 'luxon';
import { useI18n } from '#imports';
import ExpandablePillList from '../expandable-pill-list.vue';
import { buildNotificationLink } from 'shared/utils/notifications';
import { formatNotificationDate } from 'shared/utils/date';
import type { NotificationDisplayEntry } from 'shared/utils/notifications';
import type { CalendarDoc } from 'shared/types/calendar';
import { subjectLabelMap, resolveSubjectLabel, fallbackSubjectLabel } from 'shared/utils/subjects';
import { getTypeColor } from 'shared/utils/type-colors';

const props = defineProps<{
  entry: NotificationDisplayEntry;
  allDocs?: CalendarDoc[];
}>();

const { t } = useI18n();

const notificationLink = computed(() => buildNotificationLink(props.entry.key));
const formattedDeadline = computed(() => formatNotificationDate(props.entry.details?.actionDeadline) || '');
const formattedPublishedOn = computed(() => formatNotificationDate(props.entry.details?.publishedOn) || '');

const isDeadlinePast = computed(() => {
  const deadline = props.entry.details?.actionDeadline;

  if (!deadline) {
    return false;
  }

  const dt = DateTime.fromISO(String(deadline));

  if (!dt.isValid) {
    return false;
  }

  return dt.toUTC().endOf('day') < DateTime.utc();
});

const notificationCalendarLink = computed(() => {
  // Find the notification doc in allDocs to link to it in the main calendar view
  if (!props.allDocs) {
    return null;
  }

  const notificationDoc = props.allDocs.find(doc => {
    if (doc.schema !== 'notification') {
      return false;
    }
    // Match by notificationKey or symbol
    return doc.notificationKey === props.entry.key || doc.symbol === props.entry.key;
  });

  if (!notificationDoc) {
    return null;
  }

  const startDate = notificationDoc.startDate;
  const docId = notificationDoc.id || '';
  const query: Record<string, string> = {
    autoExpand: docId,
  };
  
  if (startDate) {
    query.startDate = startDate;
  }
  
  return {
    path: '/',
    query,
  };
});

const thematicLabels = computed(() => {
  if (!props.entry.details) {
    return [] as string[];
  }

  const labels = subjectLabelMap.value;
  const seen = new Set<string>();

  return props.entry.details.themes
    .map(theme => resolveSubjectLabel(theme, labels) || fallbackSubjectLabel(theme))
    .filter(label => {
      if (!label || !label.trim()) {
        return false;
      }

      const normalized = label.trim();

      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
});

const cardBackgroundStyle = computed(() => {
  // Notification entries should use the notification type color
  const palette = getTypeColor('notification');

  // Convert hex to rgba with heavy alpha (0.15 = 15% opacity)
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return {
    backgroundColor: hexToRgba(palette.background, 0.15),
  };
});

const isCpbHighlighted = computed(() => {
  const themes = props.entry.details?.themes ?? [];

  return (
    themes.includes('CBD-SUBJECT-CPB') ||
    themes.includes('CBD-SUBJECT-SYNBIO')
  );
});
</script>

<style scoped>
.calendar-notification-card {
  padding: 1rem;
  border-bottom: 1px solid #f1f3f5;
}

.calendar-notification-card--cpb-highlight {
  border-radius: 0.375rem;
}

.calendar-notification-card__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: start;
}

.calendar-notification-card__header-left {
  display: flex;
  align-items: center;
}

.calendar-notification-card__header-center {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
  justify-content: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.calendar-notification-card__header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.calendar-notification-card__meta-line {
  white-space: nowrap;
}

.calendar-notification-card__pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #0f7abd; /* CBD blue */
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}

.calendar-notification-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #fef3c7; /* warm light yellow */
  color: #92400e;
  font-weight: 600;
}

.calendar-notification-card__badge-deadline { font-weight: 400; }

.calendar-notification-card__badge--completed {
  background-color: #d1fae5; /* green tint */
  color: #065f46;
}

.calendar-notification-card__status { margin-top: 0.75rem; font-weight: 600; }
.calendar-notification-card__status--error { color: #b91c1c; }

.calendar-notification-card__title {
  display: inline-block;
  margin-top: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  text-decoration: none;
}

.calendar-notification-card__section {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calendar-pill-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6c757d;
}

.calendar-notification-card :deep(.calendar-pill) { /* reuse chip style */
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #f1f3f5;
  color: #1f1f1f;
  font-size: 0.875rem;
}

.calendar-notification-card :deep(.calendar-pill--muted) { background-color: #eef2f6; color: #4b5563; }

.calendar-notification-card__attachments { gap: 0.25rem; }

.calendar-notification-card__actions { margin-top: 1rem; }
.calendar-notification-card__cta {
  color: #0f7abd;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.2s ease;
}

.calendar-notification-card__cta:hover {
  border-bottom-color: #0f7abd;
}
</style>
