import { describe, it, expect } from 'vitest';
import { buildSelectBody, collectAllFieldNames, getTextFieldForLocale, quoteHyphenatedTokens } from 'shared/services/solr';

describe('Solr Service', () => {
  it('buildSelectBody should create default meeting query with locale', () => {
    const body = buildSelectBody({ locale: 'en', schema: 'meeting', start: 0, rows: 10, sinceUpdatedDateISO: '2025-03-12T00:00:00.000Z' });

    expect(body.df).toBe(getTextFieldForLocale('en'));
    expect(body.fq).toContain('_state_s:public');
    expect(body.fq.find((f) => f.includes('schema_s'))).toContain('meeting');
    expect(body.q).toContain('updatedDate_dt:[');
    expect(body.rows).toBe(10);
    expect(body.sort).toBe('updatedDate_dt desc');
  });

  it('collectAllFieldNames returns unique sorted keys', () => {
    const fields = collectAllFieldNames([
      { a: 1, b: 2 },
      { b: 3, c: 4 },
    ]);

    expect(fields).toEqual(['a', 'b', 'c']);
  });

  describe('quoteHyphenatedTokens', () => {
    it('quotes a single hyphenated token', () => {
      expect(quoteHyphenatedTokens('2026-039')).toBe('"2026 039"');
    });

    it('quotes hyphenated tokens among plain words', () => {
      expect(quoteHyphenatedTokens('SBI-6 climate')).toBe('"SBI 6" climate');
    });

    it('leaves plain text untouched', () => {
      expect(quoteHyphenatedTokens('climate change')).toBe('climate change');
    });

    it('leaves already-quoted tokens untouched', () => {
      expect(quoteHyphenatedTokens('"2026-039"')).toBe('"2026-039"');
    });

    it('handles multiple hyphenated tokens', () => {
      expect(quoteHyphenatedTokens('COP-15-6 NP-4-1')).toBe('"COP 15 6" "NP 4 1"');
    });

    it('handles empty string', () => {
      expect(quoteHyphenatedTokens('')).toBe('');
    });

    it('quotes slash-separated tokens (decision numbers)', () => {
      expect(quoteHyphenatedTokens('15/4/9')).toBe('"15 4 9"');
    });

    it('handles mixed slash and hyphen token', () => {
      expect(quoteHyphenatedTokens('CBD/COP/DEC/15-4')).toBe('"CBD COP DEC 15 4"');
    });

    it('handles slash token among plain words', () => {
      expect(quoteHyphenatedTokens('decision 15/4 biodiversity')).toBe('decision "15 4" biodiversity');
    });
  });
});
