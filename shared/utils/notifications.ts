import type { CalendarDoc } from '../types/calendar';
import { normalizeSolrDocument } from '../services/solr';
import { rawDocMap } from './calendar-document-normalizer';
import { coerceIsoDate } from './date';
import { htmlToText, normalizeWhitespace } from './text';

export const NOTIFICATION_BASE_URL = 'https://www.cbd.int';

export type NotificationKey = string;

export interface NotificationAttachment {
  name?: string;
  url: string;
  type?: string;
  language?: string;
}

export interface NotificationSolrDoc {
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

export interface NotificationArticleRecord {
  content?: Record<string, string | undefined>;
  summary?: Record<string, string | undefined>;
  title?: Record<string, string | undefined>;
}

export interface NotificationDetails {
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

export interface NotificationDisplayEntry {
  key: NotificationKey;
  details?: NotificationDetails;
  loading: boolean;
  error?: string;
}

export interface NotificationSnapshotRecord extends Record<string, unknown> {
  symbol?: string;
  url?: string;
  urls?: string[];
  files?: Array<{
    url?: string;
    name?: string;
    type?: string;
    language?: string;
  }>;
  recipients?: string[];
  themes?: string[];
  actionDate?: string;
  deadline?: string;
  date?: string;
  createdDate?: string;
  updatedDate?: string;
  sender?: string;
  title?: string;
  titleEn?: string;
}

const notificationKeyCache = new WeakMap<CalendarDoc, NotificationKey[]>();

let getDetailsStore: () => Record<NotificationKey, NotificationDetails> = () => ({});
let getLoadingStore: () => Record<NotificationKey, boolean> = () => ({});
let getErrorStore: () => Record<NotificationKey, string> = () => ({});

/**
 * Configure reactive stores used for display entries.
 * @param stores - Accessors returning the current notification maps.
 */
export function setNotificationStores(stores: {
  getDetails: () => Record<NotificationKey, NotificationDetails>;
  getLoading: () => Record<NotificationKey, boolean>;
  getErrors: () => Record<NotificationKey, string>;
}): void {
  getDetailsStore = stores.getDetails;
  getLoadingStore = stores.getLoading;
  getErrorStore = stores.getErrors;
}

/**
 * Normalize notification recipient/thematic lists.
 * @param value - List of recipients or thematic areas.
 * @returns Normalized array of unique strings.
 */
export function normalizeNotificationList(value: unknown): string[] {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  const normalized = values
    .map(entry => String(entry).trim())
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

/**
 * Resolve a notification URL against the CBD domain.
 * @param path - Path or absolute URL.
 * @returns Absolute URL string.
 */
export function resolveNotificationUrl(path: string): string {
  try {
    return new URL(path, NOTIFICATION_BASE_URL).toString();
  } catch {
    return path;
  }
}

/**
 * Derive a filename from a URL when the name is missing.
 * @param url - Attachment URL.
 * @returns File name.
 */
export function deriveNameFromUrl(url: string): string {
  if (!url) {
    return '';
  }

  const normalized = url.split('?')[0] ?? url;
  const segments = normalized.split('/').filter(Boolean);

  return segments.length > 0 ? segments[segments.length - 1] ?? url : url;
}

/**
 * Build the canonical link for a notification symbol.
 * @param key - Notification symbol.
 * @returns Absolute URL for the notification page.
 */
export function buildNotificationLink(key: NotificationKey): string {
  return resolveNotificationUrl(`/notifications/${key}`);
}

/**
 * Convert notification attachment metadata from SOLR documents.
 * @param files - Raw file entries from SOLR.
 * @returns Array of attachment objects.
 */
export function parseNotificationAttachments(files?: string[]): NotificationAttachment[] {
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
        const url = typeof candidate.url === 'string'
          ? candidate.url
          : typeof candidate.link === 'string'
            ? candidate.link
            : '';

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

/**
 * Determine the title to display for a notification.
 * @param key - Notification symbol.
 * @param doc - SOLR document.
 * @param article - Optional article record.
 * @returns Title string.
 */
export function selectNotificationTitle(
  key: NotificationKey,
  doc: NotificationSolrDoc,
  article: NotificationArticleRecord | null,
): string {
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

  return `Notification ${key}`;
}

/**
 * Build a short excerpt from HTML or plain text content.
 * @param source - Raw content.
 * @returns Excerpt text.
 */
export function buildNotificationExcerpt(source: string | null | undefined): string | undefined {
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

/**
 * Convert snapshot notification records to normalized documents and seeded details.
 * @param records - Notification snapshot records.
 * @returns Normalized documents and pre-built details.
 */
export function buildDocsFromNotifications(
  records: NotificationSnapshotRecord[],
): { docs: CalendarDoc[]; details: Record<NotificationKey, NotificationDetails> } {
  const docs: CalendarDoc[] = [];
  const details: Record<NotificationKey, NotificationDetails> = {};

  records.forEach((record, index) => {
    const doc = mapNotificationRecordToDoc(record, index);

    docs.push(doc);

    const key = doc.notificationKey;

    if (key) {
      const detail = buildNotificationDetailsFromSnapshot(record, key);

      if (detail) {
        details[key] = detail;
      }
    }
  });

  return { docs, details };
}

/**
 * Convert a snapshot notification record to a normalized calendar document.
 * @param record - Snapshot record.
 * @param index - Array index used for fallback identifiers.
 * @returns Normalized calendar document.
 */
export function mapNotificationRecordToDoc(record: NotificationSnapshotRecord, index: number): CalendarDoc {
  const normalized = normalizeSolrDocument(record as Record<string, unknown>);
  const idCandidate = normalized['id'] ?? normalized['identifier'] ?? `notification-${index}`;
  const id = String(idCandidate);
  const symbolRaw = normalized['symbol'];
  const symbol = typeof symbolRaw === 'string' ? symbolRaw.trim() : '';
  const publishedOn = coerceIsoDate(normalized['date'] ?? normalized['createdDate'] ?? normalized['updatedDate']);
  const actionDate = coerceIsoDate(normalized['actionDate']);
  const deadline = coerceIsoDate(normalized['deadline']);
  const startDateIso = publishedOn ?? actionDate ?? deadline ?? undefined;
  const completionIso = actionDate ?? deadline ?? undefined;
  const endDateIso = completionIso && completionIso !== startDateIso ? completionIso : undefined;

  const recipients = normalizeNotificationList(normalized['recipients']);
  const themes = normalizeNotificationList(normalized['themes'] ?? normalized['thematicAreas']);

  const urls = Array.isArray(normalized['urls'])
    ? Array.from(new Set(
      (normalized['urls'] as unknown[])
        .map(entry => String(entry).trim())
        .filter(Boolean)
        .map(entry => resolveNotificationUrl(entry)),
    ))
    : [];

  const doc: CalendarDoc = {
    ...normalized,
    id,
    identifier: normalized['identifier'] ?? id,
    type: 'Notification',
    schema: 'notification',
    title: normalized['titleEn'] ?? normalized['title'] ?? (symbol || id),
    titleEn: normalized['titleEn'] ?? normalized['title'] ?? (symbol || id),
    status: (normalized['status'] as string | undefined) ?? 'Published',
    statusKey: (normalized['statusKey'] as string | undefined) ?? 'PUBLISHED',
    startDate: startDateIso,
    endDate: endDateIso,
    publishedDate: publishedOn ?? undefined,
    actionDate: actionDate ?? undefined,
    deadline: deadline ?? undefined,
    actionRequired: Boolean(actionDate ?? deadline),
    subjects: themes,
    recipients,
    responsibleOfficer: typeof normalized['sender'] === 'string'
      ? normalized['sender']
      : undefined,
    notificationKey: symbol || undefined,
    notificationKeys: symbol ? [symbol] : [],
    notificationSymbol: symbol || undefined,
    links: urls.length > 0
      ? urls
      : symbol
        ? [buildNotificationLink(symbol)]
        : [],
  } as CalendarDoc;

  if (!doc.statusNarrative && typeof normalized['reference'] === 'string') {
    const reference = normalized['reference'].trim();

    if (reference) {
      doc.statusNarrative = reference;
    }
  }

  rawDocMap.set(doc, record as Record<string, unknown>);
  return doc;
}

/**
 * Build notification details from snapshot data for seeding state.
 * @param record - Snapshot record.
 * @param key - Notification symbol.
 * @returns Notification details or null.
 */
export function buildNotificationDetailsFromSnapshot(
  record: NotificationSnapshotRecord,
  key: NotificationKey,
): NotificationDetails | null {
  const symbol = key.trim();

  if (!symbol) {
    return null;
  }

  const publishedOn = coerceIsoDate((record as Record<string, unknown>)['date'] ?? record.date ?? record.createdDate ?? record.updatedDate);
  const actionDeadline = coerceIsoDate((record as Record<string, unknown>)['actionDate'] ?? record.actionDate ?? record.deadline);
  const recipients = normalizeNotificationList(record.recipients);
  const thematicAreas = normalizeNotificationList(record.themes);
  const attachments = Array.isArray(record.files)
    ? record.files
      .map(file => {
        const resolvedUrl = resolveNotificationUrl(file?.url ?? '');

        if (!resolvedUrl) {
          return null;
        }

        return {
          name: file?.name ?? deriveNameFromUrl(resolvedUrl),
          url: resolvedUrl,
          type: file?.type,
          language: file?.language,
        } satisfies NotificationAttachment;
      })
      .filter((attachment): attachment is NotificationAttachment => Boolean(attachment?.url))
    : [];

  const link = Array.isArray(record.urls) && record.urls[0]
    ? resolveNotificationUrl(record.urls[0]!)
    : buildNotificationLink(symbol);

  return {
    key: symbol,
    title: record.titleEn ?? record.title ?? symbol,
    excerpt: undefined,
    fullText: undefined,
    from: record.sender && String(record.sender).trim() ? String(record.sender).trim() : undefined,
    publishedOn,
    actionDeadline,
    actionRequired: Boolean(record.actionDate ?? record.deadline),
    recipients,
    thematicAreas,
    attachments,
    link,
    article: null,
  } satisfies NotificationDetails;
}

/**
 * Get distinct notification keys from a calendar document.
 * @param doc - Calendar document.
 * @returns Unique notification keys.
 */
export function getNotificationKeys(doc: CalendarDoc): NotificationKey[] {
  const cached = notificationKeyCache.get(doc);

  if (cached) {
    return cached;
  }

  const keys: NotificationKey[] = [];
  const seen = new Set<NotificationKey>();

  const collect = (value: unknown) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        keys.push(trimmed);
      }
    }
    if (Array.isArray(value)) {
      value.forEach(entry => collect(entry));
    }
  };

  collect(doc.notificationKey);
  collect(doc.notificationSymbol);
  collect(doc.notificationKeys);

  const raw = rawDocMap.get(doc);

  if (raw) {
    collect((raw as Record<string, unknown>)['notificationKey']);
    collect((raw as Record<string, unknown>)['notificationKeys']);
    collect((raw as Record<string, unknown>)['notificationSymbol']);
    collect((raw as Record<string, unknown>)['symbol']);
  }

  notificationKeyCache.set(doc, keys);
  return keys;
}

/**
 * Build display entries for notifications based on configured stores.
 * @param doc - Calendar document.
 * @returns Display entries with loading/error metadata.
 */
export function notificationDisplayEntries(doc: CalendarDoc): NotificationDisplayEntry[] {
  // Notifications cannot have sub-notifications
  if (doc.schema === 'notification') {
    return [];
  }
  const keys = getNotificationKeys(doc);

  if (keys.length === 0) {
    return [];
  }

  const detailsMap = getDetailsStore();
  const loadingMap = getLoadingStore();
  const errorsMap = getErrorStore();

  return keys.map(key => ({
    key,
    details: detailsMap[key],
    loading: Boolean(loadingMap[key]),
    error: errorsMap[key],
  }));
}
