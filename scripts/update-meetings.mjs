#!/usr/bin/env node
/**
 * Script to fetch meeting data from SCBD index and update meetings.js
 * 
 * This script:
 * 1. Queries the SCBD index API for all meetings from October 2024 onwards
 * 2. Fetches all relevant meeting fields
 * 3. Updates the meetings.js data file with the latest meeting information
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCBD_INDEX_URL = 'https://api.cbd.int/api/v2013/index/select';
const MEETINGS_FILE = path.join(__dirname, '../shared/data/meetings.js');

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
 * Fetch meetings from SCBD index
 */
async function fetchMeetings() {
  console.log('Fetching meetings from SCBD index API...');
  
  const params = {
    wt: 'json',
    q: '*:*',
    fq: [
      'schema_s:meeting',
      '_state_s:public',
      'startDate_dt:[2024-10-01T00:00:00Z TO *]'
    ],
    fl: 'id,identifier_s,title_EN_s,title_FR_s,title_ES_s,title_AR_s,title_RU_s,title_ZH_s,startDate_dt,endDate_dt,status_s,type_s,subject_EN_t,subject_ss,subsidiaryBodies_ss,decision_ss,city_EN_s,city_s,country_EN_s,country_s,code_s,url_ss,description_EN_t,updatedDate_dt,gbfTargets_is',
    rows: 5000,
    sort: 'startDate_dt desc'
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
    
    console.log(`Fetched ${docs.length} meetings from index`);
    
    return docs;
  } catch (error) {
    console.error('Error fetching meetings:', error);
    throw error;
  }
}

/**
 * Update meetings.js file by merging API data with existing relationships
 */
async function updateMeetingsFile(docs) {
  console.log('Reading current meetings.js file...');
  
  // Read current file
  const fileContent = await fs.readFile(MEETINGS_FILE, 'utf-8');
  
  // Extract the meetings array using regex
  const match = fileContent.match(/export const meetings = (\[[\s\S]*\]);/);
  
  if (!match) {
    throw new Error('Could not find meetings array in file');
  }
  
  const existingMeetings = JSON.parse(match[1]);

  console.log(`Found ${existingMeetings.length} existing meetings in file`);
  
  // Create a map of existing meetings by identifier
  const existingMeetingsMap = new Map(
    existingMeetings.map(m => [m.identifier, m])
  );
  
  console.log('Processing API data...');
  
  let updatedCount = 0;
  let addedCount = 0;
  
  // Process each document from API
  docs.forEach(doc => {
    const identifier = doc.identifier_s;

    if (!identifier) return;
    
    const existingMeeting = existingMeetingsMap.get(identifier);
    
    // Build updated meeting data from API
    const apiData = {
      id: doc.id || doc.identifier_s,
      identifier: doc.identifier_s,
      titleEn: doc.title_EN_s || '',
      titleFr: doc.title_FR_s || doc.title_EN_s || '',
      titleEs: doc.title_ES_s || doc.title_EN_s || '',
      ...(doc.title_AR_s && { titleAr: doc.title_AR_s }),
      ...(doc.title_RU_s && { titleRu: doc.title_RU_s }),
      ...(doc.title_ZH_s && { titleZh: doc.title_ZH_s }),
      startDate: doc.startDate_dt || null,
      endDate: doc.endDate_dt || null,
      status: doc.status_s || '',
      type: doc.type_s || 'Meeting',
      subjectEn: doc.subject_EN_t || '',
      subjects: doc.subject_ss || [],
      subsidiaryBodies: doc.subsidiaryBodies_ss || [],
      copDecision: doc.decision_ss?.[0] || null,
      cityEn: doc.city_EN_s || '',
      city: doc.city_s || '',
      countryEn: doc.country_EN_s || '',
      country: doc.country_s || '',
      meetingCode: doc.code_s || '',
      links: doc.url_ss || [],
      notesEn: doc.description_EN_t || null,
      updatedDate: doc.updatedDate_dt || new Date().toISOString(),
      source: 'index:meeting'
    };
    
    if (existingMeeting) {
      // Update existing meeting - preserve notifications and activities
      Object.assign(existingMeeting, apiData, {
        notifications: existingMeeting.notifications || [],
        activities: existingMeeting.activities || [],
        gbfTargets: doc.gbfTargets_is || existingMeeting.gbfTargets || []
      });
      updatedCount++;
    } else {
      // Add new meeting
      const newMeeting = {
        ...apiData,
        notifications: [],
        activities: [],
        gbfTargets: doc.gbfTargets_is || []
      };

      existingMeetings.push(newMeeting);
      addedCount++;
    }
  });
  
  console.log(`Updated ${updatedCount} existing meetings`);
  console.log(`Added ${addedCount} new meetings`);
  
  // Sort meetings by start date (newest first)
  existingMeetings.sort((a, b) => {
    const dateA = a.startDate || '';
    const dateB = b.startDate || '';

    return dateB.localeCompare(dateA);
  });
  
  // Generate new file content
  const header = `// Auto-generated snapshot of meeting index results for start dates from October 2024 onwards
// Source: https://api.cbd.int/api/v2013/index/select
// Updated: ${new Date().toISOString()}
`;
  
  const newContent = `${header}
export const meetings = ${JSON.stringify(existingMeetings, null, 2)};

export default meetings;
`;
  
  // Write updated file
  await fs.writeFile(MEETINGS_FILE, newContent, 'utf-8');
  console.log('✅ Successfully updated meetings.js');
  
  return { total: existingMeetings.length, updated: updatedCount, added: addedCount };
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Starting meetings update...\n');
    
    // Fetch meetings
    const docs = await fetchMeetings();
    
    if (docs.length === 0) {
      console.log('⚠️  No meetings found');
      return;
    }
    
    // Update meetings file
    const stats = await updateMeetingsFile(docs);
    
    console.log('\n📊 Summary:');
    console.log(`   Total meetings: ${stats.total}`);
    console.log(`   Updated existing: ${stats.updated}`);
    console.log(`   Added new: ${stats.added}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
