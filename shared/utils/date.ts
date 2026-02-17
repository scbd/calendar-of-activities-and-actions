import { DateTime } from 'luxon';
import type { CalendarDoc } from '../types/calendar';
import { normalizeTypeKey } from './type-colors';
import { getDocStringValue } from './document-processing';
import { normalizeStatusKey } from './status';

/**
 * Attempt to parse a loosely formatted date string from legacy datasets into ISO.
 * @param value - Source text that may include quarters or short years.
 * @returns ISO 8601 string when parsing succeeds, otherwise null.
 */
export function parseFlexibleDate(value: string | undefined): string | null {
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

/**
 * Convert potentially malformed ISO strings to normalized UTC ISO output.
 * @param value - Input value to coerce.
 * @returns UTC ISO string or undefined when coercion fails.
 */
export function coerceIsoDate(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  const raw = String(value).trim();

  if (!raw) {
    return undefined;
  }

  const dt = DateTime.fromISO(raw);

  if (!dt.isValid) {
    return undefined;
  }

  return dt.toUTC().toISO() ?? undefined;
}

/**
 * Format an ISO string for display in notification summaries.
 * @param iso - ISO date string to format.
 * @returns Formatted date (e.g., "1 Jan 2024") or null when invalid.
 */
export function formatNotificationDate(iso?: string | null): string | null {
  if (!iso) {
    return null;
  }

  const dt = DateTime.fromISO(String(iso));

  if (!dt.isValid) {
    return null;
  }

  return dt.toUTC().toFormat('d MMM yyyy');
}

/**
 * Format an ISO string for display in grid view (yyyy-MM-dd format).
 * @param iso - ISO date string to format.
 * @returns Formatted date (e.g., "2024-01-15") or null when invalid.
 */
export function formatGridDate(iso?: string | null): string | null {
  if (!iso) {
    return null;
  }

  const dt = DateTime.fromISO(String(iso));

  if (!dt.isValid) {
    return null;
  }

  return dt.toUTC().toFormat('yyyy-MM-dd');
}

/**
 * Safely parse an ISO-like value to a Luxon DateTime.
 * @param value - Candidate ISO value.
 * @returns DateTime instance when valid, otherwise null.
 */
export function safeDate(value: unknown): DateTime | null {
  if (!value) return null;
  const dt = DateTime.fromISO(String(value), { zone: 'utc' });

  return dt.isValid ? dt : null;
}

/**
 * Return the quarter number (1–4) for a given DateTime.
 */
export function getQuarter(dt: DateTime): number {
  return Math.ceil(dt.month / 3);
}

/**
 * Check whether a DateTime falls on the first day of a calendar quarter.
 */
export function isQuarterStart(dt: DateTime): boolean {
  return [1, 4, 7, 10].includes(dt.month) && dt.day === 1;
}

/**
 * Format a calendar document date range, handling notifications and meetings.
 *
 * Special rules for tentative calendar activities:
 * - Same quarter → "Q1 2026".
 * - Different quarters → "Q2 - Q3 2026" (or cross-year: "Q4 2025 - Q1 2026").
 *
 * @param doc - Calendar document.
 * @returns Human-readable date range string.
 */
export function formatDateRange(doc: CalendarDoc): string {
  const schema = getDocStringValue(doc, 'schema')?.trim().toLowerCase();
  const type = normalizeTypeKey(getDocStringValue(doc, 'type'));
  const isNotification = schema === 'notification' || type === 'notification';

  if (isNotification) {
    const notifDate = safeDate(
      getDocStringValue(doc, 'actionDate', 'date'),
    );

    if (notifDate) {
      return notifDate.toFormat('d LLLL yyyy');
    }
  }

  const start = safeDate(getDocStringValue(doc, 'startDate'));
  const end = safeDate(getDocStringValue(doc, 'endDate'));

  // Tentative calendar activities: display quarter labels
  if (schema === 'calendaractivity' && start && end) {
    const statusKey = normalizeStatusKey(
      getDocStringValue(doc, 'statusKey') ?? getDocStringValue(doc, 'status'),
    );

    if (statusKey === 'TENTATIVE') {
      const startQ = getQuarter(start);
      const endQ = getQuarter(end);

      if (startQ === endQ && start.year === end.year) {
        return `Q${startQ} ${start.year}`;
      }

      if (start.year === end.year) {
        return `Q${startQ} - Q${endQ} ${start.year}`;
      }

      return `Q${startQ} ${start.year} - Q${endQ} ${end.year}`;
    }
  }

  if (start && end) {
    if (start.hasSame(end, 'day')) return start.toFormat('d LLLL yyyy');
    if (start.month === end.month && start.year === end.year) {
      return `${start.toFormat('d')} - ${end.toFormat('d LLLL yyyy')}`;
    }
    if (start.year === end.year) {
      return `${start.toFormat('d LLLL')} - ${end.toFormat('d LLLL yyyy')}`;
    }
    return `${start.toFormat('d LLLL yyyy')} - ${end.toFormat('d LLLL yyyy')}`;
  }
  if (start) return start.toFormat('d LLLL yyyy');
  if (end) return end.toFormat('d LLLL yyyy');
  return '';
}

/**
 * Format a calendar document date range for grid view (yyyy-MM-dd format).
 * @param doc - Calendar document.
 * @returns Date range string in yyyy-MM-dd format.
 */
export function formatGridDateRange(doc: CalendarDoc): string {
  const schema = getDocStringValue(doc, 'schema')?.trim().toLowerCase();
  const type = normalizeTypeKey(getDocStringValue(doc, 'type'));
  const isNotification = schema === 'notification' || type === 'notification';

  if (isNotification) {
    const notifDate = safeDate(
      getDocStringValue(doc, 'actionDate', 'date'),
    );

    if (notifDate) {
      return notifDate.toFormat('yyyy-MM-dd');
    }
  }

  const start = safeDate(getDocStringValue(doc, 'startDate'));
  const end = safeDate(getDocStringValue(doc, 'endDate'));

  // Tentative calendar activities: display quarter labels (same as formatDateRange)
  if (schema === 'calendaractivity' && start && end) {
    const statusKey = normalizeStatusKey(
      getDocStringValue(doc, 'statusKey') ?? getDocStringValue(doc, 'status'),
    );

    if (statusKey === 'TENTATIVE') {
      const startQ = getQuarter(start);
      const endQ = getQuarter(end);

      if (startQ === endQ && start.year === end.year) {
        return `Q${startQ} ${start.year}`;
      }

      if (start.year === end.year) {
        return `Q${startQ} - Q${endQ} ${start.year}`;
      }

      return `Q${startQ} ${start.year} - Q${endQ} ${end.year}`;
    }
  }

  if (start && end) {
    if (start.hasSame(end, 'day')) return start.toFormat('yyyy-MM-dd');
    return `${start.toFormat('yyyy-MM-dd')} – ${end.toFormat('yyyy-MM-dd')}`;
  }
  if (start) return start.toFormat('yyyy-MM-dd');
  if (end) return end.toFormat('yyyy-MM-dd');
  return '';
}
