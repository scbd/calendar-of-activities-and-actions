#!/usr/bin/env node
/**
 * Script to create bidirectional links between meetings and activities
 * 
 * For each meeting:
 * - Searches all activity titles, descriptions, and related documents for mentions of the meeting code
 * - Adds activity indices to the meeting's activities array
 * 
 * For each activity:
 * - Adds meeting codes to the activity's meetings array
 * 
 * Updates both meetings.js and activities.js with the new relationships
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'shared', 'data');
const meetingsPath = join(dataDir, 'meetings.js');
const activitiesPath = join(dataDir, '25-26-activities.js');

console.log('Loading meetings and activities data...');

// Read and parse the files
const meetingsContent = readFileSync(meetingsPath, 'utf-8');
const activitiesContent = readFileSync(activitiesPath, 'utf-8');

// Extract the arrays from the ES module exports
const meetingsMatch = meetingsContent.match(/export const meetings = (\[[\s\S]*\]);/);
const activitiesMatch = activitiesContent.match(/export default (\[[\s\S]*\]);/);

if (!meetingsMatch || !activitiesMatch) {
  console.error('Failed to parse data files');
  process.exit(1);
}

const meetings = JSON.parse(meetingsMatch[1]);
const activities = JSON.parse(activitiesMatch[1]);

console.log(`Loaded ${meetings.length} meetings and ${activities.length} activities`);

// Initialize tracking
let meetingLinksCreated = 0;
let activityLinksCreated = 0;

// Create a map for quick meeting lookup by code
const meetingsByCode = new Map();

meetings.forEach(meeting => {
  const code = meeting.meetingCode;

  if (code) {
    meetingsByCode.set(code, meeting);
    // Clear any existing activities array
    meeting.activities = [];
  }
});

console.log('\nProcessing activities and linking to meetings...');

// For each activity, search for meeting codes in title, description, and related documents
activities.forEach((activity, index) => {
  // Clear any existing meetings array
  activity.meetings = [];
  
  // Combine searchable text fields
  const searchableText = [
    activity.title || '',
    activity.description || '',
    activity.relatedDocuments || '',
    activity.agendaItem || ''
  ].join(' ');
  
  // Search for each meeting code in the activity text
  meetingsByCode.forEach((meeting, meetingCode) => {
    // Direct text mention of meeting code
    const codePattern = new RegExp(`\\b${meetingCode.replace(/[-]/g, '[-\\s]?')}\\b`, 'i');
    
    let foundMatch = codePattern.test(searchableText);
    
    // Also check if activity text contains significant parts of the meeting title
    if (!foundMatch && meeting.titleEn) {
      // Search for the meeting title in activity text
      const titlePattern = new RegExp(meeting.titleEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      foundMatch = titlePattern.test(searchableText);
    }

    if (foundMatch) {
      // Add activity index to meeting if not already present
      if (!meeting.activities.includes(index)) {
        meeting.activities.push(index);
        meetingLinksCreated++;
      }
      
      // Add meeting code to activity if not already present
      if (!activity.meetings.includes(meetingCode)) {
        activity.meetings.push(meetingCode);
        activityLinksCreated++;
      }
    }
  });
  
  if ((index + 1) % 50 === 0) {
    process.stdout.write(`\rProcessed ${index + 1}/${activities.length} activities...`);
  }
});

console.log(`\n\nLinking complete!`);
console.log(`- Created ${meetingLinksCreated} links from meetings to activities`);
console.log(`- Created ${activityLinksCreated} links from activities to meetings`);

// Generate updated file content for meetings
const meetingsHeader = meetingsContent.substring(0, meetingsContent.indexOf('export const meetings = ['));
const updatedMeetingsContent = meetingsHeader + 'export const meetings = ' + JSON.stringify(meetings, null, 2) + ';\n';

// Generate updated file content for activities
const updatedActivitiesContent = 'export default ' + JSON.stringify(activities, null, 2) + ';\n';

console.log('\nWriting updated files...');

// Write updated files
writeFileSync(meetingsPath, updatedMeetingsContent, 'utf-8');
writeFileSync(activitiesPath, updatedActivitiesContent, 'utf-8');

console.log('✓ Updated meetings.js');
console.log('✓ Updated 25-26-activities.js');

// Print some statistics
const meetingsWithActivities = meetings.filter(m => m.activities && m.activities.length > 0);
const activitiesWithMeetings = activities.filter(a => a.meetings && a.meetings.length > 0);

console.log('\nStatistics:');
console.log(`- ${meetingsWithActivities.length}/${meetings.length} meetings have linked activities`);
console.log(`- ${activitiesWithMeetings.length}/${activities.length} activities have linked meetings`);

// Show top 5 meetings with most activities
const topMeetings = [...meetings]
  .filter(m => m.activities && m.activities.length > 0)
  .sort((a, b) => b.activities.length - a.activities.length)
  .slice(0, 5);

if (topMeetings.length > 0) {
  console.log('\nTop meetings by activity count:');
  topMeetings.forEach(m => {
    console.log(`  - ${m.meetingCode}: ${m.activities.length} activities`);
  });
}

// Show some sample activities with meetings
const activitiesWithMeetingsSample = activities
  .map((a, i) => ({ ...a, index: i }))
  .filter(a => a.meetings && a.meetings.length > 0)
  .slice(0, 5);

if (activitiesWithMeetingsSample.length > 0) {
  console.log('\nSample activities with linked meetings:');
  activitiesWithMeetingsSample.forEach(a => {
    console.log(`  - Activity ${a.index}: "${a.title}" → [${a.meetings.join(', ')}]`);
  });
}

console.log('\n✅ Done!');
