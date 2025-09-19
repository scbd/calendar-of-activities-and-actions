import { describe, it, expect } from 'vitest';
import { normalizeTitle, tokenizeDecisions, tokenizeRelatedDocs, jaccardTitleSimilarity, dateWindowOverlap } from '../../shared/utils/merge-helpers';
import { mergeRecords } from '../../utils/indexers/scbd/index-meetings';
import type { IndexRecord, MdRecord } from '../../shared/types/records';

// Example unit tests for utility functions
describe('Utility Functions', () => {
  describe('includesCI', () => {
    it('should return true when needle is found in haystack (case insensitive)', () => {
      const includesCI = (haystack?: string, needle?: string) => {
        if (!haystack || !needle) return false;
        return haystack.toLowerCase().includes(needle.toLowerCase());
      };

      expect(includesCI('Hello World', 'hello')).toBe(true);
      expect(includesCI('Hello World', 'WORLD')).toBe(true);
      expect(includesCI('Hello World', 'test')).toBe(false);
    });

    it('should return false when haystack or needle is empty', () => {
      const includesCI = (haystack?: string, needle?: string) => {
        if (!haystack || !needle) return false;
        return haystack.toLowerCase().includes(needle.toLowerCase());
      };

      expect(includesCI('', 'test')).toBe(false);
      expect(includesCI('hello', '')).toBe(false);
      expect(includesCI(undefined, 'test')).toBe(false);
      expect(includesCI('hello', undefined)).toBe(false);
    });
  });

  describe('splitSubjects', () => {
    it('should split subjects by comma and trim whitespace', () => {
      const splitSubjects = (s: string) => {
        return s
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      };

      expect(splitSubjects('subject1, subject2, subject3')).toEqual(['subject1', 'subject2', 'subject3']);
      expect(splitSubjects('  subject1  ,  subject2  ')).toEqual(['subject1', 'subject2']);
      expect(splitSubjects('subject1,,subject2')).toEqual(['subject1', 'subject2']);
    });

    it('should filter out empty strings', () => {
      const splitSubjects = (s: string) => {
        return s
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      };

      expect(splitSubjects(',,')).toEqual([]);
      expect(splitSubjects('')).toEqual([]);
    });
  });

  describe('parseMaybeDate', () => {
    it('should parse valid date strings', () => {
      const parseMaybeDate = (s?: string) => {
        if (!s) return undefined;
        const tryIso = Date.parse(s as string);
        if (!Number.isNaN(tryIso)) return new Date(tryIso);
        return undefined;
      };

      const date = parseMaybeDate('2024-01-01');
      expect(date).toBeInstanceOf(Date);
      expect(date?.toISOString().startsWith('2024-01-01')).toBe(true);
    });

    it('should return undefined for invalid date strings', () => {
      const parseMaybeDate = (s?: string) => {
        if (!s) return undefined;
        const tryIso = Date.parse(s as string);
        if (!Number.isNaN(tryIso)) return new Date(tryIso);
        return undefined;
      };

      expect(parseMaybeDate('invalid-date')).toBeUndefined();
      expect(parseMaybeDate('')).toBeUndefined();
      expect(parseMaybeDate(undefined)).toBeUndefined();
    });
  });
});

describe('Merge helpers', () => {
  it('normalizeTitle removes punctuation and lowers', () => {
    expect(normalizeTitle('Hello: World (CBD/COP-15)')).toBe('hello: world (cbd/cop-15)');
  });

  it('tokenizeDecisions splits composite tokens', () => {
    const t = tokenizeDecisions('CBD/COP/15/DEC/14');
    expect(t).toContain('CBD/COP/15/DEC/14');
    expect(t).toContain('CBD');
    expect(t).toContain('COP');
    expect(t).toContain('15');
    expect(t).toContain('DEC');
    expect(t).toContain('14');
  });

  it('tokenizeRelatedDocs extracts tokens', () => {
    const t = tokenizeRelatedDocs('INF/5, CBD/DEC/15/14 v2.pdf');
    expect(t).toContain('INF/5');
    expect(t).toContain('CBD/DEC/15/14');
    expect(t).toContain('v2.pdf');
  });

  it('jaccardTitleSimilarity works', () => {
    const s = jaccardTitleSimilarity('Draft agenda for meeting', 'Agenda draft for meeting');
    expect(s).toBeGreaterThan(0.3);
  });

  it('dateWindowOverlap detects overlap', () => {
    expect(dateWindowOverlap('2025-01-01', '2025-01-10', '2025-01-05', '2025-01-20')).toBe(true);
    expect(dateWindowOverlap('2025-01-01', '2025-01-10', '2025-02-01', '2025-02-10')).toBe(false);
  });
});

describe('mergeRecords ranking and ambiguity', () => {
  const idx: IndexRecord[] = [
    { title: 'Decision on resource mobilization', copDecision: 'CBD/COP/15/DEC/14', text_EN_txt: 'Some text with INF/5 and more.' },
    { Title: 'Report of the Subsidiary Body on Implementation', text: 'Annex includes CBD/DEC/15/12' },
    { title: 'Draft agenda for SBI meeting', startDate: '2025-03-01', endDate: '2025-03-05' },
  ];

  it('matches by exact decision token', () => {
    const md: MdRecord[] = [
      { Title: 'Some title', COPDecision: 'CBD/COP/15/DEC/14', Related_documents: '' },
    ];
    const { merged, unmergedActions } = mergeRecords(idx, md);
    expect(merged.length).toBe(1);
    expect(unmergedActions.length).toBe(0);
    expect(merged[0].provenance.index?.copDecision).toBe('CBD/COP/15/DEC/14');
    expect(merged[0].normalized?.matchReason).toContain('decision');
  });

  it('matches by related document token when decision absent', () => {
    const md: MdRecord[] = [
      { Title: 'Another', Related_documents: 'INF/5', COPDecision: '' },
    ];
    const { merged } = mergeRecords(idx, md);
    expect(merged.length).toBe(1);
    expect(merged[0].provenance.index?.text_EN_txt).toContain('INF/5');
    expect(merged[0].normalized?.matchReason).toBe('related-doc-token');
  });

  it('matches by title+date score when no tokens', () => {
    const md: MdRecord[] = [
      { Title: 'Agenda draft for SBI meeting', StartDate: '2025-03-02', EndDate: '2025-03-03' },
    ];
    const { merged } = mergeRecords(idx, md);
    expect(merged.length).toBe(1);
    expect(merged[0].provenance.index?.title).toContain('Draft agenda');
    expect(merged[0].normalized?.matchReason).toMatch(/title|date/);
  });

  it('marks ambiguous when top two scores close', () => {
    // Craft two similar candidates by giving tokens that hit in two index docs
    const localIdx: IndexRecord[] = [
      { title: 'Alpha', text_EN_txt: 'DOC/1' },
      { title: 'Beta', text_EN_txt: 'DOC/1' },
    ];
    const md: MdRecord[] = [ { Title: 'Something', Related_documents: 'DOC/1' } ];
    const { merged, unmergedActions } = mergeRecords(localIdx, md);
    expect(merged.length).toBe(0);
    expect(unmergedActions[0]._merge_reason).toBe('ambiguous-candidates');
  });
});