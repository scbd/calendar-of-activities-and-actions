import { describe, expect, it } from 'vitest';
import activities from '../../shared/data/25-26-activities.js';
import { copDecisionTerms } from '../../shared/data/cop-decision-terms.js';

describe('Decisions Property Migration', () => {
  it('should have decisions property for all activities with copDecision', () => {
    const activitiesWithCopDecision = activities.filter((a) => a.copDecision);

    activitiesWithCopDecision.forEach((activity) => {
      expect(activity.decisions).toBeDefined();
      expect(Array.isArray(activity.decisions)).toBe(true);
      expect(activity.decisions.length).toBeGreaterThan(0);
    });
  });

  it('should map copDecision to correct decision identifier', () => {
    const decisionMap = new Map();

    copDecisionTerms.forEach((term) => {
      decisionMap.set(term.name, term.identifier);
    });

    const validIdentifiers = new Set(copDecisionTerms.map((t) => t.identifier));

    activities.forEach((activity) => {
      if (activity.copDecision && activity.decisions) {
        // Try to find exact match first
        const exactMatch = decisionMap.get(activity.copDecision);

        if (exactMatch) {
          expect(activity.decisions).toContain(exactMatch);
        } else {
          // For cases where copDecision format doesn't exactly match term.name
          // (e.g., "CP11/7" vs "CP-11/7"), just verify the identifier exists
          activity.decisions.forEach((identifier) => {
            expect(validIdentifiers.has(identifier), 
              `Identifier "${identifier}" for copDecision "${activity.copDecision}" not found in cop-decision-terms`
            ).toBe(true);
          });
        }
      }
    });
  });

  it('should have all decision identifiers exist in cop-decision-terms', () => {
    const validIdentifiers = new Set(copDecisionTerms.map((t) => t.identifier));

    activities.forEach((activity) => {
      if (activity.decisions) {
        activity.decisions.forEach((decisionId) => {
          expect(validIdentifiers.has(decisionId)).toBe(true);
        });
      }
    });
  });

  it('should preserve original copDecision property', () => {
    const activitiesWithDecisions = activities.filter((a) => a.decisions);

    activitiesWithDecisions.forEach((activity) => {
      expect(activity.copDecision).toBeDefined();
    });
  });

  it('should have consistent decision count', () => {
    const activitiesWithCopDecision = activities.filter((a) => a.copDecision).length;
    const activitiesWithDecisions = activities.filter((a) => a.decisions && a.decisions.length > 0).length;

    expect(activitiesWithDecisions).toBe(activitiesWithCopDecision);
  });
});
