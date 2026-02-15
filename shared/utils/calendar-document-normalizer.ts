/**
 * Calendar document normalizer — DEPRECATED.
 *
 * Documents are now normalized by `normalizeCalendarDoc()` in `shared/services/solr.ts`.
 * This module is retained only for backward-compatible imports during the migration.
 * All exported symbols will be removed in Phase 05.
 *
 * @deprecated — Use `normalizeCalendarDoc()` from `shared/services/solr` instead.
 */

import type { CalendarDoc } from '../types/calendar';

/** @deprecated No longer used — documents are normalized in the SOLR service layer. */
export type SnapshotMeeting = Record<string, unknown>;
/** @deprecated No longer used — documents are normalized in the SOLR service layer. */
export type SnapshotActivity = Record<string, unknown>;

/**
 * @deprecated rawDocMap is no longer used — SOLR documents are pre-normalized
 * by `normalizeCalendarDoc()`. Retained as a no-op export for backward compat.
 */
export const rawDocMap = new WeakMap<CalendarDoc, Record<string, unknown>>();

/**
 * @deprecated Use `normalizeCalendarDoc()` from `shared/services/solr` instead.
 * Returns the input cast to CalendarDoc to avoid breaking callers during migration.
 */
export function normalizeMeetingDoc(meeting: SnapshotMeeting, _index: number): CalendarDoc {
  console.warn('[calendar-document-normalizer] normalizeMeetingDoc() is deprecated — use normalizeCalendarDoc() from shared/services/solr');
  return meeting as unknown as CalendarDoc;
}

/**
 * @deprecated Activities now come from SOLR — use `normalizeCalendarDoc()`.
 * Returns an empty array to avoid breaking callers during migration.
 */
export function buildDocsFromActivities(_records: SnapshotActivity[]): CalendarDoc[] {
  console.warn('[calendar-document-normalizer] buildDocsFromActivities() is deprecated — activities are fetched from SOLR');
  return [];
}
