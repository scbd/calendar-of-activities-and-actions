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
          class="badge"
          :class="isDeadlinePast ? 'bg-success' : 'bg-warning'"
        >
          <template v-if="isDeadlinePast">
            <span class="calendar-notification-card__badge-status">{{ t('calendar.status.completed') }}</span>
            <span v-if="formattedDeadline" class="calendar-notification-card__badge-sep">&bull;</span>
            <span v-if="formattedDeadline" class="calendar-notification-card__badge-date">{{ formattedDeadline }}</span>
          </template>
          <template v-else>
            <span class="calendar-notification-card__badge-status">{{ t('calendar.labels.actionRequired') }}</span>
            <span v-if="formattedDeadline" class="calendar-notification-card__badge-sep">&bull;</span>
            <span v-if="formattedDeadline" class="calendar-notification-card__badge-date">{{ formattedDeadline }}</span>
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
        :to="notificationCalendarLink"
        class="calendar-notification-card__title"
      >
        {{ entry.details.title }}
      </NuxtLink>

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

      <div v-if="governingBodyLabels.length" class="calendar-notification-card__body-section">
        <span class="calendar-pill-label">{{ t('calendar.labels.governingBodies') }}</span>
        <span
          v-for="label in governingBodyLabels"
          :key="label"
          class="calendar-notification-card__body-pill"
        >
          {{ label }}
        </span>
      </div>

      <div v-if="subsidiaryBodyLabels.length" class="calendar-notification-card__body-section">
        <span class="calendar-pill-label">{{ t('calendar.labels.subsidiaryBodies') }}</span>
        <span
          v-for="label in subsidiaryBodyLabels"
          :key="label"
          class="calendar-notification-card__body-pill"
        >
          {{ label }}
        </span>
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
import { getDocGoverningBodies, getDocSubsidiaryBodies } from 'shared/utils/document-processing';
import { useBodyLabels } from '../../composables/use-body-labels';

const props = defineProps<{
  entry: NotificationDisplayEntry;
  allDocs?: CalendarDoc[];
}>();

const { t } = useI18n();

const { resolveGoverningBodyLabels, resolveSubsidiaryBodyLabels } = useBodyLabels();

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
  const query: Record<string, string> = {};

  // Try to find the notification doc in allDocs so we can auto-expand it
  const matchedDoc = notificationDoc.value;

  if (matchedDoc) {
    const docId = matchedDoc.id || '';

    if (docId) {
      query.autoExpand = docId;
    }

    if (matchedDoc.startDate) {
      query.startDate = matchedDoc.startDate;
    }
  } else if (props.entry.details?.publishedOn) {
    // Fallback: navigate to the calendar around the notification's published date
    // and set autoExpand to the notification key so the auto-expand logic can
    // match by symbol/identifier once the data loads.
    query.startDate = props.entry.details.publishedOn;
    query.autoExpand = props.entry.key;
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

const notificationDoc = computed(() => {
  if (!props.allDocs) {
    return null;
  }

  const key = props.entry.key;

  return props.allDocs.find(doc => {
    if (doc.schema !== 'notification') {
      return false;
    }

    // Match by symbol (primary), reference, or identifier containing the key
    if (doc.symbol === key) {
      return true;
    }

    if ('reference' in doc && doc.reference === key) {
      return true;
    }

    if (doc.identifier && doc.identifier.includes(key)) {
      return true;
    }

    return false;
  }) ?? null;
});

const governingBodyLabels = computed(() => {
  if (!notificationDoc.value) {
    return [] as string[];
  }

  return resolveGoverningBodyLabels(getDocGoverningBodies(notificationDoc.value));
});

const subsidiaryBodyLabels = computed(() => {
  if (!notificationDoc.value) {
    return [] as string[];
  }

  return resolveSubsidiaryBodyLabels(getDocSubsidiaryBodies(notificationDoc.value));
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
  text-transform: uppercase;
}

.calendar-notification-card__badge-status {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.calendar-notification-card__badge-sep {
  opacity: 0.7;
}

.calendar-notification-card__badge-date {
  font-weight: 500;
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

.calendar-notification-card__body-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.calendar-notification-card__body-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #eef2f6;
  color: #4b5563;
  font-size: 0.875rem;
}

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
