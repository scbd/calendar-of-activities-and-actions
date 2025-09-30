import { normalizeSolrDocument } from '../services/solr';
import type { CalendarDoc } from '../types/calendar';
import { parseFlexibleDate } from './date';
import { normalizeStatusKey, normalizeStatusLabel } from './status';
import { slugify, splitValues } from './text';

export type SnapshotMeeting = Record<string, unknown>;
export type SnapshotActivity = Record<string, unknown>;

/**
 * WeakMap storing raw source data for normalized documents.
 */
export const rawDocMap = new WeakMap<CalendarDoc, Record<string, unknown>>();

const collectStrings = (...candidates: Array<unknown>): string[] => {
  const seen = new Set<string>();
  const collected: string[] = [];

  for (const candidate of candidates) {
    splitValues(candidate).forEach(value => {
      const trimmed = value.trim();

      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        collected.push(trimmed);
      }
    });
  }

  return collected;
};

/**
 * Normalize meeting snapshot documents using SOLR normalization helpers.
 * @param meeting - Meeting snapshot entry.
 * @param index - Position in snapshot array for stable IDs.
 * @returns Normalized calendar document.
 */
export function normalizeMeetingDoc(meeting: SnapshotMeeting, index: number): CalendarDoc {
  const record = { ...(meeting as Record<string, unknown>) };
  const normalizedRecord = normalizeSolrDocument(record);
  const normalized = normalizedRecord as Record<string, unknown>;

  const subjects = collectStrings(
    normalized['subjects'],
    normalized['subjectIdentifiers'],
    normalized['subject'],
    normalized['subjectEn'],
  );

  const bodies = collectStrings(
    normalized['subsidiaryBodies'],
    normalized['subsidiaryBody'],
  );

  const links = collectStrings(
    normalized['links'],
    normalized['attachments'],
    normalized['relatedUrls'],
  );

  const actors = collectStrings(
    normalized['actors'],
    normalized['actor'],
  );

  const targets = collectStrings(
    normalized['gbfTargets'],
    normalized['globalTargets'],
  );

  const countries = collectStrings(
    normalized['country'],
    normalized['countries'],
    normalized['countryCode'],
  );

  const id = String(normalized['_id'] ?? normalized['id'] ?? `meeting-${index}`);

  const baseRecord: Record<string, unknown> = {
    ...record,
    id,
    subjects,
    subsidiaryBodies: bodies,
    links,
    actors,
    gbfTargets: targets,
    countries,
    countriesEn: countries,
  };

  const doc = {
    ...normalizedRecord,
    id,
    schema: 'meeting',
    subjects,
    subsidiaryBodies: bodies,
    links,
    actors,
    gbfTargets: targets,
    countries,
    countriesEn: countries,
  } as CalendarDoc;

  rawDocMap.set(doc, baseRecord);

  return doc;
}

/**
 * Convert snapshot activity records to normalized documents.
 * @param records - Snapshot activities.
 * @returns Array of normalized calendar documents.
 */
export function buildDocsFromActivities(records: SnapshotActivity[]): CalendarDoc[] {
  return records.map((record, index) => {
    const subjects = splitValues(record.subject);
    const bodies = splitValues(record.associatedBody);
    const relatedDocs = splitValues(record.relatedDocuments);
    const actors = splitValues(record.actors);
    const targets = splitValues(record.gbfTargets);
    const countries = splitValues(record.country || record.countries);

    const startDate = parseFlexibleDate(String(record.startDate || ''));
    const endDate = parseFlexibleDate(String(record.endDate || ''));

    const title = record.title ? String(record.title) : '';
    const slug = slugify(title || `calendar-item-${index}`);
    const id = `activity-${slug}-${index}`;

    const rawStatus = record.status ? String(record.status) : '';
    const statusKey = normalizeStatusKey(rawStatus);
    const statusLabel = normalizeStatusLabel(statusKey, rawStatus);

    const activityType = record.type ? String(record.type).trim() : undefined;

    const baseRecord: Record<string, unknown> = {
      id,
      identifier: id,
      source: 'activities-json:25-26',
      title,
      titleEn: title,
      description: record.description ? String(record.description) : null,
      type: activityType || 'Activity',
      activityType,
      actionRequired: record.actionRequiredByParties ? String(record.actionRequiredByParties).toUpperCase() === 'Y' : false,
      subjects,
      subjectEn: subjects.join(', '),
      status: statusLabel,
      statusKey: statusKey ?? null,
      statusNarrative: record.statusNarrative ? String(record.statusNarrative) : null,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
      subsidiaryBody: bodies[0] ?? null,
      subsidiaryBodies: bodies,
      copDecision: record.copDecision ? String(record.copDecision) : undefined,
      copParagraph: record.copParagraphNo ? String(record.copParagraphNo) : undefined,
      responsibleUnit: record.responsibleUnit ? String(record.responsibleUnit) : undefined,
      responsibleOfficer: record.responsibleOfficer ? String(record.responsibleOfficer) : undefined,
      fundingSource: record.fundingSource ? String(record.fundingSource) : undefined,
      fundingAllocated: record.fundingAllocated ? String(record.fundingAllocated) : undefined,
      actors,
      actorsComments: record.actorsComments ? String(record.actorsComments) : undefined,
      gbfTargets: targets,
      relatedDocuments: relatedDocs,
      links: [] as string[],
      country: countries[0] ?? undefined,
      countries,
      countryEn: countries[0] ?? undefined,
      countriesEn: countries,
      outcome: record.outcome ? String(record.outcome) : undefined,
    };

    const normalizedRecord = normalizeSolrDocument(baseRecord);
    const doc = {
      ...normalizedRecord,
      id,
      schema: 'activity',
      source: 'activities-json:25-26',
      subjects,
      subsidiaryBodies: bodies,
      links: Array.isArray(normalizedRecord['links']) ? normalizedRecord['links'] as string[] : [],
      status: statusLabel,
      statusKey,
      statusNarrative: record.statusNarrative ? String(record.statusNarrative) : null,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
      actors,
      gbfTargets: targets,
      relatedDocuments: relatedDocs,
      countries,
      countriesEn: countries,
      country: countries[0] ?? undefined,
      countryEn: countries[0] ?? undefined,
      outcome: record.outcome ? String(record.outcome) : undefined,
      actionRequired: record.actionRequiredByParties ? String(record.actionRequiredByParties).toUpperCase() === 'Y' : false,
      activityType,
    } as CalendarDoc;

    delete (doc as Record<string, unknown>)._id;
    rawDocMap.set(doc, baseRecord);

    if (!doc.type) {
      doc.type = activityType || 'Activity';
    }
    if (!doc.title && title) {
      doc.title = title;
    }

    return doc;
  });
}
