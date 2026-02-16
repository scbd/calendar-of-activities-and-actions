<template>
  <div class="calendar-details">
    <!-- Action Required / Completed (top-right) -->
    <div v-if="actionRequired" class="calendar-detail-section calendar-detail-section--action-badge  ">
      <span
        class="badge calendar-notification-badge"
        :class="isDeadlinePast ? 'calendar-notification-badge--completed' : 'bg-danger'"
      >
        <template v-if="isDeadlinePast">
          {{ t('calendar.notifications.completedOn', { date: formattedDeadline }) }}
        </template>
        <template v-else>
          {{ t('calendar.labels.actionRequired') }}
          <span v-if="formattedDeadline" class="calendar-notification-badge__deadline">
            {{ t('calendar.notifications.deadline', { date: formattedDeadline }) }}
          </span>
        </template>
      </span>
    </div>
    <!-- Symbol -->
    <div v-if="symbol" class="calendar-detail-section mb-3">
      <div class="calendar-detail-label">{{ t('calendar.labels.symbol') }}</div>
      <div class="calendar-detail-content">{{ symbol }}</div>
    </div>

        <!-- Description -->
    <div v-if="description" class="calendar-detail-section mb-3">
      <div class="calendar-detail-label">{{ t('calendar.labels.description') }}</div>
      <div class="calendar-detail-content">{{ description }}</div>
    </div>
    <!-- Themes / Thematic Areas -->
    <div v-if="themes.length" class="calendar-detail-section mb-3">
      <div class="calendar-detail-label">{{ t('calendar.notifications.themes') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="themes"
        pill-class="calendar-pill calendar-pill--muted"
      />
    </div>




    <!-- Recipients -->
    <div v-if="recipients.length" class="calendar-detail-section mb-3">
      <div class="calendar-detail-label">{{ t('calendar.notifications.recipients') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="recipients"
      />
    </div>

    <!-- Themes / Subjects -->
    <div v-if="subjectLabels.length" class="calendar-detail-section mb-3">
      <div class="calendar-detail-label">{{ t('calendar.notifications.themes') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="subjectLabels"
        pill-class="calendar-pill calendar-pill--muted"
      />
    </div>

    <!-- Governing bodies -->
    <div v-if="governingBodies.length" class="calendar-detail-section mb-3">
      <div class="calendar-detail-label">{{ governingBodies.length > 1 ? t('calendar.labels.governingBodies') : t('calendar.labels.governingBody') }}</div>
      <div class="calendar-detail-content">{{ governingBodies.join(', ') }}</div>
    </div>

    <!-- Subsidiary bodies -->
    <div v-if="subsidiaryBodies.length" class="calendar-detail-section mb-3">
      <div class="calendar-detail-label">{{ subsidiaryBodies.length > 1 ? t('calendar.labels.subsidiaryBodies') : t('calendar.labels.subsidiaryBody') }}</div>
      <div class="calendar-detail-content">{{ subsidiaryBodies.join(', ') }}</div>
    </div>

    <!-- GBF Sections -->
    <div v-if="gbfSections.length" class="calendar-detail-section mb-3">
      <div class="calendar-detail-label">{{ t('calendar.labels.gbfSections') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="gbfSections"
      />
    </div>

    <!-- Global Targets -->
    <div v-if="globalTargets.length" class="calendar-detail-section mb-3">
      <div class="calendar-detail-label">{{ t('calendar.filters.labels.globalTargets') }}</div>
      <ExpandablePillList
        class="calendar-pill-row calendar-pill-row--gbf-targets"
        :items="globalTargets"
        pill-class="calendar-pill calendar-pill--gbf-target"
      >
        <template #default="{ item }">
          <a
            v-if="gbfTargetUrl(item)"
            :href="gbfTargetUrl(item)"
            target="_blank"
            rel="noopener"
            :aria-label="gbfTargetLabel(item)"
          >
            <img
              :src="gbfTargetImageUrl(item)"
              :alt="gbfTargetLabel(item)"
              :title="gbfTargetLabel(item)"
              class="gbf-target-img"
              width="20"
              height="20"
              loading="lazy"
            />
          </a>
          <span v-else>{{ item }}</span>
        </template>
      </ExpandablePillList>
    </div>

    <!-- Decisions -->
    <div v-if="decisionEntries.length" class="calendar-detail-section mb-3">
      <div class="calendar-detail-label">{{ t('calendar.labels.decision') }}</div>
      <div class="calendar-detail-content">
        <template
          v-for="(entry, index) in decisionEntries"
          :key="`${entry.href ?? entry.label}-${index}`"
        >
          <DecisionLink :href="entry.href" :label="entry.label" />
          <span v-if="index < decisionEntries.length - 1">, </span>
        </template>
      </div>
    </div>

    <!-- Attachments -->
    <div v-if="attachments.length" class="calendar-detail-section mb-3">
      <div class="calendar-detail-label">{{ t('calendar.notifications.attachments') }}</div>
      <div class="calendar-detail-content">
        <a
          v-for="attachment in attachments"
          :key="attachment.url"
          :href="attachment.url"
          target="_blank"
          rel="noopener"
          class="me-4 text-decoration-none"
        >
          {{ attachment.name }}
        </a>
      </div>
    </div>

        <!-- View Notification -->
    <div v-if="notificationLink" class="w-100 mb-3">
      <a
        :href="notificationLink"
        target="_blank"
        rel="noopener"
        class="btn btn-outline-primary w-100"
      >
        {{ t('calendar.notifications.viewNotification') }}
      </a>
    </div>
    

    <!-- Related Activities -->
    <RelatedActivities
      :activities="relatedActivities ?? []"
      :unresolved-refs="unresolvedActivityRefs"
    />

    <!-- Related Meetings -->
    <RelatedMeetings
      :meetings="relatedMeetings ?? []"
      :unresolved-refs="unresolvedMeetingRefs"
    />


  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '#imports';
import { DateTime } from 'luxon';
import ExpandablePillList from '../../expandable-pill-list.vue';
import DecisionLink from '../../decision-link.vue';
import RelatedActivities from './related-activities.vue';
import RelatedMeetings from './related-meetings.vue';
import type { DecisionEntry } from 'shared/utils/decision-links';
import type { NotificationAttachment } from 'shared/utils/notifications';
import type { CalendarDoc } from 'shared/types/calendar';
import { formatNotificationDate } from 'shared/utils/date';

const props = defineProps<{
  symbol?: string;
  themes: string[];
  description?: string;
  subjectLabels: string[];
  subsidiaryBodies: string[];
  governingBodies: string[];
  gbfSections: string[];
  globalTargets: string[];
  decisionEntries: DecisionEntry[];
  recipients: string[];
  attachments: NotificationAttachment[];
  notificationLink?: string;
  actionRequired?: boolean;
  actionDeadline?: string | null;
  responsibleUnit?: string;
  responsibleOfficer?: string;
  showResponsible: boolean;
  relatedMeetings?: CalendarDoc[];
  relatedActivities?: CalendarDoc[];
  unresolvedMeetingRefs?: string[];
  unresolvedActivityRefs?: string[];
}>();

const { t } = useI18n();

const formattedDeadline = computed(() => formatNotificationDate(props.actionDeadline) || '');

const isDeadlinePast = computed(() => {
  const deadline = props.actionDeadline;

  if (!deadline) {
    return false;
  }

  const dt = DateTime.fromISO(String(deadline));

  if (!dt.isValid) {
    return false;
  }

  return dt.toUTC().endOf('day') < DateTime.utc();
});

/**
 * Convert a GBF target identifier (e.g. "GBF-TARGET-01") to the CBD image URL.
 * Returns an empty string when the identifier doesn't match the expected pattern.
 */
function gbfTargetImageUrl(identifier: string): string {
  const match = identifier.match(/GBF-TARGET-(\d+)/i);

  if (!match) {
    return '';
  }

  const num = parseInt(match[1], 10);
  const padded = String(num).padStart(2, '0');

  return `https://www.cbd.int/app/images/gbf-targets/gbf-${padded}-64.png`;
}

/**
 * Derive an accessible label from a GBF target identifier.
 * E.g. "GBF-TARGET-01" → "GBF Target 1".
 */
function gbfTargetLabel(identifier: string): string {
  const match = identifier.match(/GBF-TARGET-(\d+)/i);

  if (!match) {
    return identifier;
  }

  return `GBF Target ${parseInt(match[1], 10)}`;
}

/**
 * Build the external CBD link for a GBF target.
 * E.g. "GBF-TARGET-01" → "https://www.cbd.int/gbf/targets/1".
 */
function gbfTargetUrl(identifier: string): string {
  const match = identifier.match(/GBF-TARGET-(\d+)/i);

  if (!match) {
    return '';
  }

  return `https://www.cbd.int/gbf/targets/${parseInt(match[1], 10)}`;
}
</script>

<style scoped>
.calendar-details {

  width: 100%;
  position: relative;
}

/* Action badge floated top-right */
.calendar-detail-section--action-badge {
  position: absolute;
  top: 0;
  right: 0;
  grid-column: unset;
  justify-content: flex-end;
  z-index: 1;
  color: #fff;
  
}

.calendar-detail-section {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0; /* Prevents grid blowout */
  
}
.calendar-detail-section:hover {
  text-decoration: none;
  color: #fff;
}
.calendar-detail-label {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6c757d;
  white-space: nowrap;
}



.calendar-detail-content {
  font-size: 0.875rem;
  color: #1f1f1f;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;
  padding-left: 0.75rem;
}

.calendar-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-left: 0.75rem;
}

.calendar-detail-section :deep(.calendar-pill) {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #f1f3f5;
  color: #1f1f1f;
  font-size: 0.875rem;
}

.calendar-detail-section :deep(.calendar-pill--muted) {
  background-color: #eef2f6;
  color: #4b5563;
}

.calendar-pill-row--gbf-targets {
  align-items: center;
}

.calendar-pill--gbf-target {
  padding: 0.125rem;
  background-color: transparent;
}

.gbf-target-img {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
}

.calendar-attachments {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.calendar-notification-cta {

  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.2s ease;
}

.calendar-notification-cta:hover {
  color: #fff;
}

.calendar-notification-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
}

.calendar-notification-badge--completed {
  background-color: #198754;
  color: #fff;
}

.calendar-notification-badge__deadline {
  font-weight: 400;
  opacity: 0.9;
}

/* Bare <hr> and related sections rendered by child components
   must also span the full grid width. */
.calendar-details > hr,
.calendar-details :deep(.calendar-related__separator),
.calendar-details :deep(.calendar-related) {
  grid-column: 1 / -1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .calendar-details {
    grid-template-columns: 1fr;
  }

  .calendar-detail-section {
    grid-column: 1;
  }
}
</style>
