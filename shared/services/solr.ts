/**
 * SOLR query-building and document-normalization service for the calendar.
 *
 * Kept: normalization utilities, locale helpers.
 * Added: buildCalendarQuery(), parseFacets(), normalizeCalendarDoc().
 * @deprecated buildSelectBody(), fetchMeetingsUpdatedSince(), collectAllFieldNames() — will be removed in Phase 05.
 */

import { useQueryIndex } from '../../app/composables/use-query-index';
import type { SolrSelectBody, SolrFacetCounts } from '../types/solr';
import type { CalendarDoc, FilterState, ParsedFacets } from '../types/calendar';
import { expandStatusValuesForQuery } from '../utils/status';
import { SOLR_FACET_FIELDS } from '../constants/solr-fields';

export type LocaleCode = 'en' | 'fr' | 'es' | 'ar' | 'ru' | 'zh';

const solrSuffixes = ['_ss', '_dt', '_txt', '_s', '_t', '_b', '_i', '_ls', '_l'];

const isAllUpperCase = (segment: string): boolean => segment.toUpperCase() === segment && segment.toLowerCase() !== segment;

const stripSolrSuffix = (field: string): string => {
  const lowerField = field.toLowerCase();

  for (const suffix of solrSuffixes) {
    if (lowerField.endsWith(suffix)) {
      return field.slice(0, -suffix.length);
    }
  }
  return field;
};

const camelizeSegments = (segments: string[]): string => {
  if (segments.length === 0) {
    return '';
  }

  return segments
    .map((segment, index) => {
      if (index === 0) {
        if (!segment) {
          return segment;
        }
        if (isAllUpperCase(segment)) {
          return segment.toLowerCase();
        }
        return segment.charAt(0).toLowerCase() + segment.slice(1);
      }

      const lower = segment.toLowerCase();

      if (!lower) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
};

export const normalizeSolrFieldName = (field: string): string => {
  if (field.startsWith('_')) {
    return field;
  }

  const withoutSuffix = stripSolrSuffix(field);
  const segments = withoutSuffix.split('_').filter(Boolean);

  if (segments.length === 0) {
    return withoutSuffix;
  }
  return camelizeSegments(segments);
};

export const normalizeSolrDocument = <T extends Record<string, unknown>>(doc: T): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};

  for (const [rawKey, value] of Object.entries(doc)) {
    const key = normalizeSolrFieldName(rawKey);

    if (!(key in normalized)) {
      normalized[key] = value;
      continue;
    }

    const existing = normalized[key];

    if (Array.isArray(existing)) {
      const candidates = Array.isArray(value) ? value : [value];
      const filtered = candidates.filter(item => item !== undefined && item !== null);

      for (const candidate of filtered) {
        if (!existing.some(entry => entry === candidate)) {
          existing.push(candidate);
        }
      }
      continue;
    }

    if (Array.isArray(value)) {
      normalized[key] = (value as unknown[]).slice();
      continue;
    }

    if (existing === null || existing === undefined) {
      normalized[key] = value;
    }
  }

  return normalized;
};

// SolrSelectBody, SolrResponseHeader, SolrResponse, SolrFacetCounts → shared/types/solr.ts

/** @deprecated Use `CalendarQueryParams` instead — will be removed in Phase 05. */
export interface QueryOptions {
  locale?: LocaleCode;
  schema?: 'meeting' | string;
  start?: number;
  rows?: number;
  sinceUpdatedDateISO?: string;
  searchField?: string | string[];
}

export const getTextFieldForLocale = (locale: LocaleCode = 'en'): string => {
  return `text_${locale.toUpperCase()}_txt`;
};

export const getSolrTitleFieldForLocale = (locale: LocaleCode = 'en'): string => {
  // Common title field pattern across CBD indexes
  return `title_${locale.toUpperCase()}_t`;
};

export const getTitleFieldForLocale = (locale: LocaleCode = 'en'): string => {
  return normalizeSolrFieldName(getSolrTitleFieldForLocale(locale));
};

/**
 * Replace _EN occurrences in field names with the provided locale (uppercased).
 * Accepts a single string or array of strings. If locale is not provided or 'en',
 * fields are returned unchanged.
 */
export function localizeFields(fields?: string | string[], locale?: LocaleCode): string | string[] | undefined {
  if (!fields) return fields;
  if (!locale || locale === 'en') return fields;

  const replace = (f: string) => f.replace(/_EN/gi, `_${locale.toUpperCase()}`);

  if (Array.isArray(fields)) return fields.map(replace);
  return replace(fields);
}

// ---------------------------------------------------------------------------
// Calendar field lists
// ---------------------------------------------------------------------------

/** Minimal fields requested for list/grid view — reduces SOLR response payload. */
export const CALENDAR_LIST_FIELDS = [
  'id', '_id', 'schema_s', 'identifier_s',
  'title_EN_t', 'title_FR_t', 'title_ES_t', 'title_AR_t', 'title_RU_t', 'title_ZH_t',
  'startDateCOA_dt', 'endDateCOA_dt', 'status_s', 'activityStatus_s',
  'eventCity_s', 'eventCountry_s', 'meetingCode_s',
  'type_s', 'subType_s',
  'symbol_s', 'date_dt', 'actionDate_dt',
  'subjects_ss', 'governingBodiesCOA_ss', 'subsidiaryBodiesCOA_ss',
  'gbfTargets_ss', 'gbfSections_ss', 'decisions_ss',
  'themes_ss',
  'notifications_ss', 'meetings_ss', 'activities_ss',
  'url_ss',
  'actionRequiredByPartiesCOA_b',
  // Notification-specific fields
  'recipient_ss', 'files_ss', 'sender_s', 'reference_s', 'fulltext_s', 'deadline_dt',
].join(',');

/** All fields requested for expanded detail view. */
export const CALENDAR_DETAIL_FIELDS = [
  ...CALENDAR_LIST_FIELDS.split(','),
  'description_EN_t', 'description_FR_t', 'description_ES_t',
  'description_AR_t', 'description_RU_t', 'description_ZH_t',
  'statusNarrative_EN_t', 'statusNarrative_FR_t', 'statusNarrative_ES_t',
  'statusNarrative_AR_t', 'statusNarrative_RU_t', 'statusNarrative_ZH_t',
  'fulltext_EN_t', 'fulltext_FR_t', 'fulltext_ES_t',
  'fulltext_AR_t', 'fulltext_RU_t', 'fulltext_ZH_t',
  'actionRequiredByPartiesCOA_b',
  'agendaItems_ss', 'responsibleUnitsAndOfficers_ss',
  'hostGovernments_ss',
  'reference_s', 'sender_s', 'recipient_ss', 'files_ss',
  'outcome_s',
  'createdDate_dt', 'updatedDate_dt',
].join(',');

// ---------------------------------------------------------------------------
// Calendar query params
// ---------------------------------------------------------------------------

/** Parameters accepted by `buildCalendarQuery()`. */
export interface CalendarQueryParams {
  /** Schema types to query — defaults to all three. */
  schemas?: string[];
  /** Active filter selections. */
  filters?: Partial<FilterState>;
  /** Current UI locale for text search field resolution. */
  locale?: LocaleCode;
  /** Free-text search string. */
  searchText?: string;
  /** Pagination offset (default 0). */
  start?: number;
  /** Page size (default 50). */
  rows?: number;
  /** SOLR sort expression (default `'startDateCOA_dt asc'`). */
  sort?: string;
  /** SOLR field list — defaults to `CALENDAR_LIST_FIELDS`. */
  fl?: string;
}

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

/**
 * Build a tagged `fq` clause for one or more values on a SOLR field.
 * @internal
 */
function buildFilterQuery(field: string, tag: string, values: string[]): string {
  if (values.length === 1) {
    return `{!tag=${tag}}${field}:"${values[0]}"`;
  }
  const joined = values.map(v => `"${v}"`).join(' OR ');
  return `{!tag=${tag}}${field}:(${joined})`;
}

/**
 * Build a SOLR POST body for the calendar index.
 *
 * Includes `fq` filter queries (each tagged for facet exclusion), facet fields
 * from `SOLR_FACET_FIELDS`, pagination, and optional edismax text search.
 */
export function buildCalendarQuery(params: CalendarQueryParams = {}): SolrSelectBody {
  const {
    schemas = ['meeting', 'notification', 'calendarActivity'],
    filters = {},
    locale = 'en',
    searchText,
    start = 0,
    rows = 50,
    sort = 'startDateCOA_dt asc',
    fl = CALENDAR_LIST_FIELDS,
  } = params;

  const fq: string[] = [
    // calendarActivity docs have no _state_s field, so we accept public OR missing
    '(_state_s:public OR (*:* NOT _state_s:*))',
    // calendarActivity docs have no version_s field — the NOT already covers them
    '{!tag=version}(*:* NOT version_s:*)',
    '{!tag=schemaType}schemaType_s:scbd',
  ];

  // Schema filter
  const schemaValues = filters.types?.length ? filters.types : schemas;
  fq.push(`{!tag=schema}schema_s:(${schemaValues.join(' OR ')})`);

  // Multi-value array filters
  const multiValueFilters: Array<{ key: keyof FilterState; field: string; tag: string }> = [
    { key: 'subjects', field: 'subjects_ss', tag: 'subjects' },
    { key: 'governingBodies', field: 'governingBodiesCOA_ss', tag: 'governingBody' },
    { key: 'subsidiaryBodies', field: 'subsidiaryBodiesCOA_ss', tag: 'subsidiaryBody' },
    { key: 'activityTypes', field: 'type_s', tag: 'activityType' },
    { key: 'globalTargets', field: 'gbfTargets_ss', tag: 'gbfTargets' },
    { key: 'gbfSections', field: 'gbfSections_ss', tag: 'gbfSections' },
    { key: 'countries', field: 'eventCountry_s', tag: 'countries' },
    { key: 'copDecisions', field: 'decisions_ss', tag: 'decisions' },
  ];

  for (const { key, field, tag } of multiValueFilters) {
    const values = filters[key];
    if (Array.isArray(values) && values.length) {
      fq.push(buildFilterQuery(field, tag, values as string[]));
    }
  }

  // Status filter — meetings/notifications use `status_s` (short codes like
  // CONFIRM), calendarActivity uses `activityStatus_s` (thesaurus IDs like
  // NCHM-EVENT-STATUS-CONFIRMED). Expand each selected value to both forms
  // and OR across both fields so all matching documents are found.
  if (filters.statuses?.length) {
    const expandedStatuses = expandStatusValuesForQuery(filters.statuses);
    const statusClause = buildFilterQuery('status_s', 'status', expandedStatuses);
    const activityStatusClause = buildFilterQuery('activityStatus_s', 'status', expandedStatuses);

    // Strip the {!tag=status} prefix from the individual clauses and wrap
    // with a single tag so facet exclusion still works correctly.
    const stripTag = (clause: string): string => clause.replace(/^\{!tag=[^}]+\}/, '');

    fq.push(`{!tag=status}(${stripTag(statusClause)} OR ${stripTag(activityStatusClause)})`);
  }

  // Date range filters — prefer startDateCOA_dt / endDateCOA_dt, but fall back
  // to date_dt for notifications that haven't been back-filled yet.
  // When no start date is provided (e.g. filters cleared), default to 2024-01-01.
  {
    const sd = toSolrDateString(filters.startDate || '2024-01-01');

    fq.push(
      `{!tag=startDate}(`
      + `startDateCOA_dt:[${sd} TO *]`
      + ` OR ((*:* NOT startDateCOA_dt:*) AND endDateCOA_dt:[${sd} TO *])`
      + ` OR ((*:* NOT startDateCOA_dt:*) AND (*:* NOT endDateCOA_dt:*) AND date_dt:[${sd} TO *])`
      + `)`,
    );
  }
  if (filters.endDate) {
    const ed = toSolrDateString(filters.endDate);

    fq.push(
      `{!tag=endDate}(`
      + `startDateCOA_dt:[* TO ${ed}]`
      + ` OR ((*:* NOT startDateCOA_dt:*) AND endDateCOA_dt:[* TO ${ed}])`
      + ` OR ((*:* NOT startDateCOA_dt:*) AND (*:* NOT endDateCOA_dt:*) AND date_dt:[* TO ${ed}])`
      + `)`,
    );
  }

  // Action required flag
  if (filters.actionRequired) {
    fq.push('{!tag=actionRequired}actionRequiredByPartiesCOA_b:true');
  }

  // ---------------------------------------------------------------------------
  // Partial-match helper
  // ---------------------------------------------------------------------------
  // The `text_EN_txt` field stores **stemmed** tokens (e.g. "tentative" →
  // "tent").  Wildcards bypass the analyzer, so they run directly against
  // those stemmed tokens.
  //
  // Strategy for a term like "tenta" (5 chars):
  //   1. `tenta`  — goes through the analyzer; if the stemmer recognises it
  //                 it will match (here it doesn't → 0 hits).
  //   2. `tenta*` — wildcard on the full lowercased input.  Catches any
  //                 stemmed token starting with "tenta" (rare, but possible).
  //   3. `tent*`  — wildcard on the first 4 characters.  Catches the actual
  //                 stem "tent" (and anything else beginning with "tent").
  //
  // For exactly 4 characters ("tent"), #1 and #3 overlap but that's fine —
  // Solr deduplicates.  For < 4 characters, only the plain term is used to
  // avoid overly broad wildcard matches.
  const STEM_PREFIX_LENGTH = 4;

  function expandTermForPartialMatch(term: string): string {
    const lower = term.toLowerCase();

    if (lower.length > STEM_PREFIX_LENGTH) {
      // Longer than stem prefix — include stem-prefix wildcard as well
      const stemPrefix = lower.slice(0, STEM_PREFIX_LENGTH);
      return `(${term} OR ${lower}* OR ${stemPrefix}*)`;
    }

    if (lower.length === STEM_PREFIX_LENGTH) {
      // Exactly stem prefix length — analyzed term + wildcard
      return `(${term} OR ${lower}*)`;
    }

    // Short term (< 4 chars) — plain term only
    return term;
  }

  // Text search — the SOLR proxy does NOT support edismax (defType, qf, mm
  // are returned as nonSupportedParams and silently ignored).  Additionally,
  // wildcard queries (e.g. tentative*) bypass the text analyzer so they fail
  // to match analysed (lowercased / stemmed) index entries.
  //
  // Strategy:
  //  • Short word (<4 chars) → plain term only; the analyser handles
  //                            case/stemming.  Wildcards are too broad.
  //  • Word ≥4 chars         → "(term OR term*)" — the plain term goes
  //                            through the analyser (stemming) while the
  //                            lowercased wildcard catches partial prefixes
  //                            that the stemmer wouldn't match (e.g. "tenta"
  //                            matches "tentative" via tenta*).
  //  • Multi-word            → each token is expanded as above and joined
  //                            with AND so all terms must match.
  //  • Advanced              → user-supplied syntax (quotes, wildcards,
  //                            AND/OR/NOT) is passed through as-is.

  // Default query uses schemaType_s:scbd — all relevant docs (including
  // calendarActivity which lacks _state_s) share this field.  The _state_s
  // constraint still lives in fq so meetings/notifications must be public.
  let q = 'schemaType_s:scbd';

  if (searchText?.trim()) {
    const trimmed = searchText.trim();

    const hasQuotes = trimmed.includes('"');
    const hasWildcard = trimmed.includes('*');
    const hasBooleanOps = /\b(AND|OR|NOT)\b/.test(trimmed);
    const isMultiWord = trimmed.includes(' ');

    if (hasQuotes || hasWildcard || hasBooleanOps) {
      // User-supplied advanced syntax — pass through as-is.
      // The Lucene parser handles quotes, wildcards, and Boolean operators.
      q = trimmed;
    } else if (isMultiWord) {
      // Multi-word: expand each token and join with AND so every term
      // must appear in the document.
      const tokens = trimmed.split(/\s+/);
      q = tokens.map((t) => expandTermForPartialMatch(t)).join(' AND ');
    } else {
      // Single word — expand for partial matching.
      q = expandTermForPartialMatch(trimmed);
    }
  }

  const body: SolrSelectBody = {
    df: getTextFieldForLocale(locale),
    fq,
    q,
    sort,
    wt: 'json',
    start,
    rows,
    facet: true,
    'facet.field': Object.values(SOLR_FACET_FIELDS),
    'facet.mincount': 1,
    'facet.limit': 512,
    fl,
  };

  return body;
}

// ---------------------------------------------------------------------------
// Facet parser
// ---------------------------------------------------------------------------

/**
 * Parse raw SOLR `facet_counts` into a developer-friendly record keyed by
 * camelCase field name. Each entry is an array of `{ value, count }` pairs
 * with zero-count entries excluded.
 */
export function parseFacets(facetCounts?: SolrFacetCounts): ParsedFacets {
  const result: ParsedFacets = {};

  if (!facetCounts?.facet_fields) {
    return result;
  }

  for (const [rawField, pairs] of Object.entries(facetCounts.facet_fields)) {
    // Strip the {!ex=tag} prefix if present before normalizing
    const cleanField = rawField.replace(/^\{!ex=[^}]+\}/, '');
    const key = normalizeSolrFieldName(cleanField);
    const parsed: Array<{ value: string; count: number }> = [];

    for (let i = 0; i < pairs.length; i += 2) {
      const value = String(pairs[i]);
      const count = Number(pairs[i + 1]) || 0;
      if (count > 0) {
        parsed.push({ value, count });
      }
    }

    result[key] = parsed;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Document normalizer
// ---------------------------------------------------------------------------

/** Fields that must always be arrays on a normalized `CalendarDoc`. */
const CALENDAR_ARRAY_FIELDS: ReadonlySet<string> = new Set([
  'notifications', 'meetings', 'activities',
  'subjects', 'governingBody', 'subsidiaryBody',
  'governingBodiesCOA', 'subsidiaryBodiesCOA',
  'gbfTargets', 'gbfSections', 'decisions',
  'agendaItems', 'responsibleUnitsAndOfficers',
  'hostGovernments', 'themes', 'url', 'recipients', 'files',
]);

/**
 * Normalize a raw SOLR document into a typed `CalendarDoc`.
 *
 * Wraps the generic `normalizeSolrDocument()` with calendar-specific
 * post-processing:
 * - Ensures `id` is present (falls back to `_id`)
 * - Guarantees all known array fields are arrays (never `undefined`)
 * - Returns the discriminated union member matching `schema`
 */
export function normalizeCalendarDoc(raw: Record<string, unknown>): CalendarDoc {
  const doc = normalizeSolrDocument(raw);

  // Ensure id
  if (!doc.id && doc._id) {
    doc.id = doc._id;
  }

  // Alias COA-suffixed fields to canonical property names so the rest of the
  // codebase can continue using `doc.startDate`, `doc.endDate`, etc.
  if (doc.startDateCOA !== undefined && doc.startDate === undefined) {
    doc.startDate = doc.startDateCOA;
  }
  if (doc.endDateCOA !== undefined && doc.endDate === undefined) {
    doc.endDate = doc.endDateCOA;
  }

  // Notifications use `date_dt` (normalized to `date`) instead of
  // startDateCOA_dt / endDateCOA_dt. Promote `date` to `startDate` so
  // grouping, sorting, and display logic works uniformly across schemas.
  if (doc.schema === 'notification' && doc.date && !doc.startDate) {
    doc.startDate = doc.date;
  }
  if (doc.actionRequiredByPartiesCOA !== undefined && doc.actionRequiredByParties === undefined) {
    doc.actionRequiredByParties = doc.actionRequiredByPartiesCOA;
  }
  if (doc.governingBodiesCOA !== undefined && doc.governingBody === undefined) {
    doc.governingBody = doc.governingBodiesCOA;
  }
  if (doc.subsidiaryBodiesCOA !== undefined && doc.subsidiaryBody === undefined) {
    doc.subsidiaryBody = doc.subsidiaryBodiesCOA;
  }

  // calendarActivity docs store status in `activityStatus_s` (thesaurus ID)
  // rather than `status_s`. Promote it to the canonical `status` field so
  // cards, tables, and other display logic find it in a single place.
  if (doc.schema === 'calendarActivity' && doc.activityStatus && !doc.status) {
    doc.status = doc.activityStatus;
  }

  // Ensure array fields are always arrays
  for (const field of CALENDAR_ARRAY_FIELDS) {
    if (!Array.isArray(doc[field])) {
      doc[field] = doc[field] != null ? [doc[field]] : [];
    }
  }

  return doc as unknown as CalendarDoc;
}

// ===========================================================================
// DEPRECATED — legacy helpers retained for backward compatibility
// ===========================================================================

/** @deprecated Use `buildCalendarQuery()` instead — will be removed in Phase 05. */
export function buildSelectBody(options: QueryOptions = {}): SolrSelectBody {
  const locale: LocaleCode = options.locale ?? 'en';
  const schema = options.schema ?? 'meeting';
  const start = options.start ?? 0;
  const rows = options.rows ?? 1000;
  // Resolve search field(s)
  const localizedSearch = localizeFields(options.searchField, locale);
  const df = typeof localizedSearch === 'string'
    ? localizedSearch
    : getTextFieldForLocale(locale);

  const fq: string[] = [
    '(_state_s:public OR (*:* NOT _state_s:*))',
    `{!tag=schema}schema_s:(${schema})`,
    '{!tag=version}(*:* NOT version_s:*)',
    '{!tag=schemaType}schemaType_s:scbd',
    '{!tag=excludeSchemas}(*:* NOT schema_s : (submission))',
  ];

  // by default query everything; when sinceUpdatedDateISO provided, constrain updatedDate_dt
  const q = options.sinceUpdatedDateISO
    ? `updatedDate_dt:[ ${toSolrDateString(options.sinceUpdatedDateISO)} TO * ]`
    : 'schemaType_s:scbd';

  const body: SolrSelectBody = {
    df,
    fq,
    q,
    sort: 'updatedDate_dt desc',
    wt: 'json',
    start,
    rows,
    facet: true,
    'facet.field': [
      '{!ex=schemaType}schemaType_s',
      '{!ex=schema,schemaType,schemaSub}schema_s',
      '{!ex=government}countryRegions_ss',
      '{!ex=keywords}all_terms_ss',
      '{!ex=region}countryRegions_REL_ss',
    ],
    'facet.mincount': 1,
    'facet.limit': 512,
  'facet.pivot': 'schema_s, all_Terms_ss',
  };

  // If multiple search fields were provided, enable edismax and set qf
  if (Array.isArray(localizedSearch) && localizedSearch.length) {
    body.defType = 'edismax';
    body.qf = localizedSearch.join(' ');
  }

  return body;
}

/** @deprecated Will be removed in Phase 05. */
export async function fetchMeetingsUpdatedSince(
  locale: LocaleCode = 'en',
  sinceUpdatedDateISO?: string,
) {
  const body = buildSelectBody({ locale, schema: 'meeting', sinceUpdatedDateISO });
  const { data, error } = useQueryIndex(body);

  if (error.value) {
    throw new Error(`Solr query failed: ${error.value.message || error.value}`);
  }
  return data.value!;
}

/** @deprecated Will be removed in Phase 05. */
export function collectAllFieldNames(docs: Array<Record<string, unknown>>): string[] {
  const set = new Set<string>();

  for (const doc of docs) {
    Object.keys(doc).forEach((k) => set.add(k));
  }
  return Array.from(set).sort();
}

/**
 * Convert a date string (ISO date or datetime) to a SOLR-compatible datetime.
 *
 * SOLR expects `YYYY-MM-DDTHH:mm:ssZ`. When the input is a bare date such as
 * `2026-02-15` (from Luxon `toISODate()`), we append `T00:00:00Z`.  Full ISO
 * strings that already include a time component are returned as-is.
 *
 * No backslash-escaping is performed — it is unnecessary for JSON POST bodies
 * and causes double-escaping that makes the query a bad request.
 */
export function toSolrDateString(iso: string): string {
  // Already a full datetime (contains 'T')
  if (iso.includes('T')) {
    return iso.endsWith('Z') ? iso : `${iso}Z`;
  }

  return `${iso}T00:00:00Z`;
}

/** @deprecated Use `toSolrDateString` instead. */
export const escapeSolrDate = toSolrDateString;
