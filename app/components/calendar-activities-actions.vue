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
            :initial-start-date="defaultStartDateIso"
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
            <div v-for="item in group.items" :key="String(item.id || '')" class="accordion-item mb-3">
              <h2 :id="`heading-${item.id}`" class="accordion-header">
                <button
                  class="accordion-button"
                  :class="{ collapsed: !openItems[String(item.id || '')] }"
                  type="button"
                  :aria-expanded="openItems[String(item.id || '')] ? 'true' : 'false'"
                  :aria-controls="`collapse-${item.id}`"
                  @click="toggleAccordion(String(item.id || '') )"
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
                      v-if="displaySubjectLabels(item).length || status(item) || isActionRequired(item) || primaryMeetingLink(item)"
                      class="calendar-accordion__meta-block mt-2"
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
                        v-if="primaryMeetingLink(item) || status(item) || isActionRequired(item)"
                        class="calendar-accordion__footer"
                      >
                        <a
                          v-if="primaryMeetingLink(item)"
                          :href="primaryMeetingLink(item)"
                          target="_blank"
                          rel="noopener"
                          class="calendar-notification-card__cta calendar-accordion__cta calendar-accordion__cta--documents"
                          :aria-label="t('calendar.actions.viewDocumentsAria', { title: title(item) })"
                          data-testid="calendar-accordion-view-documents"
                        >
                          {{ t('calendar.actions.viewDocuments') }}
                        </a>
                        <div
                          v-if="status(item) || isActionRequired(item)"
                          class="calendar-accordion__status-badges"
                          data-testid="calendar-accordion-status-block"
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
                  </div>
                </button>
              </h2>
              <div
                :id="`collapse-${item.id}`"
                class="accordion-collapse collapse"
                :class="{ show: openItems[String(item.id || '')] }"
                :aria-labelledby="`heading-${item.id}`"
              >
                <div class="accordion-body">
                  <div class="row">
                    <div class="col-md-6">
                      <p v-if="status(item)">
                        <strong>{{ t('calendar.labels.status') }}: </strong>
                          <span v-if="status(item)" class="badge calendar-accordion__status-badge" :class="`bg-${statusColor(item)}`">
                            {{ status(item) }}
                          </span> <br>
                        <span v-if="item.statusNarrative">{{ item.statusNarrative }}</span>
                      </p>

                      <p v-if="isActionRequired(item)">
                        <strong>{{ t('calendar.labels.actionRequiredByParties') }}:</strong>
                        {{ t('calendar.common.yes') }}
                      </p>

                      <p v-if="descriptionText(item)"><strong>{{ t('calendar.labels.description') }}:</strong> {{ descriptionText(item) }}</p>
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
                        <p v-if="item.subsidiaryBodies && item.subsidiaryBodies.length"><strong>{{ t('calendar.labels.associatedBody') }}:</strong> {{ item.subsidiaryBodies.join(', ') }}</p>
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
                        <div v-if="item.responsibleUnit || item.responsibleOfficer" class="card">
                            <div class="card-header">
                              <strong>{{ t('calendar.labels.responsible') }}</strong>
                            </div>
                            <ul class="list-group list-group-flush">
                              <li class="list-group-item "><span class="fw-bold">{{ t('calendar.labels.unit') }}: </span>{{ item.responsibleUnit }}</li>
                              <li class="list-group-item "><span class="fw-bold">{{ t('calendar.labels.officer') }}: </span>{{ item.responsibleOfficer }}</li>
                          </ul>

                      </div>
                    </div>
                  </div>
                  <div v-if="notificationDisplayEntries(item).length" class="calendar-notifications mt-4">
                        <div class="calendar-notifications__header">
                          <strong>{{ t('calendar.labels.notifications') }}</strong>
                        </div>
                        <div v-for="entry in notificationDisplayEntries(item)" :key="entry.key" class="calendar-notification-card">
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

                <div class="alert alert-info"><pre>
{{ item }} 
                </pre></div>
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
import { collectAllFieldNames, getTitleFieldForLocale, normalizeSolrDocument, type MeetingDoc, type LocaleCode } from 'shared/services/solr';
import { useCalendarMarkdown } from '../composables/use-calendar-markdown';
import { meetings as meetingSnapshot } from 'shared/data/meetings.js';
import activitiesSnapshot from 'shared/data/25-26-activities.js';
import { loadSubjectOptions, buildSubjectLabelMap, resolveSubjectLabel, type SubjectOption } from 'shared/utils/subjects';
import { extractDecisionEntries, type DecisionEntry } from 'shared/utils/decision-links';
import { getTypeColor, normalizeTypeKey } from 'shared/utils/type-colors';
import CalendarFilters from './calendar-filters.vue';
import DecisionLink from './decision-link.vue';

interface CalendarDoc extends MeetingDoc {
  id: string;
  subjects?: string[];
  subsidiaryBodies?: string[];
  countries?: string[];
  countriesEn?: string[];
  links?: string[];
  status?: string;
  statusKey?: string | null;
  startDate?: string;
  endDate?: string;
  responsibleUnit?: string;
  responsibleOfficer?: string;
  statusNarrative?: string | null;
  actors?: string[];
  gbfTargets?: string[];
  relatedDocuments?: string[];
  country?: string;
  countryEn?: string;
  outcome?: string;
  actionRequired?: boolean;
}

const rawDocMap = new WeakMap<AnyDoc, Record<string, unknown>>();

type AnyDoc = CalendarDoc;

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
const defaultStartDateIso = DateTime.utc().startOf('day').toISODate() ?? '';

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
const meetingLinksCache = new WeakMap<AnyDoc, string[]>();

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
  startDate: defaultStartDateIso,
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
type SnapshotActivity = (typeof activitiesSnapshot)[number];

const RegionDisplayNames = (Intl as typeof Intl & { DisplayNames?: typeof Intl.DisplayNames }).DisplayNames;
const regionDisplayNames = typeof RegionDisplayNames === 'function'
  ? new RegionDisplayNames(['en'], { type: 'region' })
  : null;

async function loadSnapshotData(): Promise<void> {
  loading.value = true;
  const normalizedMeetings = meetingSnapshot.map((meeting, index) => normalizeMeetingDoc(meeting as SnapshotMeeting, index));

  try {
    const markdownRaw = await useCalendarMarkdown();

    let markdownDocs = buildDocsFromMarkdown(markdownRaw);

    if (markdownDocs.length === 0 && activitiesSnapshot.length > 0) {
      markdownDocs = buildDocsFromActivities(activitiesSnapshot);
    }

    docs.value = [...normalizedMeetings, ...markdownDocs];
  } catch (error) {
    console.error('Failed to load snapshot data', error);
    const fallbackActivities = activitiesSnapshot.length > 0
      ? buildDocsFromActivities(activitiesSnapshot)
      : [];

    docs.value = [...normalizedMeetings, ...fallbackActivities];
  } finally {
    loading.value = false;
  }
}

function normalizeMeetingDoc(meeting: SnapshotMeeting, index: number): AnyDoc {
  const record = { ...(meeting as Record<string, unknown>) };
  const subjectsSource = record['subjects_ss'] ?? record['subjects'] ?? record['subjectIdentifiers_ss'];
  const subjects = Array.isArray(subjectsSource)
    ? (subjectsSource as unknown[]).map(String).map(subject => subject.trim()).filter(Boolean)
    : splitValues(record['subject_EN_s'] ?? record['subjectEn'] ?? record['subjects']);
  const bodiesSource = record['subsidiaryBodies_ss'] ?? record['subsidiaryBodies'];
  const bodies = Array.isArray(bodiesSource)
    ? (bodiesSource as unknown[]).map(String).map(body => body.trim()).filter(Boolean)
    : splitValues(record['subsidiaryBody_s'] ?? record['subsidiaryBody']);

  const id = String(record['_id'] ?? record['id'] ?? record['identifier_s'] ?? record['identifier'] ?? `meeting-${index}`);

  const rawStatus = (record['status_s'] ?? record['status']) as string | undefined;
  const statusKey = normalizeStatusKey(rawStatus);
  const statusLabel = normalizeStatusLabel(statusKey, rawStatus);

  const startDateRaw = record['startDate_dt'] ?? record['startDate'] ?? record['startDate_s'];
  const endDateRaw = record['endDate_dt'] ?? record['endDate'] ?? record['endDate_s'];
  const startDateIso = typeof startDateRaw === 'string' && startDateRaw.trim() ? startDateRaw : null;
  const endDateIso = typeof endDateRaw === 'string' && endDateRaw.trim() ? endDateRaw : null;

  const linkSources: unknown[] = Array.isArray(record['links_ss'])
    ? (record['links_ss'] as unknown[])
    : Array.isArray(record['links'])
      ? (record['links'] as unknown[])
      : record['meetingLink']
        ? [record['meetingLink']]
        : record['meetingUrl']
          ? [record['meetingUrl']]
          : [];
  const links = linkSources
    .map(entry => (typeof entry === 'string' ? entry : String(entry ?? '')))
    .map(link => link.trim())
    .filter(Boolean);

  const countriesSource: unknown[] = Array.isArray(record['countries_ss'])
    ? (record['countries_ss'] as unknown[])
    : Array.isArray(record['countries'])
      ? (record['countries'] as unknown[])
      : record['country']
        ? [record['country']]
        : [];
  const countries = countriesSource.map(entry => (typeof entry === 'string' ? entry : String(entry ?? ''))).map(country => country.trim()).filter(Boolean);

  const countryLabelsSource: unknown[] = Array.isArray(record['countries_EN_ss'])
    ? (record['countries_EN_ss'] as unknown[])
    : Array.isArray(record['countriesEn'])
      ? (record['countriesEn'] as unknown[])
      : record['countryEn']
        ? [record['countryEn']]
        : [];
  const countryLabels = countryLabelsSource
    .map(entry => (typeof entry === 'string' ? entry : String(entry ?? '')))
    .map(label => label.trim())
    .filter(Boolean);

  const solrLikeRecord: Record<string, unknown> = {
    ...record,
    id,
    startDate_dt: startDateIso ?? undefined,
    endDate_dt: endDateIso ?? undefined,
    subjects_ss: subjects,
    subject_EN_s: record['subject_EN_s'] ?? record['subjectEn'] ?? (subjects.length > 0 ? subjects.join(', ') : null),
    subsidiaryBody_s: record['subsidiaryBody_s'] ?? record['subsidiaryBody'] ?? (bodies.length > 0 ? bodies[0] : null),
    subsidiaryBodies_ss: bodies,
    type_s: String(record['type_s'] ?? record['type'] ?? 'Meeting'),
    links_ss: links,
    statusKey_s: statusKey ?? null,
    status_s: statusLabel,
    country_s: record['country_s'] ?? (countries.length > 0 ? countries[0] : undefined),
    country_EN_s: record['country_EN_s'] ?? record['countryEn'] ?? (countryLabels.length > 0 ? countryLabels[0] : undefined),
    countries_ss: Array.isArray(record['countries_ss']) ? (record['countries_ss'] as unknown[]).map(String) : countries,
    countries_EN_ss: Array.isArray(record['countries_EN_ss']) ? (record['countries_EN_ss'] as unknown[]).map(String) : (countryLabels.length > 0 ? countryLabels : (countries.length > 0 ? countries : [])),
  };

  const normalizedSolr = normalizeSolrDocument(solrLikeRecord);
  const doc = {
    ...normalizedSolr,
    id,
    subjects,
    subsidiaryBodies: bodies,
    links,
    status: statusLabel,
    statusKey,
    startDate: startDateIso ?? undefined,
    endDate: endDateIso ?? undefined,
    countries,
    countriesEn: countryLabels.length > 0 ? countryLabels : countries,
    country: (normalizedSolr['country'] as string | undefined) ?? (countries[0] ?? undefined),
    countryEn: (normalizedSolr['countryEn'] as string | undefined) ?? (countryLabels[0] ?? countries[0] ?? undefined),
  } as AnyDoc;

  delete (doc as Record<string, unknown>)._id;
  rawDocMap.set(doc, record);

  if (!doc.type) {
    doc.type = 'Meeting';
  }
  if (!doc.subjectEn && subjects.length > 0) {
    doc.subjectEn = subjects.join(', ');
  }
  if (!doc.subsidiaryBody && bodies.length > 0) {
    doc.subsidiaryBody = bodies[0] ?? null;
  }

  return doc;
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

function mapMarkdownRowToDoc(row: MarkdownRow, index: number, sourceId: string = 'markdown:2024-12-01'): AnyDoc {
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

  const solrLikeRecord: Record<string, unknown> = {
    id,
    identifier_s: id,
    source: sourceId,
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

  const normalizedSolr = normalizeSolrDocument(solrLikeRecord);
  const doc = {
    ...normalizedSolr,
    id,
    source: sourceId,
    subjects,
    subsidiaryBodies: bodies,
    links: Array.isArray(normalizedSolr['links']) ? normalizedSolr['links'] as string[] : [],
    status: statusLabel,
    statusKey,
    statusNarrative: row['Status_narrative'] || null,
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined,
    actors,
    gbfTargets: targets,
    relatedDocuments: relatedDocs,
    countries,
    countriesEn: countries,
    country: countries[0] ?? undefined,
    countryEn: countries[0] ?? undefined,
    outcome: row['Outcome'] || undefined,
    actionRequired: row['Action Required by Parties']?.toUpperCase() === 'Y',
  } as AnyDoc;

  delete (doc as Record<string, unknown>)._id;
  rawDocMap.set(doc, solrLikeRecord);

  if (!doc.type) {
    doc.type = String(row['Type'] || 'Activity');
  }
  if (!doc.title && typeof row['Title'] === 'string') {
    doc.title = row['Title'];
  }

  return doc;
}

function buildDocsFromActivities(records: SnapshotActivity[]): AnyDoc[] {
  return records.map((record, index) => {
    const row: MarkdownRow = {
      Title: record.title ?? '',
      Description: record.description ?? '',
      Type: record.type ?? '',
      'Action Required by Parties': record.actionRequiredByParties ?? '',
      Subject: record.subject ?? '',
      Status: record.status ?? '',
      Status_narrative: record.statusNarrative ?? '',
      Startdate: record.startDate ?? '',
      Enddate: record.endDate ?? '',
      Associatedbody: record.associatedBody ?? '',
      AgendaItem: record.agendaItem ?? '',
      COPDecision: record.copDecision ?? '',
      COPParagraph_no: record.copParagraphNo ?? '',
      COPParagraph_type: record.copParagraphType ?? '',
      Responsible_Unit: record.responsibleUnit ?? '',
      Responsible_Officer: record.responsibleOfficer ?? '',
      Funding_source: record.fundingSource ?? '',
      Funding_allocated: record.fundingAllocated ?? '',
      Actors: record.actors ?? '',
      Actors_comments: record.actorsComments ?? '',
      GBF_Targets: record.gbfTargets ?? '',
      Related_documents: record.relatedDocuments ?? '',
      Outcome: record.outcome ?? '',
      Country: (record as Record<string, string | undefined>)['country'] ?? '',
      Countries: (record as Record<string, string | undefined>)['countries'] ?? '',
    };

    return mapMarkdownRowToDoc(row, index, 'activities-json:25-26');
  });
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

function getDocRaw(doc: AnyDoc): Record<string, unknown> | null {
  return rawDocMap.get(doc) ?? null;
}

function getDocStringValue(doc: AnyDoc, ...keys: string[]): string | undefined {
  const anyDoc = doc as Record<string, unknown>;

  for (const key of keys) {
    const value = anyDoc[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const raw = getDocRaw(doc);

  if (raw) {
    for (const key of keys) {
      const value = raw[key];

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return undefined;
}

function getDocBooleanValue(doc: AnyDoc, ...keys: string[]): boolean | undefined {
  const anyDoc = doc as Record<string, unknown>;

  for (const key of keys) {
    const value = anyDoc[key];

    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      if (normalized === 'true' || normalized === 'yes' || normalized === 'y') {
        return true;
      }
      if (normalized === 'false' || normalized === 'no' || normalized === 'n') {
        return false;
      }
    }
  }

  const raw = getDocRaw(doc);

  if (raw) {
    for (const key of keys) {
      const value = raw[key];

      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();

        if (normalized === 'true' || normalized === 'yes' || normalized === 'y') {
          return true;
        }
        if (normalized === 'false' || normalized === 'no' || normalized === 'n') {
          return false;
        }
      }
    }
  }

  return undefined;
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
  if (Array.isArray(doc.subjects)) {
    return doc.subjects.map(String).filter(Boolean);
  }
  const anyDoc = doc as Record<string, unknown>;

  if (Array.isArray(anyDoc.subjectIdentifiers)) {
    return (anyDoc.subjectIdentifiers as unknown[]).map(String).filter(Boolean);
  }
  const subjectField = anyDoc.subjectEn ?? anyDoc.subject ?? anyDoc.subjects;

  if (typeof subjectField === 'string') {
    const split = splitValues(subjectField);

    if (split.length > 0) {
      return split;
    }
  }

  const raw = getDocRaw(doc);

  if (raw) {
    if (Array.isArray(raw['subjects_ss'])) {
      return (raw['subjects_ss'] as unknown[]).map(String).filter(Boolean);
    }
    if (Array.isArray(raw['subjectIdentifiers_ss'])) {
      return (raw['subjectIdentifiers_ss'] as unknown[]).map(String).filter(Boolean);
    }
    const rawField = raw['subject_EN_s'] ?? raw['subject_s'] ?? raw['subject'];

    if (typeof rawField === 'string') {
      return splitValues(rawField);
    }
  }

  return [];
}

function getDocSubsidiaryBodies(doc: AnyDoc): string[] {
  if (Array.isArray(doc.subsidiaryBodies)) {
    return doc.subsidiaryBodies.map(String).filter(Boolean);
  }
  const anyDoc = doc as Record<string, unknown>;
  const bodyField = anyDoc.subsidiaryBody;

  if (typeof bodyField === 'string') {
    const split = splitValues(bodyField);

    if (split.length > 0) {
      return split;
    }
  }

  const raw = getDocRaw(doc);

  if (raw) {
    if (Array.isArray(raw['subsidiaryBodies_ss'])) {
      return (raw['subsidiaryBodies_ss'] as unknown[]).map(String).filter(Boolean);
    }
    const rawField = raw['subsidiaryBody_s'] ?? raw['subsidiaryBody'];

    if (typeof rawField === 'string') {
      return splitValues(rawField);
    }
  }

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
  const entries: ValueLabelPair[] = [];

  const push = (value: unknown, label?: unknown) => {
    entries.push(...collectValueLabelPairs(value, label));
  };

  push(record['gbfTargets'], record['gbfTargetsEn']);
  push(record['globalTargets'], record['globalTargetsEn']);
  push(record['gbfTarget'], record['gbfTargetEn']);

  const raw = getDocRaw(doc);

  if (raw) {
    push(raw['gbfTargets_ss'], raw['gbfTargets_EN_ss']);
    push(raw['globalTargets_ss'], raw['globalTargets_EN_ss']);
    push(raw['gbfTarget_ss'], raw['gbfTarget_EN_ss']);
    push(raw['gbfTargets_s'], raw['gbfTargets_EN_s']);
    push(raw['gbfTarget_s'], raw['gbfTarget_EN_s']);
    push(raw['gbfTargets'], raw['gbfTargets_EN']);
    push(raw['GBF_Targets'], raw['GBF_Targets']);
  }

  return entries;
}

function collectCountryEntries(doc: AnyDoc): ValueLabelPair[] {
  const record = doc as Record<string, unknown>;
  const entries: ValueLabelPair[] = [];

  const push = (value: unknown, label?: unknown) => {
    entries.push(...collectValueLabelPairs(value, label));
  };

  push(record['country'], record['countryEn']);
  push(record['countries'], record['countriesEn']);
  push(record['countryCode'], record['countryName']);
  push(record['countryCodes'], record['countryNames']);
  push(record['hostCountry'], record['hostCountryEn']);
  push(record['hostCountries'], record['hostCountriesEn']);

  const raw = getDocRaw(doc);

  if (raw) {
    push(raw['country_s'], raw['country_EN_s']);
    push(raw['countryCode_s'], raw['countryName_s']);
    push(raw['country_ss'], raw['country_EN_ss']);
    push(raw['countries_ss'], raw['countries_EN_ss']);
    push(raw['countryCodes_ss'], raw['countryNames_ss']);
    push(raw['country_ISO2_ss'], raw['countryNames_ss']);
    push(raw['countries_s'], raw['countries_EN_ss']);
    push(raw['hostCountry_s'], raw['hostCountry_EN_s']);
    push(raw['hostCountries_ss'], raw['hostCountries_EN_ss']);
    push(raw['country_EN_s'], raw['country_EN_s']);
    push(raw['countries_EN_ss'], raw['countries_EN_ss']);
  }

  return entries;
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

function meetingLinks(doc: AnyDoc): string[] {
  const cached = meetingLinksCache.get(doc);

  if (cached) {
    return cached;
  }

  const record = doc as Record<string, unknown>;
  const candidateFields: Array<keyof typeof record> = [
    'links',
    'link',
    'meetingLinks',
    'meetingLink',
    'meetingUrl',
    'url',
    'urls',
    'links_ss',
    'links',
    'links_s',
    'link_s',
    'link',
    'meetingLinks_ss',
    'meetingLinks',
    'meetingLink_s',
    'meetingLink',
    'meeting_url_s',
    'meeting_url',
    'meetingUrl_s',
    'meetingUrl',
    'url_ss',
    'url_s',
    'urls_ss',
  ];

  const collected: string[] = [];

  candidateFields.forEach(field => {
    const value = record[field];

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

  const raw = getDocRaw(doc);

  if (raw) {
    const rawFields = [
      'links_ss',
      'links_s',
      'link_s',
      'meetingLinks_ss',
      'meetingLinks_s',
      'meetingLink_s',
      'meeting_url_s',
      'meetingUrl_s',
      'url_ss',
      'urls_ss',
    ] as const;

    rawFields.forEach(field => {
      const value = raw[field];

      if (!value) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(entry => {
          if (typeof entry === 'string' && entry.trim()) {
            collected.push(entry.trim());
          }
        });
      } else if (typeof value === 'string' && value.trim()) {
        collected.push(value.trim());
      }
    });
  }

  const normalized = Array.from(new Set(
    collected.map(link => resolveNotificationUrl(link)),
  )).filter(link => /^https?:/i.test(link));

  meetingLinksCache.set(doc, normalized);
  return normalized;
}

function primaryMeetingLink(doc: AnyDoc): string | undefined {
  const links = meetingLinks(doc);

  if (links.length === 0) {
    return undefined;
  }

  return links[0] ?? undefined;
}

function getNotificationKeys(doc: AnyDoc): NotificationKey[] {
  const cached = notificationKeyCache.get(doc);

  if (cached) {
    return cached;
  }

  const record = doc as Record<string, unknown>;
  const candidateProperties: Array<keyof typeof record> = [
    'relatedNotifications',
    'relatedNotification',
    'relatedDocuments',
    'notification',
    'notifications',
    'notificationKey',
    'notificationKeys',
  ];
  const raw = getDocRaw(doc);
  const rawCandidateProperties = [
    'relatedNotifications_ss',
    'relatedNotification_ss',
    'relatedNotifications_s',
    'relatedDocuments_ss',
    'notification_ss',
    'notifications_ss',
    'notification_s',
    'notifications_s',
    'notificationKey_s',
    'notificationKey_ss',
    'notificationKeys_ss',
  ] as const;

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

  if (raw) {
    rawCandidateProperties.forEach(property => {
      const value = raw[property];

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
  }

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

function descriptionText(doc: AnyDoc): string | undefined {
  return getDocStringValue(doc, 'description', 'description_t', 'descriptionTxt', 'descriptionText');
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
      const type = getDocStringValue(doc, 'type', 'type_s');

      return type && filters.types.includes(String(type));
    });
  }

  if (filters.activityTypes.length > 0) {
    filtered = filtered.filter(doc => {
      const activityType = getDocStringValue(doc, 'activityType', 'activity_type_s', 'activity_type');

      return activityType && filters.activityTypes.includes(activityType);
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
      const key = getDocStringValue(doc, 'statusKey', 'statusKey_s')
        ?? normalizeStatusKey(getDocStringValue(doc, 'status', 'status_s'));

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
      const startDate = safeDate(getDocStringValue(doc, 'startDate', 'startDate_dt', 'startDate_s'));
      const endDate = safeDate(getDocStringValue(doc, 'endDate', 'endDate_dt', 'endDate_s'));
      const docDate = startDate || endDate;

      if (!docDate) return false;
      const docDateIso = docDate.toISODate();

      if (!docDateIso) return false;

      if (filters.startDate) {
        const startFilter = DateTime.fromISO(filters.startDate, { zone: 'utc' }).toISODate();

        if (startFilter && docDateIso < startFilter) return false;
      }

      if (filters.endDate) {
        const endFilter = DateTime.fromISO(filters.endDate, { zone: 'utc' }).toISODate();

        if (endFilter && docDateIso > endFilter) return false;
      }

      return true;
    });
  }

  if (filters.actionRequired) {
    filtered = filtered.filter(doc => {
      const actionRequired = getDocBooleanValue(doc, 'actionRequired', 'actionRequired_b');

      return actionRequired === true;
    });
  }

  return filtered;
});

const filteredGrouped = computed<GroupedItem[]>(() => {
  const buckets = new Map<string, { label: string; items: AnyDoc[] }>();

  for (const d of filteredDocs.value) {
    const startDate = getDocStringValue(d, 'startDate', 'startDate_dt', 'startDate_s');
    const endDate = getDocStringValue(d, 'endDate', 'endDate_dt', 'endDate_s');
    const iso = startDate || endDate;
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
    const type = getDocStringValue(doc, 'type', 'type_s');

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
    const key = getDocStringValue(doc, 'statusKey', 'statusKey_s')
      ?? normalizeStatusKey(getDocStringValue(doc, 'status', 'status_s'));

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
  return getDocStringValue(doc, 'type', 'type_s') ?? '';
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

  const titleValue = getDocStringValue(d, tField, 'title', 'title_EN_t', 'title_t');

  if (titleValue) {
    return titleValue;
  }
  return t('calendar.labels.untitled') as string;
}

function status(d: AnyDoc): string {
  const rawStatus = getDocStringValue(d, 'status', 'status_s');
  const statusKey = getDocStringValue(d, 'statusKey', 'statusKey_s');

  if (shouldDisplayCompleted(d, statusKey, rawStatus)) {
    return t('calendar.status.completed') as string;
  }

  if (rawStatus) {
    return rawStatus;
  }

  return normalizeStatusLabel(statusKey ?? null);
}

function statusColor(d: AnyDoc): string {
  const rawStatus = getDocStringValue(d, 'status', 'status_s');
  const keyRaw = getDocStringValue(d, 'statusKey', 'statusKey_s');

  if (shouldDisplayCompleted(d, keyRaw, rawStatus)) {
    return 'success';
  }

  const normalizedKey = keyRaw?.toUpperCase() ?? normalizeStatusKey(status(d)) ?? '';

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

function shouldDisplayCompleted(
  doc: AnyDoc,
  statusKey: string | undefined | null,
  rawStatus?: string,
): boolean {
  const normalizedStatus = normalizeStatusKey(statusKey ?? rawStatus);

  if (normalizedStatus !== 'CONFIRM') {
    return false;
  }

  const now = DateTime.now().toUTC().startOf('day');
  const endDate = safeDate(getDocStringValue(doc, 'endDate', 'endDate_dt', 'endDate_s'));

  if (endDate && now > endDate.toUTC().endOf('day')) {
    return true;
  }

  const startDate = safeDate(getDocStringValue(doc, 'startDate', 'startDate_dt', 'startDate_s'));

  if (startDate) {
    const completionThreshold = startDate.toUTC().plus({ days: 1 }).endOf('day');

    if (now > completionThreshold) {
      return true;
    }
  }

  return false;
}

function isActionRequired(d: AnyDoc): boolean {
  return getDocBooleanValue(d, 'actionRequired', 'actionRequired_b') === true;
}

function formatDateRange(d: AnyDoc): string {
  const start = safeDate(getDocStringValue(d, 'startDate', 'startDate_dt', 'startDate_s'));
  const end = safeDate(getDocStringValue(d, 'endDate', 'endDate_dt', 'endDate_s'));

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


.calendar-accordion__meta-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calendar-accordion__subjects {
  width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.calendar-accordion__footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.calendar-accordion__cta--documents {
  margin-right: auto;
}

.calendar-accordion__status-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
  margin-left: auto;
  justify-content: flex-end;
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
.calendar-accordion__cta {
  font-weight: 700;
  flex-shrink: 0;
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

/* Expanded details layout, reusing notification card styling */
.calendar-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.calendar-details .calendar-notification-card__section {
  align-items: flex-start;
}

.calendar-details .calendar-pill {
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
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
  .calendar-accordion__footer {
    gap: 0.75rem;
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
