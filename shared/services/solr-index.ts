import { normalizeWhitespace } from '../utils/text';
import {
  buildNotificationExcerpt,
  buildNotificationLink,
  parseNotificationAttachments,
  selectNotificationTitle,
  normalizeNotificationList,
} from '../utils/notifications';
import type {
  NotificationArticleRecord,
  NotificationDetails,
  NotificationKey,
  NotificationSolrDoc,
} from '../utils/notifications';
import { getSolrIndexUrl, getSolrSelectUrl, getArticlesBaseUrl } from '../utils/api-config';
import { normalizeCalendarDoc, CALENDAR_LIST_FIELDS } from './solr';
import type { CalendarDoc } from '../types/calendar';
import type { SolrResponse } from '../types/solr';

/**
 * Map of legacy Drupal node IDs → current SOLR meeting symbols.
 *
 * Some activities reference meetings by legacy numeric IDs (e.g. "006672")
 * that don't match any SOLR field (`identifier_s`, `meetingCode_s`, or
 * `symbol_s`). This map translates them so the query can resolve them.
 *
 * Add entries here when a legacy numeric meeting reference is discovered
 * that cannot be resolved by SOLR.
 */
export const LEGACY_MEETING_ID_MAP: Record<string, string> = {
  '006672': 'MMDSI-SC-03',
};

/**
 * Generic record describing SOLR query parameters.
 */
export type SolrQueryParameters = Record<string, string | number | boolean | Array<string | number> | undefined>;

/**
 * Generic SOLR select response shape.
 */
export interface SolrSelectResponse<TDoc> {
  response?: {
    docs?: TDoc[];
  };
}

/**
 * Build a SOLR select URL using the provided base and parameters.
 * @param baseUrl - SOLR select endpoint.
 * @param params - Key/value parameters to append.
 * @returns URL instance for the query.
 */
export function buildSolrSelectUrl(baseUrl: string, params: SolrQueryParameters): URL {
  const url = new URL(baseUrl);

  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    if (Array.isArray(rawValue)) {
      rawValue.forEach(value => {
        url.searchParams.append(key, String(value));
      });
      continue;
    }

    url.searchParams.set(key, String(rawValue));
  }

  return url;
}

const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 350;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(
  url: URL,
  init: RequestInit = {},
  attempts = DEFAULT_RETRY_ATTEMPTS,
  options: { acceptStatuses?: number[] } = {},
): Promise<Response> {
  let lastError: unknown;
  const acceptedStatuses = new Set(options.acceptStatuses ?? []);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, init);

      if (response.ok || acceptedStatuses.has(response.status)) {
        return response;
      }

      // Retry on server errors or rate limiting.
      if (response.status >= 500 || response.status === 429) {
        lastError = new Error(`SOLR request failed (${response.status})`);
      } else {
        throw new Error(`SOLR request failed (${response.status})`);
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts - 1) {
      await delay(DEFAULT_RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('SOLR request failed');
}

/**
 * Fetch a notification article payload.
 * @param key - Notification symbol.
 * @returns Parsed article record or null.
 */
export async function fetchNotificationArticle(key: NotificationKey): Promise<NotificationArticleRecord | null> {
  const params = new URLSearchParams();

  params.set('q', JSON.stringify({ adminTags: { $all: ['notification', key] } }));
  params.set('s', JSON.stringify({ 'meta.updatedOn': -1 }));
  params.set('fo', '1');

  const url = new URL(getArticlesBaseUrl());

  params.forEach((value, param) => {
    url.searchParams.set(param, value);
  });

  try {
    const response = await fetchWithRetry(url, { headers: { Accept: 'application/json' } }, DEFAULT_RETRY_ATTEMPTS, { acceptStatuses: [404] });

    if (response.status === 404) {
      return null;
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
  } catch (error) {
    if (error instanceof Error && /404/.test(error.message)) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch notification details from the SOLR index.
 * @param key - Notification symbol.
 * @returns Notification details when available.
 */
export async function fetchNotificationDetails(key: NotificationKey): Promise<NotificationDetails | null> {
  const trimmedKey = key.trim();

  if (!trimmedKey) {
    return null;
  }

  const url = buildSolrSelectUrl(getSolrIndexUrl(), {
    wt: 'json',
    rows: 1,
    q: `schema_s:notification AND symbol_s:"${trimmedKey}"`,
    fl: 'symbol:symbol_s,title:title_t,title_EN:title_EN_t,fulltext:fulltext_t,from:from_t,date:date_dt,url:url_ss,files:files_ss,actionDate:actionDate_dt,recipients:recipient_ss,themes:themes_ss'
  });

  const response = await fetchWithRetry(url, { headers: { Accept: 'application/json' } });
  const json = await response.json() as SolrSelectResponse<NotificationSolrDoc>;
  const doc = json.response?.docs?.[0];

  if (!doc) {
    return null;
  }

  const article = await fetchNotificationArticle(trimmedKey);
  const attachments = parseNotificationAttachments(doc.files);
  const recipients = normalizeNotificationList(doc.recipients);
  const themes = normalizeNotificationList(doc.themes);
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
    themes,
    attachments,
    link: buildNotificationLink(trimmedKey),
    article,
  } satisfies NotificationDetails;
}

// ---------------------------------------------------------------------------
// Related document fetcher
// ---------------------------------------------------------------------------

/**
 * Fetch related calendar documents from SOLR for a specific schema type.
 *
 * Makes a single SOLR request that matches documents by `identifier_s` OR
 * `meetingCode_s` (for meetings) so that references like `"CAL-ACT-2025-001"`
 * or `"CP-MOP-11"` resolve correctly.
 *
 * @param identifiers - Array of reference strings (identifiers or meeting codes).
 * @param schema - SOLR schema value: `'calendarActivity'` or `'meeting'`.
 * @returns Normalized `CalendarDoc[]` for the matching documents.
 */
export async function fetchRelatedDocsBySchema(
  identifiers: string[],
  schema: 'calendarActivity' | 'meeting',
): Promise<CalendarDoc[]> {
  if (!identifiers.length) {
    return [];
  }

  const normalizedIdentifiers = identifiers.map(id =>
    (schema === 'meeting' && LEGACY_MEETING_ID_MAP[id]) ? LEGACY_MEETING_ID_MAP[id] : id,
  );

  // De-duplicate after mapping (in case the same meeting is referenced
  // by both its legacy ID and its symbol).
  const uniqueIdentifiers = [...new Set(normalizedIdentifiers)];

  // Build an OR query across identifier_s, meetingCode_s and symbol_s
  // (meetings use short codes like "CP-MOP-11" stored in meetingCode_s
  // and symbols like "SBI-06" stored in symbol_s).
  const escaped = uniqueIdentifiers.map(id => `"${id}"`);
  const identifierClause = `identifier_s:(${escaped.join(' OR ')})`;
  const meetingCodeClause = schema === 'meeting'
    ? ` OR meetingCode_s:(${escaped.join(' OR ')}) OR symbol_s:(${escaped.join(' OR ')})`
    : '';

  const q = `schema_s:${schema} AND (${identifierClause}${meetingCodeClause})`;

  const endpoint = getSolrSelectUrl();

  const body = {
    q,
    wt: 'json',
    rows: uniqueIdentifiers.length,
    start: 0,
    fl: CALENDAR_LIST_FIELDS,
    fq: [
      '(_state_s:public OR (*:* NOT _state_s:*))',
      'schemaType_s:scbd',
    ],
  };

  const response = await $fetch<SolrResponse>(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const rawDocs = response?.response?.docs ?? [];

  return rawDocs.map(raw => normalizeCalendarDoc(raw as Record<string, unknown>));
}
