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
}

export const getTextFieldForLocale = (locale: LocaleCode = 'en'): string => {
  return `text_${locale.toUpperCase()}_txt`;
};

export const getTitleFieldForLocale = (locale: LocaleCode = 'en'): string => {
  // Common title field pattern across CBD indexes
  return `title_${locale.toUpperCase()}_t`;
};

export function buildSelectBody(options: QueryOptions = {}): SolrSelectBody {
  const locale: LocaleCode = options.locale ?? 'en';
  const schema = options.schema ?? 'meeting';
  const start = options.start ?? 0;
  const rows = options.rows ?? 1000;
  const df = getTextFieldForLocale(locale);

  const fq: string[] = [
    '_state_s:public',
    `{!tag=schema}schema_s:(${schema})`,
    '{!tag=version}(*:* NOT version_s:*)',
    '{!tag=schemaType}schemaType_s:scbd',
    '{!tag=excludeSchemas}(*:* NOT schema_s : (submission))',
  ];

  // updatedDate filter as in the example; if not provided, query everything
  const q = options.sinceUpdatedDateISO
    ? `((updatedDate_dt:[ ${escapeSolrDate(options.sinceUpdatedDateISO)} TO * ]))`
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
  startDate_dt?: string;
  endDate_dt?: string;
  city_EN_s?: string;
  country_EN_s?: string;
  country_s?: string;
  meetingCode_s?: string;
  identifier_s?: string;
  status_s?: string;
}
