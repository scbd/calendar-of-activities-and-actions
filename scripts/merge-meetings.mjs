#!/usr/bin/env node

/**
 * Script to merge meetings from meetings-temp.js into meetings.js
 * Checks for existing meetings and adds new ones with proper property mapping
 */

import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MEETINGS_PATH = join(__dirname, '../shared/data/meetings.js');
const MEETINGS_TEMP_PATH = join(__dirname, '../shared/data/meetings-temp.js');

/**
 * Maps temp meeting properties to target meeting structure
 */
function mapTempMeeting(tempMeeting) {
  const mapped = {
    id: tempMeeting.id || tempMeeting.identifier_s,
    identifier: tempMeeting.identifier_s,
    titleEn: tempMeeting.title_EN_s || tempMeeting.title_s,
    titleFr: tempMeeting.title_FR_s || tempMeeting.title_s,
    titleEs: tempMeeting.title_ES_s || tempMeeting.title_s,
    startDate: tempMeeting.startDate_dt || tempMeeting.startDate_s,
    endDate: tempMeeting.endDate_dt || tempMeeting.endDate_s,
    status: tempMeeting.status_s,
    type: tempMeeting.schema_EN_s || 'Meeting',
    subjectEn: tempMeeting.thematicArea_EN_ss?.join(', ') || null,
    subjects: tempMeeting.thematicAreas_ss || tempMeeting.themes_ss || [],
    subsidiaryBody: null,
    subsidiaryBodies: [],
    copDecision: null,
    cityEn: tempMeeting.eventCity_EN_s || tempMeeting.eventCity_s,
    city: tempMeeting.eventCity_EN_s || tempMeeting.eventCity_s,
    countryEn: tempMeeting.eventCountry_EN_s || tempMeeting.eventCountry_EN_t,
    country: tempMeeting.eventCountry_s,
    meetingCode: tempMeeting.symbol_s,
    links: tempMeeting.url_ss || [],
    notesEn: tempMeeting.notes_EN_s || null,
    updatedDate: tempMeeting.updatedDate_s || tempMeeting.updatedDate_dt,
    source: 'index:meeting',
    notifications: [],
    activities: [],
  };

  return mapped;
}

/**
 * Load and parse a JS file that exports data
 */
async function loadJsData(filePath) {
  const content = await readFile(filePath, 'utf-8');
  
  // Extract the array from the file
  // Handle both "export default [...]" and "export const meetings = [...]"
  let dataMatch = content.match(/export\s+default\s*(\[[\s\S]*\]);?/);
  if (!dataMatch) {
    dataMatch = content.match(/export\s+const\s+\w+\s*=\s*(\[[\s\S]*\]);?/);
  }
  
  if (!dataMatch) {
    throw new Error(`Could not parse data from ${filePath}`);
  }

  // Use eval to parse the array (be careful - only use with trusted sources)
  // In production, you might want to use a proper parser
  const dataStr = dataMatch[1];
  const data = eval(dataStr);
  
  return data;
}

/**
 * Write meetings array to JS file
 */
async function writeMeetingsFile(meetings, filePath) {
  const header = `// Auto-generated snapshot of meeting index results for start dates from October 2024 onwards
// Source: https://api.cbd.int/api/v2013/index/select

`;
  
  const content = header + 'export const meetings = ' + JSON.stringify(meetings, null, 2) + ';\n';
  await writeFile(filePath, content, 'utf-8');
}

async function main() {
  console.log('Loading meetings from both files...');
  
  // Load existing meetings
  let existingMeetings;
  try {
    existingMeetings = await loadJsData(MEETINGS_PATH);
  } catch (error) {
    console.error('Error loading meetings.js:', error.message);
    process.exit(1);
  }

  // Load temp meetings
  let tempMeetings;
  try {
    tempMeetings = await loadJsData(MEETINGS_TEMP_PATH);
  } catch (error) {
    console.error('Error loading meetings-temp.js:', error.message);
    process.exit(1);
  }

  console.log(`Found ${existingMeetings.length} existing meetings`);
  console.log(`Found ${tempMeetings.length} temp meetings`);

  // Create a map of existing meeting IDs for quick lookup
  const existingIds = new Set(existingMeetings.map(m => m.id || m.identifier));
  
  // Process temp meetings and find new ones
  const newMeetings = [];
  let skippedCount = 0;
  
  for (const tempMeeting of tempMeetings) {
    const id = tempMeeting.id || tempMeeting.identifier_s;
    
    if (!id) {
      console.warn('Warning: Found meeting without ID, skipping...');
      skippedCount++;
      continue;
    }
    
    if (existingIds.has(id)) {
      // Meeting already exists
      skippedCount++;
      continue;
    }
    
    // Map and add new meeting
    const mapped = mapTempMeeting(tempMeeting);
    newMeetings.push(mapped);
  }

  console.log(`\nFound ${newMeetings.length} new meetings to add`);
  console.log(`Skipped ${skippedCount} meetings (already exist or invalid)`);

  if (newMeetings.length === 0) {
    console.log('\nNo new meetings to add. Exiting.');
    return;
  }

  // Combine and sort by start date
  const allMeetings = [...existingMeetings, ...newMeetings];
  allMeetings.sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateA - dateB;
  });

  console.log('\nNew meetings being added:');
  newMeetings.forEach(meeting => {
    console.log(`  - ${meeting.meetingCode}: ${meeting.titleEn} (${meeting.startDate})`);
  });

  // Write back to file
  console.log(`\nWriting ${allMeetings.length} meetings back to ${MEETINGS_PATH}...`);
  await writeMeetingsFile(allMeetings, MEETINGS_PATH);
  
  console.log('✅ Done! Meetings merged successfully.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
