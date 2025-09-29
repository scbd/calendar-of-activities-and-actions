import { describe, it, expect } from 'vitest';
import { fallbackSubjectLabel, buildSubjectLabelMap, resolveSubjectLabel } from '../../shared/utils/subjects';

describe('subjects utility', () => {
  describe('fallbackSubjectLabel', () => {
    it('converts CBD_SUBJECT_ prefix to readable label', () => {
      expect(fallbackSubjectLabel('CBD_SUBJECT_BIODIVERSITY')).toBe('Biodiversity');
    });

    it('converts CBD- prefix to readable label', () => {
      expect(fallbackSubjectLabel('CBD-CLIMATE-CHANGE')).toBe('Climate Change');
    });

    it('handles underscore-separated identifiers', () => {
      expect(fallbackSubjectLabel('GENETIC_RESOURCES')).toBe('Genetic Resources');
    });

    it('handles dash-separated identifiers', () => {
      expect(fallbackSubjectLabel('CAPACITY-BUILDING')).toBe('Capacity Building');
    });

    it('handles mixed separators', () => {
      expect(fallbackSubjectLabel('CBD_SUBJECT_CLIMATE-CHANGE')).toBe('Climate Change');
    });

    it('returns original identifier if empty after cleaning', () => {
      expect(fallbackSubjectLabel('___')).toBe('___');
    });

    it('returns identifier as-is if already empty', () => {
      expect(fallbackSubjectLabel('')).toBe('');
    });
  });

  describe('buildSubjectLabelMap', () => {
    it('builds a map from options array', () => {
      const options = [
        { value: 'A', label: 'Label A' },
        { value: 'B', label: 'Label B' },
      ];
      const map = buildSubjectLabelMap(options);

      expect(map).toEqual({ A: 'Label A', B: 'Label B' });
    });

    it('returns empty map for empty array', () => {
      expect(buildSubjectLabelMap([])).toEqual({});
    });
  });

  describe('resolveSubjectLabel', () => {
    const labelMap = {
      'CBD_SUBJECT_A': 'Subject A',
      'CBD_SUBJECT_B': 'Subject B',
    };

    it('resolves label from map', () => {
      expect(resolveSubjectLabel('CBD_SUBJECT_A', labelMap)).toBe('Subject A');
    });

    it('returns empty string when identifier not in map', () => {
      expect(resolveSubjectLabel('CBD_SUBJECT_C', labelMap)).toBe('');
    });

    it('returns empty string for empty identifier', () => {
      expect(resolveSubjectLabel('', labelMap)).toBe('');
    });
  });
});
