<template>
  <div ref="accordionRef" class="accordion-item mb-4" :class="{ 'accordion-item--faded': fadeOthers && !isOpen }">
    <h2 :id="headingId" class="accordion-header">
      <button
        class="accordion-button p-0"
        :class="{ collapsed: !isOpen }"
        type="button"
        :aria-expanded="isOpen ? 'true' : 'false'"
        :aria-controls="collapseId"
        @click="$emit('toggle')"
      >
        <!-- Top banner showing type (Meeting, Workshop, Nominations, etc.) -->
        <div class="calendar-row__type-banner p-2" :style="typeStyle">
          <span class="calendar-row__type-date">{{ dateRange }}</span>
          <span class="calendar-row__type-text">{{ typeLabel }}</span>
          <span class="calendar-row__caret-spacer" />
        </div>

        <div class="calendar-accordion__summary p-4">
          <div class="calendar-accordion__title mb-3">{{ title }}</div>
          <div v-if="meetingLocation" class="calendar-accordion__location mb-3">{{ meetingLocation }}</div>
          <div v-if="notificationSymbol" class="calendar-accordion__symbol mb-3">{{ notificationSymbol }}</div>
          <div
            v-if="statusLabel || isActionRequired || primaryLink"
            class="calendar-accordion__meta-block mt-2"
          >
            <div
              v-if="primaryLink || statusLabel || isActionRequired"
              class="calendar-accordion__footer"
              :class="{ 'calendar-accordion__footer--has-link': primaryLink }"
            >
              <a
                v-if="primaryLink"
                :href="primaryLink"
                target="_blank"
                rel="noopener"
                class="calendar-accordion__cta calendar-accordion__cta--link"
                :aria-label="t('calendar.actions.viewDocumentsAria', { title })"
                data-testid="calendar-accordion-view-documents"
              >
                {{ t('calendar.actions.viewDocuments') }} →
              </a>
              <div
                v-if="statusLabel || isActionRequired"
                class="calendar-accordion__status-badges"
                data-testid="calendar-accordion-status-block"
              >
                <span
                  v-if="isActionRequired"
                  class="badge bg-danger calendar-accordion__status-badge"
                >
                  {{ t('calendar.labels.actionRequiredByParties') }}
                </span>
                <span
                  v-if="statusLabel"
                  class="badge calendar-accordion__status-badge"
                  :class="`bg-${statusColorValue}`"
                >
                  {{ statusLabel }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </h2>
    <div
      :id="collapseId"
      class="accordion-collapse collapse"
      :class="{ show: isOpen }"
      :aria-labelledby="headingId"
    >
      <div class="accordion-body">
        <CalendarDocumentDetails
          :status-narrative="statusNarrative"
          :symbol="meetingSymbol"
          :description="description"
          :subject-labels="subjectLabels"
          :subsidiary-bodies="subsidiaryBodies"
          :decision-entries="decisionEntriesValue"
          :responsible-unit="responsibleUnit"
          :responsible-officer="responsibleOfficer"
          :show-responsible="showResponsible"
        />

        <hr v-if="notificationEntries.length" class="calendar-notifications__separator">

        <div v-if="notificationEntries.length" class="calendar-notifications mt-3">
          <div class="calendar-notifications__header">
            <strong>{{ t('calendar.labels.notifications') }}</strong>
          </div>
          <CalendarNotificationCard
            v-for="entry in notificationEntries"
            :key="entry.key"
            :entry="entry"
            :all-docs="allDocs"
            class="mb-2"
          />
        </div>

        <hr v-if="relatedActivities.length" class="calendar-activities__separator">

        <div v-if="relatedActivities.length" class="calendar-activities mt-3">
          <div class="calendar-activities__header">
            <strong>{{ t('calendar.labels.relatedActivities') }}</strong>
          </div>
          <CalendarActivityCard
            v-for="activity in relatedActivities"
            :key="activity.id"
            :doc="activity"
            class="mb-2"
          />
        </div>

        <hr v-if="relatedMeetings.length" class="calendar-meetings__separator">

        <div v-if="relatedMeetings.length" class="calendar-meetings mt-3">
          <div class="calendar-meetings__header">
            <strong>{{ t('calendar.labels.relatedMeetings') }}</strong>
          </div>
          <CalendarActivityCard
            v-for="meeting in relatedMeetings"
            :key="meeting.id"
            :doc="meeting"
            class="mb-2"
          />
        </div>

        <hr v-if="relatedNotifications.length" class="calendar-related-notifications__separator">

        <div v-if="relatedNotifications.length" class="calendar-related-notifications mt-3">
          <div class="calendar-related-notifications__header">
            <strong>{{ t('calendar.labels.relatedNotifications') }}</strong>
          </div>
          <CalendarActivityCard
            v-for="notification in relatedNotifications"
            :key="notification.id"
            :doc="notification"
            class="mb-2"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from '#imports';
import { getTitleFieldForLocale, normalizeSolrDocument } from 'shared/services/solr';
import type { LocaleCode } from 'shared/services/solr';
import type { CalendarDoc } from 'shared/types/calendar';
import CalendarDocumentDetails from './calendar-document-details.vue';
import CalendarNotificationCard from './calendar-notification-card.vue';
import CalendarActivityCard from './calendar-activity-card.vue';
import { formatDateRange } from 'shared/utils/date';
import {
  getDocBooleanValue,
  getDocRaw,
  getDocStringValue,
  getDocSubsidiaryBodies,
} from 'shared/utils/document-processing';
import {
  normalizeDecisionLabel,
  responsibleOfficerLabel,
  responsibleUnitLabel,
  resolveCountryLabel,
} from 'shared/utils/labels';
import { normalizeStatusKey, normalizeStatusLabel, shouldDisplayCompleted, statusColor } from 'shared/utils/status';
import { getTypeColor, normalizeTypeKey } from 'shared/utils/type-colors';
import {
  notificationDisplayEntries,
  resolveNotificationUrl,
  getRelatedActivities,
  getRelatedMeetings,
  getRelatedNotificationsForMeeting,
  getRelatedActivitiesForMeeting,
} from 'shared/utils/notifications';
import { extractDecisionEntries, type DecisionEntry } from 'shared/utils/decision-links';
import { displaySubjectLabels } from 'shared/utils/subjects';

const meetingLinksCache = new WeakMap<CalendarDoc, string[]>();
const decisionEntriesCache = new WeakMap<CalendarDoc, DecisionEntry[]>();

const props = defineProps<{
  doc: CalendarDoc;
  allDocs?: CalendarDoc[];
  isOpen: boolean;
  headingId: string;
  collapseId: string;
  fadeOthers?: boolean;
}>();

const _emit = defineEmits<{
  (e: 'toggle'): void;
}>();

const accordionRef = ref<HTMLElement>();

const handleClickOutside = (event: Event) => {
  if (accordionRef.value && !accordionRef.value.contains(event.target as Node) && props.isOpen) {
    _emit('toggle');
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const { t, te, locale } = useI18n();

const titleField = computed(() => getTitleFieldForLocale(locale.value as LocaleCode));

const title = computed(() => {
  const value = getDocStringValue(props.doc, titleField.value, 'title', 'titleEn');

  if (value) {
    return value;
  }
  return t('calendar.labels.untitled') as string;
});

const dateRange = computed(() => formatDateRange(props.doc));

const typeLabel = computed(() => {
  const raw = getDocStringValue(props.doc, 'type');
  const translationKey = `calendar.types.${normalizeTypeKey(raw)}`;

  if (te(translationKey)) {
    return t(translationKey) as string;
  }
  if (te('calendar.types.default')) {
    return t('calendar.types.default') as string;
  }
  if (!raw && te('calendar.types.activity')) {
    return t('calendar.types.activity') as string;
  }
  return raw ?? '';
});

const typeStyle = computed(() => {
  const palette = getTypeColor(normalizeTypeKey(getDocStringValue(props.doc, 'type')));

  return {
    backgroundColor: palette.background,
    color: palette.text,
  };
});

const isNotification = computed(() => {
  return props.doc.schema === 'notification';
});

const statusNarrative = computed(() => {
  // For notifications, don't use statusNarrative field - use fulltext_s instead
  if (isNotification.value) {
    const fulltext = getDocStringValue(props.doc, 'fulltext_s');
    
    if (!fulltext) {
      return '';
    }
    
    // Extract first 3 sentences
    const sentences = fulltext.match(/[^.!?]+[.!?]+/g) || [];
    const firstThree = sentences.slice(0, 3).join(' ').trim();
    
    return firstThree ? `${firstThree}...` : '';
  }
  
  return getDocStringValue(props.doc, 'statusNarrative');
});

const isActionRequired = computed(() => getDocBooleanValue(props.doc, 'actionRequired') === true);

const schemaValue = computed(() => {
  const direct = props.doc.schema ? String(props.doc.schema) : undefined;
  const fallback = getDocStringValue(props.doc, 'schema');

  return (direct ?? fallback ?? '').toLowerCase();
});

const isMeetingDoc = computed(() => {
  if (schemaValue.value === 'meeting') {
    return true;
  }
  const typeValue = getDocStringValue(props.doc, 'type');

  return Boolean(typeValue && typeValue.toLowerCase() === 'meeting');
});

const meetingLocation = computed(() => {
  if (!isMeetingDoc.value) {
    return '';
  }
  const city = getDocStringValue(props.doc, 'city', 'cityEn');
  const rawCountry = getDocStringValue(props.doc, 'hostCountry', 'hostGovernment', 'country', 'countryCode');
  const providedCountry = getDocStringValue(props.doc, 'hostCountryEn', 'hostGovernmentEn', 'countryEn', 'countryName');
  const hostGovernment = rawCountry
    ? resolveCountryLabel(rawCountry, providedCountry)
    : (providedCountry ?? '');
  const parts = [city, hostGovernment].filter((part): part is string => Boolean(part && part.trim()));

  return parts.join(', ');
});

const notificationSymbol = computed(() => {
  if (!isNotification.value) {
    return '';
  }
  const symbol = getDocStringValue(props.doc, 'symbol');
  
  return symbol ?? '';
});

const meetingSymbol = computed(() => {
  if (!isMeetingDoc.value) {
    return '';
  }
  const code = getDocStringValue(props.doc, 'meetingCode');

  if (code) {
    return code;
  }
  const symbol = getDocStringValue(props.doc, 'symbol');

  return symbol ?? '';
});

const statusLabel = computed(() => {
  const rawStatus = getDocStringValue(props.doc, 'status');
  const statusKey = getDocStringValue(props.doc, 'statusKey');
  const normalizedStatusKey = statusKey?.toUpperCase() ?? normalizeStatusKey(rawStatus);

  if (normalizedStatusKey === 'NOT_SET') {
    return '';
  }

  if (shouldDisplayCompleted(props.doc, statusKey, rawStatus)) {
    return t('calendar.status.completed') as string;
  }

  // Always use normalized status label instead of raw status
  return normalizeStatusLabel(statusKey ?? null, rawStatus ?? undefined);
});

const statusColorValue = computed(() => statusColor(props.doc));

const subsidiaryBodies = computed(() => getDocSubsidiaryBodies(props.doc));

const description = computed(() => getDocStringValue(props.doc, 'description', 'descriptionTxt', 'descriptionText'));

const responsibleUnit = computed(() => responsibleUnitLabel(props.doc));
const responsibleOfficer = computed(() => responsibleOfficerLabel(props.doc));
const showResponsible = computed(() => Boolean(responsibleUnit.value || responsibleOfficer.value));

const decisionEntriesValue = computed(() => {
  const cached = decisionEntriesCache.get(props.doc);

  if (cached) {
    return cached;
  }

  const rawEntries = extractDecisionEntries(props.doc as Record<string, unknown>);
  const normalized = rawEntries
    .map(entry => {
      const normalizedLabel = normalizeDecisionLabel(entry.label) ?? entry.label;
      const finalLabel = normalizedLabel?.trim() ?? '';

      if (!finalLabel) {
        return null;
      }
      return {
        ...entry,
        label: finalLabel,
      } satisfies DecisionEntry;
    })
    .filter((entry): entry is DecisionEntry => entry !== null);

  if (normalized.length === 0) {
    const fallback = normalizeDecisionLabel(getDocStringValue(props.doc, 'copDecision'));

    if (fallback) {
      normalized.push({ label: fallback });
    }
  }

  decisionEntriesCache.set(props.doc, normalized);
  return normalized;
});

const subjectLabels = computed(() => displaySubjectLabels(props.doc));

const notificationEntries = computed(() => notificationDisplayEntries(props.doc));

const notificationKey = computed(() => {
  if (!isNotification.value) {
    return null;
  }

  return props.doc.notificationKey || props.doc.symbol || null;
});

const relatedActivities = computed(() => {
  if (!props.allDocs) {
    return [];
  }

  // For notifications, show activities that reference this notification
  if (isNotification.value && notificationKey.value) {
    return getRelatedActivities(notificationKey.value, props.allDocs);
  }

  // For meetings, show activities referenced in the meeting's activities array
  if (isMeetingDoc.value) {
    return getRelatedActivitiesForMeeting(props.doc, props.allDocs);
  }

  return [];
});

const relatedMeetings = computed(() => {
  if (!isNotification.value || !notificationKey.value || !props.allDocs) {
    return [];
  }

  return getRelatedMeetings(notificationKey.value, props.allDocs);
});

const relatedNotifications = computed(() => {
  if (!isMeetingDoc.value || !props.allDocs) {
    return [];
  }

  return getRelatedNotificationsForMeeting(props.doc, props.allDocs);
});

const primaryLink = computed(() => {
  const links = meetingLinks(props.doc);

  if (links.length === 0) {
    return undefined;
  }
  return links[0];
});

function meetingLinks(doc: CalendarDoc): string[] {
  const cached = meetingLinksCache.get(doc);

  if (cached) {
    return cached;
  }

  const record = doc as Record<string, unknown>;
  const candidateFields = [
    'links',
    'link',
    'meetingLinks',
    'meetingLink',
    'meetingUrl',
    'meetingUrls',
    'url',
    'urls',
    'documents',
  ] as const;

  const collected: string[] = [];

  const collectFromSource = (source: Record<string, unknown>) => {
    candidateFields.forEach(field => {
      const value = source[field];

      if (!value) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(entry => {
          if (typeof entry === 'string') {
            const trimmed = entry.trim();

            if (trimmed) {
              collected.push(trimmed);
            }
          }
        });
      } else if (typeof value === 'string') {
        const trimmed = value.trim();

        if (trimmed) {
          collected.push(trimmed);
        }
      }
    });
  };

  collectFromSource(record);

  const raw = getDocRaw(doc);

  if (raw) {
    collectFromSource(normalizeSolrDocument(raw));
  }

  const normalized = Array.from(new Set(
    collected.map(link => resolveNotificationUrl(link)),
  ))
    .filter(link => /^https?:/i.test(link));

  meetingLinksCache.set(doc, normalized);
  return normalized;
}

const headingId = computed(() => props.headingId);
const collapseId = computed(() => props.collapseId);

</script>

<style scoped>
/* Ensure the accordion header stacks the type banner above the summary */
.accordion-button {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
}

.accordion-button::after {
  display: none;
}

/* Add subtle shadow to accordion items for enhanced visual separation */
.accordion-item {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Fade out other accordion items when one is expanded */
.accordion-item--faded {
  opacity: 0.2;
}

/* Smooth accordion transitions */
.accordion-collapse {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
}

.accordion-collapse:not(.show) {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}

.accordion-collapse.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Top banner that spans full header width with type color */
.calendar-row__type-banner {
  width: 100%;
  display: grid;
  grid-template-columns: 180px 1fr 40px;
  align-items: center;
  position: relative;
  text-transform: uppercase;
  color: #fff;
  border-radius: 0.375rem 0.375rem 0 0;
}

.calendar-row__caret-spacer {
  width: 40px;
  height: var(--bs-accordion-btn-icon-width, 1.25rem);
  position: relative;
}

.calendar-row__caret-spacer::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0.5rem;
  width: var(--bs-accordion-btn-icon-width, 1.25rem);
  height: var(--bs-accordion-btn-icon-width, 1.25rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23ffffff'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-size: var(--bs-accordion-btn-icon-width, 1.25rem);
  transform: translateY(-50%);
  transition: transform var(--bs-accordion-btn-icon-transition);
  pointer-events: none;
}

.accordion-button:not(.collapsed) .calendar-row__caret-spacer::after {
  transform: translateY(-50%) rotate(-180deg);
}

.calendar-row__type-text {
  font-weight: 700;
  margin-left: -5rem;
  letter-spacing: 0.05em;
  text-align: center;
}

.calendar-row__type-date {
  font-weight: normal;
  font-size: 0.9em;
  text-transform: none;
  letter-spacing: normal;
  color: inherit;
  text-align: left;
  padding-right: 1rem;
  white-space: nowrap;
}

.calendar-accordion__summary {
  width: 100%;
  text-align: left;
  padding-right: 0;
}

.calendar-accordion__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.calendar-accordion__meta {
  margin-top: 0.25rem;
}

.calendar-accordion__meta-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.calendar-accordion__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.calendar-accordion__footer--has-link {
  justify-content: space-between;
}

.calendar-accordion__status-badges {
  display: flex;
  gap: 0.5rem;
}

.calendar-accordion__cta {
  font-weight: 600;
}

.calendar-accordion__cta--link {
  color: var(--bs-primary);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}

.calendar-accordion__cta--link:hover {
  border-bottom-color: var(--bs-primary);
}

.calendar-accordion__location {
  color: #6c757d;
  font-size: 0.95rem;
  font-style: italic;
}

.calendar-accordion__symbol {
  color: #333;
  font-size: 1rem;
  font-weight: 600;
}

.calendar-accordion__status-badge {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-notifications__separator {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid #dee2e6;
}

.calendar-notifications__header {
  font-size: 1.125rem;
}

.calendar-activities__separator {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid #dee2e6;
}

.calendar-activities__header {
  font-size: 1.125rem;
}

.calendar-meetings__separator {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid #dee2e6;
}

.calendar-meetings__header {
  font-size: 1.125rem;
}

.calendar-related-notifications__separator {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid #dee2e6;
}

.calendar-related-notifications__header {
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .calendar-accordion__title { font-size: 1.125rem; }
}
</style>
