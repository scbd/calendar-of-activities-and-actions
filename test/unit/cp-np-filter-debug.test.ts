import { describe, it, expect } from 'vitest';
import { getDocDecisionLabels } from '../../shared/utils/document-processing';
import activities from '../../shared/data/25-26-activities.js';
import { copDecisionTerms } from '../../shared/data/cop-decision-terms.js';

describe('CP and NP Decision Filter Test', () => {
  it('should show CP and NP term identifiers and names', () => {
    const cpTerms = copDecisionTerms.filter(t => t.identifier.includes('CAL-DECISION-CP'));
    const npTerms = copDecisionTerms.filter(t => t.identifier.includes('CAL-DECISION-NP'));
    
    console.log('\n=== CP Terms ===');
    cpTerms.forEach(t => console.log(`  ${t.identifier} → ${t.name}`));
    
    console.log('\n=== NP Terms ===');
    npTerms.forEach(t => console.log(`  ${t.identifier} → ${t.name}`));
  });

  it('should test CP decision filtering', () => {
    const cpActivities = activities.filter(a => a.decisions?.some(d => d.includes('CAL-DECISION-CP')));
    
    console.log(`\n=== Found ${cpActivities.length} CP activities ===`);
    
    cpActivities.forEach(activity => {
      const labels = getDocDecisionLabels(activity);

      console.log(`\nActivity: ${activity.identifier}`);
      console.log(`  copDecision: ${activity.copDecision}`);
      console.log(`  decisions: ${JSON.stringify(activity.decisions)}`);
      console.log(`  labels: ${JSON.stringify(labels)}`);
    });

    // Test filtering by CP-11/7
    const filterValue = 'CP-11/7';
    const filtered = activities.filter(activity => {
      const labels = getDocDecisionLabels(activity);

      return labels.includes(filterValue);
    });
    
    console.log(`\n=== Filter test for "${filterValue}" ===`);
    console.log(`  Matched ${filtered.length} activities`);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('should test NP decision filtering', () => {
    const npActivities = activities.filter(a => a.decisions?.some(d => d.includes('CAL-DECISION-NP')));
    
    console.log(`\n=== Found ${npActivities.length} NP activities ===`);
    
    npActivities.forEach(activity => {
      const labels = getDocDecisionLabels(activity);

      console.log(`\nActivity: ${activity.identifier}`);
      console.log(`  copDecision: ${activity.copDecision}`);
      console.log(`  decisions: ${JSON.stringify(activity.decisions)}`);
      console.log(`  labels: ${JSON.stringify(labels)}`);
    });

    // Test filtering by NP-4/3
    const filterValue = 'NP-4/3';
    const filtered = activities.filter(activity => {
      const labels = getDocDecisionLabels(activity);

      return labels.includes(filterValue);
    });
    
    console.log(`\n=== Filter test for "${filterValue}" ===`);
    console.log(`  Matched ${filtered.length} activities`);
    expect(filtered.length).toBeGreaterThan(0);
  });
});
