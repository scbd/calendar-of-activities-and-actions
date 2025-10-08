# Activity Type Filter Implementation

## Summary

Updated the activity type filtering system to use identifiers instead of human-readable names for more consistent and reliable filtering.

## Changes Made

### 1. Updated Activity Data (`shared/data/25-26-activities.js`)

Changed all activity `type` values from human-readable names to standardized identifiers:

- `"Nominations"` → `"CAL-ACTIVITY-TYPE-NOMINATIONS"`
- `"Peer-Review"` → `"CAL-ACTIVITY-TYPE-PEER-REVIEW"`
- `"Workshop"` → `"CAL-ACTIVITY-TYPE-WORKSHOP"`
- `"Submission of Information"` → `"CAL-ACTIVITY-TYPE-SUBMISSION-OF-INFORMATION"`
- `"Report"` → `"CAL-ACTIVITY-TYPE-REPORT"`
- `"Forum"` → `"CAL-ACTIVITY-TYPE-FORUM"`
- `"Webinar"` → `"CAL-ACTIVITY-TYPE-WEBINAR"`

**Total Updates:** 93 activities updated across all 7 activity types.

### 2. Updated Filter Components

#### `app/components/calendar/calendar-filters.vue`
- Created `mapActivityTypeTermToOption()` function that uses `term.identifier` as the filter value
- Created `mapSubsidiaryBodyTermToOption()` function that uses `term.name` as the filter value (to maintain compatibility with existing data)
- Updated `activityTypeOptions` computed property to use the new mapping function

#### `app/components/calendar/calendar-filters-2.vue`
- Applied the same changes as calendar-filters.vue for consistency

### 3. Activity Type Terms Reference (`shared/data/activity-type-terms.js`)

Already had the correct structure with:
- `identifier`: Standardized CAL-ACTIVITY-TYPE-* format (used for filtering)
- `name`: Human-readable name (used for display)
- `title.en`: English translation (used for i18n)

### 4. Scripts

#### Created `scripts/update-activity-types.mjs`
- Automated script to update all activity type values from names to identifiers
- Successfully replaced 93 occurrences across all activity types

#### Created `scripts/verify-activity-types.mjs`
- Verification script to ensure all activity types in data have corresponding terms
- Confirms the mapping between data and filter options

## How It Works

### Data Flow

1. **Activity Data** → Contains `type: "CAL-ACTIVITY-TYPE-NOMINATIONS"`
2. **Document Normalizer** → Copies `type` to `activityType` field during normalization
3. **Filter Options** → Generated from `activityTypeTerms` using identifier as value, name as label
4. **Filter Logic** → Compares `doc.activityType` with selected filter values (identifiers)

### Example

**Activity Data:**
```javascript
{
  "type": "CAL-ACTIVITY-TYPE-NOMINATIONS",
  "title": "Call for nominations..."
}
```

**Filter Option:**
```javascript
{
  value: "CAL-ACTIVITY-TYPE-NOMINATIONS",  // Used for filtering
  label: "Nominations"                      // Displayed to user
}
```

**Filter Logic:**
```typescript
if (filters.activityTypes.length > 0) {
  filtered = filtered.filter(doc => {
    const activityType = getDocStringValue(doc, 'activityType');
    return activityType && filters.activityTypes.includes(activityType);
  });
}
```

## Benefits

1. **Consistency**: Using identifiers ensures exact matching and avoids issues with case sensitivity or spacing
2. **Maintainability**: Centralized activity type definitions in `activity-type-terms.js`
3. **Extensibility**: Easy to add new activity types by adding to the terms file
4. **Internationalization**: Display names can be localized while filter values remain stable
5. **Data Integrity**: Type-safe filtering with predictable behavior

## Verification

Run the verification script to confirm everything is set up correctly:

```bash
node scripts/verify-activity-types.mjs
```

Expected output:
- ✅ All activity types in data have corresponding terms
- Shows count of activities by type
- Confirms identifier → name mapping

## Testing

The activity type filter should now:
1. Display human-readable labels (e.g., "Nominations", "Workshop")
2. Filter using identifiers (e.g., "CAL-ACTIVITY-TYPE-NOMINATIONS")
3. Persist filter selections in URL parameters
4. Work correctly with locale changes
5. Clear properly when filters are reset

## Related Files

- `/shared/data/activity-type-terms.js` - Activity type definitions
- `/shared/data/25-26-activities.js` - Activity data
- `/app/components/calendar/calendar-filters.vue` - Main filter component
- `/app/components/calendar/calendar-filters-2.vue` - Alternative filter component
- `/app/composables/use-calendar-data.ts` - Filtering logic
- `/shared/utils/calendar-document-normalizer.ts` - Document normalization

## Notes

- Subsidiary body filtering continues to use `name` values for backward compatibility
- COP decision filtering already uses identifiers (no changes needed)
- The `activityType` field in normalized documents is populated from the `type` field
