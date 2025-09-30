import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, 'shared/data/25-26-activities.js');

// Import the activities directly
const { default: activities } = await import('./shared/data/25-26-activities.js');

function parseDate(dateStr) {
  if (!dateStr || dateStr === "Ongoing" || dateStr.includes("Before") || dateStr.includes("Q")) {
    if (dateStr && dateStr.includes("Before")) return new Date(2025, 0, 1); // Jan 1 2025
    if (dateStr === "Ongoing") return new Date(9999, 0, 1); // far future
    if (dateStr && dateStr.startsWith("Q")) {
      const quarter = parseInt(dateStr[1]);
      const year = 2000 + parseInt(dateStr.slice(-2));
      const month = (quarter - 1) * 3;

      return new Date(year, month, 1);
    }
    return new Date(9999, 0, 1); // default for empty or special
  } else {
    // Handle multiple date formats
    const parts = dateStr.split('-');
    
    // DD-MMM-YYYY format (e.g., "17-Mar-2025")
    if (parts.length === 3 && parts[2].length === 4) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const year = parseInt(parts[2]);
      const months = {Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11};
      const month = months[monthStr];

      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }
    // DD-MMM-YY format (e.g., "5-Mar-25")
    else if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const year = 2000 + parseInt(parts[2]);
      const months = {Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11};
      const month = months[monthStr];

      if (month !== undefined) {
        return new Date(year, month, day);
      }
    } else if (parts.length === 2) {
      // MMM-YY format
      const monthStr = parts[0];
      const year = 2000 + parseInt(parts[1]);
      const months = {Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11};
      const month = months[monthStr];

      if (month !== undefined) {
        return new Date(year, month, 1);
      }
    }
  }
  return new Date(9999, 0, 1); // fallback
}

// Sort activities by start date
const sorted = activities.sort((a, b) => {
  const dateA = parseDate(a.startDate);
  const dateB = parseDate(b.startDate);

  return dateA - dateB;
});

// Add identifiers based on year and index within that year
let currentYear = null;
let yearIndex = 0;

sorted.forEach(activity => {
  const date = parseDate(activity.startDate);
  const year = date.getFullYear();
  
  if (year !== currentYear) {
    currentYear = year;
    yearIndex = 1;
  } else {
    yearIndex++;
  }
  
  const paddedIndex = String(yearIndex).padStart(2, '0');

  activity.identifier = `ACT-${year}-${paddedIndex}`;
});

// Write back to file
const output = 'export default ' + JSON.stringify(sorted, null, 2) + ';\n';

writeFileSync(filePath, output, 'utf-8');

console.log(`✓ Sorted ${activities.length} activities by start date`);
console.log(`✓ Added identifiers to all activities`);
console.log(`✓ File updated: ${filePath}`);
