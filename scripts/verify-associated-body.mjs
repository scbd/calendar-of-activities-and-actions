#!/usr/bin/env node

/**
 * Script to verify that all associatedBody values have been correctly mapped
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Valid subject identifiers for subsidiary bodies
const VALID_SUBJECT_IDS = [
  "CBD-SUBJECT-SBI",
  "CBD-SUBJECT-SBSTTA",
  "CBD-SUBJECT-CPB",
  "CBD-SUBJECT-NPB",
  "CBD-SUBJECT-8J",
  "CBD-SUBJECT-COP",
];

// Old short names that should no longer exist
const OLD_SHORT_NAMES = ["SBI", "SBSTTA", "CP", "NP", "8J", "COP"];

async function main() {
  const dataFilePath = path.resolve(__dirname, '../shared/data/25-26-activities.js');
  
  console.log('Verifying file:', dataFilePath);
  
  // Import the data
  const module = await import(`file://${dataFilePath}`);
  const activities = module.default;
  
  console.log(`\nVerifying ${activities.length} activities...\n`);
  
  let allValid = true;
  const issues = [];
  
  activities.forEach((activity) => {
    if (activity.associatedBody) {
      const bodies = activity.associatedBody.split(',').map(b => b.trim());
      
      bodies.forEach(body => {
        // Check if it's an old short name
        if (OLD_SHORT_NAMES.includes(body)) {
          allValid = false;
          issues.push({
            identifier: activity.identifier,
            issue: `Found old short name "${body}" in associatedBody`,
            value: activity.associatedBody
          });
        }
        
        // Check if it's a valid subject identifier
        if (!VALID_SUBJECT_IDS.includes(body)) {
          allValid = false;
          issues.push({
            identifier: activity.identifier,
            issue: `Unknown value "${body}" in associatedBody`,
            value: activity.associatedBody
          });
        }
      });
    }
  });
  
  if (allValid) {
    console.log('✅ All associatedBody values are correctly mapped!');
    console.log(`\nSummary:`);
    console.log(`  Total activities: ${activities.length}`);
    
    // Count usage of each subject identifier
    const usage = {};

    activities.forEach(activity => {
      if (activity.associatedBody) {
        const bodies = activity.associatedBody.split(',').map(b => b.trim());

        bodies.forEach(body => {
          usage[body] = (usage[body] || 0) + 1;
        });
      }
    });
    
    console.log('\n  Subject identifier usage:');
    Object.entries(usage).sort((a, b) => b[1] - a[1]).forEach(([id, count]) => {
      console.log(`    ${id}: ${count}`);
    });
  } else {
    console.log('❌ Found issues:\n');
    issues.forEach(issue => {
      console.log(`  ${issue.identifier}: ${issue.issue}`);
      console.log(`    Current value: "${issue.value}"\n`);
    });
    process.exit(1);
  }
}

main().catch(console.error);
