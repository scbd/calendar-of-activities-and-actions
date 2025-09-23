/**
 * Generic Solr service for CBD index queries.
 * This mirrors the approach in the online reporting tool and follows the example-index-call.
 */

import { useQueryIndex } from '../../composables/useQueryIndex';

export type LocaleCode = 'en' | 'fr' | 'es' | 'ar' | 'ru' | 'zh';

export interface SolrSelectBody {
  df: string;
  fq: string[];
  q: string;
  sort: string;
  wt: 'json';
  start: number;
  rows: number;
  facet: boolean;
  'facet.field': string[];
  'facet.mincount': number;
  'facet.limit': number;
  'facet.pivot': string;
  // Optional extras when doing multi-field queries (edismax)
  defType?: 'dismax' | 'edismax';
  qf?: string; // space-delimited fields for dismax/edismax
}

export interface SolrResponseHeader {
  status: number;
  QTime: number;
  params: Record<string, string>;
}

export interface SolrResponse<TDoc = Record<string, unknown>> {
  responseHeader: SolrResponseHeader;
  response: {
    numFound: number;
    start: number;
    docs: TDoc[];
  };
  facet_counts?: Record<string, unknown>;
}

export interface QueryOptions {
  locale?: LocaleCode;
  schema?: 'meeting' | string; // extensible for future schemas
  start?: number;
  rows?: number;
  sinceUpdatedDateISO?: string; // ISO string used in updatedDate_dt range filter
  // Where to direct text searches: a single field, or multiple
  // If multiple, we'll set defType=edismax and populate qf
  searchField?: string | string[];
}

export const getTextFieldForLocale = (locale: LocaleCode = 'en'): string => {
  return `text_${locale.toUpperCase()}_txt`;
};

export const getTitleFieldForLocale = (locale: LocaleCode = 'en'): string => {
  // Common title field pattern across CBD indexes
  return `title_${locale.toUpperCase()}_t`;
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
    '_state_s:public',
    `{!tag=schema}schema_s:(${schema})`,
    '{!tag=version}(*:* NOT version_s:*)',
    '{!tag=schemaType}schemaType_s:scbd',
    '{!tag=excludeSchemas}(*:* NOT schema_s : (submission))',
  ];

  // by default query everything; when sinceUpdatedDateISO provided, constrain updatedDate_dt
  const q = options.sinceUpdatedDateISO
    ? `updatedDate_dt:[ ${escapeSolrDate(options.sinceUpdatedDateISO)} TO * ]`
    : '*:*';

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

export function collectAllFieldNames(docs: Array<Record<string, unknown>>): string[] {
  const set = new Set<string>();
  for (const doc of docs) {
    Object.keys(doc).forEach((k) => set.add(k));
  }
  return Array.from(set).sort();
}

function escapeSolrDate(iso: string): string {
  // Escape colon characters per example payload (2025\-03\-12T00\:00\:00.000Z)
  // We also return the same ISO string if already escaped.
  return iso.replaceAll(':', '\\:').replaceAll('-', '\\-');
}

export interface MeetingDoc extends Record<string, unknown> {
  _id?: string;
  id?: string;
  startDate_dt?: string;
  endDate_dt?: string;
  city_EN_s?: string;
  country_EN_s?: string;
  country_s?: string;
  meetingCode_s?: string;
  identifier_s?: string;
  status_s?: string;
  statusKey_s?: string | null;
  description_t?: string | null;
  type_s?: string;
  links_ss?: string[];
  subjects_ss?: string[];
  subsidiaryBodies_ss?: string[];
  actionRequired_b?: boolean;
}
