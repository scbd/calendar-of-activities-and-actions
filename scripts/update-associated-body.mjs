#!/usr/bin/env node

/**
 * Script to update associatedBody values in 25-26-activities.js
 * Maps short names (SBI, SBSTTA, CP, NP, etc.) to subject identifiers 
 * (CBD-SUBJECT-SBI, CBD-SUBJECT-SBSTTA, CBD-SUBJECT-CPB, CBD-SUBJECT-NPB, etc.)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping from short names to subject identifiers
const SUBSIDIARY_BODY_TO_SUBJECT_MAP = {
  "SBI": "CBD-SUBJECT-SBI",
  "SBSTTA": "CBD-SUBJECT-SBSTTA",
  "CP": "CBD-SUBJECT-CPB",
  "NP": "CBD-SUBJECT-NPB",
  "8J": "CBD-SUBJECT-8J",
  "COP": "CBD-SUBJECT-COP",
};

/**
 * Map a single associatedBody value (or comma-separated values) to subject identifiers
 */
function mapAssociatedBody(associatedBody) {
  if (!associatedBody || typeof associatedBody !== 'string') {
    return associatedBody;
  }

  // Split by comma, trim whitespace, map each value
  const bodies = associatedBody.split(',').map(body => body.trim());
  const mappedBodies = bodies.map(body => {
    const mapped = SUBSIDIARY_BODY_TO_SUBJECT_MAP[body];

    if (mapped) {
      return mapped;
    }

    // If already mapped or unknown, return as-is
    console.warn(`Warning: No mapping found for "${body}"`);
    return body;
  });

  return mappedBodies.join(', ');
}

async function main() {
  const dataFilePath = path.resolve(__dirname, '../shared/data/25-26-activities.js');
  
  console.log('Reading file:', dataFilePath);
  
  // Import the data
  const module = await import(`file://${dataFilePath}`);
  const activities = module.default;
  
  console.log(`Processing ${activities.length} activities...`);
  
  let updatedCount = 0;
  const changes = [];
  
  // Update each activity's associatedBody
  activities.forEach((activity, index) => {
    if (activity.associatedBody) {
      const original = activity.associatedBody;
      const mapped = mapAssociatedBody(original);
      
      if (original !== mapped) {
        activity.associatedBody = mapped;
        updatedCount++;
        changes.push({
          index,
          identifier: activity.identifier,
          original,
          mapped
        });
      }
    }
  });
  
  console.log(`\nUpdated ${updatedCount} activities:`);
  changes.forEach(change => {
    console.log(`  ${change.identifier}: "${change.original}" -> "${change.mapped}"`);
  });
  
  // Write back to file
  const output = `export default ${JSON.stringify(activities, null, 2)};\n`;

  fs.writeFileSync(dataFilePath, output, 'utf8');
  
  console.log(`\nSuccessfully updated ${dataFilePath}`);
  console.log(`Total activities processed: ${activities.length}`);
  console.log(`Total activities updated: ${updatedCount}`);
}

main().catch(console.error);
