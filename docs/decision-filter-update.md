# Decision Filter Update - Using New `decisions` Property

## Overview

Updated the decision filtering logic to use the new `decisions` property (array of identifiers) instead of only relying on the legacy `copDecision` field.

## Changes Made

### 1. Updated `shared/utils/document-processing.ts`

**File:** `/shared/utils/document-processing.ts`

- Added import for `copDecisionTerms`
- Created a mapping from decision identifiers to names: `decisionIdentifierToNameMap`
- Modified `getDocDecisionLabels()` function to:
  - First check for the new `decisions` array property
  - Map each identifier (e.g., `"CAL-DECISION-NP-4-3"`) to its name (e.g., `"NP-4/3"`)
  - Fallback to legacy `copDecision` fields using `extractDecisionEntries()`
  - Deduplicate results

**Key Logic:**

```typescript
// Create a mapping from decision identifiers to names
const decisionIdentifierToNameMap = new Map(
  copDecisionTerms.map(term => [term.identifier, term.name])
);

// In getDocDecisionLabels():
const decisionsArray = record['decisions'];
if (Array.isArray(decisionsArray)) {
  decisionsArray.forEach(identifier => {
    if (typeof identifier === 'string') {
      const name = decisionIdentifierToNameMap.get(identifier);
      if (name) {
        pushBase(name);
      }
    }
  });
}
```

### 2. Updated Filter Components

**Files:**

- `/app/components/calendar/calendar-filters.vue`
- `/app/components/calendar/calendar-filters-2.vue`

Changes:

- Simplified `copDecisionOptions` to always use `copDecisionTerms`
- Map using `term.name` as the value (what's shown in filter and used for filtering)
- This ensures consistency with the identifier-to-name mapping in `getDocDecisionLabels()`

**Example:**

```typescript
const copDecisionOptions = computed<FilterOption[]>(() => {
  return copDecisionTerms
    .map(term => ({ value: term.name, label: term.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
});
```

### 3. Added Comprehensive Tests

**File:** `/test/unit/decision-filtering.test.ts`

Created 9 tests covering:

- ✅ Extracting decision names from `decisions` array using identifiers
- ✅ Handling single decision in array
- ✅ Fallback to `copDecision` when `decisions` array is not present
- ✅ Handling empty `decisions` array
- ✅ Handling unknown identifiers gracefully
- ✅ Handling mixed valid and invalid identifiers
- ✅ Deduplicating decisions from both sources
- ✅ Handling CP11/7 variant without hyphen
- ✅ Stripping paragraph suffixes from decision labels

## How It Works

### Data Flow

1. **Activity Data** contains:

   ```javascript
   {
     "copDecision": "NP-4/3",  // Legacy field (preserved)
     "decisions": [              // New field
       "CAL-DECISION-NP-4-3"
     ]
   }
   ```

2. **cop-decision-terms.js** provides the mapping:

   ```javascript
   {
     "identifier": "CAL-DECISION-NP-4-3",
     "name": "NP-4/3"
   }
   ```

3. **getDocDecisionLabels()** converts:
   - `["CAL-DECISION-NP-4-3"]` → `["NP-4/3"]`

4. **Filter** uses `"NP-4/3"` as both value and label

5. **Filtering** matches activities where `getDocDecisionLabels()` returns `["NP-4/3"]`

### Backward Compatibility

- The function **first** checks the new `decisions` array
- If not present or empty, it **falls back** to the legacy `copDecision` field
- This ensures both old and new data formats work correctly
- Results are deduplicated to avoid showing the same decision twice

## Benefits

1. **Consistent Identifiers**: Uses standardized CAL-DECISION-* identifiers
2. **Future-Proof**: Can easily extend to support multiple decisions per activity
3. **Backward Compatible**: Still works with legacy `copDecision` field
4. **Type-Safe**: Proper mapping between identifiers and display names
5. **Comprehensive**: Handles edge cases like unknown identifiers, empty arrays, and variants

## Test Results

All 60 unit tests pass:

- 10 test files
- 60 tests total
- 0 failures

The new decision filtering tests specifically verify:

- Proper mapping from identifiers to names
- Fallback behavior
- Deduplication
- Edge case handling

## Migration Path

For activities with the new `decisions` property:

```javascript
// Before (index.vue, composables, etc.)
if (filters.copDecisions.length > 0) {
  filtered = filtered.filter(doc => {
    const decisions = getDocDecisionLabels(doc);  // Now checks 'decisions' array first
    return decisions.some(decision => filters.copDecisions.includes(decision));
  });
}
```

No changes needed in existing filtering code! The `getDocDecisionLabels()` function handles the new format automatically.

## Future Enhancements

The `decisions` array structure allows for:

1. Multiple decisions per activity
2. Easy addition of new decision types
3. Consistent identifier-based relationships
4. Potential for decision metadata (effective dates, revisions, etc.)
