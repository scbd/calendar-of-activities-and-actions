<template>
  <section class="activities-explorer">
    <div class="container py-3">
      <h2>Activities & Actions Explorer - Accordion View</h2>

      <div class="card mb-3">
        <div class="card-body">
          <CalendarFilters
            :available-types="availableTypes"
            :available-subjects="availableSubjects"
            :available-statuses="availableStatuses"
            :available-subsidiary-bodies="availableSubsidiaryBodies"
            :available-cop-decisions="availableCopDecisions"
            @update:filters="handleFiltersUpdate"
          />
        </div>
      </div>

      <div v-if="loading" class="alert">Loading meetings…</div>
      <div v-else>
        <div v-if="filteredGrouped.length === 0" class="alert alert-warning">No results</div>

        <div v-for="group in filteredGrouped" :key="group.key" class="mb-4">
          <div class="dgSep"><h3 class="m-0">{{ group.label }}</h3></div>

          <div :id="`accordion-${group.key}`" class="accordion">
            <div v-for="item in group.items" :key="item._id" class="accordion-item">
              <h2 :id="`heading-${item._id}`" class="accordion-header">
                <button
                  class="accordion-button"
                  :class="{ collapsed: !openItems[item._id] }"
                  type="button"
                  :aria-expanded="openItems[item._id] ? 'true' : 'false'"
                  :aria-controls="`collapse-${item._id}`"
                  @click="toggleAccordion(item._id)"
                >
                  <div class="w-100">
                    <div class="d-flex justify-content-between">
                      <span class="flex-grow-1"><strong>{{ title(item) }}</strong></span>
                      <span class="badge bg-secondary ms-2">{{ item.type_s }}</span>
                    </div>
                    <div class="small text-muted">{{ formatDateRange(item) }}</div>
                  </div>
                </button>
              </h2>
              <div
                :id="`collapse-${item._id}`"
                class="accordion-collapse collapse"
                :class="{ show: openItems[item._id] }"
                :aria-labelledby="`heading-${item._id}`"
              >
                <div class="accordion-body">
                  <div class="row">
                    <div class="col-md-6">
                      <p><strong>Status:</strong> <span :class="`badge bg-${statusColor(item)}`">{{ status(item) }}</span></p>
                      <p v-if="item.actionRequired_b"><strong>Action Required by Parties:</strong> Yes</p>
                      <p v-if="item.description_t"><strong>Description:</strong> {{ item.description_t }}</p>
                      <p v-if="item.statusNarrative_t"><strong>Status Narrative:</strong> {{ item.statusNarrative_t }}</p>
                    </div>
                    <div class="col-md-6">
                      <p v-if="item.subjects_ss && item.subjects_ss.length"><strong>Subjects:</strong> {{ item.subjects_ss.join(', ') }}</p>
                      <p v-if="item.subsidiaryBodies_ss && item.subsidiaryBodies_ss.length"><strong>Associated Body:</strong> {{ item.subsidiaryBodies_ss.join(', ') }}</p>
                      <p v-if="item.copDecision_s"><strong>COP Decision:</strong> {{ item.copDecision_s }}</p>
                      <p v-if="item.copParagraph_s"><strong>COP Paragraph:</strong> {{ item.copParagraph_s }}</p>
                      <p v-if="item.responsibleUnit_s"><strong>Responsible Unit:</strong> {{ item.responsibleUnit_s }}</p>
                      <p v-if="item.responsibleOfficer_s"><strong>Responsible Officer:</strong> {{ item.responsibleOfficer_s }}</p>
                    </div>
                  </div>
                  <div v-if="item.relatedDocuments_ss && item.relatedDocuments_ss.length" class="mt-3">
                    <strong>Related Documents:</strong>
                    <a v-for="doc in item.relatedDocuments_ss" :key="doc" href="#" class="ms-2">{{ doc }}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-2">
          <button type="button" class="btn btn-sm btn-outline-secondary" disabled>Prev</button>
          <span>Page 1 / 1</span>
          <button type="button" class="btn btn-sm btn-outline-secondary" disabled>Next</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watchEffect } from 'vue';
import { DateTime } from 'luxon';
import { collectAllFieldNames, getTitleFieldForLocale, type MeetingDoc, type LocaleCode } from 'shared/services/solr';
import { meetings as meetingSnapshot } from '../../shared/data/meetings.js';
import calendarMarkdownRaw from '../../shared/data/2024-12-01.md?raw';
import CalendarFilters from './calendar-filters.vue';

type AnyDoc = MeetingDoc & { [key: string]: unknown };

const loading = ref<boolean>(false);
const docs = ref<AnyDoc[]>([]);
const allFieldNames = ref<string[]>([]);
const locale = ref<LocaleCode>('en');

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

onMounted(() => {
  loadSnapshotData();
});

interface GroupedItem {
  key: string;
  label: string;
  items: AnyDoc[];
}

type SnapshotMeeting = (typeof meetingSnapshot)[number];

function loadSnapshotData(): void {
  loading.value = true;
  try {
    const normalizedMeetings = meetingSnapshot.map((meeting, index) => normalizeMeetingDoc(meeting as SnapshotMeeting, index));
    const markdownDocs = buildDocsFromMarkdown(calendarMarkdownRaw);
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
    type_s: record['type_s'] ?? record['type'] ?? 'Meeting',
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

  const headerCells = lines[0].split('|').map(cell => cell.trim());
  const header = headerCells.slice(1, headerCells.length - 1);
  const dataLines = lines.slice(2);
  const rows: MarkdownRow[] = [];

  for (const line of dataLines) {
    const cells = line.split('|').map(cell => cell.trim());
    if (cells.length < header.length + 2) continue;
    const row: MarkdownRow = {};
    for (let i = 0; i < header.length; i += 1) {
      row[header[i]] = cells[i + 1] ?? '';
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
    type_s: row['Type'] || 'Activity',
    actionRequired_b: row['Action Required by Parties']?.toUpperCase() === 'Y',
    subjects_ss: subjects,
    subject_EN_s: subjects.join(', '),
  status_s: statusLabel,
  statusKey_s: statusKey ?? null,
    statusNarrative_t: row['Status_narrative'] || null,
    startDate_dt: startDate,
    endDate_dt: endDate,
    subsidiaryBody_s: bodies[0] ?? null,
    subsidiaryBodies_ss: bodies,
    copDecision_s: row['COPDecision'] || null,
    copParagraph_s: row['COPParagraph_no'] || null,
    responsibleUnit_s: row['Responsible_Unit'] || null,
    responsibleOfficer_s: row['Responsible_Officer'] || null,
    fundingSource_s: row['Funding_source'] || null,
    fundingAllocated_s: row['Funding_allocated'] || null,
    actors_ss: actors,
    actorsComments_t: row['Actors_comments'] || null,
    gbfTargets_ss: targets,
    relatedDocuments_ss: relatedDocs,
    links_ss: [],
    outcome_s: row['Outcome'] || null,
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
  if (key === 'CONFIRM') return 'Confirmed';
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
    const year = Number.parseInt(yearMatch[1], 10);
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

function getDocCopDecision(doc: AnyDoc): string | null {
  const decision = (doc as Record<string, unknown>).copDecision_s ?? (doc as Record<string, unknown>).copDecision;
  return decision ? String(decision) : null;
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
      const decision = getDocCopDecision(doc);
      return decision ? filters.copDecisions.includes(decision) : false;
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
  const buckets = new Map<string, { label: string; items: AnyDoc }>();
  for (const d of filteredDocs.value) {
    const { startDate_dt, endDate_dt } = d as MeetingDoc;
    const iso = startDate_dt || endDate_dt;
    const dt = iso ? DateTime.fromISO(String(iso)) : null;
    const key = dt ? dt.toFormat('yyyy-LL') : 'unknown';
    const label = dt ? dt.toFormat('LLLL yyyy') : 'Unknown';
    if (!buckets.has(key)) buckets.set(key, { label, items: [] });
    buckets.get(key)!.items.push(d);
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
    const decision = getDocCopDecision(doc);
    if (decision) decisions.add(decision);
  });
  return Array.from(decisions).sort();
});

const handleFiltersUpdate = (filters: FilterState) => {
  currentFilters.value = filters;
};

function title(d: AnyDoc): string {
  const tField = getTitleFieldForLocale(locale.value);
  return String(d[tField] ?? d['title_EN_t'] ?? d['title_t'] ?? d['title'] ?? 'Untitled');
}

function status(d: AnyDoc): string {
  const label = d['status_s'];
  if (typeof label === 'string' && label.trim()) return label;
  const key = d['statusKey_s'] as string | undefined;
  return normalizeStatusLabel(key ?? null);
}

function statusColor(d: AnyDoc): string {
    const s = status(d).toLowerCase();
    if (s === 'completed') return 'success';
    if (s === 'confirmed') return 'primary';
    if (s === 'to be confirmed') return 'warning';
    if (s === 'ongoing') return 'info';
    return 'secondary';
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
.dgSep {
  padding: 0.5rem 0;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  margin: 1rem 0;
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
</style>
