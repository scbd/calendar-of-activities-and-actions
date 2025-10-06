#!/usr/bin/env node

/**
 * Script to replace notification IDs with symbols in meetings.js
 *
 * This script:
 * 1. Loads notifications to build an ID->symbol map
 * 2. Scans meetings for notification IDs (format: "52000000cbd0120000000xxx")
 * 3. Replaces IDs with their corresponding symbols (format: "2025-118")
 *
 * Usage:
 *   node scripts/fix-notification-ids.mjs
 *
 * The script will:
 * - Identify any notification entries that use IDs instead of symbols
 * - Look up the corresponding symbol from notifications.js
 * - Replace the ID with the symbol in meetings.js
 * - Display a summary of changes made
 *
 * Example:
 *   Before: notifications: ["52000000cbd0120000000de7"]
 *   After:  notifications: ["2025-095"]
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MEETINGS_PATH = join(__dirname, "../shared/data/meetings.js");

// Pattern to identify notification IDs (24-character hex strings starting with 52000000cbd)
const ID_PATTERN = /^52000000cbd[0-9a-f]{13}$/;

console.log("Loading notifications...");

// Load notifications data
const notificationsModule = await import("../shared/data/notifications.js");
const notifications =
  notificationsModule.default || notificationsModule.notifications;

console.log(`Loaded ${notifications.length} notifications`);

// Build ID to symbol map
const idToSymbol = new Map();

notifications.forEach((notification) => {
  if (notification.id && notification.symbol) {
    idToSymbol.set(notification.id, notification.symbol);
  }
});

console.log(`Built map with ${idToSymbol.size} ID->symbol mappings`);

// Load meetings data
console.log("\nLoading meetings...");
const meetingsModule = await import("../shared/data/meetings.js");
const meetings = meetingsModule.meetings;

console.log(`Loaded ${meetings.length} meetings`);

// Also load the file content for replacements
let meetingsContent = readFileSync(MEETINGS_PATH, "utf8");

// Track replacements
const replacements = [];

let meetingsUpdated = 0;
let idsReplaced = 0;

// Find and track meetings with notification IDs
meetings.forEach((meeting, index) => {
  if (!meeting.notifications || meeting.notifications.length === 0) {
    return;
  }

  const idsToReplace = [];

  meeting.notifications.forEach((notification) => {
    if (ID_PATTERN.test(notification)) {
      const symbol = idToSymbol.get(notification);

      if (symbol) {
        idsToReplace.push({
          id: notification,
          symbol: symbol,
        });
      } else {
        console.warn(
          `Warning: No symbol found for ID ${notification} in meeting ${meeting.id} (${meeting.titleEn})`,
        );
      }
    }
  });

  if (idsToReplace.length > 0) {
    meetingsUpdated++;
    idsReplaced += idsToReplace.length;
    replacements.push({
      meetingIndex: index,
      meetingId: meeting.id,
      meetingTitle: meeting.titleEn,
      replacements: idsToReplace,
    });
  }
});

console.log(
  `\nFound ${meetingsUpdated} meeting(s) with ${idsReplaced} ID(s) to replace:\n`,
);

// Display what will be replaced
replacements.forEach(({ meetingTitle, replacements: items }) => {
  console.log(`Meeting: ${meetingTitle}`);
  items.forEach(({ id, symbol }) => {
    console.log(`  - ${id} → ${symbol}`);
  });
  console.log();
});

// Perform replacements in the file content
replacements.forEach(({ replacements: items }) => {
  items.forEach(({ id, symbol }) => {
    // Use a more precise regex to replace IDs in the notifications arrays
    const idRegex = new RegExp(`"${id}"`, "g");
    const beforeCount = (meetingsContent.match(idRegex) || []).length;

    meetingsContent = meetingsContent.replace(idRegex, `"${symbol}"`);
    const afterCount = (meetingsContent.match(idRegex) || []).length;

    if (beforeCount > afterCount) {
      console.log(
        `✓ Replaced "${id}" with "${symbol}" (${beforeCount - afterCount} occurrence(s))`,
      );
    }
  });
});

// Write updated content back to file
console.log(`\nWriting updated meetings.js...`);
writeFileSync(MEETINGS_PATH, meetingsContent, "utf8");

console.log("✅ Done! Successfully updated meetings.js");
console.log(`\nSummary:`);
console.log(`- Meetings updated: ${meetingsUpdated}`);
console.log(`- IDs replaced: ${idsReplaced}`);
