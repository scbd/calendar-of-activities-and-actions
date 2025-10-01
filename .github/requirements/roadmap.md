# Activities & Actions Calendar - Consolidated Executable Roadmap

This roadmap synthesizes the best features from multiple roadmap versions, creating a comprehensive, executable guide for the initial vertical slice of the CBD Activities & Actions Calendar. It includes detailed phases, checkable tasks, acceptance criteria, run commands, deliverables, and risk mitigation. Scope excludes auth, persistence DB, and editorial workflow (see `index.md`).

## Phase 0 – Foundations & Setup

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

Goal: Fetch raw meeting/activity index JSON since configurable date.

- [ ] Implement `utils/indexers/scbd/indexMeetings.ts` (pure; no side effects except via injected IO)
- [ ] Support parameters: `{ since: string; limit?: number; logger?: ConsolaInstance; fetchImpl?: typeof fetch }`
- [ ] Return shape: `{ items: any[]; count: number; warnings: string[] }`
- [ ] Implement Nitro task `server/tasks/indexer.ts`
- [ ] Task payload validation (`since` default = last COP start date env/constant)
- [ ] Write outputs: `shared/data/raw-index.json` & `public/data/raw-index.json`
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
- [ ] Extract columns: Title, Type, Subject, Status, StartDate, EndDate, AssociatedBody, COPDecision, Related_documents, ActionRequired
- [ ] Normalize date strings (ISO where possible; keep raw if ambiguous)
- [ ] Unit tests with fixture from `shared/data/2024-12-01.md`

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

## Phase 5 – Post-Merge Data Indexation

Goal: Create a lightweight searchable in-memory index for fast filtering & free-text search.

- [ ] Define derived index structure (token map: token -> record ids; facet maps)
- [ ] Implement build step (part of merge task) that outputs `public/data/merged.index.json`
- [ ] Include: tokens from normalized title, COPDecision tokens, related document tokens
- [ ] Pre-compute facet value frequency maps for UI counts
- [ ] Size check: ensure index file < 30% of merged payload size
- [ ] Update merge task to emit index file
- [ ] Unit tests: tokenization, lookup correctness, facet map integrity

**Acceptance Criteria:**

- `merged.index.json` present and search lookup returns expected record ids for sample tokens
- Index enables fast filtering without rescanning full dataset

## Phase 6 – Index Query Service Utility

Goal: Provide a reusable query utility for free-text + facet filtering.

Location: `shared/util/indexQuery.ts`

- [ ] Implement types: `QueryInput { text?: string; facets?: FacetFilters; dateRange?: { from?: string; to?: string } }`
- [ ] Load / accept injected data + index (pure function design)
- [ ] Text search strategy: intersect postings lists for each token; fallback to substring scan if token absent
- [ ] Facet filtering applied after text candidate set reduction
- [ ] Stable sort (chronological ascending by StartDate then Title)
- [ ] Expose incremental API: `prepare(data, index)`, `query(q)`, `facetCounts(qPartial)`
- [ ] Unit tests: text only, facet only, combined, empty, date range edge, unknown token
- [ ] Performance test (mock) to ensure O(k + r) where k tokens, r results

**Acceptance Criteria:**

- Utility returns identical result set to legacy in-component filtering for sampled queries
- Document usage in roadmap & `index.md`

## Phase 7 – UI Component

- [ ] Create `components/calendar-activities-actions.vue`
- [ ] Fetch `public/data/merged.json` client-side with loading/error/empty states
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

## Phase 8 – Testing

- [ ] Unit tests (Vitest): filter predicate combinations, empty state, provenance presence
- [ ] Component mount test (shallow) verifies column rendering
- [ ] E2E (Playwright): load page, apply ≥2 filters, assert count change & persistence on soft navigation
- [ ] Add CI script entries (if CI config present)

**Acceptance Criteria:**

- `npx vitest run` and `npx playwright test` both pass
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

## Phase 10 – Documentation & Finalization

- [ ] Update roadmap checkboxes to reflect completion
- [ ] Add quick run section (index, merge, tests, build) to README or roadmap
- [ ] Record any configuration (auth tokens, env vars) needed (none expected for public index, else document)
- [ ] List deferred backlog items (already in `index.md`)

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

# E2E tests
npx playwright test

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
| `utils/indexers/scbd/indexMeetings.ts` | Indexing utility | ⬜ |
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
