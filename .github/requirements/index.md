# Activities & Actions Calendar – Vertical Slice Index

This repository hosts an incremental implementation of the CBD Calendar of Activities & Actions. This document defines the **narrow initial vertical slice** and links to the full v2 requirement set for broader context.

## Canonical References

- Full v2 Requirements: `./v2/index.md`
- Summary / Background: `./v2/cbd-cal-summary.md`
- Engineer Init Prompt: `../prompts/init.md`

## Slice Objective

Deliver a minimal, testable pipeline + UI that:

1. Fetches meeting/activity index JSON (since a configurable date) via a Nitro Task.
2. Parses a program‑officer–maintained Markdown table (`shared/data/2024-12-01.md`).
3. Deterministically merges both datasets (with provenance + unmerged outputs).
4. Renders a single public Vue/Nuxt component (`calendar-activities-actions.vue`) providing filtering & basic light/dark styling.
5. Ships unit + e2e tests and a component‑only library build (ES + UMD) externalizing `vue` & `bootstrap`.

## In Scope (This Slice)

- Local JSON persistence under `shared/data/` & duplicated to `public/data/` for client fetch.
- Two Nitro Tasks (CLI only): `indexer` (fetch) & `merge` (parse + merge).
- Reusable pure indexing utility (`utils/indexers/scbd/indexMeetings.ts`).
- Deterministic merge logic (COP decision / related doc tokens / title+date window) with provenance shape `{ index: {...}, md: {...}, normalized: {...} }`.
- Single SFC UI (Bootstrap 5) with filters: Type, Subject, Status, Subsidiary Body, COP Decision, Date Range, Action Required flag.
- Accessibility basics (aria labels, focus states).
- Unit tests (filter logic & rendering) via Vitest; e2e tests via Playwright.
- Library build config at `build/component.vite.config.ts`.

## Out of Scope (Deferred to Later Phases)

- Authentication / RBAC / user management.
- Database (MongoDB) persistence & APIs.
- Draft/Review/Publish workflows or editing UI.
- Notifications / email / reminders / deadline alerts.
- GBF Targets, Agenda item taxonomy management, analytics.
- Protocol data ingestion & multi‑language content.
- Calendar (grid) or iCal export views; only list/facet view.
- LLM assisted extraction / auto‑drafting.

## Key Artifacts (Result of Tasks)

| File | Purpose |
|------|---------|
| `shared/data/raw-index.json` | Raw fetched index data (since last COP date). |
| `shared/data/merged.json` | Merged normalized records with provenance. |
| `shared/data/unmerged_index.json` | Index rows unmatched to MD table. |
| `shared/data/unmerged_actions.json` | MD rows unmatched to index. |
| `server/tasks/indexer.ts` | Nitro Task: fetch + write raw index JSON. |
| `server/tasks/merge.ts` | Nitro Task: parse MD + merge + write outputs. |
| `utils/indexers/scbd/indexMeetings.ts` | Pure indexing helper (refactored). |
| `components/calendar-activities-actions.vue` | Public list + filters component. |
| `tests/unit/calendar-activities-actions.spec.ts` | Unit tests. |
| `tests/e2e/calendar-activities-actions.spec.ts` | E2E filters test. |
| `build/component.vite.config.ts` | Component‑only library build config. |

## Merge Logic Summary

1. Normalize titles (lowercase, trim, collapse whitespace, strip punctuation except `/`).
2. Candidate linking order:
   a. Exact COPDecision token match.
   b. Related document token match (e.g., notification IDs).
   c. Title similarity + date window (range overlap or ±30d start).
3. If >1 candidate after ranking, mark as ambiguous → do **not** auto‑merge; emit to both unmerged outputs with a note.
4. Store provenance + normalized flattened fields used by UI.

## Running the Slice

Fetch index (override date as needed):

```bash
npx nuxi task run indexer --payload '{"since":"2024-12-01"}'
```

Merge with MD table(s):

```bash
npx nuxi task run merge --payload '{"dataPaths":["shared/data/2024-12-01.md"]}'
```

Tests:

```bash
npx vitest run
npx playwright test
```

Library build (planned once config added):

```bash
npx vite build -c build/component.vite.config.ts
```

## Acceptance (Slice Definition of Done)

- Both Nitro Tasks run without unhandled errors and emit expected JSON files.
- `merged.json` contains required columns & provenance.
- Component renders dataset, filters adjust result count, supports dark/light.
- Unit + e2e tests pass locally.
- Library build outputs ES & UMD bundles excluding `vue` & `bootstrap`.

## Next Iteration Candidates (Not Implemented Yet)

- Persistent DB + CRUD APIs.
- Auth + roles & editorial workflow.
- Multi‑language and protocol expansion.
- Deadline reminders & notification integration.
- Advanced search (full‑text, decision paragraph filters).
- Calendar grid / export (CSV/iCal) views.
- AI-assisted draft extraction from decisions/notifications.

> See `./roadmap.md` for executable task checklists & progress tracking.
