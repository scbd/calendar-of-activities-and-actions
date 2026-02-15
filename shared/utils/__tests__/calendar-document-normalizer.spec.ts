import { describe, it, expect } from 'vitest';
import {
  buildDocsFromActivities,
  normalizeMeetingDoc,
  rawDocMap,
} from '../calendar-document-normalizer';

describe('calendar document normalizer (deprecated stubs)', () => {
  it('rawDocMap is a WeakMap (noop)', () => {
    expect(rawDocMap).toBeInstanceOf(WeakMap);
  });

  it('normalizeMeetingDoc returns a stub (deprecated)', () => {
    const meeting = { id: 'm1', subjects: ['Subject'], links: ['http://example.com'] };
    const doc = normalizeMeetingDoc(meeting, 0);

    // Deprecated stub — returns the input cast rather than normalizing
    expect(doc).toBeDefined();
  });

  it('buildDocsFromActivities returns empty array (deprecated)', () => {
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

    // Deprecated stub — returns empty array
    expect(activityDocs).toEqual([]);
  });
});
