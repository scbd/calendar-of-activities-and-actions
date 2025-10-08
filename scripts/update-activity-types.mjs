#!/usr/bin/env node

/**
 * Script to update activity type values from human-readable names to identifiers
 * Maps type names to their corresponding CAL-ACTIVITY-TYPE-* identifiers
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '..', 'shared', 'data', '25-26-activities.js');

// Read the file
let content = readFileSync(filePath, 'utf-8');

// Define the mapping from human-readable names to identifiers
const typeMapping = {
  'Nominations': 'CAL-ACTIVITY-TYPE-NOMINATIONS',
  'Peer-Review': 'CAL-ACTIVITY-TYPE-PEER-REVIEW',
  'Workshop': 'CAL-ACTIVITY-TYPE-WORKSHOP',
  'Submission of Information': 'CAL-ACTIVITY-TYPE-SUBMISSION-OF-INFORMATION',
  'Report': 'CAL-ACTIVITY-TYPE-REPORT',
  'Forum': 'CAL-ACTIVITY-TYPE-FORUM',
  'Webinar': 'CAL-ACTIVITY-TYPE-WEBINAR'
};

// Replace each type
for (const [oldValue, newValue] of Object.entries(typeMapping)) {
  const pattern = `"type": "${oldValue}"`;
  const replacement = `"type": "${newValue}"`;
  
  const beforeCount = (content.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

  content = content.replaceAll(pattern, replacement);
  
  console.log(`Replaced "${oldValue}" → "${newValue}": ${beforeCount} occurrences`);
}

// Write the file back
writeFileSync(filePath, content, 'utf-8');

console.log('\n✓ Successfully updated activity types in 25-26-activities.js');
