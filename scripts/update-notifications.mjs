#!/usr/bin/env node
/**
 * Script to fetch notification data from SCBD index and update notifications.js
 * 
 * This script:
 * 1. Queries the SCBD index API for all notifications from December 2025 onwards
 * 2. Fetches all relevant notification fields
 * 3. Updates the notifications.js data file by adding new records (does not modify existing)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCBD_INDEX_URL = 'https://api.cbd.int/api/v2013/index/select';
const NOTIFICATIONS_FILE = path.join(__dirname, '../shared/data/notifications.js');

/**
 * Build SOLR query URL
 */
function buildQueryUrl(params) {
  const url = new URL(SCBD_INDEX_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(key, v));
    } else {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

/**
 * Fetch notifications from SCBD index
 */
async function fetchNotifications() {
  console.log('Fetching notifications from SCBD index API...');
  
  const params = {
    wt: 'json',
    q: '*:*',
    fq: [
      'schema_s:notification',
      '_state_s:public',
      'date_dt:[2025-12-01T00:00:00Z TO *]'
    ],
    fl: [
      'id',
      'identifier_s',
      'symbol_s',
      'reference_s',
      'title_EN_s',
      'title_FR_s',
      'title_ES_s',
      'title_AR_s',
      'title_RU_s',
      'title_ZH_s',
      'date_dt',
      'actionDate_dt',
      'deadline_dt',
      'sender_s',
      'recipient_ss',
      'subject_ss',
      'url_ss',
      'files_ss',
      'updatedDate_dt',
      'createdDate_dt',
      'fulltext_s',
      'fulltext_EN_s',
      'fulltext_ES_s',
      'fulltext_FR_s',
      'fulltext_AR_s',
      'fulltext_RU_s',
      'fulltext_ZH_s'
    ].join(','),
    rows: 5000,
    sort: 'date_dt desc'
  };

  const url = buildQueryUrl(params);
  
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const docs = data.response?.docs || [];
    
    console.log(`Fetched ${docs.length} notifications from index`);
    
    return docs;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Parse files from the API response
 */
function parseFiles(filesArray) {
  if (!filesArray || !Array.isArray(filesArray)) return [];
  
  return filesArray.map(fileStr => {
    try {
      // Files may be JSON strings or already parsed objects
      if (typeof fileStr === 'string') {
        return JSON.parse(fileStr);
      }
      return fileStr;
    } catch {
      // If parsing fails, return as-is in a simple structure
      return { url: fileStr };
    }
  });
}

/**
 * Update notifications.js file by adding new records only
 */
async function updateNotificationsFile(docs) {
  console.log('Reading current notifications.js file...');
  
  // Read current file
  const fileContent = await fs.readFile(NOTIFICATIONS_FILE, 'utf-8');
  
  // Extract the notifications array using regex
  const match = fileContent.match(/const notifications = (\[[\s\S]*?\]);[\s]*export default notifications;/);
  
  if (!match) {
    throw new Error('Could not find notifications array in file');
  }
  
  let existingNotifications;
  try {
    existingNotifications = JSON.parse(match[1]);
  } catch (parseError) {
    throw new Error(`Failed to parse existing notifications: ${parseError.message}`);
  }

  console.log(`Found ${existingNotifications.length} existing notifications in file`);
  
  // Create a set of existing identifiers for fast lookup
  const existingIdentifiers = new Set(
    existingNotifications.map(n => n.identifier)
  );
  
  console.log('Processing API data...');
  
  let addedCount = 0;
  let skippedCount = 0;
  
  // Process each document from API - only add new records
  docs.forEach(doc => {
    const identifier = doc.identifier_s;

    if (!identifier) return;
    
    // Skip if notification already exists
    if (existingIdentifiers.has(identifier)) {
      skippedCount++;
      return;
    }
    
    // Build new notification data from API
    const newNotification = {
      id: doc.id || doc.identifier_s,
      identifier: doc.identifier_s,
      symbol: doc.symbol_s || '',
      reference: doc.reference_s || '',
      titleEn: doc.title_EN_s || '',
      titleFr: doc.title_FR_s || doc.title_EN_s || '',
      titleEs: doc.title_ES_s || doc.title_EN_s || '',
      titleAr: doc.title_AR_s || doc.title_EN_s || '',
      titleRu: doc.title_RU_s || doc.title_EN_s || '',
      titleZh: doc.title_ZH_s || doc.title_EN_s || '',
      date: doc.date_dt || null,
      ...(doc.actionDate_dt && { actionDate: doc.actionDate_dt }),
      ...(doc.deadline_dt && { deadline: doc.deadline_dt }),
      sender: doc.sender_s || '',
      recipients: doc.recipient_ss || [],
      themes: doc.subject_ss || [],
      urls: doc.url_ss || [],
      files: parseFiles(doc.files_ss),
      updatedDate: doc.updatedDate_dt || new Date().toISOString(),
      createdDate: doc.createdDate_dt || doc.date_dt || new Date().toISOString(),
      source: 'index:notification',
      ...(doc.fulltext_s && { fulltext: doc.fulltext_s }),
      ...(doc.fulltext_EN_s && { fulltextEn: doc.fulltext_EN_s }),
      ...(doc.fulltext_ES_s && { fulltextEs: doc.fulltext_ES_s }),
      ...(doc.fulltext_FR_s && { fulltextFr: doc.fulltext_FR_s }),
      ...(doc.fulltext_AR_s && { fulltextAr: doc.fulltext_AR_s }),
      ...(doc.fulltext_RU_s && { fulltextRu: doc.fulltext_RU_s }),
      ...(doc.fulltext_ZH_s && { fulltextZh: doc.fulltext_ZH_s }),
      meetings: []
    };

    existingNotifications.push(newNotification);
    existingIdentifiers.add(identifier);
    addedCount++;
  });
  
  console.log(`Added ${addedCount} new notifications`);
  console.log(`Skipped ${skippedCount} existing notifications`);
  
  // Sort notifications by date (newest first)
  existingNotifications.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';

    return dateB.localeCompare(dateA);
  });
  
  // Generate new file content
  const header = `// Auto-generated snapshot of notification index results for issue dates from 2024 onwards
// Source: https://api.cbd.int/api/v2013/index/select
// Updated: ${new Date().toISOString()}
// Includes fulltext_s and localized fulltext fields
`;
  
  const newContent = `${header}const notifications = ${JSON.stringify(existingNotifications, null, 2)};

export default notifications;
`;
  
  // Write updated file
  await fs.writeFile(NOTIFICATIONS_FILE, newContent, 'utf-8');
  console.log('✅ Successfully updated notifications.js');
  
  return { total: existingNotifications.length, added: addedCount, skipped: skippedCount };
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Starting notifications update...\n');
    
    // Fetch notifications
    const docs = await fetchNotifications();
    
    if (docs.length === 0) {
      console.log('⚠️  No new notifications found from December 2025 onwards');
      return;
    }
    
    // Update notifications file
    const stats = await updateNotificationsFile(docs);
    
    console.log('\n📊 Summary:');
    console.log(`   Total notifications: ${stats.total}`);
    console.log(`   Added new: ${stats.added}`);
    console.log(`   Skipped existing: ${stats.skipped}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
