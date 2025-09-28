import { DateTime } from 'luxon';
import type { CalendarDoc } from '../types/calendar';
import { getDocStringValue } from './document-processing';
import { safeDate } from './date';

type TranslateExists = (key: string) => boolean;
type Translate = (key: string) => unknown;

let translationExists: TranslateExists | null = null;
let translate: Translate | null = null;

/**
 * Configure translation helpers used when resolving status labels.
 * @param options - Optional translation utilities.
 */
export function configureStatusLocalization(options: { te?: TranslateExists; t?: Translate }): void {
  translationExists = options.te ?? null;
  translate = options.t ?? null;
}

/**
 * Normalize a status label to an uppercase key used for filtering.
 * @param label - Raw status label.
 * @returns Normalized status key.
 */
export function normalizeStatusKey(label: string | undefined): string | null {
  if (!label) return null;
  const value = String(label).trim().toLowerCase();

  if (!value) return null;
  if (value === 'confirmed') return 'CONFIRM';
  return value.replace(/\s+/g, '_').toUpperCase();
}

/**
 * Produce a localized status label when possible.
 * @param key - Normalized status key.
 * @param fallback - Optional fallback label.
 * @returns Display label.
 */
export function normalizeStatusLabel(key: string | null | undefined, fallback?: string): string {
  if (key) {
    const normalized = String(key).toLowerCase();
    const translationKey = `calendar.status.${normalized}`;

    if (translationExists?.(translationKey)) {
      const result = translate?.(translationKey);

      if (typeof result === 'string' && result.trim().length > 0) {
        return result.trim();
      }
    }

    if (normalized === 'confirm') {
      const result = translate?.('calendar.status.confirmed');

      if (typeof result === 'string' && result.trim().length > 0) {
        return result.trim();
      }
    }
  }

  if (typeof fallback === 'string' && fallback.trim().length > 0) {
    return fallback.trim();
  }
  return key ? String(key) : '';
}

/**
 * Determine whether a confirmed item should display as completed based on its dates.
 * @param doc - Calendar document.
 * @param statusKey - Optional status key.
 * @param rawStatus - Optional raw status label.
 * @returns True when the item should appear as completed.
 */
export function shouldDisplayCompleted(
  doc: CalendarDoc,
  statusKey: string | undefined | null,
  rawStatus?: string,
): boolean {
  const normalizedStatus = normalizeStatusKey(statusKey ?? rawStatus);

  if (normalizedStatus !== 'CONFIRM') {
    return false;
  }

  const now = DateTime.now().toUTC().startOf('day');
  const endDate = safeDate(getDocStringValue(doc, 'endDate'));

  if (endDate && now > endDate.toUTC().endOf('day')) {
    return true;
  }

  const startDate = safeDate(getDocStringValue(doc, 'startDate'));

  if (startDate) {
    const completionThreshold = startDate.toUTC().plus({ days: 1 }).endOf('day');

    if (now > completionThreshold) {
      return true;
    }
  }

  return false;
}

/**
 * Derive the bootstrap status color for a document.
 * @param doc - Calendar document.
 * @returns Bootstrap color key.
 */
export function statusColor(doc: CalendarDoc): string {
  const rawStatus = getDocStringValue(doc, 'status');
  const keyRaw = getDocStringValue(doc, 'statusKey');

  if (shouldDisplayCompleted(doc, keyRaw, rawStatus)) {
    return 'success';
  }

  const normalizedKey = keyRaw?.toUpperCase() ?? normalizeStatusKey(rawStatus) ?? '';

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
