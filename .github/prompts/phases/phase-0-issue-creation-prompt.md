# Prompt: Generate & Enforce Phase 0 Jira Issues

Use this prompt with an MCP-enabled assistant that can call a Jira MCP server (create & update issues).

Objective: For every unchecked Phase 0 checkbox task in `.github/requirements/roadmap.md`, ensure a fully compliant Jira issue exists or is updated to compliance.  If not created already create a git branch from the  repo phase-0.  

Issues created will have direction to try and keep commits all logical chunks to the pr.  The pr the be to the phase 0 branch.  Each issue will create its own branch p0-task-${taskNumber}.  Every issue will have it's own git branch.  The issue will be linked to the epic DEV-739.  The issue will have a due date of tomorrow.  The issue summary MUST start with CAA-P0-T${taskNumber} - ${taskTitle} (e.g., CAA-P0-T0 - Ensure instructions compliance).  The issue will have a label of PHASE-0 and any other relevant labels from the list FOUNDATION, NUXT, TESTING, DOCS, CONFIG.  The issue will have story points assigned based on the table below.  The issue will have an original estimate based on the table below.  The issue will have a description in the format below.  The issue will be assigned to the user in the env var JIRA_ASSIGNEE_ACCOUNT_ID if set otherwise unassigned.  The issue will have a type of Task unless the complexity warrants Improvement or New Feature.  If so justify in the description.  The issue will have acceptance criteria, implementation outline, test strategy, risks (if any) and references to the roadmap file and line number if helpful.  The issue will have a summary paragraph explaining the context of the task in relation to the project.

## Environment Prerequisites

Load from `.env`:

- `JIRA_BASE_URL`
- `JIRA_AUTH_HEADER`
- (Optional) `JIRA_EPIC_LINK_FIELD_ID`, `JIRA_STORY_POINTS_FIELD_ID`, `JIRA_ASSIGNEE_ACCOUNT_ID`

## Fixed Configuration

- Project Key: `DEV`
- Parent Epic: `DEV-739`
- Phase Label: `PHASE-0`
- Summary Prefix: `CAA-P0 -`
- Due Date: Tomorrow (ISO)
- Allowed Issue Types: Task (default) unless complexity warrants Improvement or New Feature (justify if changed)

## Roadmap Source

Parse only Phase 0 list items from `.github/requirements/roadmap.md` under heading `## Phase 0 – Foundations & Setup` until the next `## Phase 1` heading. Skip already completed (checked) tasks; operate only on unchecked `- [ ]` lines.

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

(If different estimate chosen, justify in description.)

## Creation / Update Logic

**MCP BUG WORKAROUND:** Due to a bug in the Jira MCP preventing custom fields from being set on creation, all issues must be created and then immediately updated via a separate API call to set custom fields like Epic Link and Story Points. For instructions on how to perform this update, see the [Jira Enforcement Template](/Users/randyhoulahan/projects/@scbd/calendar-of-activities-and-actions/.github/prompts/jira-enforcement-template.md).

1. Preflight: discover custom fields (Epic Link, Story Points) unless provided.
2. JQL search for existing issues with `summary ~ "CAA-P0 -"` and containing roadmap-derived unique token (e.g. slug of title). Prefer reuse over duplicate creation.
3. If missing, create issue with all mandatory fields populated (Epic Link, labels, story points, timetracking original estimate, due date, assignee, description doc format).
4. If exists, PATCH only missing or non-compliant fields.
5. Record actions taken per issue.

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

Always include `PHASE-0`. Add additional semantic labels from: `FOUNDATION`, `NUXT`, `TESTING`, `DOCS`, `CONFIG` as appropriate (limit to ≤4 labels total).

## Required Field Compliance

Fail the run if any newly created or updated issue ends without:

- Epic Link
- Story Points value
- plan start date and time and end date and time.
- estimated time to complete.
- `PHASE-0` label
- Summary starting `CAA-P0 -`

## Output Report (Markdown + JSON)

Produce:

- Markdown table summarizing keys, titles, actions (Created/Updated/Skipped), SP, estimate, defects fixed.
- JSON block with machine-readable summary (see enforcement template for schema).

## Error Handling / Retries

- Retry GET/POST/PATCH up to 3 times for network/transient.
- On unknown custom field error, re-fetch fields once and retry.

## Additional Enhancements (If Value Add)

- Derive additional label based on presence of words: `Bootstrap` → `UI`, `Vitest` → `TESTING`.
- Short slug generation: lowercase kebab of core title words for reuse detection.

## Final Step

Return direct browseable links to each issue: `${JIRA_BASE_URL}/browse/<ISSUE_KEY>`.

## Execution Directive

Perform all feasible automated Jira operations directly; only describe steps that cannot be programmatically completed.


## create a phase 0 start report

- in .github/prompts/phases create file phase-0-start-report.md  Describe initial actions takes to support all tasks within phase.
- make a table in order of task number which is the order displayed in roadmap.  name and description of task, started date, status, end date, time estimate, points estimate and link to any supporting context for the implimentation agents.


---

Proceed with generation and enforcement now.
