# Fix: Activities Not Showing Related Meetings

## Problem
When activities were expanded in the calendar view, they were not showing related meetings even though the data was linked.

## Root Cause Analysis

### Issue 1: Missing Data in Document Normalization
The `buildDocsFromActivities` and `normalizeMeetingDoc` functions were not including the `meetings`, `activities`, and `notifications` arrays from the source data. These arrays were being populated by the linking script but then stripped out during document normalization.

**Files affected:**
- `shared/utils/calendar-document-normalizer.ts`

### Issue 2: Incorrect ID Matching
The `getRelatedMeetingsForActivity` function was checking if `doc.id` or `doc.identifier` was in the `meetings` array, but the linking script stores **meeting codes** (like "CP-RA-OM-2025-2") in that array, not IDs.

**Files affected:**
- `shared/utils/notifications.ts` - `getRelatedMeetingsForActivity` function

### Issue 3: Activity Identifier Matching
The `getRelatedActivitiesForMeeting` function needed improvement to check both `id` and `identifier` fields separately rather than falling back.

**Files affected:**
- `shared/utils/notifications.ts` - `getRelatedActivitiesForMeeting` function

## Solution

### 1. Updated Document Normalization (calendar-document-normalizer.ts)

**For Activities:**
```typescript
// Added to baseRecord and doc:
meetings: Array.isArray(record.meetings) ? record.meetings as string[] : [],
activities: Array.isArray(record.activities) ? record.activities as string[] : [],
notifications: Array.isArray(record.notifications) ? record.notifications as string[] : [],
```

**For Meetings:**
```typescript
// Added to baseRecord and doc:
activities: Array.isArray(record['activities']) ? record['activities'] as string[] : [],
meetings: Array.isArray(record['meetings']) ? record['meetings'] as string[] : [],
notifications: Array.isArray(record['notifications']) ? record['notifications'] as string[] : [],
```

### 2. Fixed Related Meetings Lookup (notifications.ts)

```typescript
export function getRelatedMeetingsForActivity(activityDoc: CalendarDoc, allDocs: CalendarDoc[]): CalendarDoc[] {
  // ... existing checks ...
  
  return allDocs.filter(doc => {
    // ... schema checks ...
    
    // Check if any of the meeting identifiers (id, identifier, or meetingCode) match
    const docId = doc.id || doc.identifier;
    const meetingCode = doc.meetingCode;
    
    return (docId && meetings.includes(docId)) || (meetingCode && meetings.includes(meetingCode));
  });
}
```

### 3. Improved Related Activities Lookup (notifications.ts)

```typescript
export function getRelatedActivitiesForMeeting(meetingDoc: CalendarDoc, allDocs: CalendarDoc[]): CalendarDoc[] {
  // ... existing checks ...
  
  return allDocs.filter(doc => {
    // ... schema checks ...
    
    // Check if any of the activity identifiers match
    const docId = doc.id;
    const docIdentifier = doc.identifier;
    
    return activities.some(activityRef => 
      activityRef === docId || activityRef === docIdentifier
    );
  });
}
```

## Verification

### Data Linking Status
After running `scripts/link-meetings-activities.mjs`:
- 8 activities have linked meetings
- 6 meetings have linked activities
- Total of 8 bidirectional links created

### Test Coverage
Created comprehensive unit tests in `test/unit/related-meetings.test.ts`:
- ✅ Activities can find their related meetings by meeting code
- ✅ Meetings can find their related activities by identifier
- ✅ Proper filtering by schema (activities, meetings, notifications)
- ✅ Empty arrays handled correctly

All tests pass successfully.

## How the Linking Works

1. **Script Execution** (`scripts/link-meetings-activities.mjs`)
   - Searches activity text for meeting codes
   - Stores meeting codes in activity's `meetings` array
   - Stores activity identifiers in meeting's `activities` array

2. **Data Normalization** (at app startup)
   - Activities and meetings are normalized from snapshot data
   - The linking arrays (meetings, activities, notifications) are preserved

3. **Display Logic** (in accordion item)
   - When an activity is expanded, `getRelatedMeetingsForActivity` is called
   - It matches meeting codes from the activity's `meetings` array
   - Related meeting cards are displayed under "Related Meetings" section

## Files Changed

1. ✅ `shared/utils/calendar-document-normalizer.ts` - Added linking arrays to normalized docs
2. ✅ `shared/utils/notifications.ts` - Fixed ID/code matching logic
3. ✅ `test/unit/related-meetings.test.ts` - Added comprehensive test coverage
4. ✅ `shared/data/25-26-activities.js` - Updated by linking script (contains meeting codes)
5. ✅ `shared/data/meetings.js` - Updated by linking script (contains activity identifiers)

## Testing Instructions

1. **Run the linking script:**
   ```bash
   node scripts/link-meetings-activities.mjs
   ```

2. **Start the dev server:**
   ```bash
   yarn dev
   ```

3. **Test in browser:**
   - Navigate to http://localhost:3000/calendar-of-activities-and-actions/
   - Find activity "ACT-2025-11" (Nominations for the Open-ended Online Forum on Risk Assessment and Risk Management)
   - Expand the activity
   - Verify "Related Meetings" section appears
   - Should show meeting "CP-RA-OM-2025-2"

4. **Run tests:**
   ```bash
   yarn test:unit
   ```

## Related Documentation

- Linking script: `scripts/link-meetings-activities.mjs`
- Verification script: `scripts/verify-related-display.mjs`
- Accordion component: `app/components/calendar/calendar-accordion-item.vue`
