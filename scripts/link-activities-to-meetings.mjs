#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function main() {
  try {
    // Read the files
    const activitiesPath = join(projectRoot, 'shared/data/25-26-activities.js');
    const meetingsPath = join(projectRoot, 'shared/data/meetings.js');
    
    const activitiesContent = await readFile(activitiesPath, 'utf-8');
    const meetingsContent = await readFile(meetingsPath, 'utf-8');
    
    // Parse the data by evaluating the exports
    // Use eval to extract the data (simple approach for this use case)
    const activitiesMatch = activitiesContent.match(/export default (\[[\s\S]*\])/);
    const meetingsMatch = meetingsContent.match(/export const meetings = (\[[\s\S]*\]);?\s*$/);
    
    if (!activitiesMatch || !meetingsMatch) {
      throw new Error('Could not parse activities or meetings data');
    }
    
    const activities = JSON.parse(activitiesMatch[1]);
    const meetings = JSON.parse(meetingsMatch[1]);
    
    console.log(`Loaded ${activities.length} activities and ${meetings.length} meetings`);
    
    // Create a map of meetings by meetingCode for quick lookup
    const meetingsByCode = new Map();

    meetings.forEach(meeting => {
      if (meeting.meetingCode) {
        meetingsByCode.set(meeting.meetingCode, meeting);
      }
    });
    
    console.log(`\nMeeting codes available: ${meetingsByCode.size}`);
    
    // Track changes
    let updatedMeetingsCount = 0;
    let totalLinksAdded = 0;
    
    // For each activity that has meetings
    activities.forEach(activity => {
      if (activity.meetings && activity.meetings.length > 0) {
        console.log(`\nProcessing activity: ${activity.identifier} - ${activity.title.substring(0, 60)}...`);
        console.log(`  Meetings referenced: ${activity.meetings.join(', ')}`);
        
        activity.meetings.forEach(meetingCode => {
          const meeting = meetingsByCode.get(meetingCode);
          
          if (meeting) {
            // Initialize activities array if it doesn't exist, or clean it to only have strings
            if (!meeting.activities) {
              meeting.activities = [];
            } else {
              // Remove any non-string values (like numbers from previous attempts)
              meeting.activities = meeting.activities.filter(a => typeof a === 'string');
            }
            
            // Add activity identifier if not already present
            if (!meeting.activities.includes(activity.identifier)) {
              meeting.activities.push(activity.identifier);
              totalLinksAdded++;
              console.log(`  ✓ Added ${activity.identifier} to meeting ${meetingCode}`);
            } else {
              console.log(`  - ${activity.identifier} already in meeting ${meetingCode}`);
            }
            
            updatedMeetingsCount++;
          } else {
            console.log(`  ⚠ Warning: Meeting ${meetingCode} not found in meetings data`);
          }
        });
      }
    });
    
    console.log(`\n\nSummary:`);
    console.log(`- Updated ${updatedMeetingsCount} meeting references`);
    console.log(`- Added ${totalLinksAdded} new activity links to meetings`);
    
    // Write back the meetings file
    const newMeetingsContent = `// Auto-generated snapshot of meeting index results for start dates from October 2024 onwards
// Source: https://api.cbd.int/api/v2013/index/select

export const meetings = ${JSON.stringify(meetings, null, 2)};
`;
    
    await writeFile(meetingsPath, newMeetingsContent, 'utf-8');
    console.log(`\n✓ Successfully updated ${meetingsPath}`);
    
    // Show sample of updated meetings
    console.log(`\n\nSample updated meetings:`);
    meetings.slice(0, 5).forEach(meeting => {
      if (meeting.activities && meeting.activities.length > 0) {
        console.log(`\n${meeting.meetingCode}: ${meeting.titleEn.substring(0, 60)}...`);
        console.log(`  Activities: ${meeting.activities.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
