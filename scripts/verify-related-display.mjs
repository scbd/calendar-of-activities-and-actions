#!/usr/bin/env node
/**
 * Verify that related meetings are properly linked and will display
 */

import activitiesSnapshot from '../shared/data/25-26-activities.js';
import { meetings as meetingsSnapshot } from '../shared/data/meetings.js';
import { buildDocsFromActivities, normalizeMeetingDoc } from '../shared/utils/calendar-document-normalizer.ts';
import { getRelatedMeetingsForActivity, getRelatedActivitiesForMeeting } from '../shared/utils/notifications.ts';

console.log('Verifying related meetings display...\n');

// Build docs like the app does
const normalizedMeetings = meetingsSnapshot.map((meeting, index) => normalizeMeetingDoc(meeting, index));
const activitiesDocs = buildDocsFromActivities(activitiesSnapshot);
const allDocs = [...normalizedMeetings, ...activitiesDocs];

console.log(`Total documents: ${allDocs.length} (${normalizedMeetings.length} meetings, ${activitiesDocs.length} activities)\n`);

// Find activities with meetings
const activitiesWithMeetings = activitiesDocs.filter(doc => doc.meetings && doc.meetings.length > 0);

console.log(`Activities with meetings: ${activitiesWithMeetings.length}\n`);

activitiesWithMeetings.forEach(activity => {
  console.log(`Activity: ${activity.titleEn || activity.title}`);
  console.log(`  ID: ${activity.id}`);
  console.log(`  Meetings array: [${activity.meetings?.join(', ')}]`);
  
  const relatedMeetings = getRelatedMeetingsForActivity(activity, allDocs);
  
  console.log(`  Related meetings found: ${relatedMeetings.length}`);
  
  relatedMeetings.forEach(meeting => {
    console.log(`    - ${meeting.titleEn || meeting.title}`);
    console.log(`      Meeting Code: ${meeting.meetingCode}`);
    console.log(`      ID: ${meeting.id}`);
  });
  
  console.log('');
});

// Find meetings with activities
const meetingsWithActivities = normalizedMeetings.filter(doc => doc.activities && doc.activities.length > 0);

console.log(`\nMeetings with activities: ${meetingsWithActivities.length}\n`);

meetingsWithActivities.forEach(meeting => {
  console.log(`Meeting: ${meeting.titleEn || meeting.title}`);
  console.log(`  Meeting Code: ${meeting.meetingCode}`);
  console.log(`  ID: ${meeting.id}`);
  console.log(`  Activities array: [${meeting.activities?.join(', ')}]`);
  
  const relatedActivities = getRelatedActivitiesForMeeting(meeting, allDocs);
  
  console.log(`  Related activities found: ${relatedActivities.length}`);
  
  relatedActivities.forEach(activity => {
    console.log(`    - ${activity.titleEn || activity.title}`);
    console.log(`      ID: ${activity.id}`);
  });
  
  console.log('');
});

console.log('\n✅ Verification complete!');
