# Update: Notifications Now Use Symbol as Key

## Change Summary

Updated all notification-related functions to consistently use `symbol` as the primary key for identifying notifications, removing fallbacks to `notificationKey` or `id` fields.

## Why This Change?

Previously, the code was inconsistent about which field to use as the notification identifier:
- Some places checked `symbol` first, then fell back to `notificationKey`
- Other places used `doc.symbol || doc.notificationKey`
- This inconsistency could lead to mismatches when linking documents

**The notification `symbol` field (format: "YYYY-NNN", e.g., "2025-001") is the canonical identifier** and should be used exclusively for matching and lookups.

## Changes Made

### 1. `getRelatedMeetings` Function
**Before:**
```typescript
const symbol = doc.symbol || doc.notificationKey;
```

**After:**
```typescript
const symbol = typeof doc.symbol === 'string' ? doc.symbol : undefined;
```

Now strictly uses `symbol` field only.

### 2. `getRelatedNotificationsForMeeting` Function
**Before:**
```typescript
const id = doc.id || doc.identifier;
const symbol = typeof doc.symbol === 'string' ? doc.symbol : doc.notificationKey;

return (id && notifications.includes(id)) || 
       (symbol && typeof symbol === 'string' && notifications.includes(symbol));
```

**After:**
```typescript
const symbol = typeof doc.symbol === 'string' ? doc.symbol : undefined;

return symbol && notifications.includes(symbol);
```

Removed ID-based matching, now only matches by symbol.

### 3. `getRelatedNotificationsForActivity` Function
**Before:**
```typescript
const symbol = typeof doc.symbol === 'string' ? doc.symbol : doc.notificationKey;

return typeof symbol === 'string' && keys.includes(symbol);
```

**After:**
```typescript
const symbol = typeof doc.symbol === 'string' ? doc.symbol : undefined;

return symbol && keys.includes(symbol);
```

Simplified to use only `symbol` field.

### 4. `convertToNotificationEntries` Function
**Before:**
```typescript
const key = (typeof doc.symbol === 'string' ? doc.symbol : doc.notificationKey) || '';
```

**After:**
```typescript
const key = typeof doc.symbol === 'string' ? doc.symbol : '';
```

Now strictly uses `symbol` as the key.

## Impact

### Benefits
1. **Consistency**: All notification lookups now use the same identifier field
2. **Predictability**: Developers know exactly which field will be used
3. **Data Integrity**: Symbol format (YYYY-NNN) is standardized and validated
4. **Simplicity**: Cleaner code without fallback logic

### Breaking Changes
⚠️ **Important**: Notifications **must** have a valid `symbol` field to be linked. 

- Notifications without a `symbol` field will not be matched or displayed
- The `notificationKey` field is no longer used as a fallback
- IDs and identifiers are not used for notification matching

## Data Requirements

All notification documents must have:
```typescript
{
  symbol: '2025-001',  // Required: Format YYYY-NNN
  schema: 'notification',
  // ... other fields
}
```

Meeting and activity documents that reference notifications should use symbols:
```typescript
// Meeting
{
  notifications: ['2025-001', '2025-002'],  // Use symbols, not IDs
  // ...
}

// Activity
{
  relatedDocuments: '2025-001, 2025-003',  // Symbols in related docs
  // ...
}
```

## Testing

### New Test File
Created `test/unit/notification-symbol-key.test.ts` with comprehensive coverage:

✅ **7 new tests**, all passing:
1. Meetings find notifications using symbol as key
2. Only notifications with correct symbol are matched
3. Empty array returned if no symbols match
4. Activities find notifications using extracted symbols
5. Display entries use symbol as key
6. Notifications without symbol are filtered out
7. Symbol field is used exclusively (not notificationKey or id)

### All Tests Status
✅ **46 total tests pass** across 8 test files

## Files Modified

1. ✅ `shared/utils/notifications.ts` - Updated 4 functions to use symbol exclusively
2. ✅ `test/unit/notification-symbol-key.test.ts` - Added comprehensive test coverage

## Migration Notes

If you have existing data with notifications that use `notificationKey` instead of `symbol`:

1. **Ensure all notifications have a `symbol` field** with the format `YYYY-NNN`
2. **Update any linking arrays** (in meetings/activities) to use symbols instead of IDs
3. **Verify data** using the linking scripts:
   ```bash
   node scripts/link-meetings-notifications.mjs
   ```

## Related Documentation

- Original related meetings fix: `docs/fix-related-meetings.md`
- Notification utilities: `shared/utils/notifications.ts`
- Calendar types: `shared/types/calendar.ts`
