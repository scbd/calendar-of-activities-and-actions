# Tab View Filter Fix

## Issue (Latest - Component Recreation Race Condition)
When using the tab view mode, clicking on tabs (Meeting, Notification, Activity) would not properly filter the displayed records except on the first load. After the initial "Meeting" tab selection worked correctly, clicking other tabs would show all records instead of filtering by the selected type.

### Root Cause
The issue was caused by a race condition in the component lifecycle:

1. The `calendar-tab-view.vue` component had a dynamic key that included `activeTab`:
   ```vue
   :key="`tab-${activeTab}-view-${currentView}`"
   ```

2. When a tab was clicked:
   - `activeTab` was immediately updated
   - This caused Vue to destroy and recreate the child component (CalendarTableView or CalendarActivitiesActions) due to the key change
   - `router.push({ query: { types: newType } })` was called asynchronously
   - The NEW component instance mounted and tried to load filters from the URL
   - But `router.push()` is async, so `route.query` still had the OLD type value
   - The new component loaded the wrong filters

3. Even though the route.query watcher would eventually fire with the correct value, the component had already been destroyed and recreated with stale data.

### Solution
Removed `activeTab` from the component key in `calendar-tab-view.vue`:

```vue
<!-- Before -->
:key="`tab-${activeTab}-view-${currentView}`"

<!-- After -->
:key="`view-${currentView}`"
```

#### Why This Works
- The component now stays alive when tabs change
- Only `currentView` (grid/list) changes cause component recreation, which is appropriate
- When a tab is clicked:
  1. `activeTab` updates (UI shows correct tab as active)
  2. `router.push()` updates the URL asynchronously
  3. The component's `route.query` watcher fires when the URL actually changes
  4. Filters are loaded from the updated URL
  5. The list is properly filtered

### Testing
The fix can be verified by:
1. Enabling tab view mode
2. Clicking through Meeting → Notification → Activity tabs
3. Observing that each tab correctly filters the displayed records
4. The URL should update to show `?types=meeting`, `?types=notification`, or `?types=activity`
5. Each tab should show only records matching that type

---

## Previous Issue: Filters Not Loading from URL
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
