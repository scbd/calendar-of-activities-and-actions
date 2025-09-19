import { describe, it, expect } from 'vitest';
import { normalizeTitle, tokenizeDecisions, jaccardTitleSimilarity, dateWindowOverlap } from '../../shared/utils/merge-helpers';
import { mergeRecords } from '../../utils/indexers/scbd/index';
import type { IndexRecord, MdRecord } from '../../shared/types/records';

// Smoke tests and examples of unit tests
describe('Utility Functions - Smoke Tests', () => {
  describe('includesCI - example function', () => {
    it('should return true when needle is found in haystack (case insensitive)', () => {
      const includesCI = (haystack?: string, needle?: string) => {
        if (!haystack || !needle) return false;
        return haystack.toLowerCase().includes(needle.toLowerCase());
      };

      expect(includesCI('Hello World', 'hello')).toBe(true);
      expect(includesCI('Hello World', 'WORLD')).toBe(true);
      expect(includesCI('Hello World', 'test')).toBe(false);
    });
  });

  describe('splitSubjects - example function', () => {
    it('should split subjects by comma and trim whitespace', () => {
      const splitSubjects = (s: string) => {
        return s
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      };

      expect(splitSubjects('subject1, subject2, subject3')).toEqual(['subject1', 'subject2', 'subject3']);
      expect(splitSubjects('  subject1  ,  subject2  ')).toEqual(['subject1', 'subject2']);
    });
  });

  describe('parseMaybeDate - example function', () => {
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
  });
});

describe('Merge helpers - Smoke Tests', () => {
  it('normalizeTitle basic functionality', () => {
    expect(normalizeTitle('Hello: World (CBD/COP-15)')).toBe('hello: world (cbd/cop-15)');
  });

  it('tokenizeDecisions basic functionality', () => {
    const t = tokenizeDecisions('CBD/COP/15/DEC/14');
    expect(t).toContain('CBD/COP/15/DEC/14');
    expect(t).toContain('CBD');
    expect(t).toContain('COP');
  });

  it('jaccardTitleSimilarity basic functionality', () => {
    const s = jaccardTitleSimilarity('Draft agenda for meeting', 'Agenda draft for meeting');
    expect(s).toBeGreaterThan(0.3);
  });

  it('dateWindowOverlap basic functionality', () => {
    expect(dateWindowOverlap('2025-01-01', '2025-01-10', '2025-01-05', '2025-01-20')).toBe(true);
    expect(dateWindowOverlap('2025-01-01', '2025-01-10', '2025-02-01', '2025-02-10')).toBe(false);
  });
});

describe('mergeRecords - Smoke Test', () => {
  it('handles empty inputs', () => {
    const idx: IndexRecord[] = [];
    const md: MdRecord[] = [];
    const { merged, unmergedActions } = mergeRecords(idx, md);
    expect(merged.length).toBe(0);
    expect(unmergedActions.length).toBe(0);
  });
});