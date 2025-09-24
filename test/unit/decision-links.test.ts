import { describe, it, expect } from 'vitest';
import { extractDecisionEntries, parseDecisionLabel, resolveDecisionHref, resolveDecisionHrefWithFallback } from 'shared/utils/decision-links';

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
