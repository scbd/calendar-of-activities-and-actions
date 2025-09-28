<template>
  <div class="calendar-notification-card">
    <div class="calendar-notification-card__pill-row">
      <a
        :href="notificationLink"
        target="_blank"
        rel="noopener"
        class="calendar-notification-card__pill"
      >
        {{ t('calendar.notifications.notificationLabel', { id: entry.key }) }}
      </a>
      <span
        v-if="entry.details?.actionRequired"
        class="calendar-notification-card__badge"
      >
        {{ t('calendar.labels.actionRequired') }}
        <span v-if="entry.details?.actionDeadline" class="calendar-notification-card__badge-deadline">
          {{ t('calendar.notifications.deadline', { date: formattedDeadline }) }}
        </span>
      </span>
    </div>

    <div
      v-if="entry.details?.publishedOn || entry.details?.from"
      class="calendar-notification-card__meta"
    >
      <div v-if="entry.details?.publishedOn" class="calendar-notification-card__meta-line">
        {{ t('calendar.notifications.publishedOnDate', { date: formattedPublishedOn }) }}
      </div>
      <div v-if="entry.details?.from" class="calendar-notification-card__meta-line">
        {{ t('calendar.notifications.fromSource', { source: entry.details.from }) }}
      </div>
    </div>

    <div v-if="entry.loading" class="calendar-notification-card__status">
      {{ t('calendar.notifications.loadingDetails') }}
    </div>
    <div v-else-if="entry.error" class="calendar-notification-card__status calendar-notification-card__status--error">
      {{ entry.error }}
    </div>
    <div v-else-if="entry.details" class="calendar-notification-card__content">
      <a
        :href="entry.details.link"
        target="_blank"
        rel="noopener"
        class="calendar-notification-card__title"
      >
        {{ entry.details.title }}
      </a>

      <div v-if="entry.details.recipients.length" class="calendar-notification-card__section">
        <span class="calendar-pill-label">{{ t('calendar.notifications.recipients') }}</span>
        <span
          v-for="recipient in entry.details.recipients"
          :key="recipient"
          class="calendar-pill"
        >
          {{ recipient }}
        </span>
      </div>

      <div v-if="entry.details.thematicAreas.length" class="calendar-notification-card__section">
        <span class="calendar-pill-label">{{ t('calendar.notifications.themes') }}</span>
        <span
          v-for="theme in entry.details.thematicAreas"
          :key="theme"
          class="calendar-pill calendar-pill--muted"
        >
          {{ theme }}
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
import { useI18n } from '#imports';
import { buildNotificationLink } from 'shared/utils/notifications';
import { formatNotificationDate } from 'shared/utils/date';
import type { NotificationDisplayEntry } from 'shared/utils/notifications';

const props = defineProps<{
  entry: NotificationDisplayEntry;
}>();

const { t } = useI18n();

const notificationLink = computed(() => buildNotificationLink(props.entry.key));
const formattedDeadline = computed(() => formatNotificationDate(props.entry.details?.actionDeadline) || '');
const formattedPublishedOn = computed(() => formatNotificationDate(props.entry.details?.publishedOn) || '');
</script>
