import { describe, it } from 'vitest';

/**
 * Skipped — static data files (25-26-activities.js, cop-decision-terms.js) were
 * removed in Phase 05 (p05-01) of the SOLR endpoint migration. Decision data
 * now comes from the SOLR endpoint.
 */
describe.skip('Decisions Property Migration (removed — static data deleted)', () => {
  it('static data removed in p05-01 — decisions now from SOLR endpoint', () => {
    // Intentionally empty — kept for git history reference
  });
});
