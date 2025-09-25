<template>
  <section class="activities-explorer">
    <div class="container py-3">
      <h2>{{ t('calendar.headings.activitiesExplorerAccordion') }}</h2>

      <div class="card mb-3">
        <div class="card-body">
          <CalendarFilters
            :available-types="availableTypes"
            :available-subjects="availableSubjects"
            :available-statuses="availableStatuses"
            :available-subsidiary-bodies="availableSubsidiaryBodies"
            :available-cop-decisions="availableCopDecisions"
            :preloaded-country-options="availableCountryOptions"
            :preloaded-global-target-options="availableGlobalTargetOptions"
            @update:filters="handleFiltersUpdate"
          />
        </div>
      </div>

      <div v-if="loading" class="alert">{{ t('calendar.messages.loadingMeetings') }}</div>
      <div v-else>
        <div v-if="filteredGrouped.length === 0" class="alert alert-warning">{{ t('calendar.messages.noResults') }}</div>

        <div v-for="group in filteredGrouped" :key="group.key" class="mb-4">
          <div class="dg-sep"><h3 class="m-0">{{ group.label }}</h3></div>

          <div :id="`accordion-${group.key}`" class="accordion">
            <div v-for="item in group.items" :key="String(item._id || item.id || '')" class="accordion-item mb-3">
              <h2 :id="`heading-${item._id}`" class="accordion-header">
                <button
                  class="accordion-button"
                  :class="{ collapsed: !openItems[String(item._id || item.id || '')] }"
                  type="button"
                  :aria-expanded="openItems[String(item._id || item.id || '')] ? 'true' : 'false'"
                  :aria-controls="`collapse-${item._id}`"
                  @click="toggleAccordion(String(item._id || item.id || '') )"
                >
                  <div
                    class="calendar-row__type-strip d-flex align-items-center justify-content-center"
                    :style="typeStripStyle(item)"
                  >
                    <span class="calendar-row__type-text">{{ typeLabel(item) }}</span>
                  </div>
                  <div class="calendar-accordion__summary">
                    <div class="calendar-accordion__title">{{ title(item) }}</div>
                    <div class="calendar-accordion__meta small text-muted">{{ formatDateRange(item) }}</div>
                    <div
                      v-if="displaySubjectLabels(item).length || status(item) || isActionRequired(item)"
                      class="calendar-accordion__badges-row mt-2"
                    >
                      <div
                        v-if="displaySubjectLabels(item).length"
                        class="calendar-accordion__subjects"
                      >
                        <span
                          v-for="subject in displaySubjectLabels(item)"
                          :key="subject"
                          class="calendar-pill"
                        >
                          {{ subject }}
                        </span>
                      </div>
                      <div
                        v-if="status(item) || isActionRequired(item)"
                        class="calendar-accordion__status-badges"
                      >
                        <span
                          v-if="isActionRequired(item)"
                          class="badge bg-danger calendar-accordion__status-badge"
                        >
                          {{ t('calendar.labels.actionRequiredByParties') }}
                        </span>
                        <span
                          v-if="status(item)"
                          class="badge calendar-accordion__status-badge"
                          :class="`bg-${statusColor(item)}`"
                        >
                          {{ status(item) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </h2>
              <div
                :id="`collapse-${item._id}`"
                class="accordion-collapse collapse"
                :class="{ show: openItems[String(item._id || item.id || '')] }"
                :aria-labelledby="`heading-${item._id}`"
              >
                <div class="accordion-body">
                  <div class="row">
                    <div class="col-md-6">
                      <p v-if="status(item)">
                        <strong>{{ t('calendar.labels.status') }}: </strong>
                          <span v-if="status(item)" class="badge calendar-accordion__status-badge" :class="`bg-${statusColor(item)}`">
                            {{ status(item) }}
                          </span> <br>
                        <span v-if="item.statusNarrative_t">{{ item.statusNarrative_t }}</span>
                      </p>

                      <p v-if="isActionRequired(item)">
                        <strong>{{ t('calendar.labels.actionRequiredByParties') }}:</strong>
                        {{ t('calendar.common.yes') }}
                      </p>

                      <p v-if="item.description_t"><strong>{{ t('calendar.labels.description') }}:</strong> {{ item.description_t }}</p>
                    </div>
                    <div class="col-md-6">
                        <div v-if="displaySubjectLabels(item).length" class="mb-3 calendar-subjects">
                          <span class="calendar-pill-label">{{ t('calendar.labels.subjects') }}</span>
                          <div class="calendar-pill-row">
                            <span
                              v-for="subject in displaySubjectLabels(item)"
                              :key="subject"
                              class="calendar-pill"
                            >
                              {{ subject }}
                            </span>
                          </div>
                        </div>
                        <p v-if="item.subsidiaryBodies_ss && item.subsidiaryBodies_ss.length"><strong>{{ t('calendar.labels.associatedBody') }}:</strong> {{ item.subsidiaryBodies_ss.join(', ') }}</p>
                        <p v-if="decisionEntries(item).length">
                          <strong>{{ t('calendar.labels.decision') }}:</strong>
                          <span class="ms-1">
                            <template
                              v-for="(entry, index) in decisionEntries(item)"
                              :key="`${entry.href ?? entry.label}-${index}`"
                            >
                              <DecisionLink :href="entry.href" :label="entry.label" />
                              <span v-if="index < decisionEntries(item).length - 1">, </span>
                            </template>
                          </span>
                        </p>
                      <div v-if="item.responsibleUnit_s || item.responsibleOfficer_s" class="card">
                            <div class="card-header">
                              <strong>{{ t('calendar.labels.responsible') }}</strong>
                            </div>
                            <ul class="list-group list-group-flush">
                              <li class="list-group-item "><span class="fw-bold">{{ t('calendar.labels.unit') }}: </span>{{ item.responsibleUnit_s }}</li>
                              <li class="list-group-item "><span class="fw-bold">{{ t('calendar.labels.officer') }}: </span>{{ item.responsibleOfficer_s }}</li>
                          </ul>

                      </div>
                    </div>
                  </div>
                      <div v-if="notificationDisplayEntries(item).length" class="calendar-notifications mt-4">
                        <div class="calendar-notifications__header">
                          <strong>{{ t('calendar.labels.notifications') }}</strong>
                        </div>
                        <div
                          v-for="entry in notificationDisplayEntries(item)"
                      :key="entry.key"
                      class="calendar-notification-card"
                    >
                      <div class="calendar-notification-card__pill-row">
                        <a
                          :href="buildNotificationLink(entry.key)"
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
                          {{ t('calendar.notifications.deadline', { date: formatNotificationDate(entry.details.actionDeadline) || '' }) }}
                          </span>
                        </span>
                      </div>
                      <div
                        v-if="entry.details?.publishedOn || entry.details?.from"
                        class="calendar-notification-card__meta"
                      >
                        <div v-if="entry.details?.publishedOn" class="calendar-notification-card__meta-line">
                          {{ t('calendar.notifications.publishedOnDate', { date: formatNotificationDate(entry.details.publishedOn) || '' }) }}
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch, watchEffect } from 'vue';
import { DateTime } from 'luxon';
import { collectAllFieldNames, getTitleFieldForLocale, type MeetingDoc, type LocaleCode } from 'shared/services/solr';
import { useCalendarMarkdown } from '../../composables/useCalendarMarkdown';
import { meetings as meetingSnapshot } from 'shared/data/meetings.js';
import { loadSubjectOptions, buildSubjectLabelMap, resolveSubjectLabel, type SubjectOption } from 'shared/utils/subjects';
import { extractDecisionEntries, type DecisionEntry } from 'shared/utils/decision-links';
import { getTypeColor, normalizeTypeKey } from 'shared/utils/type-colors';
import CalendarFilters from './calendar-filters.vue';
import DecisionLink from './decision-link.vue';

type AnyDoc = MeetingDoc & { [key: string]: unknown };

type NotificationKey = string;

interface NotificationAttachment {
  name?: string;
  url: string;
  type?: string;
  language?: string;
}

interface NotificationSolrDoc {
  symbol?: string;
  title?: string;
  title_EN?: string;
  fulltext?: string;
  from?: string;
  date?: string;
  url?: string[];
  files?: string[];
  recipients?: string[];
  thematicAreas?: string[];
  actionDate?: string;
}

interface NotificationSolrResponse {
  response?: {
    docs?: NotificationSolrDoc[];
  };
}

interface NotificationArticleRecord {
  content?: Record<string, string | undefined>;
  summary?: Record<string, string | undefined>;
  title?: Record<string, string | undefined>;
}

interface NotificationDetails {
  key: NotificationKey;
  title: string;
  excerpt?: string;
  fullText?: string;
  from?: string;
  publishedOn?: string;
  actionDeadline?: string | null;
  actionRequired: boolean;
  recipients: string[];
  thematicAreas: string[];
  attachments: NotificationAttachment[];
  link: string;
  article?: NotificationArticleRecord | null;
}

interface NotificationDisplayEntry {
  key: NotificationKey;
  details?: NotificationDetails;
  loading: boolean;
  error?: string;
}

const NOTIFICATION_BASE_URL = 'https://www.cbd.int';

const loading = ref<boolean>(false);
const docs = ref<AnyDoc[]>([]);
const allFieldNames = ref<string[]>([]);
const locale = ref<LocaleCode>('en');
const { t, te } = useI18n();

const notificationDetailsMap = ref<Record<NotificationKey, NotificationDetails>>({});
const notificationErrors = ref<Record<NotificationKey, string>>({});
const notificationLoadingMap = ref<Record<NotificationKey, boolean>>({});

const notificationKeyCache = new WeakMap<AnyDoc, NotificationKey[]>();

interface FilterOption {
  value: string;
  label: string;
}

const subjectOptionsCache = ref<SubjectOption[]>([]);
const subjectLabelMap = computed(() => buildSubjectLabelMap(subjectOptionsCache.value));

const decisionEntriesCache = new WeakMap<AnyDoc, DecisionEntry[]>();

const openItems = ref<Record<string, boolean>>({});

const toggleAccordion = (itemId: string) => {
  // This will close other items in the same group if you want a traditional accordion behavior
  // For now, it allows multiple items to be open.
  openItems.value[itemId] = !openItems.value[itemId];
};

interface FilterState {
  types: string[];
  subjects: string[];
  statuses: string[];
  subsidiaryBodies: string[];
  copDecisions: string[];
  activityTypes: string[];
  globalTargets: string[];
  countries: string[];
  startDate: string;
  endDate: string;
  actionRequired: boolean;
}

const currentFilters = ref<FilterState>({
  types: [],
  subjects: [],
  statuses: [],
  subsidiaryBodies: [],
  copDecisions: [],
  activityTypes: [],
  globalTargets: [],
  countries: [],
  startDate: '',
  endDate: '',
  actionRequired: false,
});

watchEffect(() => {
  if (docs.value.length === 0) {
    allFieldNames.value = [];
    return;
  }
  allFieldNames.value = collectAllFieldNames(docs.value as Array<Record<string, unknown>>);
});

const notificationKeys = computed<NotificationKey[]>(() => {
  const keys = new Set<NotificationKey>();

  docs.value.forEach(doc => {
    getNotificationKeys(doc).forEach(key => keys.add(key));
  });

  return Array.from(keys).sort();
});

watch(notificationKeys, async (keys) => {
  if (!keys.length) {
    return;
  }

  const missing = keys.filter(key => {
    return !notificationDetailsMap.value[key]
      && !notificationLoadingMap.value[key]
      && !notificationErrors.value[key];
  });

  if (missing.length === 0) {
    return;
  }

  const nextLoading = { ...notificationLoadingMap.value };

  missing.forEach(key => {
    nextLoading[key] = true;
  });

  notificationLoadingMap.value = nextLoading;

  await Promise.all(missing.map(async key => {
    try {
      const details = await fetchNotificationDetails(key);

      if (details) {
        notificationDetailsMap.value = {
          ...notificationDetailsMap.value,
          [key]: details,
        };

        if (notificationErrors.value[key]) {
          const { [key]: _removed, ...restErrors } = notificationErrors.value;

          notificationErrors.value = restErrors;
        }
      } else {
        notificationErrors.value = {
          ...notificationErrors.value,
          [key]: t('calendar.notifications.notFound') as string,
        };
      }
    } catch (error) {
      console.error(`Failed to fetch notification ${key}`, error);
      notificationErrors.value = {
        ...notificationErrors.value,
        [key]: (error instanceof Error && error.message)
          ? error.message
          : t('calendar.notifications.loadFailed') as string,
      };
    } finally {
      const { [key]: _removed, ...restLoading } = notificationLoadingMap.value;

      notificationLoadingMap.value = restLoading;
    }
  }));
}, { immediate: true });

async function ensureSubjectLabels(): Promise<void> {
  if (subjectOptionsCache.value.length > 0) {
    return;
  }

  try {
    subjectOptionsCache.value = await loadSubjectOptions();
  } catch (error) {
    console.error('Failed to load subject options', error);
    subjectOptionsCache.value = [];
  }
}

onMounted(() => {
  void loadSnapshotData();
  void ensureSubjectLabels();
});

interface GroupedItem {
  key: string;
  label: string;
  items: AnyDoc[];
}

type SnapshotMeeting = (typeof meetingSnapshot)[number];

const RegionDisplayNames = (Intl as typeof Intl & { DisplayNames?: typeof Intl.DisplayNames }).DisplayNames;
const regionDisplayNames = typeof RegionDisplayNames === 'function'
  ? new RegionDisplayNames(['en'], { type: 'region' })
  : null;

async function loadSnapshotData(): Promise<void> {
  loading.value = true;
  try {
    const markdownRaw = await useCalendarMarkdown();
    const normalizedMeetings = meetingSnapshot.map((meeting, index) => normalizeMeetingDoc(meeting as SnapshotMeeting, index));
    const markdownDocs = buildDocsFromMarkdown(markdownRaw);

    docs.value = [...normalizedMeetings, ...markdownDocs];
  } catch (error) {
    console.error('Failed to load snapshot data', error);
    docs.value = [];
  } finally {
    loading.value = false;
  }
}

function normalizeMeetingDoc(meeting: SnapshotMeeting, index: number): AnyDoc {
  const record = { ...(meeting as Record<string, unknown>) };
  const subjectsRaw = record['subjects_ss'];
  const subjects = Array.isArray(subjectsRaw)
    ? (subjectsRaw as unknown[]).map(String)
    : splitValues(record['subject_EN_s']);
  const bodiesRaw = record['subsidiaryBodies_ss'];
  const bodies = Array.isArray(bodiesRaw)
    ? (bodiesRaw as unknown[]).map(String)
    : splitValues(record['subsidiaryBody_s']);

  const id = String(record['_id'] ?? record['id'] ?? record['identifier_s'] ?? `meeting-${index}`);

  const rawStatus = (record['status_s'] ?? record['status']) as string | undefined;
  const statusKey = normalizeStatusKey(rawStatus);
  const statusLabel = normalizeStatusLabel(statusKey, rawStatus);

  const normalized: AnyDoc = {
    ...record,
    _id: id,
    id,
    subjects_ss: subjects,
    subject_EN_s: record['subject_EN_s'] ?? (subjects.length > 0 ? subjects.join(', ') : null),
    subsidiaryBody_s: record['subsidiaryBody_s'] ?? (bodies.length > 0 ? bodies[0] : null),
    subsidiaryBodies_ss: bodies,
  type_s: String(record['type_s'] ?? record['type'] ?? 'Meeting'),
    links_ss: Array.isArray(record['links_ss']) ? record['links_ss'] as string[] : [],
    statusKey_s: statusKey ?? null,
    status_s: statusLabel,
  };

  return normalized;
}

function buildDocsFromMarkdown(raw: string): AnyDoc[] {
  const rows = parseMarkdownTable(raw);

  return rows.map((row, index) => mapMarkdownRowToDoc(row, index));
}

type MarkdownRow = Record<string, string>;

function parseMarkdownTable(raw: string): MarkdownRow[] {
  const lines = raw.split('\n').filter(line => line.trim().startsWith('|'));

  if (lines.length < 3) {
    return [];
  }

  const headerLine = lines[0];

  if (!headerLine) return [];
  const headerCells = headerLine.split('|').map(cell => cell.trim());
  const header = headerCells.slice(1, headerCells.length - 1);
  const dataLines = lines.slice(2);
  const rows: MarkdownRow[] = [];

  for (const line of dataLines) {
    const cells = line.split('|').map(cell => cell.trim());

    if (cells.length < header.length + 2) continue;
    const row: MarkdownRow = {};

    for (let i = 0; i < header.length; i += 1) {
      const key = header[i]!;

      row[key] = cells[i + 1] ?? '';
    }
    if (!row.Title) continue;
    rows.push(row);
  }

  return rows;
}

function mapMarkdownRowToDoc(row: MarkdownRow, index: number): AnyDoc {
  const subjects = splitValues(row['Subject']);
  const bodies = splitValues(row['Associatedbody']);
  const relatedDocs = splitValues(row['Related_documents']);
  const actors = splitValues(row['Actors']);
  const targets = splitValues(row['GBF_Targets']);
  const countries = splitValues(row['Country'] || row['Countries']);

  const startDate = parseFlexibleDate(row['Startdate']);
  const endDate = parseFlexibleDate(row['Enddate']);

  const slug = slugify(row['Title'] || `calendar-item-${index}`);
  const id = `markdown-${slug}-${index}`;

  const rawStatus = row['Status'] || '';
  const statusKey = normalizeStatusKey(rawStatus);
  const statusLabel = normalizeStatusLabel(statusKey, rawStatus);

  const doc: AnyDoc = {
    _id: id,
    id,
    identifier_s: id,
    source: 'markdown:2024-12-01',
    title_EN_t: row['Title'],
    description_t: row['Description'] || null,
  type_s: String(row['Type'] || 'Activity'),
    actionRequired_b: row['Action Required by Parties']?.toUpperCase() === 'Y',
    subjects_ss: subjects,
  subject_EN_s: subjects.join(', '),
  status_s: statusLabel,
  statusKey_s: statusKey ?? null,
    statusNarrative_t: row['Status_narrative'] || null,
  startDate_dt: startDate ?? undefined,
  endDate_dt: endDate ?? undefined,
  subsidiaryBody_s: bodies[0] ?? undefined,
    subsidiaryBodies_ss: bodies,
  copDecision_s: row['COPDecision'] || undefined,
  copParagraph_s: row['COPParagraph_no'] || undefined,
  responsibleUnit_s: row['Responsible_Unit'] || undefined,
  responsibleOfficer_s: row['Responsible_Officer'] || undefined,
  fundingSource_s: row['Funding_source'] || undefined,
  fundingAllocated_s: row['Funding_allocated'] || undefined,
    actors_ss: actors,
  actorsComments_t: row['Actors_comments'] || undefined,
    gbfTargets_ss: targets,
    relatedDocuments_ss: relatedDocs,
    links_ss: [],
  country_s: countries[0] ?? undefined,
    countries_ss: countries,
  country_EN_s: countries[0] ?? undefined,
    countries_EN_ss: countries,
    outcome_s: row['Outcome'] || undefined,
  };

  return doc;
}

// Status normalization helpers
function normalizeStatusKey(label: string | undefined): string | null {
  if (!label) return null;
  const v = String(label).trim().toLowerCase();

  if (!v) return null;
  if (v === 'confirmed') return 'CONFIRM';
  return v.replace(/\s+/g, '_').toUpperCase();
}

function normalizeStatusLabel(key: string | null | undefined, fallback?: string): string {
  if (key) {
    const normalized = String(key).toLowerCase();
    const translationKey = `calendar.status.${normalized}`;

    if (te(translationKey)) {
      return t(translationKey) as string;
    }

    if (normalized === 'confirm') {
      return t('calendar.status.confirmed') as string;
    }
  }
  if (typeof fallback === 'string' && fallback.trim().length > 0) return fallback.trim();
  return key ? key : '';
}

function parseFlexibleDate(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();

  if (!trimmed) return null;

  const normalized = trimmed.replace(/\s+/g, ' ');
  const patterns = ['d-MMM-yy', 'd-MMM-yyyy', 'dd-MMM-yy', 'dd-MMM-yyyy'];

  for (const pattern of patterns) {
    const dt = DateTime.fromFormat(normalized, pattern, { zone: 'utc', locale: 'en' });

    if (dt.isValid) return dt.toUTC().toISO();
  }

  const monthPatterns = ['MMM-yy', 'MMM-yyyy', 'LLL yyyy', 'LLLL yyyy'];

  for (const pattern of monthPatterns) {
    const dt = DateTime.fromFormat(normalized, pattern, { zone: 'utc', locale: 'en' });

    if (dt.isValid) return dt.startOf('month').toUTC().toISO();
  }

  const quarterMatch = normalized.match(/^Q([1-4])\s*(\d{2,4})$/i);

  if (quarterMatch) {
    const quarter = Number.parseInt(quarterMatch[1] ?? '1', 10);

    let year = Number.parseInt(quarterMatch[2] ?? '0', 10);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    const month = (quarter - 1) * 3 + 1;
    const dt = DateTime.utc(year, month, 1);

    if (dt.isValid) return dt.toISO();
  }

  const yearMatch = normalized.match(/^(\d{4})$/);

  if (yearMatch) {
    const year = Number.parseInt(yearMatch[1]!, 10);
    const dt = DateTime.utc(year, 1, 1);

    if (dt.isValid) return dt.toISO();
  }

  return null;
}

function splitValues(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map(v => v.trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    || 'item';
}

function humanizeIdentifier(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  const hasMixedCase = /[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed);

  if (hasMixedCase) {
    return trimmed;
  }

  return trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : '')
    .join(' ');
}

function getDocSubjects(doc: AnyDoc): string[] {
  if (Array.isArray((doc as Record<string, unknown>).subjects_ss)) {
    return ((doc as Record<string, unknown>).subjects_ss as unknown[]).map(String).filter(Boolean);
  }
  if (Array.isArray((doc as Record<string, unknown>).subjectIdentifiers_ss)) {
    return ((doc as Record<string, unknown>).subjectIdentifiers_ss as unknown[]).map(String).filter(Boolean);
  }
  const subjectField = (doc as Record<string, unknown>).subject_EN_s ?? (doc as Record<string, unknown>).subject_s ?? (doc as Record<string, unknown>).subject;

  if (typeof subjectField === 'string') return splitValues(subjectField);
  return [];
}

function getDocSubsidiaryBodies(doc: AnyDoc): string[] {
  if (Array.isArray((doc as Record<string, unknown>).subsidiaryBodies_ss)) {
    return ((doc as Record<string, unknown>).subsidiaryBodies_ss as unknown[]).map(String).filter(Boolean);
  }
  const bodyField = (doc as Record<string, unknown>).subsidiaryBody_s ?? (doc as Record<string, unknown>).subsidiaryBody;

  if (typeof bodyField === 'string') return splitValues(bodyField);
  return [];
}

function getDocDecisionLabels(doc: AnyDoc): string[] {
  return extractDecisionEntries(doc as Record<string, unknown>)
    .map(entry => entry.label)
    .filter(label => Boolean(label && label.trim()));
}

interface ValueLabelPair {
  value: string;
  label?: string | null;
}

function collectValueLabelPairs(value: unknown, label?: unknown): ValueLabelPair[] {
  const values = splitValues(value);
  const labels = splitValues(label);

  if (values.length === 0 && labels.length > 0) {
    const fallback = labels[0];

    return fallback ? [{ value: fallback, label: fallback }] : [];
  }

  return values.map((val, index) => ({
    value: val,
    label: labels[index] ?? labels[0] ?? null,
  }));
}

function collectGlobalTargetEntries(doc: AnyDoc): ValueLabelPair[] {
  const record = doc as Record<string, unknown>;

  return [
    ...collectValueLabelPairs(record['gbfTargets_ss'], record['gbfTargets_EN_ss']),
    ...collectValueLabelPairs(record['globalTargets_ss'], record['globalTargets_EN_ss']),
    ...collectValueLabelPairs(record['gbfTarget_ss'], record['gbfTarget_EN_ss']),
    ...collectValueLabelPairs(record['gbfTargets_s'], record['gbfTargets_EN_s']),
    ...collectValueLabelPairs(record['gbfTarget_s'], record['gbfTarget_EN_s']),
    ...collectValueLabelPairs(record['gbfTargets'], record['gbfTargets_EN']),
    ...collectValueLabelPairs(record['GBF_Targets'], record['GBF_Targets']),
  ];
}

function collectCountryEntries(doc: AnyDoc): ValueLabelPair[] {
  const record = doc as Record<string, unknown>;

  return [
    ...collectValueLabelPairs(record['country_s'], record['country_EN_s']),
    ...collectValueLabelPairs(record['countryCode_s'], record['countryName_s']),
    ...collectValueLabelPairs(record['country_ss'], record['country_EN_ss']),
    ...collectValueLabelPairs(record['countries_ss'], record['countries_EN_ss']),
    ...collectValueLabelPairs(record['countryCodes_ss'], record['countryNames_ss']),
    ...collectValueLabelPairs(record['country_ISO2_ss'], record['countryNames_ss']),
    ...collectValueLabelPairs(record['countries_s'], record['countries_EN_ss']),
    ...collectValueLabelPairs(record['hostCountry_s'], record['hostCountry_EN_s']),
    ...collectValueLabelPairs(record['hostCountries_ss'], record['hostCountries_EN_ss']),
    ...collectValueLabelPairs(record['country_EN_s'], record['country_EN_s']),
    ...collectValueLabelPairs(record['countries_EN_ss'], record['countries_EN_ss']),
  ];
}

function getDocGlobalTargets(doc: AnyDoc): string[] {
  const values = new Set<string>();

  collectGlobalTargetEntries(doc).forEach(entry => {
    if (entry.value) {
      values.add(entry.value);
    }
  });
  return Array.from(values);
}

function getDocCountries(doc: AnyDoc): string[] {
  const values = new Set<string>();

  collectCountryEntries(doc).forEach(entry => {
    if (entry.value) {
      values.add(entry.value);
    }
  });
  return Array.from(values);
}

function resolveCountryLabel(value: string, provided?: string | null): string {
  if (provided && provided.trim()) {
    return provided.trim();
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (regionDisplayNames) {
    try {
      const display = regionDisplayNames.of(trimmed.toUpperCase());

      if (display && display.toLowerCase() !== trimmed.toLowerCase()) {
        return display;
      }
    } catch {
      // Ignore lookup failures and fall back to a humanized identifier
    }
  }

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return humanizeIdentifier(trimmed);
}

function displaySubjectLabels(doc: AnyDoc): string[] {
  return getDocSubjects(doc)
    .map(subject => resolveSubjectLabel(subject, subjectLabelMap.value))
    .filter(label => Boolean(label && label.trim()));
}

function getCopLabel(): string {
  if (te('calendar.labels.cop')) {
    const localized = t('calendar.labels.cop');

    if (typeof localized === 'string' && localized.trim().length > 0) {
      return localized.trim();
    }
  }
  return 'COP';
}

function normalizeDecisionLabel(label: string | null | undefined): string | null {
  if (label === null || label === undefined) {
    return null;
  }

  const trimmed = label.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toUpperCase();
  const hasReservedToken = ['COP', 'NP', 'CP'].some(token => normalized.includes(token));

  if (hasReservedToken) {
    return trimmed;
  }

  const prefix = getCopLabel();
  const safePrefix = prefix.trim() || 'COP';

  return `${safePrefix} ${trimmed}`;
}

function decisionEntries(doc: AnyDoc): DecisionEntry[] {
  const cached = decisionEntriesCache.get(doc);

  if (cached) {
    return cached;
  }

  const rawEntries = extractDecisionEntries(doc as Record<string, unknown>);
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
    const fallback = normalizeDecisionLabel((doc as Record<string, unknown>)['copDecision_s'] as string | undefined);

    if (fallback) {
      normalized.push({ label: fallback });
    }
  }

  decisionEntriesCache.set(doc, normalized);
  return normalized;
}

function getNotificationKeys(doc: AnyDoc): NotificationKey[] {
  const cached = notificationKeyCache.get(doc);

  if (cached) {
    return cached;
  }

  const record = doc as Record<string, unknown>;
  const candidateProperties: Array<keyof typeof record> = [
    'relatedNotifications_ss',
    'relatedNotification_ss',
    'relatedNotifications_s',
    'relatedDocuments_ss',
    'relatedDocuments',
    'notification_ss',
    'notifications_ss',
    'notification_s',
    'notifications_s',
    'notificationKey_s',
    'notificationKey_ss',
    'notificationKeys_ss',
    'links_ss',
    'links',
  ];

  const candidates: string[] = [];

  candidateProperties.forEach(property => {
    const value = record[property];

    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(entry => {
        if (entry !== null && entry !== undefined) {
          candidates.push(String(entry));
        }
      });
    } else if (typeof value === 'string') {
      candidates.push(value);
    }
  });

  const keys: NotificationKey[] = [];
  const seen = new Set<NotificationKey>();
  const pattern = /\b(\d{4}-\d{2,4}[A-Z]?)\b/g;

  candidates.forEach(candidate => {
    const normalized = candidate.replace(/[\r\n]+/g, ' ');

    let match: RegExpExecArray | null;

    while ((match = pattern.exec(normalized)) !== null) {
      const key = match[1]?.trim();

      if (key && !seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  });

  notificationKeyCache.set(doc, keys);
  return keys;
}

function notificationDisplayEntries(doc: AnyDoc): NotificationDisplayEntry[] {
  const keys = getNotificationKeys(doc);

  if (keys.length === 0) {
    return [];
  }

  return keys.map(key => ({
    key,
    details: notificationDetailsMap.value[key],
    loading: Boolean(notificationLoadingMap.value[key]),
    error: notificationErrors.value[key],
  }));
}

async function fetchNotificationDetails(key: NotificationKey): Promise<NotificationDetails | null> {
  const trimmedKey = key.trim();

  if (!trimmedKey) {
    return null;
  }

  const solrParams = new URLSearchParams({
    fl: 'symbol:symbol_s,title:title_t,title_EN:title_EN_t,fulltext:fulltext_t,from:from_t,date:date_dt,url:url_ss,files:files_ss,actionDate:actionDate_dt,recipients:recipient_ss,thematicAreas:thematicAreas_EN_txt',
    q: `schema_s:notification AND symbol_s:"${trimmedKey}"`,
    rows: '1',
    wt: 'json',
  });

  const solrUrl = `https://api.cbd.int/api/v2013/index?${solrParams.toString()}`;
  const solrResponse = await fetch(solrUrl);

  if (!solrResponse.ok) {
    throw new Error(`Notification lookup failed (${solrResponse.status})`);
  }

  const solrJson = await solrResponse.json() as NotificationSolrResponse;
  const doc = solrJson.response?.docs?.[0];

  if (!doc) {
    return null;
  }

  const article = await fetchNotificationArticle(trimmedKey);

  const attachments = parseNotificationAttachments(doc.files);
  const recipients = normalizeList(doc.recipients);
  const thematicAreas = normalizeList(doc.thematicAreas);
  const title = selectNotificationTitle(trimmedKey, doc, article);
  const excerpt = buildNotificationExcerpt(article?.summary?.en ?? doc.fulltext ?? null);
  const fullText = doc.fulltext ? normalizeWhitespace(doc.fulltext) : undefined;

  return {
    key: trimmedKey,
    title,
    excerpt,
    fullText,
    from: doc.from?.trim() || undefined,
    publishedOn: doc.date ?? undefined,
    actionDeadline: doc.actionDate ?? null,
    actionRequired: Boolean(doc.actionDate),
    recipients,
    thematicAreas,
    attachments,
    link: buildNotificationLink(trimmedKey),
    article,
  } satisfies NotificationDetails;
}

async function fetchNotificationArticle(key: NotificationKey): Promise<NotificationArticleRecord | null> {
  const params = new URLSearchParams();

  params.set('q', JSON.stringify({ adminTags: { $all: ['notification', key] } }));
  params.set('s', JSON.stringify({ 'meta.updatedOn': -1 }));
  params.set('fo', '1');

  const url = `https://api.cbd.int/api/v2017/articles?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Notification article request failed (${response.status})`);
  }

  const payload = await response.text();

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload) as NotificationArticleRecord;
  } catch (error) {
    console.error('Failed to parse notification article payload', error);
    return null;
  }
}

function selectNotificationTitle(key: NotificationKey, doc: NotificationSolrDoc, article: NotificationArticleRecord | null): string {
  const candidates = [
    article?.title?.en,
    doc.title_EN,
    doc.title,
    doc.symbol,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return t('calendar.notifications.notificationLabel', { id: key }) as string;
}

function buildNotificationExcerpt(source: string | null | undefined): string | undefined {
  if (!source) {
    return undefined;
  }

  const plain = source.includes('<') && source.includes('>')
    ? htmlToText(source)
    : normalizeWhitespace(source);

  if (!plain) {
    return undefined;
  }

  if (plain.length <= 280) {
    return plain;
  }

  return `${plain.slice(0, 277).trimEnd()}...`;
}

function parseNotificationAttachments(files?: string[]): NotificationAttachment[] {
  if (!files || files.length === 0) {
    return [];
  }

  const attachments: NotificationAttachment[] = [];

  files.forEach(entry => {
    if (!entry) {
      return;
    }

    try {
      const parsed = JSON.parse(entry);
      const collection = Array.isArray(parsed) ? parsed : [parsed];

      collection.forEach(item => {
        if (!item || typeof item !== 'object') {
          return;
        }

        const candidate = item as Record<string, unknown>;
        const url = typeof candidate.url === 'string' ? candidate.url : typeof candidate.link === 'string' ? candidate.link : '';

        if (!url) {
          return;
        }

        attachments.push({
          url: resolveNotificationUrl(url),
          name: typeof candidate.name === 'string' ? candidate.name : undefined,
          type: typeof candidate.type === 'string' ? candidate.type : undefined,
          language: typeof candidate.language === 'string' ? candidate.language : undefined,
        });
      });
    } catch {
      attachments.push({
        url: resolveNotificationUrl(entry),
        name: deriveNameFromUrl(entry),
      });
    }
  });

  const seen = new Set<string>();

  return attachments.filter(attachment => {
    if (!attachment.url || seen.has(attachment.url)) {
      return false;
    }

    seen.add(attachment.url);
    if (!attachment.name || attachment.name.trim().length === 0) {
      attachment.name = deriveNameFromUrl(attachment.url);
    }
    return true;
  });
}

function normalizeList(value: unknown): string[] {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return values
    .map(entry => String(entry).trim())
    .filter(entry => entry.length > 0);
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveNotificationUrl(path: string): string {
  try {
    return new URL(path, NOTIFICATION_BASE_URL).toString();
  } catch {
    return path;
  }
}

function deriveNameFromUrl(url: string): string {
  if (!url) {
    return '';
  }

  const normalized = url.split('?')[0] ?? url;
  const segments = normalized.split('/').filter(Boolean);

  return segments.length > 0 ? segments[segments.length - 1] ?? url : url;
}

function buildNotificationLink(key: NotificationKey): string {
  return resolveNotificationUrl(`/notifications/${key}`);
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<\s*br\s*\/?>/gi, ' ')
      .replace(/<\s*\/p\s*>/gi, ' ')
      .replace(/<\s*\/li\s*>/gi, '; ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/&lsquo;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&mdash;/gi, '--')
    .replace(/&ndash;/gi, '-');
}

function formatNotificationDate(iso?: string | null): string | null {
  if (!iso) {
    return null;
  }

  const dt = DateTime.fromISO(String(iso));

  if (!dt.isValid) {
    return null;
  }

  return dt.toUTC().toFormat('d MMM yyyy');
}

const filteredDocs = computed(() => {
  let filtered = docs.value;
  const filters = currentFilters.value;

  if (filters.types.length > 0) {
    filtered = filtered.filter(doc => {
      const type = doc['type_s'] || doc['type'];

      return type && filters.types.includes(String(type));
    });
  }

  if (filters.activityTypes.length > 0) {
    filtered = filtered.filter(doc => {
      const type = doc['type_s'] || doc['type'];

      return type && filters.activityTypes.includes(String(type));
    });
  }

  if (filters.subjects.length > 0) {
    filtered = filtered.filter(doc => {
      const subjects = getDocSubjects(doc);

      return subjects.some(subject => filters.subjects.includes(subject));
    });
  }

  if (filters.globalTargets.length > 0) {
    filtered = filtered.filter(doc => {
      const targets = getDocGlobalTargets(doc);

      return targets.some(target => filters.globalTargets.includes(target));
    });
  }

  if (filters.countries.length > 0) {
    filtered = filtered.filter(doc => {
      const countries = getDocCountries(doc);

      return countries.some(country => filters.countries.includes(country));
    });
  }

  if (filters.statuses.length > 0) {
    filtered = filtered.filter(doc => {
      const key = (doc['statusKey_s'] as string | undefined) ?? normalizeStatusKey((doc['status_s'] as string | undefined) ?? (doc['status'] as string | undefined));

      return !!key && filters.statuses.includes(key);
    });
  }

  if (filters.subsidiaryBodies.length > 0) {
    filtered = filtered.filter(doc => {
      const bodies = getDocSubsidiaryBodies(doc);

      return bodies.some(body => filters.subsidiaryBodies.includes(body));
    });
  }

  if (filters.copDecisions.length > 0) {
    filtered = filtered.filter(doc => {
      const decisions = getDocDecisionLabels(doc);

      return decisions.some(decision => filters.copDecisions.includes(decision));
    });
  }

  if (filters.startDate || filters.endDate) {
    filtered = filtered.filter(doc => {
      const startDate = safeDate(doc['startDate_dt']);
      const endDate = safeDate(doc['endDate_dt']);
      const docDate = startDate || endDate;

      if (!docDate) return false;

      if (filters.startDate) {
        const startFilter = DateTime.fromISO(filters.startDate);

        if (docDate < startFilter) return false;
      }

      if (filters.endDate) {
        const endFilter = DateTime.fromISO(filters.endDate);

        if (docDate > endFilter) return false;
      }

      return true;
    });
  }

  if (filters.actionRequired) {
    filtered = filtered.filter(doc => {
      return doc['actionRequired_b'] === true || doc['actionRequired'] === true;
    });
  }

  return filtered;
});

const filteredGrouped = computed<GroupedItem[]>(() => {
  const buckets = new Map<string, { label: string; items: AnyDoc[] }>();

  for (const d of filteredDocs.value) {
    const { startDate_dt, endDate_dt } = d as MeetingDoc;
    const iso = startDate_dt || endDate_dt;
    const dt = iso ? DateTime.fromISO(String(iso)) : null;
    const key = dt ? dt.toFormat('yyyy-LL') : 'unknown';
    const label = dt ? dt.toFormat('LLLL yyyy') : t('calendar.labels.unknownDate') as string;

    if (!buckets.has(key)) buckets.set(key, { label, items: [] as AnyDoc[] });
    buckets.get(key)!.items.push(d as AnyDoc);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ key, label: v.label, items: v.items }));
});

const availableTypes = computed(() => {
  const types = new Set<string>();

  docs.value.forEach(doc => {
    const type = doc['type_s'] || doc['type'];

    if (type) types.add(String(type));
  });
  return Array.from(types).sort();
});

const availableSubjects = computed(() => {
  const subjects = new Set<string>();

  docs.value.forEach(doc => {
    getDocSubjects(doc).forEach(subject => subjects.add(subject));
  });
  return Array.from(subjects).sort();
});

const availableStatuses = computed(() => {
  const statuses = new Set<string>();

  docs.value.forEach(doc => {
    const key = (doc['statusKey_s'] as string | undefined) ?? normalizeStatusKey((doc['status_s'] as string | undefined) ?? (doc['status'] as string | undefined));

    if (key) statuses.add(key);
  });
  return Array.from(statuses).sort();
});

const availableSubsidiaryBodies = computed(() => {
  const bodies = new Set<string>();

  docs.value.forEach(doc => {
    getDocSubsidiaryBodies(doc).forEach(body => bodies.add(body));
  });
  return Array.from(bodies).sort();
});

const availableCopDecisions = computed(() => {
  const decisions = new Set<string>();

  docs.value.forEach(doc => {
    getDocDecisionLabels(doc).forEach(label => {
      if (label) {
        decisions.add(label);
      }
    });
  });
  return Array.from(decisions).sort();
});

const availableCountryOptions = computed<FilterOption[]>(() => {
  const map = new Map<string, string>();

  docs.value.forEach(doc => {
    collectCountryEntries(doc).forEach(({ value, label }) => {
      if (!value) {
        return;
      }
      const currentLabel = map.get(value);
      const finalLabel = resolveCountryLabel(value, label ?? currentLabel);

      if (!map.has(value) || (label && label.trim())) {
        map.set(value, finalLabel);
      }
    });
  });

  return Array.from(map.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const availableGlobalTargetOptions = computed<FilterOption[]>(() => {
  const map = new Map<string, string>();

  docs.value.forEach(doc => {
    collectGlobalTargetEntries(doc).forEach(({ value, label }) => {
      if (!value) {
        return;
      }
      if (!map.has(value) || (label && label.trim())) {
        map.set(value, label?.trim() || humanizeIdentifier(value));
      }
    });
  });

  return Array.from(map.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const handleFiltersUpdate = (filters: FilterState) => {
  currentFilters.value = filters;
};

function typeValue(doc: AnyDoc): string {
  const raw = (doc as Record<string, unknown>).type_s ?? (doc as Record<string, unknown>).type;

  return typeof raw === 'string' ? raw.trim() : '';
}

function resolveTypeKey(doc: AnyDoc): ReturnType<typeof normalizeTypeKey> {
  return normalizeTypeKey(typeValue(doc));
}

function typeLabel(doc: AnyDoc): string {
  const raw            = typeValue(doc);
  const translationKey = `calendar.types.${resolveTypeKey(doc)}`;

  if (te(translationKey)) {
    return t(translationKey) as string;
  }
  if (te('calendar.types.default')) {
    return t('calendar.types.default') as string;
  }
  if (!raw && te('calendar.types.activity')) {
    return t('calendar.types.activity') as string;
  }
  return raw;
}

function typeStripStyle(doc: AnyDoc): { backgroundColor: string; color: string } {
  const palette = getTypeColor(resolveTypeKey(doc));

  return {
    backgroundColor: palette.background,
    color: palette.text,
  };
}

function title(d: AnyDoc): string {
  const tField = getTitleFieldForLocale(locale.value);

  const titleValue = d[tField] ?? d['title_EN_t'] ?? d['title_t'] ?? d['title'];

  if (typeof titleValue === 'string' && titleValue.trim()) {
    return titleValue;
  }
  return t('calendar.labels.untitled') as string;
}

function status(d: AnyDoc): string {
  const label = d['status_s'];

  if (typeof label === 'string' && label.trim()) return label;
  const key = d['statusKey_s'] as string | undefined;

  return normalizeStatusLabel(key ?? null);
}

function statusColor(d: AnyDoc): string {
  const keyRaw = (d['statusKey_s'] as string | undefined)?.toUpperCase();
  const normalizedKey = keyRaw ?? normalizeStatusKey(status(d)) ?? '';

  switch (normalizedKey) {
    case 'COMPLETED':
      return 'success';
    case 'CONFIRM':
    case 'CONFIRMED':
      return 'primary';
    case 'TO_BE_CONFIRMED':
      return 'warning';
    case 'ONGOING':
      return 'info';
    default:
      return 'secondary';
  }
}

function isActionRequired(d: AnyDoc): boolean {
  return d['actionRequired_b'] === true || d['actionRequired'] === true;
}

function formatDateRange(d: AnyDoc): string {
  const start = safeDate(d['startDate_dt']);
  const end = safeDate(d['endDate_dt']);

  if (start && end) {
    if (start.hasSame(end, 'day')) return start.toFormat('d LLLL yyyy');
    if (start.month === end.month && start.year === end.year) {
      return `${start.toFormat('d')}–${end.toFormat('d LLLL yyyy')}`;
    }
    if (start.year === end.year) {
      return `${start.toFormat('d LLLL')}–${end.toFormat('d LLLL yyyy')}`;
    }
    return `${start.toFormat('d LLLL yyyy')}–${end.toFormat('d LLLL yyyy')}`;
  }
  if (start) return start.toFormat('d LLLL yyyy');
  if (end) return end.toFormat('d LLLL yyyy');
  return '';
}

function safeDate(v: unknown): DateTime | null {
  if (!v) return null;
  const dt = DateTime.fromISO(String(v));

  return dt.isValid ? dt : null;
}
</script>
<style lang="scss">
@use '../assets/styles/main.scss' as *;
</style>
<style scoped>
.activities-explorer {
  --calendar-group-header-offset: 0px;
  --calendar-group-header-bg: var(--bs-body-bg, #fff);
}

.dg-sep {
  position: sticky;
  top: var(--calendar-group-header-offset);
  z-index: 3;
  padding: 0.75rem 0;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  margin: 1.5rem 0 1rem;
  background-color: var(--calendar-group-header-bg);
  scroll-margin-top: calc(var(--calendar-group-header-offset) + 1rem);
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}
h3 {
  font-family: -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 28px;
  font-weight: 500;
  line-height: 33.6px;
  margin-bottom: 8px;
  margin-top: 0px;
  color: #009b48;
  padding: 0.5rem 0;
}

.accordion-button {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  gap: 0;
  overflow: hidden;
}

:deep(.accordion-button::after) {
  display: none;
}

.calendar-row__type-strip {
  width: 100%;
  min-height: 1.75rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  border-radius: 0;
  text-align: center;
  text-transform: uppercase;
  position: relative;
  padding-right: 2rem;
}

.calendar-row__type-text {
  white-space: nowrap;
}

.calendar-row__type-strip::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0.75rem;
  width: 0.45rem;
  height: 0.45rem;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: translateY(-50%) rotate(45deg);
  transition: transform 0.2s ease;
}

:deep(.accordion-button.collapsed) .calendar-row__type-strip::after {
  transform: translateY(-50%) rotate(-135deg);
}

.calendar-accordion__summary {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 1rem 1rem;
}

.calendar-accordion__badges-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.calendar-accordion__subjects {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.calendar-accordion__status-badges {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
  margin-left: auto;
  flex-wrap: wrap;
  text-align: right;
}

.calendar-accordion__status-badge {
  white-space: nowrap;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.45rem;
}

.calendar-notifications {
  border-top: 1px solid rgba(12, 74, 50, 0.12);
  padding-top: 1.5rem;
}

.calendar-notifications__header {
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  color: #4d7c68;
}

.calendar-notification-card {
  background: #f8fdf9;
  border: 1px solid rgba(12, 74, 50, 0.15);
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 10px 28px -18px rgba(12, 74, 50, 0.45);
  margin-bottom: 1.25rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.calendar-notification-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px -18px rgba(12, 74, 50, 0.55);
}

.calendar-notification-card__pill-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.calendar-notification-card__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: #0c4a32;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.2s ease;
}

.calendar-notification-card__pill:hover {
  background: #0f5d3e;
}

.calendar-notification-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background: rgba(214, 58, 47, 0.12);
  color: #d63a2f;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-left: auto;
}

.calendar-notification-card__badge-deadline {
  font-weight: 500;
  letter-spacing: normal;
  text-transform: none;
  font-size: 0.68rem;
}

.calendar-notification-card__status {
  background: rgba(12, 74, 50, 0.08);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  font-size: 0.9rem;
  color: #0c4a32;
}

.calendar-notification-card__status--error {
  background: rgba(214, 58, 47, 0.12);
  color: #a5271e;
}

.calendar-notification-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.calendar-notification-card__title {
  font-size: 1rem;
  font-weight: 500;
  color: #093021;
  text-decoration: none;
  line-height: 1.35;
}

.calendar-notification-card__title:hover {
  text-decoration: underline;
}

.calendar-notification-card__meta {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.2rem;
  margin-bottom: 0.5rem;
  font-size: 0.82rem;
  color: rgba(9, 48, 33, 0.7);
}

.calendar-notification-card__meta-line {
  width: 100%;
}

.calendar-notification-card__section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.calendar-pill-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(9, 48, 33, 0.65);
}

.calendar-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.calendar-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: #fff;
  border: 1px solid rgba(12, 74, 50, 0.15);
  font-size: 0.75rem;
  font-weight: 600;
  color: #0c4a32;
}

.calendar-pill--muted {
  color: rgba(9, 48, 33, 0.7);
}

.calendar-subjects {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.calendar-notification-card__attachments {
  gap: 0.75rem;
}

.calendar-notification-card__attachments a {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  background: rgba(12, 74, 50, 0.1);
  color: #0c4a32;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.85rem;
  transition: background 0.2s ease;
}

.calendar-notification-card__attachments a:hover {
  background: rgba(12, 74, 50, 0.18);
}

.calendar-notification-card__actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.calendar-notification-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 700;
  font-size: 0.9rem;
  color: #0c4a32;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  padding-bottom: 0.1rem;
  transition: border-color 0.2s ease;
}

.calendar-notification-card__cta::after {
  content: '>';
  font-size: 1rem;
  line-height: 1;
}

.calendar-notification-card__cta:hover {
  border-color: #0c4a32;
}

@media (max-width: 576px) {
  .calendar-notification-card {
    padding: 1rem;
  }

  .calendar-notification-card__section {
    align-items: flex-start;
  }

  .calendar-notification-card__pill-row {
    justify-content: flex-start;
  }
}

@media (max-width: 576px) {
  .calendar-accordion__status-badges {
    width: 100%;
    justify-content: flex-start;
    margin-left: 0;
  }
}

.calendar-accordion__title {
  font-family: -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #1d1d1d;
}
</style>
