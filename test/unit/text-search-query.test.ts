/**
 * Unit tests for text-search query construction in `buildCalendarQuery()`.
 *
 * The SOLR proxy at api.cbd.int does NOT support `defType=edismax`, `qf`, or
 * `mm` — they are silently ignored (`nonSupportedParams`).  Additionally,
 * wildcard queries bypass the text analyser so they fail to match
 * lowercased / stemmed index entries.
 *
 * Strategy (≥ 4 chars):
 *  • Single-word ≥ 4 chars  → `(term OR lowercasedterm*)` — the plain term
 *                              goes through the analyser (stemming) and the
 *                              lowercased wildcard catches partial prefixes.
 *  • Single-word < 4 chars  → plain term only (wildcard too broad).
 *  • Multi-word             → each token expanded as above, joined with AND.
 *  • Advanced-syntax        → pass-through (quotes, wildcards, Boolean ops).
 *  • None of the builds include `defType`, `qf`, or `mm`.
 */

import { describe, it, expect } from 'vitest';
import { buildCalendarQuery } from 'shared/services/solr';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert the body never contains unsupported eDisMax params. */
function assertNoEdismax(body: ReturnType<typeof buildCalendarQuery>): void {
  expect(body).not.toHaveProperty('defType');
  expect(body).not.toHaveProperty('qf');
  expect(body).not.toHaveProperty('mm');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildCalendarQuery – text search', () => {
  // -----------------------------------------------------------------------
  // No search text
  // -----------------------------------------------------------------------
  describe('no search text', () => {
    it('uses schemaType_s:scbd as default q', () => {
      const body = buildCalendarQuery();

      expect(body.q).toBe('schemaType_s:scbd');
      assertNoEdismax(body);
      expect(body).not.toHaveProperty('q.op');
    });

    it('uses schemaType_s:scbd when searchText is empty string', () => {
      const body = buildCalendarQuery({ searchText: '' });

      expect(body.q).toBe('schemaType_s:scbd');
      assertNoEdismax(body);
    });

    it('uses schemaType_s:scbd when searchText is whitespace', () => {
      const body = buildCalendarQuery({ searchText: '   ' });

      expect(body.q).toBe('schemaType_s:scbd');
      assertNoEdismax(body);
    });
  });

  // -----------------------------------------------------------------------
  // Single-word search — short (< 4 chars, plain term only)
  // -----------------------------------------------------------------------
  describe('single-word search (short, < 4 chars)', () => {
    it('produces plain term without wildcard for "bio"', () => {
      const body = buildCalendarQuery({ searchText: 'bio' });

      expect(body.q).toBe('bio');
      assertNoEdismax(body);
      expect(body.q).not.toContain('*');
    });

    it('produces plain term for "ab"', () => {
      const body = buildCalendarQuery({ searchText: 'ab' });

      expect(body.q).toBe('ab');
    });
  });

  // -----------------------------------------------------------------------
  // Single-word search — ≥ 4 chars (partial match via OR wildcard)
  // -----------------------------------------------------------------------
  describe('single-word search (≥ 4 chars, partial match)', () => {
    it('produces (term OR term* OR stemPrefix*) for "tentative" (> 4 chars)', () => {
      const body = buildCalendarQuery({ searchText: 'tentative' });

      // > 4 chars → includes stem-prefix wildcard (first 4 chars)
      expect(body.q).toBe('(tentative OR tentative* OR tent*)');
      assertNoEdismax(body);
    });

    it('produces (term OR term* OR stemPrefix*) for partial "tenta" (> 4 chars)', () => {
      const body = buildCalendarQuery({ searchText: 'tenta' });

      // "tenta" → stem prefix is "tent"
      expect(body.q).toBe('(tenta OR tenta* OR tent*)');
      assertNoEdismax(body);
    });

    it('produces (term OR term*) for exactly 4 chars "tent"', () => {
      const body = buildCalendarQuery({ searchText: 'tent' });

      // Exactly 4 chars → no extra stem prefix (it would be the same)
      expect(body.q).toBe('(tent OR tent*)');
      assertNoEdismax(body);
    });

    it('lowercases the wildcard variants for "Biodiversity"', () => {
      const body = buildCalendarQuery({ searchText: 'Biodiversity' });

      expect(body.q).toBe('(Biodiversity OR biodiversity* OR biod*)');
    });

    it('lowercases the wildcard variant for "TENTA"', () => {
      const body = buildCalendarQuery({ searchText: 'TENTA' });

      expect(body.q).toBe('(TENTA OR tenta* OR tent*)');
    });

    it('trims leading/trailing whitespace', () => {
      const body = buildCalendarQuery({ searchText: '  tentative  ' });

      expect(body.q).toBe('(tentative OR tentative* OR tent*)');
    });

    it('does not set q.op for single word', () => {
      const body = buildCalendarQuery({ searchText: 'tentative' });

      expect(body).not.toHaveProperty('q.op');
    });
  });

  // -----------------------------------------------------------------------
  // Multi-word search
  // -----------------------------------------------------------------------
  describe('multi-word search', () => {
    it('expands each word ≥ 4 chars and joins with AND for "peer review"', () => {
      const body = buildCalendarQuery({ searchText: 'peer review' });

      // Both > 4 chars → each gets stem-prefix wildcard
      expect(body.q).toBe('(peer OR peer*) AND (review OR review* OR revi*)');
      assertNoEdismax(body);
    });

    it('does not expand short words in "a big day"', () => {
      const body = buildCalendarQuery({ searchText: 'a big day' });

      // "a" (1 char) and "big" (3 chars) stay plain; "day" is 3 chars → plain
      expect(body.q).toBe('a AND big AND day');
    });

    it('mixes short and long words in "cbd tentative plan"', () => {
      const body = buildCalendarQuery({ searchText: 'cbd tentative plan' });

      // "cbd" (3 chars) → plain, "tentative" (9 > 4) → expanded+stem, "plan" (4 = 4) → expanded
      expect(body.q).toBe('cbd AND (tentative OR tentative* OR tent*) AND (plan OR plan*)');
    });

    it('handles three long words "climate change adaptation"', () => {
      const body = buildCalendarQuery({ searchText: 'climate change adaptation' });

      expect(body.q).toBe('(climate OR climate* OR clim*) AND (change OR change* OR chan*) AND (adaptation OR adaptation* OR adap*)');
      assertNoEdismax(body);
    });

    it('does not set q.op (AND is in the query itself)', () => {
      const body = buildCalendarQuery({ searchText: 'peer review' });

      expect(body).not.toHaveProperty('q.op');
    });
  });

  // -----------------------------------------------------------------------
  // Advanced syntax — pass-through
  // -----------------------------------------------------------------------
  describe('advanced syntax (pass-through)', () => {
    it('passes quoted phrase through as-is', () => {
      const body = buildCalendarQuery({ searchText: '"peer review"' });

      expect(body.q).toBe('"peer review"');
      assertNoEdismax(body);
    });

    it('passes user-supplied wildcard through as-is', () => {
      const body = buildCalendarQuery({ searchText: 'bio*' });

      expect(body.q).toBe('bio*');
      assertNoEdismax(body);
    });

    it('passes Boolean AND through as-is', () => {
      const body = buildCalendarQuery({ searchText: 'climate AND biodiversity' });

      expect(body.q).toBe('climate AND biodiversity');
      assertNoEdismax(body);
    });

    it('passes Boolean OR through as-is', () => {
      const body = buildCalendarQuery({ searchText: 'climate OR biodiversity' });

      expect(body.q).toBe('climate OR biodiversity');
      assertNoEdismax(body);
    });

    it('passes Boolean NOT through as-is', () => {
      const body = buildCalendarQuery({ searchText: 'climate NOT draft' });

      expect(body.q).toBe('climate NOT draft');
      assertNoEdismax(body);
    });

    it('does not set q.op for advanced syntax', () => {
      const body = buildCalendarQuery({ searchText: '"peer review"' });

      expect(body).not.toHaveProperty('q.op');
    });
  });

  // -----------------------------------------------------------------------
  // Locale — df field
  // -----------------------------------------------------------------------
  describe('locale-specific df field', () => {
    it('sets df to English text field', () => {
      const body = buildCalendarQuery({ searchText: 'tentative', locale: 'en' });

      expect(body.df).toBe('text_EN_txt');
    });

    it('sets df to French text field', () => {
      const body = buildCalendarQuery({ searchText: 'provisoire', locale: 'fr' });

      expect(body.df).toBe('text_FR_txt');
    });
  });

  // -----------------------------------------------------------------------
  // Body structure — general invariants
  // -----------------------------------------------------------------------
  describe('body structure invariants', () => {
    it('always includes df for locale-specific text field', () => {
      const bodyNoSearch = buildCalendarQuery({ locale: 'en' });
      const bodySingle = buildCalendarQuery({ searchText: 'test', locale: 'en' });
      const bodyMulti = buildCalendarQuery({ searchText: 'peer review', locale: 'en' });

      expect(bodyNoSearch.df).toBe('text_EN_txt');
      expect(bodySingle.df).toBe('text_EN_txt');
      expect(bodyMulti.df).toBe('text_EN_txt');
    });

    it('always includes fq with schemaType constraint', () => {
      const body = buildCalendarQuery({ searchText: 'tentative' });

      expect(body.fq.some(f => f.includes('schemaType_s:scbd'))).toBe(true);
    });

    it('never includes defType, qf, or mm regardless of search type', () => {
      const scenarios = [
        undefined,
        'tentative',
        'peer review',
        '"exact phrase"',
        'bio*',
        'climate AND biodiversity',
      ];

      for (const searchText of scenarios) {
        const body = buildCalendarQuery({ searchText });

        assertNoEdismax(body);
      }
    });
  });
});
