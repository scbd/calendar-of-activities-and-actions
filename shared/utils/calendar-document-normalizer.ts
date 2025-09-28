import { normalizeSolrDocument } from '../services/solr';
import type { CalendarDoc } from '../types/calendar';
import { parseFlexibleDate } from './date';
import { normalizeStatusKey, normalizeStatusLabel } from './status';
import { slugify, splitValues } from './text';

export type SnapshotMeeting = Record<string, unknown>;
export type SnapshotActivity = Record<string, unknown>;

export type MarkdownRow = Record<string, string>;

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
 * Parse a markdown table string into structured rows.
 * @param raw - Markdown table content.
 * @returns Array of rows keyed by header titles.
 */
export function parseMarkdownTable(raw: string): MarkdownRow[] {
  const lines = raw.split('\n').filter(line => line.trim().startsWith('|'));

  if (lines.length < 3) {
    return [];
  }

  const headerLine = lines[0];

  if (!headerLine) return [];
  const headerCells = headerLine.split('|').map(cell => cell.trim());
  const header = headerCells.slice(1, headerCells.length - 1);
  const dataLines = lines.slice(2);
  const rows: MarkdownRow[] = [];

  for (const line of dataLines) {
    const cells = line.split('|').map(cell => cell.trim());

    if (cells.length < header.length + 2) continue;
    const row: MarkdownRow = {};

    for (let i = 0; i < header.length; i += 1) {
      const key = header[i]!;

      row[key] = cells[i + 1] ?? '';
    }
    if (!row.Title) continue;
    rows.push(row);
  }

  return rows;
}

/**
 * Map a markdown table row to a normalized calendar document.
 * @param row - Markdown row data.
 * @param index - Row index used for deterministic IDs.
 * @param sourceId - Optional source identifier.
 * @returns Normalized calendar document.
 */
export function mapMarkdownRowToDoc(row: MarkdownRow, index: number, sourceId: string = 'markdown:2024-12-01'): CalendarDoc {
  const subjects = splitValues(row['Subject']);
  const bodies = splitValues(row['Associatedbody']);
  const relatedDocs = splitValues(row['Related_documents']);
  const actors = splitValues(row['Actors']);
  const targets = splitValues(row['GBF_Targets']);
  const countries = splitValues(row['Country'] || row['Countries']);

  const startDate = parseFlexibleDate(row['Startdate']);
  const endDate = parseFlexibleDate(row['Enddate']);

  const slug = slugify(row['Title'] || `calendar-item-${index}`);
  const id = `markdown-${slug}-${index}`;

  const rawStatus = row['Status'] || '';
  const statusKey = normalizeStatusKey(rawStatus);
  const statusLabel = normalizeStatusLabel(statusKey, rawStatus);

  const baseRecord: Record<string, unknown> = {
    id,
    identifier: id,
    source: sourceId,
    title: row['Title'],
    titleEn: row['Title'],
    description: row['Description'] || null,
    type: String(row['Type'] || 'Activity'),
    actionRequired: row['Action Required by Parties']?.toUpperCase() === 'Y',
    subjects,
    subjectEn: subjects.join(', '),
    status: statusLabel,
    statusKey: statusKey ?? null,
    statusNarrative: row['Status_narrative'] || null,
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined,
    subsidiaryBody: bodies[0] ?? null,
    subsidiaryBodies: bodies,
    copDecision: row['COPDecision'] || undefined,
    copParagraph: row['COPParagraph_no'] || undefined,
    responsibleUnit: row['Responsible_Unit'] || undefined,
    responsibleOfficer: row['Responsible_Officer'] || undefined,
    fundingSource: row['Funding_source'] || undefined,
    fundingAllocated: row['Funding_allocated'] || undefined,
    actors,
    actorsComments: row['Actors_comments'] || undefined,
    gbfTargets: targets,
    relatedDocuments: relatedDocs,
    links: [] as string[],
    country: countries[0] ?? undefined,
    countries,
    countryEn: countries[0] ?? undefined,
    countriesEn: countries,
    outcome: row['Outcome'] || undefined,
  };

  const normalizedRecord = normalizeSolrDocument(baseRecord);
  const doc = {
    ...normalizedRecord,
    id,
    source: sourceId,
    subjects,
    subsidiaryBodies: bodies,
    links: Array.isArray(normalizedRecord['links']) ? normalizedRecord['links'] as string[] : [],
    status: statusLabel,
    statusKey,
    statusNarrative: row['Status_narrative'] || null,
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined,
    actors,
    gbfTargets: targets,
    relatedDocuments: relatedDocs,
    countries,
    countriesEn: countries,
    country: countries[0] ?? undefined,
    countryEn: countries[0] ?? undefined,
    outcome: row['Outcome'] || undefined,
    actionRequired: row['Action Required by Parties']?.toUpperCase() === 'Y',
  } as CalendarDoc;

  delete (doc as Record<string, unknown>)._id;
  rawDocMap.set(doc, baseRecord);

  if (!doc.type) {
    doc.type = String(row['Type'] || 'Activity');
  }
  if (!doc.title && typeof row['Title'] === 'string') {
    doc.title = row['Title'];
  }

  return doc;
}

/**
 * Convert markdown table content into normalized calendar documents.
 * @param raw - Markdown table markup.
 * @returns Array of normalized documents.
 */
export function buildDocsFromMarkdown(raw: string): CalendarDoc[] {
  const rows = parseMarkdownTable(raw);

  return rows.map((row, index) => mapMarkdownRowToDoc(row, index));
}

/**
 * Convert snapshot activity records to normalized documents.
 * @param records - Snapshot activities.
 * @returns Array of normalized calendar documents.
 */
export function buildDocsFromActivities(records: SnapshotActivity[]): CalendarDoc[] {
  return records.map((record, index) => {
    const row: MarkdownRow = {
      Title: record.title ? String(record.title) : '',
      Description: record.description ? String(record.description) : '',
      Type: record.type ? String(record.type) : '',
      'Action Required by Parties': record.actionRequiredByParties ? String(record.actionRequiredByParties) : '',
      Subject: record.subject ? String(record.subject) : '',
      Status: record.status ? String(record.status) : '',
      Status_narrative: record.statusNarrative ? String(record.statusNarrative) : '',
      Startdate: record.startDate ? String(record.startDate) : '',
      Enddate: record.endDate ? String(record.endDate) : '',
      Associatedbody: record.associatedBody ? String(record.associatedBody) : '',
      AgendaItem: record.agendaItem ? String(record.agendaItem) : '',
      COPDecision: record.copDecision ? String(record.copDecision) : '',
      COPParagraph_no: record.copParagraphNo ? String(record.copParagraphNo) : '',
      COPParagraph_type: record.copParagraphType ? String(record.copParagraphType) : '',
      Responsible_Unit: record.responsibleUnit ? String(record.responsibleUnit) : '',
      Responsible_Officer: record.responsibleOfficer ? String(record.responsibleOfficer) : '',
      Funding_source: record.fundingSource ? String(record.fundingSource) : '',
      Funding_allocated: record.fundingAllocated ? String(record.fundingAllocated) : '',
      Actors: record.actors ? String(record.actors) : '',
      Actors_comments: record.actorsComments ? String(record.actorsComments) : '',
      GBF_Targets: record.gbfTargets ? String(record.gbfTargets) : '',
      Related_documents: record.relatedDocuments ? String(record.relatedDocuments) : '',
      Outcome: record.outcome ? String(record.outcome) : '',
      Country: record.country ? String(record.country) : '',
      Countries: record.countries ? String(record.countries) : '',
    };

    return mapMarkdownRowToDoc(row, index, 'activities-json:25-26');
  });
}
