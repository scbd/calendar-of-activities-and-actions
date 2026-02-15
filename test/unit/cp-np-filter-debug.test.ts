import { describe, it } from 'vitest';

/**
 * Skipped — static data files (25-26-activities.js, cop-decision-terms.js) were
 * removed in Phase 05 (p05-01) of the SOLR endpoint migration. COP decision
 * filtering is now handled via SOLR facets.
 */
describe.skip('CP and NP Decision Filter Test (removed — static data deleted)', () => {
  it('static data removed in p05-01 — decisions now from SOLR facets', () => {
    // Intentionally empty — kept for git history reference
  });
});
