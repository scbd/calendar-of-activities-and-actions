#!/usr/bin/env node
/**
 * Script to fetch fulltext_s field for notifications and update notifications.js
 * 
 * This script:
 * 1. Queries the SCBD index API for all notifications from 2024 onwards
 * 2. Fetches the fulltext_s field for each notification
 * 3. Updates the notifications.js data file with the fulltext content
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
 * Fetch notifications with fulltext_s field
 */
async function fetchNotificationsWithFulltext() {
  console.log('Fetching notifications from SCBD index API...');
  
  const params = {
    wt: 'json',
    q: '*:*',
    fq: [
      'schema_s:notification',
      '_state_s:public',
      'date_dt:[2024-01-01T00:00:00Z TO *]'
    ],
    fl: 'identifier_s,symbol_s,fulltext_s,fulltext_EN_s,fulltext_ES_s,fulltext_FR_s,fulltext_AR_s,fulltext_RU_s,fulltext_ZH_s',
    rows: 1000,
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
    
    console.log(`Fetched ${docs.length} notifications with fulltext data`);
    
    return docs;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Create a map of identifier to fulltext fields
 */
function createFulltextMap(docs) {
  const map = new Map();
  
  docs.forEach(doc => {
    const identifier = doc.identifier_s;

    if (!identifier) return;
    
    const fulltextData = {};
    
    if (doc.fulltext_s) fulltextData.fulltext = doc.fulltext_s;
    if (doc.fulltext_EN_s) fulltextData.fulltextEn = doc.fulltext_EN_s;
    if (doc.fulltext_ES_s) fulltextData.fulltextEs = doc.fulltext_ES_s;
    if (doc.fulltext_FR_s) fulltextData.fulltextFr = doc.fulltext_FR_s;
    if (doc.fulltext_AR_s) fulltextData.fulltextAr = doc.fulltext_AR_s;
    if (doc.fulltext_RU_s) fulltextData.fulltextRu = doc.fulltext_RU_s;
    if (doc.fulltext_ZH_s) fulltextData.fulltextZh = doc.fulltext_ZH_s;
    
    if (Object.keys(fulltextData).length > 0) {
      map.set(identifier, fulltextData);
    }
  });
  
  console.log(`Created fulltext map for ${map.size} notifications`);
  return map;
}

/**
 * Update notifications.js file
 */
async function updateNotificationsFile(fulltextMap) {
  console.log('Reading current notifications.js file...');
  
  // Read current file
  const fileContent = await fs.readFile(NOTIFICATIONS_FILE, 'utf-8');
  
  // Extract the notifications array using regex
  const match = fileContent.match(/const notifications = (\[[\s\S]*\]);/);

  if (!match) {
    throw new Error('Could not find notifications array in file');
  }
  
  const notifications = JSON.parse(match[1]);

  console.log(`Found ${notifications.length} notifications in file`);
  
  // Update notifications with fulltext data
  let updatedCount = 0;
  notifications.forEach(notification => {
    const fulltextData = fulltextMap.get(notification.identifier);

    if (fulltextData) {
      Object.assign(notification, fulltextData);
      updatedCount++;
    }
  });
  
  console.log(`Updated ${updatedCount} notifications with fulltext data`);
  
  // Generate new file content
  const header = `// Auto-generated snapshot of notification index results for issue dates from 2024 onwards
// Source: https://api.cbd.int/api/v2013/index/select
// Updated: ${new Date().toISOString()}
// Includes fulltext_s and localized fulltext fields
`;
  
  const newContent = `${header}const notifications = ${JSON.stringify(notifications, null, 2)};

export default notifications;
`;
  
  // Write updated file
  await fs.writeFile(NOTIFICATIONS_FILE, newContent, 'utf-8');
  console.log('✅ Successfully updated notifications.js');
  
  return { total: notifications.length, updated: updatedCount };
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Starting notifications fulltext update...\n');
    
    // Fetch notifications with fulltext
    const docs = await fetchNotificationsWithFulltext();
    
    // Create fulltext map
    const fulltextMap = createFulltextMap(docs);
    
    // Update notifications file
    const stats = await updateNotificationsFile(fulltextMap);
    
    console.log('\n📊 Summary:');
    console.log(`   Total notifications: ${stats.total}`);
    console.log(`   Updated with fulltext: ${stats.updated}`);
    console.log(`   Missing fulltext: ${stats.total - stats.updated}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
