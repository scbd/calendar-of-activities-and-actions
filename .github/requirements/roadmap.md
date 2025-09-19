# Activities & Actions Calendar - Consolidated Executable Roadmap

This roadmap synthesizes the best features from multiple roadmap versions, creating a comprehensive, executable guide for the initial vertical slice of the CBD Activities & Actions Calendar. It includes detailed phases, checkable tasks, acceptance criteria, run commands, deliverables, and risk mitigation. Scope excludes auth, persistence DB, and editorial workflow (see `index.md`).

## Project Scaffolding

```text
📁 calendar-of-activities-and-actions/
├── 📄 eslint.config.mjs
├── 📄 nuxt.config.ts
├── 📄 package.json
├── 📄 playwright.config.ts
├── 📄 README.md
├── 📄 setup.sh
├── 📄 tsconfig.json
├── 📄 vitest.config.ts
├── 📄 wire-frame-2.png
├── 📁 app/
│   └── 📄 app.vue
├── 📁 components/
│   └── 📄 calendar-activities-actions.vue
├── 📁 public/
│   ├── 📄 favicon.ico
│   └── 📄 robots.txt
├── 📁 server/
│   ├── 📁 tasks/
│   │   ├── 📄 indexer.ts
│   │   └── 📄 merge.ts
│   └── 📁 types/
│       └── 📄 tasks.ts
├── 📁 shared/
│   ├── 📁 data/
│   │   ├── 📄 2024-12-01.md
│   │   └── 📄 calendar of activities options for bureau-all staff presentation (17-06-2025).pptx
│   ├── 📁 types/
│   │   └── 📄 records.ts
│   └── 📁 utils/
│       └── 📄 merge-helpers.ts
├── 📁 test/
│   ├── 📁 e2e/
│   │   └── 📄 homepage.test.ts
│   ├── 📁 nuxt/
│   │   └── 📄 calendar-activities-actions.test.ts
│   └── 📁 unit/
│       └── 📄 utils.test.ts
└── 📁 utils/
    └── 📁 indexers/
        └── 📁 scbd/
            └── 📄 index-meetings.ts
```



## Phase 0 – Foundations & Setup

- [ ] ensure all rules followed from .github/instructions/default.instructions.md are followed to date in all files.
- [ ] Confirm repository bootstrap (Nuxt, Vitest, Playwright present)
- [ ] Install `consola` (if not already) and ensure TS config supports new utils
- [ ] Decide on date lib (native Date first; re-evaluate later)
- [ ] Add Bootstrap 5 (if not already) for component styling
- [ ] Create `.github/requirements/index.md` linking to v2 docs and defining slice scope

**Acceptance Criteria:**

- All dependencies installed and configured
- Documentation index created with clear scope definition
- No linting errors in setup

## Phase 1 – Data Fetch (Indexer Task)

Goal: Fetch raw meeting  index JSON since configurable date.  Make an index service that will allow params to be passed support and payload.

- [ ] Implement `utils/indexers/scbd.ts` (pure; no side effects except via injected IO)
- [ ] Support parameters: `{ since: string; limit?: number; logger?: ConsolaInstance; fetchImpl?: typeof fetch }`
- [ ] Return shape: `{ items: any[]; count: number; warnings: string[] }`
- [ ] Implement Nitro task `server/tasks/indexer.ts`
- [ ] Task payload validation (`since` default = last COP start date env/constant also the schema 'meetings' in our case)
- [ ] Write outputs: `shared/data/temp/raw-indexed-meetings.json`
- [ ] Task return: `{ counts: { raw: number }, outputs: { rawIndex: string }, warnings: string[] }`
- [ ] Dry run mode (skip file writes)
- [ ] Unit test utility (mock fetch + fs adapter)

**Acceptance Criteria:**

- Running `npx nuxi task run indexer --payload '{"since":"2024-12-01"}'` produces files and success message
- JSON structure matches expected schema
- Warnings logged for any data issues

## Phase 2 – Markdown Parsing

Goal: Convert program officer Markdown table(s) to structured JSON.

- [ ] Implement MD table parser (robust to trailing pipes & alignment rows)
- [ ] Extract all columns: Title, Type, Subject, Status, StartDate, EndDate, AssociatedBody, COPDecision, Related_documents, ActionRequired - if more colums than listed here update here, the related issue and output with additionaol colum found.
- [ ] Normalize date strings (ISO where possible; keep raw if ambiguous)
- [ ] Unit tests with fixture from `shared/data/2024-12-01.md` yet latest source as well.

**Acceptance Criteria:**

- Parser returns array with ≥1 record and preserves source row text
- Handles edge cases like missing fields or formatting variations
- All required columns extracted accurately

## Phase 3 – Merge Logic

Goal: Deterministically relate index + MD rows with provenance & unmerged outputs.

- [ ] Implement normalization helpers: `normalizeTitle`, `tokenizeDecisions`, `tokenizeRelatedDocs`, `dateWindowOverlap`
- [ ] Ranking: decision match > related doc token > title+date score
- [ ] Ambiguity handling → push candidates to unmerged sets with reason field
- [ ] Produce merged array entries with `{ index: {...}, md: {...}, normalized: {...} }`
- [ ] Write `shared/data/merged.json`, `unmerged_index.json`, `unmerged_actions.json`
- [ ] Mirror to `public/data/` paths
- [ ] Count summary: `{ merged, unmergedIndex, unmergedActions, ambiguous }`
- [ ] Unit tests covering: exact decision match, doc token match, title+date match, ambiguity case

**Acceptance Criteria:**

- Merge task run returns counts matching file contents
- Provenance preserved in all merged records
- Unmerged items include clear reasons for non-matching

## Phase 4 – Merge Task (Nitro)

- [ ] Implement `server/tasks/merge.ts`
- [ ] Payload schema: `{ dataPaths: string[]; rawIndexPath?: string; dryRun?: boolean }`
- [ ] Load raw index (default path) & parse each MD path
- [ ] Invoke merge logic; write outputs unless dryRun
- [ ] Return counts + output file paths + warnings

**Acceptance Criteria:**

- `npx nuxi task run merge --payload '{"dataPaths":["shared/data/2024-12-01.md"]}'` produces all three JSON outputs
- Supports multiple data paths and dry run mode
- Detailed warnings for any processing issues

## Phase 5 – Activities & Actions Index (No Pre-Merge)

Goal: Index Activities & Actions from the Markdown table(s) as a separate collection with a lightweight search index. Do not globally merge with meetings yet. Provide loose link fields to enable query-time reconciliation.

- [ ] Define ActivitiesActions schema (minimum):
  - `id` (stable hash), `Title`, `Type`, `Subject`, `Status`, `StartDate`, `EndDate`, `AssociatedBody`, `COPDecision[]`, `RelatedDocuments[]`, `ActionRequired`
  - Provenance: `sourcePath`, `rowNumber`
  - Optional loose-link hints: `link.decisions[]`, `link.dateWindow { from?: string; to?: string }`, `link.associatedBody?`
- [ ] Implement build step (part of the existing pipeline) that outputs:
  - `public/data/activities-actions.json` (normalized parsed records)
  - `public/data/activities-actions.index.json` (token map + facet maps)
- [ ] Index contents: tokens from normalized title, COPDecision tokens, related document tokens
- [ ] Pre-compute facet value frequency maps for Activities & Actions UI counts
- [ ] Size check: ensure index file < 30% of the Activities & Actions payload size
- [ ] Update pipeline to emit these two files (skip creating a global merged index at this phase)
- [ ] Unit tests: tokenization, lookup correctness, facet map integrity, schema validation

**Acceptance Criteria:**

- `public/data/activities-actions.index.json` present and postings lookup returns expected record ids for sample tokens
- `public/data/activities-actions.json` present with normalized records and loose-link fields
- Index enables fast filtering of Activities & Actions without rescanning the full dataset and without dependency on meeting reindex

## Phase 6 – Cross-Collection Query Service (Query-Time Merge)

Goal: Provide a reusable query utility that loads the meetings dataset and the Activities & Actions dataset+index, performs free-text + facet filtering, and merges results at query time using loose-link heuristics.

Location: `shared/utils/index-query.ts`

- [ ] Implement types:
  - `QueryInput { text?: string; facets?: FacetFilters; dateRange?: { from?: string; to?: string } }`
  - `MergedRecord { meeting?: Meeting; activity?: ActivityAction; linkConfidence?: number; linkReason?: string }`
- [ ] Accept injected datasets and index (pure function design): `prepare(meetings, activities, activitiesIndex)`
- [ ] Text search: use Activities & Actions postings lists (intersect per token); for meetings, use simple normalized field scan (or future index if added)
- [ ] Facet filtering: apply per-dataset facets, then combine
- [ ] Query-time merge strategy (loose link):
  - Priority: COP decision token match > date window overlap + associated body match > title similarity
  - Produce `MergedRecord` with `linkConfidence` and provenance
- [ ] Stable sort: chronological ascending by `StartDate` then `Title`
- [ ] API: `prepare(...)`, `query(q)`, `facetCounts(qPartial)` returns counts for both datasets and combined
- [ ] Unit tests: text-only, facet-only, combined, empty, date-range edges, unknown token, merge heuristics (decision/date/title)
- [ ] Performance test (mock): ensure near O(k + r) where k = tokens, r = results; no full rescans of Activities & Actions thanks to index

**Acceptance Criteria:**

- Query returns a unified list of `MergedRecord` items for sampled inputs
- Activities & Actions candidates primarily sourced via index; meetings are incorporated without requiring reindex
- Link heuristics produce expected matches for decision tokens and reasonable date-window matches
- Documented usage in roadmap & `index.md`

## Phase 7 – UI Component

- [ ] Create `components/calendar-activities-actions.vue`
- [ ] Provide facets: Type, Subject, Status, Subsidiary Body, COP Decision (multi), Date Range (from/to), Action Required (boolean)
- [ ] Computed filtered list; performance: O(n * facets) acceptable for < 5k rows
- [ ] Light/dark toggle (CSS vars + `prefers-color-scheme` fallback)
- [ ] Accessible labels, keyboard navigation for filters
- [ ] Render table columns: Title, Type, Subject, Status, StartDate, EndDate, AssociatedBody, COPDecision, Related_documents, Action Required
- [ ] Basic responsive styling

**Acceptance Criteria:**

- Filtering reduces result set as expected; dark mode toggles class/vars
- All columns render correctly with proper formatting
- Keyboard accessibility fully implemented

## Phase 8 – Testing (E2E Deferred)

- [ ] Unit tests (Vitest): filter predicate combinations, empty state, provenance presence
- [ ] Component mount test (shallow) verifies column rendering
- [ ] E2E (Playwright): Deferred to Phase 10
- [ ] Add CI script entries (if CI config present)

**Acceptance Criteria:**

- `npx vitest run` passes; Playwright E2E is deferred to Phase 10
- Coverage > 80% for critical paths
- Tests handle edge cases (empty data, malformed JSON)

## Phase 9 – Library Build

- [ ] Add `build/component.vite.config.ts` exporting component as library
- [ ] Externalize: `vue`, `bootstrap`
- [ ] Outputs: `dist/` with `index.es.js`, `index.umd.js`, types (d.ts) if TS
- [ ] Verify no Nuxt runtime chunks bundled
- [ ] Add npm script: `build:component`

**Acceptance Criteria:**

- Build completes & bundle size minimal (< ~30KB gzipped, excluding externals)
- Library can be consumed in other projects without Nuxt dependencies

## Phase 10 – Documentation, E2E & Finalization

- [ ] Update roadmap checkboxes to reflect completion
- [ ] Add quick run section (index, merge, tests, build) to README or roadmap
- [ ] Record any configuration (auth tokens, env vars) needed (none expected for public index, else document)
- [ ] List deferred backlog items (already in `index.md`)
- [ ] Implement E2E (Playwright) scenarios: load page, apply ≥2 filters, assert count change & persistence on soft navigation
- [ ] Ensure `npx playwright test` passes

**Acceptance Criteria:**

- PR / commit history maps cleanly to phases
- All documentation updated and accurate
- No TODO comments left un-ticketed

## Commands (Reference)

```bash
# Fetch index
defaultSince="2024-12-01"
npx nuxi task run indexer --payload "{\"since\":\"$defaultSince\"}"

# Merge with MD table
npx nuxi task run merge --payload '{"dataPaths":["shared/data/2024-12-01.md"]}'

# Unit tests
npx vitest run

# E2E tests (Deferred to Phase 10)
# npx playwright test

# Component build (after config added)
npx vite build -c build/component.vite.config.ts
```

## Risk & Mitigation Log

| Risk | Impact | Mitigation |
|------|--------|------------|
| Index API schema changes | Fetch or merge failures | Keep fetch narrow, validate minimal fields, log warnings |
| Ambiguous merge spikes | User confusion | Emit explicit reasons, allow manual curation later |
| Large dataset performance | Slow filtering | Consider precomputed facet maps in future iteration |
| Date parsing ambiguity | Incorrect merges | Preserve raw date + normalized field; never discard original |

## Backlog (Post-Slice)

- Editorial workflow + auth
- DB persistence
- Calendar grid & exports (CSV/iCal)
- Multi-language content
- Protocol expansion
- Advanced search & analytics
- Notification/reminder system
- AI-assisted ingestion

## Deliverables Summary

| File | Purpose | Status |
|------|---------|--------|
| `.github/requirements/index.md` | Documentation index | ⬜ |
| `.github/requirements/roadmap.md` | This roadmap | ⬜ |
| `shared/data/raw-index.json` | CBD API response | ⬜ |
| `shared/data/merged.json` | Merged dataset | ⬜ |
| `shared/data/unmerged_index.json` | Unmatched index items | ⬜ |
| `shared/data/unmerged_actions.json` | Unmatched MD rows | ⬜ |
| `server/tasks/indexer.ts` | Fetch task | ⬜ |
| `server/tasks/merge.ts` | Merge task | ⬜ |
| `utils/indexers/scbd/index-activities-actions.ts` | Indexing utility | ⬜ |
| `components/calendar-activities-actions.vue` | Main component | ⬜ |
| `tests/unit/calendar-activities-actions.spec.ts` | Unit tests | ⬜ |
| `tests/e2e/calendar-activities-actions.spec.ts` | E2E tests | ⬜ |
| `build/component.vite.config.ts` | Library build | ⬜ |

## Definition of Done (Consolidated)

- All acceptance boxes across phases checked
- Lint/tests pass; build artifact created
- README / docs updated with run + regenerate guidance
- No TODO comments left un-ticketed
- Component loads in <3 seconds
- Merge process achieves >90% match rate
- Library build is <100KB (excluding externals)
- All tests pass with >80% coverage

## Success Metrics

- All Nitro tasks execute without errors
- Merge process achieves >90% match rate
- Component loads in <3 seconds
- All tests pass with >80% coverage
- Library build is <100KB (excluding externals)
