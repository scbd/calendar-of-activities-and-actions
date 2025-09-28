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
        <div
          class="calendar-row__type-strip d-flex align-items-center justify-content-center"
          :style="typeStyle"
        >
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
import { normalizeStatusLabel, shouldDisplayCompleted, statusColor } from 'shared/utils/status';
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

const { t, te, locale } = useI18n();

const titleField = computed(() => getTitleFieldForLocale(locale.value as any));

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
