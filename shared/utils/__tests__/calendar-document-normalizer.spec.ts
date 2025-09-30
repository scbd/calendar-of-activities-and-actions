import { describe, it, expect } from 'vitest';
import type { CalendarDoc } from '../../types/calendar';
import {
  buildDocsFromActivities,
  normalizeMeetingDoc,
  rawDocMap,
} from '../calendar-document-normalizer';

describe('calendar document normalizer', () => {
  it('normalizes meetings', () => {
    const meeting = { id: 'm1', subjects: ['Subject'], links: ['http://example.com'] };
    const doc = normalizeMeetingDoc(meeting, 0);

    expect(doc.subjects).toEqual(['Subject']);
  });

  it('builds docs from activities and stores raw data', () => {
    const activityDocs = buildDocsFromActivities([
      {
        title: 'Activity 1',
        type: 'Nominations',
        subject: 'CBD-SUBJECT-IND',
        status: 'Completed',
        startDate: '5-Mar-25',
        endDate: '11-Apr-25',
      },
    ]);

    expect(activityDocs.length).toBe(1);
    expect(activityDocs[0]?.title).toBe('Activity 1');
    expect(activityDocs[0]?.type).toBe('Nominations');
    expect(rawDocMap.get(activityDocs[0] as CalendarDoc)).toBeDefined();
  });
});
