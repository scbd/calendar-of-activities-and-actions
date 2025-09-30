#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const activities = JSON.parse(readFileSync(join(projectRoot, 'shared/data/25-26-activities.js'), 'utf-8').match(/export default (\[[\s\S]*\])/)[1]);
const meetings = JSON.parse(readFileSync(join(projectRoot, 'shared/data/meetings.js'), 'utf-8').match(/export const meetings = (\[[\s\S]*\]);?\s*$/)[1]);

console.log('=== ACTIVITY TO MEETING LINKING SUMMARY ===\n');

// Activities with meetings
const activitiesWithMeetings = activities.filter(a => a.meetings && a.meetings.length > 0);

console.log('Total activities with meetings:', activitiesWithMeetings.length);

console.log('\n--- Activities and their meetings ---\n');
activitiesWithMeetings.forEach(activity => {
  console.log('Activity:', activity.identifier);
  console.log('Title:', activity.title.substring(0, 70) + '...');
  console.log('Linked to meetings:', activity.meetings.join(', '));
  console.log('');
});

// Meetings with activities
const meetingsWithActivities = meetings.filter(m => m.activities && m.activities.length > 0);

console.log('\n--- Meetings and their activities ---\n');
console.log('Total meetings with activities:', meetingsWithActivities.length);
console.log('');

meetingsWithActivities.forEach(meeting => {
  console.log('Meeting:', meeting.meetingCode);
  console.log('Title:', meeting.titleEn.substring(0, 70) + '...');
  console.log('Linked activities:', meeting.activities.join(', '));
  console.log('');
});

// Verification
console.log('\n=== VERIFICATION ===\n');
let allLinksValid = true;
activitiesWithMeetings.forEach(activity => {
  activity.meetings.forEach(meetingCode => {
    const meeting = meetings.find(m => m.meetingCode === meetingCode);

    if (meeting) {
      const hasBacklink = meeting.activities && meeting.activities.includes(activity.identifier);

      if (!hasBacklink) {
        console.log('❌ ERROR: Activity', activity.identifier, 'references meeting', meetingCode, 'but the meeting does not reference it back');
        allLinksValid = false;
      }
    } else {
      console.log('⚠️  WARNING: Activity', activity.identifier, 'references meeting', meetingCode, 'which does not exist');
      allLinksValid = false;
    }
  });
});

if (allLinksValid) {
  console.log('✅ All activity-to-meeting links are properly bidirectional!');
}
