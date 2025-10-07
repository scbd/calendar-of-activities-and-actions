# Tab View Filter Fix

## Issue
When the tab view was engaged, filtering was not being applied. Additionally, all filter selects showed mismatched labels and values.

## Root Causes

### Issue 1: Filters Not Loading from URL
The `calendar-filters.vue` component had a function `_loadFiltersFromUrl()` that was defined but **never called**. This meant:
- URL parameter changes from the tab view were ignored
- Initial URL parameters on page load were not applied
- Filter state was not synchronized with the URL

### Issue 2: String Values vs FilterOption Objects
The `_loadFiltersFromUrl()` function was setting string values from the URL directly to the filter refs:
```typescript
selectedTypes.value = types; // types is string[]
```

However, the vue-multiselect components expect `FilterOption` objects:
```typescript
interface FilterOption {
  value: string;
  label: string;
}
```

Additionally, `selectedTypes` was intentionally NOT synced with `schemaOptions` to avoid implicitly applying filters, which prevented the automatic conversion from strings to FilterOption objects.

## Solution

### 1. Load Filters from URL on Mount
Added call to `_loadFiltersFromUrl()` in the `onMounted` hook after options are loaded:
```typescript
onMounted(async () => {
  await Promise.all([
    // ... load options
  ]);

  // Load filters from URL after options are loaded
  _loadFiltersFromUrl();
});
```

### 2. Watch for URL Changes
Added a watcher for `route.query` changes to reload filters when the URL changes (e.g., when tab view updates the type):
```typescript
watch(() => route.query, () => {
  _loadFiltersFromUrl();
}, { deep: true });
```

### 3. Prevent Circular Updates
Added an `isLoadingFromUrl` flag to prevent the component from updating the URL while loading from it:
```typescript
const isLoadingFromUrl = ref<boolean>(false);

function updateUrlQuery(): void {
  if (isLoadingFromUrl.value) return;
  // ... update URL
}
```

### 4. Convert String Values to FilterOption Objects
Created a helper function to find FilterOption objects from string values:
```typescript
function findOptionsFromValues(values: string[], availableOptions: FilterOption[]): FilterOption[] {
  if (!values.length || !availableOptions.length) return [];
  
  const optionMap = new Map(availableOptions.map(opt => [opt.value, opt]));
  
  return values
    .map(value => optionMap.get(value))
    .filter((option): option is FilterOption => Boolean(option));
}
```

Updated `_loadFiltersFromUrl()` to use this helper:
```typescript
if (types.length > 0) {
  selectedTypes.value = findOptionsFromValues(types, schemaOptions.value);
  hasUserInteracted.value = true;
} else {
  selectedTypes.value = [];
}
```

### 5. Enable Type Filter Syncing
Removed the intentional exclusion of `selectedTypes` from syncing and added it:
```typescript
// Sync selections with options to ensure FilterOption objects are used
// This is especially important when loading from URL (e.g., tab view setting types)
syncSelectionWithOptions(selectedTypes, schemaOptions);
```

## Files Changed
- `/app/components/calendar/calendar-filters.vue`

## Testing
The fix ensures that:
1. Tab clicks update the URL with the correct type filter
2. The filter component reads the type from the URL
3. String values are converted to proper FilterOption objects
4. vue-multiselect displays correct labels
5. Filter state is synchronized between URL, component state, and UI
6. No circular update loops occur

## Related Components
- `calendar-tab-view.vue` - Sets the type filter in URL when tabs are clicked
- `calendar-activities-actions.vue` - Uses CalendarFilters component
- `calendar-table-view.vue` - Uses CalendarFilters component
