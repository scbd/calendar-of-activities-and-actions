import activities from './shared/data/25-26-activities.js';

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
    // DD-MMM-YY
    const parts = dateStr.split('-');

    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const year = 2000 + parseInt(parts[2]);
      const months = {Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11};
      const month = months[monthStr];

      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }
  }
  return new Date(9999, 0, 1); // fallback
}

const sorted = activities.sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate));

console.log('export default ' + JSON.stringify(sorted, null, 2) + ';');