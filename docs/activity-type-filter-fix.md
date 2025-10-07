# Activity Type Filter Fix

## Issue
Activity type filtering was not working. When users selected an activity type from the filter dropdown, no results were being filtered.

## Root Cause

The `mapLocalCalendarTermToOption` function was using `term.identifier` as the filter value, but the actual data uses `term.name`.

### Mismatch Example:

**Filter Options (using identifier):**
```javascript
{
  value: 'CAL-ACTIVITY-TYPE-NOMINATIONS',  // identifier
  label: 'Nominations'                       // name
}
```

**Actual Data (using name):**
```javascript
{
  "type": "Nominations"  // This is the name field
}
```

**Filter Logic:**
```typescript
// This was looking for 'CAL-ACTIVITY-TYPE-NOMINATIONS' 
// but documents only have 'Nominations'
const activityType = getDocStringValue(doc, 'activityType');
return activityType && filters.activityTypes.includes(activityType);
```

## Solution

Changed `mapLocalCalendarTermToOption` to use `term.name` as the value instead of `term.identifier`:

**Before:**
```javascript
function mapLocalCalendarTermToOption(term: LocalCalendarTerm): FilterOption {
  const value = term.identifier;  // ❌ Wrong - doesn't match data
  const label = term.name || (term.title && term.title['en']) || term.identifier;
  return { value, label };
}
```

**After:**
```javascript
function mapLocalCalendarTermToOption(term: LocalCalendarTerm): FilterOption {
  const label = term.name || (term.title && term.title['en']) || term.identifier;
  const value = term.name || term.identifier;  // ✅ Correct - matches data
  return { value, label };
}
```

## Impact

This fix affects **two filters** that use `mapLocalCalendarTermToOption`:

1. **Activity Type Filter** - Now correctly filters by values like "Nominations", "Peer-Review", "Workshop", "Submission of Information"
2. **Subsidiary Body Filter** - Now correctly filters by values like "NP", "SBSTTA", "SBI", "8J", "CP"

## Note on COP Decisions

COP decisions are handled separately and already use identifiers correctly:
```javascript
copDecisionTerms.map(term => ({ 
  value: term.identifier,  // e.g., "CAL-DECISION-NP-4-3"
  label: term.name         // e.g., "NP-4/3"
}))
```

This is correct because the data stores decision identifiers in the `decisions` array.

## Files Changed
- `/app/components/calendar/calendar-filters.vue`

## Testing
Verify that:
1. Activity type filter now correctly filters activities
2. Subsidiary body filter now correctly filters by body
3. COP decision filter continues to work correctly
4. URL parameters for these filters work when loading/sharing links
