import { describe, it, expect } from 'vitest';
import { extractDecisionEntries, parseCbdDecisionPath, parseDecisionLabel, resolveDecisionHref, resolveDecisionHrefWithFallback } from 'shared/utils/decision-links';

describe('parseCbdDecisionPath', () => {
  it('parses COP decision path', () => {
    const entry = parseCbdDecisionPath('CBD/COP/DEC/15/4');

    expect(entry).toEqual({
      label: 'COP 15/4',
      href: 'https://www.cbd.int/decisions/cop/15/04',
    });
  });

  it('parses CP-MOP decision path', () => {
    const entry = parseCbdDecisionPath('CBD/CP/MOP/DEC/11/7');

    expect(entry).toEqual({
      label: 'CP-MOP 11/7',
      href: 'https://www.cbd.int/decisions/mop?m=cp-mop-11',
    });
  });

  it('parses NP-MOP decision path', () => {
    const entry = parseCbdDecisionPath('CBD/NP/MOP/DEC/5/3');

    expect(entry).toEqual({
      label: 'NP-MOP 5/3',
      href: 'https://www.cbd.int/decisions/np-mop?m=np-mop-05',
    });
  });

  it('parses CP-MOP decision path with paragraph segment', () => {
    const entry = parseCbdDecisionPath('CBD/CP/MOP/DEC/11/7/7');

    expect(entry).toEqual({
      label: 'CP-MOP 11/7 P. 7',
      href: 'https://www.cbd.int/decisions/mop?m=cp-mop-11',
    });
  });

  it('generates correct COP URL with paragraph', () => {
    const entry = parseCbdDecisionPath('CBD/COP/DEC/15/4/1');

    expect(entry).toEqual({
      label: 'COP 15/4 P. 1',
      href: 'https://www.cbd.int/decisions/cop/15/04/01',
    });
  });

  it('generates correct COP URL with different paragraph', () => {
    const entry = parseCbdDecisionPath('CBD/COP/DEC/15/4/4');

    expect(entry).toEqual({
      label: 'COP 15/4 P. 4',
      href: 'https://www.cbd.int/decisions/cop/15/04/04',
    });
  });

  it('returns null for non-CBD paths', () => {
    expect(parseCbdDecisionPath('SOME/OTHER/PATH')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseCbdDecisionPath('')).toBeNull();
  });

  it('handles case-insensitive paths', () => {
    const entry = parseCbdDecisionPath('cbd/cop/dec/16/1');

    expect(entry).toEqual({
      label: 'COP 16/1',
      href: 'https://www.cbd.int/decisions/cop/16/01',
    });
  });
});

describe('extractDecisionEntries with decisions_ss', () => {
  it('extracts entries from decisions_ss (CP-MOP)', () => {
    const entries = extractDecisionEntries({
      decisions_ss: ['CBD/CP/MOP/DEC/11/7/7'],
    });

    expect(entries).toEqual([
      {
        label: 'CP-MOP 11/7 P. 7',
        href: 'https://www.cbd.int/decisions/mop?m=cp-mop-11',
      },
    ]);
  });

  it('extracts multiple decisions from decisions_ss', () => {
    const entries = extractDecisionEntries({
      decisions_ss: ['CBD/COP/DEC/15/4', 'CBD/CP/MOP/DEC/11/7'],
    });

    expect(entries).toHaveLength(2);
    expect(entries[0]!.label).toBe('COP 15/4');
    expect(entries[1]!.label).toBe('CP-MOP 11/7');
  });

  it('falls back to legacy copDecision when decisions_ss is absent', () => {
    const entries = extractDecisionEntries({
      copDecision_s: '16/22',
    });

    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]!.label).toContain('16/22');
  });
});

describe('decision-links utilities', () => {
  it('parses paragraph tokens from NP decisions', () => {
    const parsed = parseDecisionLabel('NP-4/3 P. 5,7');

    expect(parsed).not.toBeNull();
    expect(parsed?.paragraphs).toEqual(['5', '7']);
  });

  it('builds COP paragraph URLs from labels', () => {
    const href = resolveDecisionHref('COP 16/1 P. 5,7');

    expect(href).toBe('https://www.cbd.int/decisions/cop/16/01/5');
  });

  it('ensures fallback adds CP decision query when missing', () => {
    const href = resolveDecisionHrefWithFallback('https://www.cbd.int/decisions/mop', 'CP-11/3 P. 8');

    expect(href).toBe('https://www.cbd.int/decisions/mop?m=cp-mop-11-03');
  });

  it('creates separate entries for COP paragraphs', () => {
    const entries = extractDecisionEntries({
      decision_s: 'COP 16/1 P. 5,7',
    });

    expect(entries).toEqual([
      {
        label: 'COP 16/1 P. 5',
        href: 'https://www.cbd.int/decisions/cop/16/01/5',
      },
      {
        label: 'COP 16/1 P. 7',
        href: 'https://www.cbd.int/decisions/cop/16/01/7',
      },
    ]);
  });

  it('applies record paragraphs to COP decisions without inline labels', () => {
    const entries = extractDecisionEntries({
      copDecision_s: '16/22',
      copParagraph_s: 'Para 17, Para 19',
    });

    expect(entries).toEqual([
      {
        label: 'COP 16/22 P. 17',
        href: 'https://www.cbd.int/decisions/cop/16/22/17',
      },
      {
        label: 'COP 16/22 P. 19',
        href: 'https://www.cbd.int/decisions/cop/16/22/19',
      },
    ]);
  });

  it('handles sub-paragraph letters from record fields for COP decisions', () => {
    const entries = extractDecisionEntries({
      copDecision_s: '16/30',
      copParagraphNo: 'Para 6 (b), Para 6(c)',
    });

    expect(entries).toEqual([
      {
        label: 'COP 16/30 P. 6(b)',
        href: 'https://www.cbd.int/decisions/cop/16/30/6(b)',
      },
      {
        label: 'COP 16/30 P. 6(c)',
        href: 'https://www.cbd.int/decisions/cop/16/30/6(c)',
      },
    ]);
  });

  it('creates a single CP entry with formatted paragraphs', () => {
    const entries = extractDecisionEntries({
      decision_s: 'CP 11/3 paragraph 5 and 7',
    });

    expect(entries).toEqual([
      {
        label: 'CP-11/3 P. 5,7',
        href: 'https://www.cbd.int/decisions/mop?m=cp-mop-11-03',
      },
    ]);
  });

  it('combines record paragraph values into CP labels', () => {
    const entries = extractDecisionEntries({
      decision_s: 'CP-11/3',
      paragraph_s: 'Para 8, Para 9',
    });

    expect(entries).toEqual([
      {
        label: 'CP-11/3 P. 8,9',
        href: 'https://www.cbd.int/decisions/mop?m=cp-mop-11-03',
      },
    ]);
  });

  it('derives labels from COP paragraph URLs', () => {
    const entries = extractDecisionEntries({
      decisionUrl: 'https://www.cbd.int/decisions/cop/16/01/5',
    });

    expect(entries).toEqual([
      {
        label: 'COP 16/1 P. 5',
        href: 'https://www.cbd.int/decisions/cop/16/01/5',
      },
    ]);
  });
});
