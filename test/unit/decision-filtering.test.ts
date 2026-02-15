import { describe, expect, it } from 'vitest';
import { getDocDecisionLabels } from '../../shared/utils/document-processing';
import type { CalendarDoc } from '../../shared/types/calendar';

describe('Decision Filtering with new decisions property', () => {
  it('should extract decision names from decisions array using identifiers', () => {
    const doc = {
      identifier: 'ACT-2024-01',
      decisions: ['CAL-DECISION-NP-4-3', 'CAL-DECISION-15-6'],
    } as unknown as CalendarDoc;

    const labels = getDocDecisionLabels(doc);

    expect(labels).toContain('NP-4/3');
    expect(labels).toContain('15/6');
    expect(labels.length).toBe(2);
  });

  it('should handle single decision in array', () => {
    const doc = {
      identifier: 'ACT-2024-02',
      decisions: ['CAL-DECISION-16-22'],
    } as unknown as CalendarDoc;

    const labels = getDocDecisionLabels(doc);

    expect(labels).toContain('16/22');
    expect(labels.length).toBe(1);
  });

  it('should fallback to copDecision when decisions array is not present', () => {
    const doc = {
      copDecision: '15/11',
    };

    const labels = getDocDecisionLabels(doc);

    // "COP " prefix is stripped to match term.name format (e.g., "COP 15/11" → "15/11")
    expect(labels).toContain('15/11');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should handle empty decisions array', () => {
    const doc = {
      identifier: 'ACT-2024-04',
      decisions: [],
    } as unknown as CalendarDoc;

    const labels = getDocDecisionLabels(doc);

    expect(labels).toEqual([]);
  });

  it('should handle unknown identifiers gracefully', () => {
    const doc = {
      identifier: 'ACT-2024-05',
      decisions: ['CAL-DECISION-UNKNOWN-999'],
    } as unknown as CalendarDoc;

    const labels = getDocDecisionLabels(doc);

    // Unknown identifiers are humanized (prefix stripped)
    expect(labels.length).toBe(1);
    expect(labels[0]).toBe('UNKNOWN-999');
  });

  it('should handle mixed valid and invalid identifiers', () => {
    const doc = {
      identifier: 'ACT-2024-06',
      decisions: ['CAL-DECISION-16-11', 'CAL-DECISION-INVALID', 'CAL-DECISION-16-12'],
    } as unknown as CalendarDoc;

    const labels = getDocDecisionLabels(doc);

    expect(labels).toContain('16/11');
    expect(labels).toContain('16/12');
    expect(labels).toContain('INVALID');
    expect(labels.length).toBe(3);
  });

  it('should deduplicate decisions from decisions array', () => {
    const doc = {
      identifier: 'ACT-2024-07',
      decisions: ['CAL-DECISION-16-15'],
      copDecision: '16/15',
    } as unknown as CalendarDoc;

    const labels = getDocDecisionLabels(doc);

    // decisions array takes priority, copDecision fallback is not used
    expect(labels).toContain('16/15');
    expect(labels.length).toBe(1);
  });

  it('should handle CP11/7 variant without hyphen', () => {
    const doc = {
      decisions: ['CAL-DECISION-CP11-7'], // Uses identifier without hyphen between type/number
      copDecision: 'CP-11/7',
    };

    const labels = getDocDecisionLabels(doc);

    // humanizeDecisionIdentifier handles CP11-7 → CP-11/7
    expect(labels).toContain('CP-11/7');
  });

  it('should strip paragraph suffixes from decision labels', () => {
    const doc = {
      copDecision: '16/22 Para 12',
    };

    const labels = getDocDecisionLabels(doc);

    // "COP " prefix is stripped to match term.name format
    expect(labels).toContain('16/22');
    expect(labels.some(l => l.includes('Para'))).toBe(false);
  });
});
