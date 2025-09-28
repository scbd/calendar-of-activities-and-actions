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

const DEFAULT_SOLR_INDEX_URL = 'https://api.cbd.int/api/v2013/index';
const DEFAULT_ARTICLE_URL = 'https://api.cbd.int/api/v2017/articles';

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

  const url = new URL(DEFAULT_ARTICLE_URL);

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

  const url = buildSolrSelectUrl(DEFAULT_SOLR_INDEX_URL, {
    wt: 'json',
    rows: 1,
    q: `schema_s:notification AND symbol_s:"${trimmedKey}"`,
    fl: 'symbol:symbol_s,title:title_t,title_EN:title_EN_t,fulltext:fulltext_t,from:from_t,date:date_dt,url:url_ss,files:files_ss,actionDate:actionDate_dt,recipients:recipient_ss,thematicAreas:thematicAreas_EN_txt'
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
  const thematicAreas = normalizeNotificationList(doc.thematicAreas);
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
