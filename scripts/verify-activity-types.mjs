#!/usr/bin/env node

/**
 * Simple verification script to check that activity type filtering will work correctly
 */

import { activityTypeTerms } from '../shared/data/activity-type-terms.js';
import activitiesData from '../shared/data/25-26-activities.js';

console.log('=== Activity Type Filter Verification ===\n');

// Check that activity type terms have identifiers
console.log('Activity Type Terms:');
activityTypeTerms.forEach(term => {
  console.log(`  ${term.identifier} -> ${term.name}`);
});

// Check a sample of activities
console.log('\nSample Activities (first 5):');
activitiesData.slice(0, 5).forEach(activity => {
  console.log(`  ${activity.identifier}: type = "${activity.type}"`);
});

// Verify all activity types in data exist in terms
console.log('\nVerifying all activity types in data exist in terms...');
const termIdentifiers = new Set(activityTypeTerms.map(t => t.identifier));
const activityTypes = new Set(activitiesData.map(a => a.type).filter(Boolean));

let allValid = true;
for (const type of activityTypes) {
  if (!termIdentifiers.has(type)) {
    console.log(`  ❌ Activity type "${type}" not found in terms`);
    allValid = false;
  }
}

if (allValid) {
  console.log('  ✅ All activity types in data have corresponding terms');
}

// Count activities by type
console.log('\nActivity counts by type:');
const counts = {};

activitiesData.forEach(activity => {
  const type = activity.type || 'undefined';

  counts[type] = (counts[type] || 0) + 1;
});

Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    const term = activityTypeTerms.find(t => t.identifier === type);
    const name = term ? term.name : type;

    console.log(`  ${name}: ${count}`);
  });

console.log('\n✅ Verification complete!');
