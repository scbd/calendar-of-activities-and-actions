#!/usr/bin/env node
/**
 * Script to create bidirectional links between meetings and notifications
 * 
 * For each meeting:
 * - Searches all notification fulltexts for mentions of the meeting code
 * - Adds notification symbols to the meeting's notifications array
 * 
 * For each notification:
 * - Adds meeting codes to the notification's meetings array
 * 
 * Updates both meetings.js and notifications.js with the new relationships
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'shared', 'data');
const meetingsPath = join(dataDir, 'meetings.js');
const notificationsPath = join(dataDir, 'notifications.js');

console.log('Loading meetings and notifications data...');

// Read and parse the files
const meetingsContent = readFileSync(meetingsPath, 'utf-8');
const notificationsContent = readFileSync(notificationsPath, 'utf-8');

// Extract the arrays from the ES module exports
const meetingsMatch = meetingsContent.match(/export const meetings = (\[[\s\S]*\]);/);
const notificationsMatch = notificationsContent.match(/const notifications = (\[[\s\S]*\]);/);

if (!meetingsMatch || !notificationsMatch) {
  console.error('Failed to parse data files');
  process.exit(1);
}

const meetings = JSON.parse(meetingsMatch[1]);
const notifications = JSON.parse(notificationsMatch[1]);

console.log(`Loaded ${meetings.length} meetings and ${notifications.length} notifications`);

// Initialize tracking
let meetingLinksCreated = 0;
let notificationLinksCreated = 0;

// Create a map for quick notification lookup by symbol
const notificationsBySymbol = new Map();

notifications.forEach(notification => {
  notificationsBySymbol.set(notification.symbol, notification);
  // Initialize meetings array if not present
  if (!notification.meetings) {
    notification.meetings = [];
  }
});

console.log('\nProcessing meetings and linking to notifications...');

// For each meeting, search for it in notification fulltexts
meetings.forEach((meeting, index) => {
  const meetingCode = meeting.meetingCode;
  
  if (!meetingCode) {
    return;
  }
  
  // Initialize notifications array if not present
  if (!meeting.notifications) {
    meeting.notifications = [];
  }
  
  // Search for this meeting code in all notification fulltexts
  notifications.forEach(notification => {
    // Check all fulltext fields for mentions of the meeting code
    const fulltextFields = [
      notification.fulltext,
      notification.fulltextEn,
      notification.fulltextEs,
      notification.fulltextFr,
      notification.fulltextAr,
      notification.fulltextRu,
      notification.fulltextZh
    ];
    
    const mentioned = fulltextFields.some(text => {
      if (!text) return false;
      
      // Create regex pattern for meeting code with word boundaries
      // This handles codes like "COP-16", "SBI-05", etc.
      const pattern = new RegExp(`\\b${meetingCode.replace(/[-]/g, '[-\\s]?')}\\b`, 'i');

      return pattern.test(text);
    });
    
    if (mentioned) {
      // Add notification symbol to meeting if not already present
      if (!meeting.notifications.includes(notification.symbol)) {
        meeting.notifications.push(notification.symbol);
        meetingLinksCreated++;
      }
      
      // Add meeting code to notification if not already present
      if (!notification.meetings.includes(meetingCode)) {
        notification.meetings.push(meetingCode);
        notificationLinksCreated++;
      }
    }
  });
  
  if ((index + 1) % 10 === 0) {
    process.stdout.write(`\rProcessed ${index + 1}/${meetings.length} meetings...`);
  }
});

console.log(`\n\nLinking complete!`);
console.log(`- Created ${meetingLinksCreated} links from meetings to notifications`);
console.log(`- Created ${notificationLinksCreated} links from notifications to meetings`);

// Generate updated file content for meetings
const meetingsHeader = meetingsContent.substring(0, meetingsContent.indexOf('export const meetings = ['));
const updatedMeetingsContent = meetingsHeader + 'export const meetings = ' + JSON.stringify(meetings, null, 2) + ';\n';

// Generate updated file content for notifications
const notificationsHeader = notificationsContent.substring(0, notificationsContent.indexOf('const notifications = ['));
const notificationsFooter = notificationsContent.substring(notificationsContent.indexOf('export default notifications;'));
const updatedNotificationsContent = notificationsHeader + 'const notifications = ' + JSON.stringify(notifications, null, 2) + ';\n\n' + notificationsFooter;

console.log('\nWriting updated files...');

// Write updated files
writeFileSync(meetingsPath, updatedMeetingsContent, 'utf-8');
writeFileSync(notificationsPath, updatedNotificationsContent, 'utf-8');

console.log('✓ Updated meetings.js');
console.log('✓ Updated notifications.js');

// Print some statistics
const meetingsWithNotifications = meetings.filter(m => m.notifications && m.notifications.length > 0);
const notificationsWithMeetings = notifications.filter(n => n.meetings && n.meetings.length > 0);

console.log('\nStatistics:');
console.log(`- ${meetingsWithNotifications.length}/${meetings.length} meetings have linked notifications`);
console.log(`- ${notificationsWithMeetings.length}/${notifications.length} notifications have linked meetings`);

// Show top 5 meetings with most notifications
const topMeetings = [...meetings]
  .filter(m => m.notifications && m.notifications.length > 0)
  .sort((a, b) => b.notifications.length - a.notifications.length)
  .slice(0, 5);

if (topMeetings.length > 0) {
  console.log('\nTop meetings by notification count:');
  topMeetings.forEach(m => {
    console.log(`  - ${m.meetingCode}: ${m.notifications.length} notifications`);
  });
}

console.log('\n✅ Done!');
