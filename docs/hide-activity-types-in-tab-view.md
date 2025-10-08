# Hide Activity Types Filter in Tab View

## Feature Description
When tab view is engaged, the Activity Types filter is now hidden from view unless the "Activity" tab is selected. This provides a cleaner, more context-appropriate filtering interface for users.

## Implementation

### Changes Made

1. **calendar-filters.vue** (Basic Filters Component)
   - Added `activeTabType?: string` prop to receive the current active tab
   - Added computed property `hideActivityTypesFilter` that returns `true` when in tab view mode (activeTabType is not empty) and the active tab is not 'activity'
   - Wrapped the Activity Types filter `<div>` with `v-if="!hideActivityTypesFilter"`

2. **calendar-filters-2.vue** (Advanced Filters Component)
   - Added `activeTabType?: string` prop to receive the current active tab
   - Modified the `filterOptions` computed property to conditionally exclude activity types:
     ```typescript
     const hideActivityTypes = props.activeTabType !== '' && props.activeTabType !== 'activity';
     if (!hideActivityTypes && activityTypeOptions.value.length > 0) {
       // Add activity types to filter groups
     }
     ```

3. **calendar-table-view.vue**
   - Added `activeTabType?: string` prop
   - Passed `active-tab-type` to the filter component

4. **calendar-activities-actions.vue**
   - Added `activeTabType?: string` prop
   - Passed `active-tab-type` to the filter component

5. **calendar-tab-view.vue**
   - Passed `:active-tab-type="activeTab"` to both CalendarTableView and CalendarActivitiesActions components

## Behavior

### When Tab View is Disabled
- Activity Types filter is always visible
- Standard filtering behavior applies

### When Tab View is Enabled

#### Meeting Tab Selected
- Activity Types filter is **hidden**
- Only filters relevant to meetings are shown

#### Notification Tab Selected
- Activity Types filter is **hidden**
- Only filters relevant to notifications are shown

#### Activity Tab Selected
- Activity Types filter is **visible**
- Users can filter activities by their specific types

## Technical Details

The implementation uses a prop-drilling pattern:
1. `calendar-tab-view.vue` tracks the active tab (`activeTab` ref)
2. Passes it as `activeTabType` prop to view components
3. View components pass it to filter components
4. Filter components conditionally render/include the Activity Types filter

The condition for hiding is:
```typescript
props.activeTabType !== '' && props.activeTabType !== 'activity'
```

This ensures:
- When `activeTabType` is empty (not in tab view), the filter shows
- When `activeTabType` is 'activity', the filter shows
- When `activeTabType` is anything else ('meeting', 'notification'), the filter hides

## Testing

To verify this feature:
1. Navigate to the calendar application
2. Enable "Tab View" mode
3. Click on "Meeting" tab - Activity Types filter should be hidden
4. Click on "Notification" tab - Activity Types filter should be hidden
5. Click on "Activity" tab - Activity Types filter should be visible
6. Disable "Tab View" mode - Activity Types filter should always be visible
