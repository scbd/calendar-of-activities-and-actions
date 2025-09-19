# Jira Issue Enforcement Template (ENV Based)

Purpose: Enforce consistent creation and updating of Jira issues for CBD Activities & Actions Calendar project phases using environment variables. Ensures all required metadata fields (parent Epic, labels, story points, estimates, assignment) are properly populated rather than only described in issue descriptions.

## Environment Variables Required

Read from `.env` (see `.env.example`):

- `JIRA_BASE_URL` (e.g., <https://example.atlassian.net>)
- `ATLASSIAN_CLOUD_ID` (if needed for non-core APIs)
- `JIRA_USER_AUTH` (format: "email:api_token" for Basic auth)
- Optional: `JIRA_EPIC_LINK_FIELD_ID`, `JIRA_STORY_POINTS_FIELD_ID`, `JIRA_ASSIGNEE_ACCOUNT_ID`

If custom field IDs are not provided they MUST be discovered dynamically via the Jira REST API (`GET /rest/api/3/field`) and cached in memory for the session.

## Allowed Issue Types

`Task`, `Improvement`, `New Feature`, `Bug` (reject others unless explicitly added).

## Parent / Epic Linking

Parent Epic key: `DEV-739` (must exist and be type Epic). Determine underlying Epic Link custom field ID:

1. GET `${JIRA_BASE_URL}/rest/api/3/field`
2. Find field where `schema.custom` == `EpicLink` OR name contains `Epic Link`.
3. Use that ID (e.g., `customfield_10014`). If provided via env `JIRA_EPIC_LINK_FIELD_ID`, validate it exists.

## Story Points Field

Locate field with `name` == "Story Points" or agile board config alias (commonly `customfield_10016`). Validate numeric. If `JIRA_STORY_POINTS_FIELD_ID` provided, verify existence.

## Preflight Checklist (Automated)

1. Validate env vars present; fail fast if missing mandatory ones (`JIRA_BASE_URL`, `JIRA_AUTH_HEADER`).
2. Fetch field metadata; map: `epicLinkFieldId`, `storyPointsFieldId`.
3. Resolve assignee accountId (if `JIRA_ASSIGNEE_ACCOUNT_ID` not set: GET `/rest/api/3/myself`).
4. Confirm parent Epic exists: GET `/rest/api/3/issue/DEV-739?fields=issuetype`.
5. Build label scheme derived from phase: `PHASE-0`, `PHASE-1`, etc.
6. Construct idempotency map: search existing issues by JQL prefix match on summary `"CAA-P0 -"` to avoid duplicates.

## Creation Rules

- Summary: `CAA-P0 - <Concise Descriptive Title>`
- Description: Must include:
  - Context / rationale
  - Acceptance criteria (bullet list)
  - Implementation outline
  - Test strategy
  - Links to roadmap line(s) / file references (e.g., `.github/requirements/roadmap.md` anchor if desired)
- Labels: `PHASE-0` plus any thematic tags (e.g., `FOUNDATION`, `NUXT`, `TESTING`). Always include `PHASE-0`.
- Story Points: Provide an integer estimate.
- Original Estimate: Provide seconds (e.g., 1d = 28800s). Convert from a simple heuristic mapping SP → time if needed.
- Due date: Tomorrow (ISO date) unless overridden.
- Assignee: env or resolved account id.
- Parent Epic: set via Epic Link field.

## Create Endpoint & Sample Payload

POST `${JIRA_BASE_URL}/rest/api/3/issue`

Use curl with Basic auth:

```bash
curl -u "$JIRA_USER_AUTH" -X POST "$JIRA_BASE_URL/rest/api/3/issue" \
  -H 'Content-Type: application/json' \
  -d '{
    "fields": {
      "project": { "key": "DEV" },
      "summary": "CAA-P0 - Ensure instructions compliance",
      "issuetype": { "name": "Task" },
      "description": {
        "type": "doc",
        "version": 1,
        "content": [ { "type": "paragraph", "content": [ { "text": "Detailed context...", "type": "text" } ] } ]
      },
      "labels": ["PHASE-0","FOUNDATION"],
      "${EPIC_LINK_FIELD_ID}": "DEV-739",
      "${STORY_POINTS_FIELD_ID}": 2,
      "duedate": "${TOMORROW_YYYY_MM_DD}",
      "assignee": { "id": "${ASSIGNEE_ACCOUNT_ID}" }
    }
  }'
```

For updates, use the edit format:

```bash
curl -u "$JIRA_USER_AUTH" -X PUT "$JIRA_BASE_URL/rest/api/3/issue/DEV-750" \
  -H 'Content-Type: application/json' \
  -d '{
    "update": {
      "timetracking": [{
        "edit": {
          "originalEstimate": "{{ORIGINAL_ESTIMATE}}",
          "remainingEstimate": "{{REMAINING_ESTIMATE}}"
        }
      }]
    }
  }'
```'
```

`EPIC_LINK_FIELD_ID` and `STORY_POINTS_FIELD_ID` are placeholders replaced at runtime; do NOT literally send `${...}` to Jira.

## Update Endpoint & Patch Strategy

PATCH `${JIRA_BASE_URL}/rest/api/3/issue/<ISSUE_KEY>` with minimal diff payload only for missing fields.

Use curl with Basic auth:

```bash
curl -u "$JIRA_USER_AUTH" -X PUT "$JIRA_BASE_URL/rest/api/3/issue/DEV-750" \
  -H 'Content-Type: application/json' \
  -d '{
    "fields": {
      "labels": ["PHASE-0","NUXT"],
      "${STORY_POINTS_FIELD_ID}": 3
    }
  }'
```

## Validation Rules After Creation

- Fail if labels missing `PHASE-0`.
- Fail if Epic link blank.
- Warn (not fail) if description missing acceptance criteria heading.
- Fail if story points null.
- Fail if summary does not start with `CAA-P0 -`.
- Return structured report of deficiencies and applied fixes.

## Output Report Schema (Example)

```json
{
  "phase": "0",
  "parentEpic": "DEV-739",
  "issues": [
    {
      "key": "DEV-750",
      "summary": "CAA-P0 - Ensure instructions compliance",
      "created": true,
      "updated": true,
      "defectsResolved": ["missingEpicLink","missingStoryPoints"],
      "remainingDefects": []
    }
  ],
  "stats": {"created": 6, "updated": 6, "skipped": 0, "errors": 0}
}
```

## Error Handling

- 401/403: Abort and flag invalid credentials.
- 400 with unknown field: Re-discover fields and retry once.
- Network/transient: Retry (exponential backoff up to 3 attempts) for idempotent GET/POST not yet succeeded.

## Pseudocode Outline

```ts
loadEnv();
assertRequired();
fields = fetchFields();
ids = mapCustomFieldIds(fields);
assignee = getAssignee();
parentOk = validateEpic();
roadmapTasks = parseRoadmapPhase(0);
existing = searchExisting("CAA-P0 -");
for task in roadmapTasks:
  key = dedupe(existing, task.summary);
  if !key:
    key = createIssue(task, ids);
  ensureCompliance(key, ids, task);
report();
```

## Security

Never log full `JIRA_USER_AUTH` value. Redact after first 6 characters of the API token portion.

## Expansion

Future phases: replicate with phase parameter and label pattern `PHASE-X`.

---
Use this template verbatim as the foundational enforcement contract.
