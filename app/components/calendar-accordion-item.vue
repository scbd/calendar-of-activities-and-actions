<template>
  <div class="accordion-item mb-3">
    <h2 :id="headingId" class="accordion-header">
      <button
        class="accordion-button"
        :class="{ collapsed: !isOpen }"
        type="button"
        :aria-expanded="isOpen ? 'true' : 'false'"
        :aria-controls="collapseId"
        @click="$emit('toggle')"
      >
        <!-- Top banner showing type (Meeting, Workshop, Nominations, etc.) -->
        <div class="calendar-row__type-banner" :style="typeStyle">
          <span class="calendar-row__type-text">{{ typeLabel }}</span>
        </div>

        <div class="calendar-accordion__summary">
          <div class="calendar-accordion__title">{{ title }}</div>
          <div class="calendar-accordion__meta small text-muted">{{ dateRange }}</div>
          <div
            v-if="subjectLabels.length || statusLabel || isActionRequired || primaryLink"
            class="calendar-accordion__meta-block mt-2"
          >
            <div v-if="subjectLabels.length" class="calendar-accordion__subjects">
              <span
                v-for="subject in subjectLabels"
                :key="subject"
                class="calendar-pill"
              >
                {{ subject }}
              </span>
            </div>
            <div
              v-if="primaryLink || statusLabel || isActionRequired"
              class="calendar-accordion__footer"
            >
              <a
                v-if="primaryLink"
                :href="primaryLink"
                target="_blank"
                rel="noopener"
                class="calendar-notification-card__cta calendar-accordion__cta calendar-accordion__cta--documents"
                :aria-label="t('calendar.actions.viewDocumentsAria', { title })"
                data-testid="calendar-accordion-view-documents"
              >
                {{ t('calendar.actions.viewDocuments') }}
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
          :status-label="statusLabel"
          :status-color="statusColorValue"
          :status-narrative="statusNarrative"
          :is-action-required="isActionRequired"
          :description="description"
          :subject-labels="subjectLabels"
          :subsidiary-bodies="subsidiaryBodies"
          :decision-entries="decisionEntriesValue"
          :responsible-unit="responsibleUnit"
          :responsible-officer="responsibleOfficer"
          :show-responsible="showResponsible"
        />

        <div v-if="notificationEntries.length" class="calendar-notifications mt-4">
          <div class="calendar-notifications__header">
            <strong>{{ t('calendar.labels.notifications') }}</strong>
          </div>
          <CalendarNotificationCard
            v-for="entry in notificationEntries"
            :key="entry.key"
            :entry="entry"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '#imports';
import { getTitleFieldForLocale, normalizeSolrDocument } from 'shared/services/solr';
import type { LocaleCode } from 'shared/services/solr';
import type { CalendarDoc } from 'shared/types/calendar';
import CalendarDocumentDetails from './calendar-document-details.vue';
import CalendarNotificationCard from './calendar-notification-card.vue';
import { formatDateRange } from 'shared/utils/date';
import {
  getDocBooleanValue,
  getDocRaw,
  getDocStringValue,
  getDocSubsidiaryBodies,
} from 'shared/utils/document-processing';
import {
  displaySubjectLabels,
  normalizeDecisionLabel,
  responsibleOfficerLabel,
  responsibleUnitLabel,
} from 'shared/utils/labels';
import { normalizeStatusKey, normalizeStatusLabel, shouldDisplayCompleted, statusColor } from 'shared/utils/status';
import { getTypeColor, normalizeTypeKey } from 'shared/utils/type-colors';
import { notificationDisplayEntries, resolveNotificationUrl } from 'shared/utils/notifications';
import { extractDecisionEntries, type DecisionEntry } from 'shared/utils/decision-links';

const meetingLinksCache = new WeakMap<CalendarDoc, string[]>();
const decisionEntriesCache = new WeakMap<CalendarDoc, DecisionEntry[]>();

const props = defineProps<{
  doc: CalendarDoc;
  isOpen: boolean;
  headingId: string;
  collapseId: string;
}>();

const _emit = defineEmits<{
  (e: 'toggle'): void;
}>();

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

const statusNarrative = computed(() => getDocStringValue(props.doc, 'statusNarrative'));

const isActionRequired = computed(() => getDocBooleanValue(props.doc, 'actionRequired') === true);

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

  if (rawStatus) {
    return rawStatus;
  }

  return normalizeStatusLabel(statusKey ?? null, rawStatus ?? undefined);
});

const statusColorValue = computed(() => statusColor(props.doc));

const subjectLabels = computed(() => displaySubjectLabels(props.doc));

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

const notificationEntries = computed(() => notificationDisplayEntries(props.doc));

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

/* Top banner that spans full header width with type color */
.calendar-row__type-banner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.5rem;
  position: relative;
  padding-right: calc(0.5rem + var(--bs-accordion-btn-icon-width, 1.25rem));
  /* Bleed to the button edges using Bootstrap vars with fallbacks */
  margin: calc(-1 * var(--bs-accordion-btn-padding-y, 1rem)) calc(-1 * var(--bs-accordion-btn-padding-x, 1.25rem)) 0.75rem;
  border-top-left-radius: var(--bs-accordion-inner-border-radius, 0.25rem);
  border-top-right-radius: var(--bs-accordion-inner-border-radius, 0.25rem);
  text-transform: uppercase;
  color: #fff;
}

.calendar-row__type-banner::after {
  content: '';
  position: absolute;
  top: 50%;
  right: var(--bs-accordion-btn-padding-x, 1.25rem);
  width: var(--bs-accordion-btn-icon-width, 1.25rem);
  height: var(--bs-accordion-btn-icon-width, 1.25rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23ffffff'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-size: var(--bs-accordion-btn-icon-width, 1.25rem);
  transform: translateY(-50%);
  transition: transform var(--bs-accordion-btn-icon-transition);
  pointer-events: none;
}

.accordion-button:not(.collapsed) .calendar-row__type-banner::after {
  transform: translateY(-50%) rotate(-180deg);
}

.calendar-row__type-text {
  font-weight: 700;
  letter-spacing: 0.05em;
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
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.calendar-accordion__status-badges {
  display: flex;
  gap: 0.5rem;
}

.calendar-accordion__cta {
  font-weight: 600;
}

.calendar-accordion__cta--documents {
  background-color: var(--bs-primary);
  color: #fff;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  text-decoration: none;
}

.calendar-accordion__status-badge {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Subjects chips */
.calendar-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #f1f3f5;
  color: #1f1f1f;
  font-size: 0.875rem;
  margin: 0 0.25rem 0.25rem 0;
}

@media (max-width: 768px) {
  .calendar-accordion__title { font-size: 1.125rem; }
}
</style>
