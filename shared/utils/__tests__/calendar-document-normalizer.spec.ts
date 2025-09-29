import { describe, it, expect } from 'vitest';
import type { CalendarDoc } from '../../types/calendar';
import {
  buildDocsFromActivities,
  buildDocsFromMarkdown,
  mapMarkdownRowToDoc,
  normalizeMeetingDoc,
  parseMarkdownTable,
  rawDocMap,
} from '../calendar-document-normalizer';

describe('calendar document normalizer', () => {
  it('parses markdown tables', () => {
    const rows = parseMarkdownTable('| Title |\n| --- |\n| Example |');

    expect(rows.length).toBe(1);
    expect(rows[0]?.Title).toBe('Example');
  });

  it('maps markdown rows to docs and stores raw data', () => {
    const row = { Title: 'Item', Type: 'Activity' } as Record<string, string>;
    const doc = mapMarkdownRowToDoc(row, 0);

    expect(doc.title).toBe('Item');
    expect(rawDocMap.get(doc as CalendarDoc)).toBeDefined();
  });

  it('normalizes meetings', () => {
    const meeting = { id: 'm1', subjects: ['Subject'], links: ['http://example.com'] };
    const doc = normalizeMeetingDoc(meeting, 0);

    expect(doc.subjects).toEqual(['Subject']);
  });

  it('builds docs from markdown and activities', () => {
    const markdownDocs = buildDocsFromMarkdown('| Title |\n| --- |\n| Example |');

    expect(markdownDocs.length).toBe(1);

    const activityDocs = buildDocsFromActivities([{ title: 'Activity 1' }]);

    expect(activityDocs.length).toBe(1);
  });
});
