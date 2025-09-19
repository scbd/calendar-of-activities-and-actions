# Activities & Actions Calendar — Init Plan Prompt (engineer-facing)

Role: You are a repo-aware engineer working in this repository to deliver a minimal, verifiable vertical slice of the Activities/Actions calendar. Follow the steps below precisely, keep changes focused, and prefer repo-relative paths.

Objective

- Stand up the data ingestion + merge pipeline, a Nitro Task invoking a reusable indexing utility, and a single Nuxt view with filters/facets that renders the merged records. Include unit + e2e tests and a small build for publishing the component as a library.

Context and Inputs

- Requirements: .github/requirements/v2/index.md
- Summary: .github/requirements/v2/cbd-cal-summary.md
- Wireframes: .github/requirements/wireframe-dark.png, .github/requirements/whire-frame-light.png
- Program-officer data (MD table): shared/data/2024-12-01.md
- Indexing reference (external): /Users/randyhoulahan/projects/@scbd/gaia/workers/indexers/scbd/index-meetings.js (use as inspiration; do not copy obsolete patterns)

Deliverables (new/updated files)

- .github/requirements/index.md: Short index that links to the v2 docs and states scope for this slice.
- .github/requirements/roadmap.md: Executable roadmap elaborating the steps below with checkable acceptance criteria.
- shared/data/raw-index.json: JSON fetched from the CBD index (since last COP).
- shared/data/merged.json: Merged rows from index + MD table.
- shared/data/unmerged_index.json: Index items that did not match an MD row.
- shared/data/unmerged_actions.json: MD rows that did not match an index item.
- server/tasks/indexer.ts: Nitro Task (defineTask) to fetch index data and write raw output.
- server/tasks/merge.ts: Nitro Task (defineTask) to parse MD, merge with raw index, and write merged outputs.
- utils/indexers/scbd/indexMeetings.ts: Reusable utility (refactored from Gaia pattern) that indexes given data path(s).
- components/calendar-activities-actions.vue: Single-file component implementing filters/facets + listing.
- tests/unit/calendar-activities-actions.spec.ts: Unit tests.
- tests/e2e/calendar-activities-actions.spec.ts: E2E test.
- build/component.vite.config.ts: Vite/Rollup config to publish just the component as a library.

High-level Steps (produce commits per step where applicable)

1) Create .github/requirements/index.md that links to the v2 docs and clarifies this slice’s scope (no auth, minimal UI, local JSON data OK), just one piblic component showing list searchable filterable list of all actions and activities.
2) Fetch index data since last COP and write shared/data/raw-index.json (see cURL example). Make the “since date” configurable.
3) Parse shared/data/2024-12-01.md (MD table) to JSON.
4) Merge the index JSON with the MD JSON using deterministic rules (see “Merging logic”). Output merged.json, unmerged_index.json, unmerged_actions.json.
5) Implement utils/indexers/scbd/indexMeetings.ts by refactoring the Gaia reference to modern ESM/TypeScript, remove deprecated libs (e.g., when), and use consola for logging. Keep it small and pure.
6) Add server/tasks/indexer.ts using Nitro Tasks (defineTask) to fetch index JSON (since) and write to shared/data/raw-index.json and public/data/raw-index.json.
7) Add server/tasks/merge.ts using Nitro Tasks (defineTask) to parse MD tables and merge with raw index, writing merged outputs under shared/data/ and public/data/.
8) Add unit tests and a minimal Playwright/Cypress E2E that mounts the page and verifies filtering.
9) Add a library build config to export only the component without bundling Nuxt.
10) Document how to run the endpoint, regenerate data, and run tests in .github/requirements/roadmap.md.

Merging logic (deterministic and explainable)

- Keys: Prefer exact matches on COPDecision (e.g., "16/32"), Related_documents tokens (e.g., "NTF 2025-024"), and Title + date window.
- Title normalization: lowercase, trim, collapse whitespace, remove punctuation aside from slashes in COP refs.
- Date window: consider two entries matching if their date ranges overlap or if start dates fall within ±30 days when only one side has a range.
- If multiple candidates match, rank by: (1) COPDecision exact match, (2) Related_documents token match, (3) Title + date score; if still ambiguous, do not auto-merge—emit both to unmerged sets with a note.
- Preserve provenance: include source fields in merged rows as nested objects: { index: {...}, md: {...} } and add a top-level normalized view for UI.

Nitro tasks + utility requirements

- server/tasks/indexer.ts (fetch-only)
  - Use defineTask per Nitro Tasks guide.
  - Accept payload: { since?: string; dryRun?: boolean }.
  - Fetch index JSON (since) and write shared/data/raw-index.json and public/data/raw-index.json.
  - Return: { counts, outputs: { rawIndex }, warnings: string[] }.
- server/tasks/merge.ts (merge-only)
  - Use defineTask per Nitro Tasks guide.
  - Accept payload: { dataPaths: string[]; rawIndexPath?: string; dryRun?: boolean }.
  - Parse MD tables, load raw index JSON, merge, and write outputs under shared/data/ and public/data/.
  - Return: { counts, outputs: { merged, unmergedIndex, unmergedActions }, warnings: string[] }.
- utils/indexers/scbd/indexMeetings.ts
  - ESM/TS module; pure functions; no side effects besides explicit writes via an injected fs adapter.
  - Replace any Gaia-era dependencies (e.g., when) with native promises or lightweight modern libs as needed.
  - Logging via consola with levels (info/warn/error). No custom logger.
No server API
- Do not expose server APIs for indexing. Trigger tasks only via CLI per Nitro Tasks documentation.

Nuxt component requirements (components/calendar-activities-actions.vue)

- Display: list or table of merged items showing at least: Title, Type, Subject, Status, Startdate, Enddate, Associatedbody, COPDecision, Related_documents, Action Required by Parties.
- Facets/filters: Type, Subject, Status, Subsidiary Body, COP Decision, Date range, “Action Required by Parties”.
- Style: Bootstrap 5; add a simple light/dark toggle (CSS vars or prefers-color-scheme). No header/footer/sidebar.
- Data: Query static JSON from public/data/merged.json and cache client-side; handle loading/empty/error states. Indexing is triggered via Nitro Tasks (CLI), not from the client.
- Accessibility: Keyboard focus states and sensible aria-labels for controls.

Testing

- Unit: Filter logic (composables/helpers), rendering of key columns, empty states.
- E2E: Load page, apply at least two filters, verify result count changes and selection persists on navigation.

Packaging (component-only)

- Create build/component.vite.config.ts to build calendar-activities-actions.vue as a library (ES + UMD) without bundling Nuxt. Externalize vue and bootstrap.
- Export types if using TypeScript.

Conventions and constraints

- Use repo-relative paths (e.g., shared/data/...), not user-specific absolutes in code.
- Keep changes minimal and scoped; do not refactor unrelated code.
- Prefer TypeScript for new modules; use ESM. No obsolete date libs; prefer native Date or dayjs/luxon if necessary.
- Console/logging via consola only.

Acceptance criteria

- New files are added as listed under Deliverables.
- Running the Nitro Tasks produces the data files in both shared/data and public/data and returns counts with no unhandled errors.
- Merged.json includes provenance and allows the UI to render all specified columns.
- calendar-activities-actions renders and filters datasets from shared/data/merged.json in both light and dark modes.
- Unit and E2E tests run locally and pass.
- Library build outputs a consumable component without Nuxt bundled.

Example cURL (index data since 2024-12-01; adjust as needed)

```bash
curl --location 'https://api.cbd.int/api/v2013/index/select' \
  --header 'Content-Type: application/json' \
  --data '{
    "df": "text_EN_txt",
    "q": "((updatedDate_dt:[ 2024-12-01T00:00:00.000Z TO * ]))",
    "sort": "updatedDate_dt desc",
    "wt": "json",
    "start": 0,
    "rows": 1000,
    "facet": true,
    "facet.field": [
      "{!ex=schemaType}schemaType_s",
      "{!ex=schema,schemaType,schemaSub}schema_s",
      "{!ex=government}countryRegions_ss",
      "{!ex=keywords}all_terms_ss",
      "{!ex=region}countryRegions_REL_ss"
    ],
    "facet.mincount": 1,
    "facet.limit": 512,
    "facet.pivot": "schema_s, all_terms_ss"
  }'
```

Notes

- If the CBD index requires authentication or different filters, capture configuration in a small JSON file (e.g., .github/requirements/indexer.config.json) and document it in the roadmap.
- Use the Gaia file only as reference; modernize and keep the surface small and testable.

How to run (Nitro Tasks)

- Fetch index only: `npx nuxi task run indexer --payload '{"since":"2024-12-01"}'`
- Merge with MD: `npx nuxi task run merge --payload '{"dataPaths":["shared/data/2024-12-01.md"]}'`
- Payload file: `npx nuxi task run merge --payload ./merge.payload.json`
- See Nitro Tasks documentation for environment and programmatic invocation guidance.

References

- Nitro: <https://nitro.build/>
- Nitro Tasks: <https://nitro.build/guide/tasks>
- Nuxt: <https://nuxt.com/>
- Bootstrap 5: <https://getbootstrap.com/docs/5.0/getting-started/introduction/>
