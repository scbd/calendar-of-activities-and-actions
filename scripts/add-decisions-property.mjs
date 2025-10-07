#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const activitiesPath = join(__dirname, '../shared/data/25-26-activities.js');
const copDecisionTermsPath = join(__dirname, '../shared/data/cop-decision-terms.js');

// Dynamically import the activities and cop decision terms
const { default: activities } = await import(activitiesPath);
const { copDecisionTerms } = await import(copDecisionTermsPath);

// Create a map of decision name -> identifier for quick lookup
const decisionMap = new Map();

copDecisionTerms.forEach(term => {
  decisionMap.set(term.name, term.identifier);
});

// Find all unique copDecisions from activities
const uniqueCopDecisions = new Set();

activities.forEach(activity => {
  if (activity.copDecision) {
    uniqueCopDecisions.add(activity.copDecision);
  }
});

console.log(`Found ${uniqueCopDecisions.size} unique COP decisions in activities`);
console.log(`Found ${copDecisionTerms.length} existing COP decision terms`);

// Find missing decisions
const missingDecisions = [];

uniqueCopDecisions.forEach(decision => {
  if (!decisionMap.has(decision)) {
    missingDecisions.push(decision);
  }
});

if (missingDecisions.length > 0) {
  console.log(`\nFound ${missingDecisions.length} missing COP decisions:`);
  missingDecisions.forEach(d => console.log(`  - ${d}`));
  
  // Add missing decisions to copDecisionTerms
  const nextTermId = Math.max(...copDecisionTerms.map(t => t.termId)) + 1;
  
  missingDecisions.forEach((decision, index) => {
    const identifier = `CAL-DECISION-${decision.replace(/\//g, '-')}`;
    const newTerm = {
      termId: nextTermId + index,
      identifier: identifier,
      name: decision,
      title: { en: decision },
      shortTitle: { en: decision },
      description: 'Locally defined COP decision derived from the calendar data.',
      longDescription: { en: `Calendar entries linked to COP decision ${decision}.` },
      source: 'shared/data/2024-12-01.md',
      broaderTerms: [],
      narrowerTerms: [],
      relatedTerms: [],
      nonPreferedTerms: [],
    };
    
    copDecisionTerms.push(newTerm);
    decisionMap.set(decision, identifier);
    console.log(`  Added: ${decision} -> ${identifier}`);
  });
  
  // Update cop-decision-terms.js
  const updatedCopTermsContent = `// COP decision terms derived from shared/data/2024-12-01.md
// Mirrors the structure of ThesaurusTerm used by thesaurus services.

export const copDecisionTerms = ${JSON.stringify(copDecisionTerms, null, 2)};

export default copDecisionTerms;
`;
  
  writeFileSync(copDecisionTermsPath, updatedCopTermsContent, 'utf-8');
  console.log(`\nUpdated ${copDecisionTermsPath}`);
}

// Update activities with decisions property
let updateCount = 0;

activities.forEach(activity => {
  if (activity.copDecision) {
    const identifier = decisionMap.get(activity.copDecision);

    if (identifier) {
      // Create decisions array with the identifier
      activity.decisions = [identifier];
      updateCount++;
    }
  }
});

console.log(`\nAdded 'decisions' property to ${updateCount} activities`);

// Write updated activities
const updatedActivitiesContent = `export default ${JSON.stringify(activities, null, 2)};
`;

writeFileSync(activitiesPath, updatedActivitiesContent, 'utf-8');
console.log(`Updated ${activitiesPath}`);

console.log('\n✅ Script completed successfully!');
console.log('\nSummary:');
console.log(`  - Total activities: ${activities.length}`);
console.log(`  - Activities with decisions: ${updateCount}`);
console.log(`  - Total COP decision terms: ${copDecisionTerms.length}`);
console.log(`  - Missing decisions added: ${missingDecisions.length}`);
