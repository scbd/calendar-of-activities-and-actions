import { describe, it } from 'vitest';

/**
 * Skipped — calendar-document-normalizer.ts was removed in Phase 05 (p05-01)
 * of the SOLR endpoint migration. Documents are now normalized by
 * normalizeCalendarDoc() in shared/services/solr.ts.
 */
describe.skip('calendar document normalizer (removed)', () => {
  it('module removed in p05-01 — documents normalized by SOLR service layer', () => {
    // Intentionally empty — kept for git history reference
  });
});
