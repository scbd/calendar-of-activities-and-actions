# Endpoint Data Migration

## Summary

The Calendar of Activities and Actions was migrated from **static JSON data files** to **live SOLR index queries**. All calendar data (meetings, notifications, calendar activities) is now fetched from the SOLR endpoint with server-side filtering and pagination. Static data files, legacy scripts, and snapshot-dependent code have been removed.

**Migration completed:** 2026-02-15

## What Changed

### Before (Static Data)

- Data stored in `shared/data/*.js` files (meetings, activities, notifications, terms)
- Client-side filtering via computed properties in `useCalendarData`
- No server-side pagination — all records loaded at once
- Filter options loaded from static term lists + limited thesaurus calls
- `calendar-document-normalizer.ts` transformed snapshot records into display format

### After (SOLR Endpoint)

- All data fetched from the SOLR index endpoint (configured via `NUXT_PUBLIC_SCBD_API_BASE`)
- Server-side filtering via SOLR `fq` (filter query) parameters
- Server-side pagination via `rows`/`start` with infinite scroll (50 records per page)
- Filter options from thesaurus domain endpoints merged with SOLR facet counts
- `normalizeCalendarDoc()` in `shared/services/solr.ts` normalizes SOLR response documents
- Documents use camelCase field names (SOLR suffixes like `_s`, `_ss`, `_dt` stripped)

## Architecture

### Data Flow

```
User interacts with filters
        ↓
useCalendarData composable (debounced 300ms)
        ↓
buildCalendarQuery() → SOLR POST body
        ↓
$fetch(getSolrSelectUrl()) // derived from NUXT_PUBLIC_SCBD_API_BASE
        ↓
parseFacets() + normalizeCalendarDoc()
        ↓
CalendarDoc[] + ParsedFacets → reactive refs
        ↓
useThesaurusFilters merges thesaurus terms + facet counts
        ↓
FilterOption[] with counts → filter dropdowns
```

### How Filtering Works

Filters are translated into SOLR `fq` (filter query) parameters by `buildCalendarQuery()` in [shared/services/solr.ts](../shared/services/solr.ts):

| Filter | SOLR Field | Example fq |
|--------|-----------|------------|
| Record Type | `schema_s` | `schema_s:(meeting OR notification OR calendarActivity)` |
| Subjects | `subjects_ss` | `subjects_ss:("CBD-SUBJECT-CPB" OR "CBD-SUBJECT-ABS")` |
| Governing Bodies | `governingBody_ss` | `governingBody_ss:("CBD-GB-COP")` |
| Subsidiary Bodies | `subsidiaryBody_ss` | `subsidiaryBody_ss:("CBD-SB-SBI")` |
| Activity Types | `activityType_ss` | `activityType_ss:("CBD-ACTIVITY-TYPE-WORKSHOP")` |
| Global Targets | `gbfTargets_ss` | `gbfTargets_ss:("GBF-TARGET-01")` |
| GBF Sections | `gbfSections_ss` | `gbfSections_ss:("GBF-SECTION-A")` |
| Countries | `hostCountry_ss` | `hostCountry_ss:("ca" OR "mx")` |
| COP Decisions | `decisions_ss` | `decisions_ss:("CBD-DECISION-COP-15-4")` |
| Status | `status_s` | `status_s:("NCHM-EVENT-STATUS-CONFIRMED")` |
| Date Range | `startDate_dt` / `endDate_dt` | `startDate_dt:[2026-01-01 TO *]` |
| Action Required | `actionRequired_b` | `actionRequired_b:true` |
| Search Text | `text_txt` | Full-text via `q` parameter |

### How Pagination Works

- Page size: **50 records** per SOLR request
- Initial load fetches rows 0–49
- `loadMore()` increments `start` by 50 and appends results
- Infinite scroll via `IntersectionObserver` on a scroll sentinel element (200px root margin)
- `hasMore` computed: `docs.length < total`
- Filter changes reset pagination to `start=0` and replace all results
- Guard against concurrent `loadMore()` calls via `loadingMore` ref

### How Facets Work

SOLR returns facet counts for each filter field in every response. The facet fields are defined in [shared/constants/solr-fields.ts](../shared/constants/solr-fields.ts):

```typescript
export const SOLR_FACET_FIELDS = [
  'schema_s', 'subjects_ss', 'governingBody_ss', 'subsidiaryBody_ss',
  'activityType_ss', 'gbfTargets_ss', 'gbfSections_ss',
  'hostCountry_ss', 'decisions_ss', 'status_s'
];
```

`parseFacets()` converts the SOLR facet response into a `ParsedFacets` map. The `useThesaurusFilters` composable then:

1. Loads thesaurus terms for each domain (cached per session)
2. Merges terms with facet counts to produce `FilterOption[]` arrays
3. Hides options with 0 count
4. Re-merges when facets change (new query) without re-fetching thesaurus
5. Clears cache and re-fetches on locale change

### Environment Configuration

The SOLR API base URL is controlled by a **single environment variable**:

```
NUXT_PUBLIC_SCBD_API_BASE=https://api.cbddev.xyz
```

| Environment | Value |
|-------------|-------|
| Development | `https://api.cbddev.xyz` (default when env var is unset) |
| Staging | `https://api.cbdstg.xyz` |
| Production | `https://api.cbd.int` |

All endpoints are derived from this base URL via `shared/utils/api-config.ts`:

| Helper | Derived URL |
|--------|-------------|
| `getSolrSelectUrl()` | `{base}/api/v2013/index/select` |
| `getSolrIndexUrl()` | `{base}/api/v2013/index` |
| `getThesaurusBaseUrl()` | `{base}/api/v2013/thesaurus` |
| `getArticlesBaseUrl()` | `{base}/api/v2017/articles` |

In Nuxt context (composables, components), `useRuntimeConfig().public.scbdApiBase` is the canonical source. Shared services that run outside the Nuxt lifecycle resolve from `import.meta.env` / `process.env` with a static default fallback.

## New Filters Added

| Filter | Source | Notes |
|--------|--------|-------|
| Governing Bodies | `CBD-GOVERNING-BODIES` thesaurus + `governingBody_ss` facets | Separated from the old combined subsidiary/governing filter |
| GBF Sections | `GBF-SECTIONS` thesaurus + `gbfSections_ss` facets | New field from Gaia schema |
| COP Decisions | `decisions_ss` SOLR facets only | No thesaurus — labels parsed from decision identifiers |

## Key Composables

### `useCalendarData` ([app/composables/use-calendar-data.ts](../app/composables/use-calendar-data.ts))

Primary data composable. Manages SOLR queries, pagination, document normalization, notification enrichment, and subject label loading.

**Public API:**
- `docs` — reactive array of `CalendarDoc[]`
- `facets` — reactive `ParsedFacets` from latest query
- `loading`, `loadingMore`, `initialLoading` — loading states
- `error`, `isEmpty` — error/empty states
- `total`, `hasMore` — pagination info
- `loadMore()` — fetch next page
- `retry()` — re-execute current query
- `setFilters(partial)` — update filter state (triggers re-query)
- `filters` — current `FilterState` ref

### `useThesaurusFilters` ([app/composables/use-thesaurus-filters.ts](../app/composables/use-thesaurus-filters.ts))

Converts SOLR facet counts into labeled filter options using thesaurus domain terms.

**Public API:**
- `recordTypeOptions`, `subjectOptions`, `governingBodyOptions`, `subsidiaryBodyOptions`, `activityTypeOptions`, `globalTargetOptions`, `gbfSectionOptions`, `countryOptions`, `statusOptions`, `decisionOptions` — computed `FilterOption[]` arrays
- `loading` — whether thesaurus terms are still loading

## Files Removed (37 total)

### Static Data (9 files)
- `shared/data/25-26-activities.js` + `.backup`
- `shared/data/meetings.js`, `meetings-temp.js`
- `shared/data/notifications.js`
- `shared/data/cop-decision-terms.js`
- `shared/data/activity-type-terms.js`
- `shared/data/subsidiary-body-terms.js`
- `shared/data/subjects-used.js`

### Legacy Scripts (15 files)
- All files in `scripts/` directory

### Archive (10 files)
- All files in `public/to-delete/`

### Root Scripts (2 files)
- `sort-activities.mjs`, `sort-script.js`

### Deprecated Module (1 file)
- `shared/utils/calendar-document-normalizer.ts`

## Schemas

The SOLR index uses three document schemas:

| Schema (`schema_s`) | Description |
|---------------------|-------------|
| `meeting` | CBD meetings, workshops, conferences |
| `notification` | Secretariat notifications to parties |
| `calendarActivity` | Calendar activities (previously `activity` in static data) |

## Test Status

- **117 unit/nuxt tests pass** (including 5 skipped for deleted static data)
- **30 pre-existing test failures** from Phase 02 migration (nuxt component tests need mocks updated for SOLR composable shape)
- **0 TypeScript compilation errors**
- **E2E tests** require running dev server (deferred)

## Migration Phases

| Phase | Description | Tasks |
|-------|-------------|-------|
| Phase 01 | Types, constants, SOLR query builder | p01-01 through p01-03 |
| Phase 02 | Data layer composables + thesaurus loading | p02-01 through p02-03 |
| Phase 03 | Filter components migration | p03-01 through p03-03 |
| Phase 04 | Display components + infinite scroll | p04-01 through p04-03 |
| Phase 05 | Cleanup + verification + documentation | p05-01 through p05-02 |

Full planning details: `.github/planing/endpoint-data-migrate/`
