# Prompt: Generate & Enforce Phase 3 Jira Issues

Use this prompt with an MCP-enabled assistant that can call a Jira MCP server (create & update issues).

Objective: For every unchecked Phase 3 checkbox task in `.github/requirements/roadmap.md`, ensure a fully compliant Jira issue exists or is updated to compliance. If branch `phase-3` does not exist, create it from the repository default branch. For each task, create its own working branch `p3-task-${taskNumber}` off `phase-3`. Keep commits as logical chunks and open a PR targeting `phase-3`.

Issues must be linked to the epic `DEV-739`. Each issue will have a due date of today + `1` days. Each summary MUST start with `CAA-P3-T${taskNumber} -` (e.g., `CAA-P3-T0 -` for the first task in the phase). Include the label `PHASE-3` and any other relevant labels from the set: `FOUNDATION`, `NUXT`, `TESTING`, `DOCS`, `CONFIG`, `UI`.

Select issue type `Task` by default unless the complexity warrants `Improvement` or `New Feature` (justify if changed).

---

## Environment Prerequisites

Load from `.env` (or environment):

- `JIRA_BASE_URL`
- `JIRA_USER_AUTH` (format: "email:api_token" for Basic auth)
- (Optional) `JIRA_EPIC_LINK_FIELD_ID`, `JIRA_STORY_POINTS_FIELD_ID`, `JIRA_ASSIGNEE_ACCOUNT_ID`

## Fixed Configuration (Parametrized)

- Project Key: `DEV` (default: `DEV`)
- Parent Epic: `DEV-739` (e.g., `DEV-739`)
- Phase Label: `PHASE-3` (e.g., `PHASE-3`)
- Summary Prefix: `CAA-P3 -` (e.g., `CAA-P3 -`)
- Due Date: Today + `1` day(s)
- Allowed Issue Types: `Task` (default); allow `Improvement`/`New Feature` if justified

## Roadmap Source

Parse only Phase 3 list items from `.github/requirements/roadmap.md` under the heading exactly matching:

```md
## Phase 3 – Merge Logic
```

Continue until the next `## Phase` heading. Skip already completed (checked) tasks; operate only on unchecked `- [ ]` lines.

## For Each Task

Derive:

- Canonical short title
- Expanded context paragraph explaining rationale in project context
- Acceptance Criteria (bulleted list)
- Implementation Steps (ordered list)
- Test Strategy (unit / integration / e2e relevance)
- Risk & Mitigation (if any)
- Suggested Story Points & Original Estimate (mapping table below)

### Suggested SP → Time Mapping

| SP | Approx | Timetracking originalEstimate |
|----|--------|-------------------------------|
| 1  | 0.5d   | 4h ("4h")                     |
| 2  | 1d     | 1d                            |
| 3  | 1.5d   | 12h                           |
| 5  | 2-3d   | 2d                            |

(If different estimate is chosen, justify in the description.)

## Creation / Update Logic

Note: Due to an MCP limitation preventing some custom fields from being set during creation, create the issue first and then immediately update it to set custom fields like Epic Link and Story Points. See enforcement template at `.github/prompts/jira-enforcement-template.md` for examples and schema details.

1. Preflight: discover custom fields (Epic Link, Story Points) unless provided via env.
2. JQL search for existing issues with `summary ~ "CAA-P3 -"` containing the roadmap-derived unique token (slug of title). Prefer reuse over duplicate creation.
3. If missing, create the issue with mandatory fields populated (labels including `PHASE-3`, due date, summary prefix, description, and default type `Task`).
4. Immediately PATCH to set Epic link (`DEV-739`), Story Points, timetracking original estimate, assignee (`JIRA_ASSIGNEE_ACCOUNT_ID` if present), custom fields, and any missing metadata.
5. Create or update Git branches: ensure base branch `phase-3` exists; for each issue, create/update `p3-task-${taskNumber}` from base. Push and open PR if changes are made.
6. Record actions taken per issue.

## Description Format (Atlassian Document API JSON)

Sections ordered:

1. Summary Context Paragraph
2. Heading: `Acceptance Criteria`
3. Bullet list items
4. Heading: `Implementation Outline`
5. Ordered steps
6. Heading: `Test Strategy`
7. Bullet list
8. (Optional) Heading: `Risks`
9. Heading: `References` with link to repository file and line context if helpful

## Labels Strategy

Always include `PHASE-3`. Add additional semantic labels from: `FOUNDATION`, `NUXT`, `TESTING`, `DOCS`, `CONFIG`, `UI` as appropriate (limit to ≤4 labels total). Derive additional labels automatically when helpful (e.g., presence of "Bootstrap" → `UI`, "Vitest" → `TESTING`).

## Required Field Compliance

Fail the run if any newly created or updated issue ends without:

- Epic Link (to `DEV-739`)
- Story Points value
- Plan start date and time and end date and time
- Original Estimate (timetracking.originalEstimate)
- Assignee
- `PHASE-3` label
- Summary starting with `CAA-P3 -`

## Output Report (Markdown + JSON)

Produce:

- Markdown table summarizing keys, titles, actions (Created/Updated/Skipped), SP, estimate, defects fixed.
- JSON block with machine-readable summary (see enforcement template for schema).

## Error Handling / Retries

- Retry GET/POST/PATCH up to 3 times for network/transient errors.
- On unknown custom field errors, re-fetch fields once and retry.

## Additional Enhancements (If Value Add)

- Short slug generation: lowercase kebab of core title words for reuse detection.
- Auto-detect semantic labels based on task wording.

## Completion Enforcement (Post-Run Audit)

After processing the full task list, perform a final audit for every created or updated issue:

- Verify the following fields are populated: Epic Link, Story Points, Assignee, and Original Estimate (timetracking.originalEstimate).
- If any are missing, immediately call the Jira REST API to set only the missing fields via PATCH, using the dynamically discovered custom field IDs (see `.github/prompts/jira-enforcement-template.md`).
  - Endpoint: `${JIRA_BASE_URL}/rest/api/3/issue/<ISSUE_KEY>`
  - Minimal diff payload example (replace placeholders with discovered IDs/values; do not send literal `${...}`):

```json
{
  "fields": {
    "labels": ["PHASE-3"],
    "${EPIC_LINK_FIELD_ID}": "DEV-739",
    "${STORY_POINTS_FIELD_ID}": {{STORY_POINTS_NUMBER}},
    "assignee": { "id": "{{ASSIGNEE_ACCOUNT_ID}}" }
  }
}
```

For timetracking updates, use the edit format:

```json
{
  "update": {
    "timetracking": [{
      "edit": {
        "originalEstimate": "{{ORIGINAL_ESTIMATE}}",
        "remainingEstimate": "{{REMAINING_ESTIMATE}}"
      }
    }]
  }
}
```

- Re-validate after patching. Report any remaining deficiencies in the output report and fail the run if mandatory fields are still missing.

## Final Step

Return direct browseable links to each issue: `${JIRA_BASE_URL}/browse/<ISSUE_KEY>`.

## Execution Directive

Perform all feasible automated Jira and Git operations directly; only describe steps that cannot be programmatically completed.

---

## Create a Phase 3 Start Report

- In `.github/prompts`, create file: `phase-3-start-report.md`.
- Describe initial actions taken to support all tasks within the phase.
- Include a table in task-number order (order displayed in roadmap) with columns:
  - Name and description of task
  - Started date
  - Status
  - End date
  - Time estimate
  - Points estimate
  - Link(s) to any supporting context for the implementation agents

---

## Templated Variables

Provide these variables when invoking this template (defaults shown where applicable):

- `PHASE_NUMBER` (required): e.g., `0`, `1`, `2`.
- `PHASE_NAME` (required): the phase heading suffix exactly as in the roadmap, e.g., `Merge Logic`.
- `ROADMAP_PATH` (default: `.github/requirements/roadmap.md`).
- `JIRA_PROJECT_KEY` (default: `DEV`).
- `PARENT_EPIC_KEY` (e.g., `DEV-739`).
- `PHASE_LABEL` (default: `PHASE-3`).
- `SUMMARY_PREFIX` (default: `CAA-P3 -`).
- `DUE_DATE_OFFSET_DAYS` (default: `1`).
- `ENFORCEMENT_TEMPLATE_PATH` (default: `.github/prompts/jira-enforcement-template.md`).

## Notes

- Ground planning and acceptance criteria in `.github/requirements/index.md` and the referenced slice scope where applicable.
- Keep diffs small and commits logically grouped per issue branch.
- Ensure commit messages are descriptive in name and the description outlines all changes and why. The title must always reference the Jira ticket by starting with the key.
- Use the same run commands as listed in the roadmap when applicable to validate changes.