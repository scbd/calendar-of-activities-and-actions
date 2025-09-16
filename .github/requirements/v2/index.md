# CBD Calendar of Activities and Actions - Requirements Document

## Purpose

Create a searchable calendar system for CBD activities and actions. Reduce
notification overload. Help parties quickly identify required actions and
deadlines. Facilitate secretariat maintenance of records.

## Scope

System covers activities (secretariat-led) and actions (party-led with
deadlines). Links to COP decisions and notifications. Excludes protocol
activities unless specified. Integrates with existing CBD website.

## Users

- **Secretariat Users (Division/Unit Heads)**: Input, update, approve
  activities/actions. Focus on simplicity for maintenance.
- **Party Users (National Focal Points)**: View/search calendar. Filter by
  relevance (e.g., deadlines, subjects).
- **Admin Users**: Manage users, metadata, approvals.

## Functional Requirements

### Data Input

- Forms for activities and actions using template from
  activity-template-summary.md.
- Mandatory fields: Title, Type, Subject, Status, Start Date, End Date,
  Associated Body, COP Decision, COP Paragraph Number.
- Optional fields: Description, Status Narrative, Agenda Item, COP Paragraph
  Type, Responsible Unit, Responsible Officer, Funding Source, Funding
  Allocated, Actors, Actors Comments, GBF Targets, Related Documents, Outcome.
- Reference format: COP Decisions as "16/15"; full URLs for documents.
- Support multiple values for COP Decisions, GBF Targets, Related Documents.
- Link activities to actions (bidirectional) for workflows. Allow
  action-to-action links.

### Data Management

- Store in MongoDB.
- Workflow: Draft > Review/Approve > Publish.
- Version history for changes.
- Integration:  notifications & desicion tracker for auto-links.

### Search and Display

- Combined view (Format 3): Single list of meetings, activities, actions.
  Sort chronologically. Color-code & icon  by type.
- Filters: Type (meeting/activity/action), Subject Area, Status, Subsidiary
  Body, Deadlines, GBF Targets.
- Search by keywords, dates, decisions.

### User Interface

- Built with Nuxt.js and bootstrap.
- Responsive design.
- Dashboard for secretariat: List drafts, pending approvals.
- Public view: Calendar list with filters.
- Public view as seperate layer for use in other systems.

### Security and Access

- Authentication: CBD credentials.
- Role-based access: View-only for parties; edit for secretariat.
- Audit logs for changes.

## Roadmap

1. **Planning/Design (2 weeks)**: Finalize wireframes, schema. Estimate:
   Week 1-2.
2. **Backend Setup (3 weeks)**: MongoDB schema, API endpoints. Week 3-5.
3. **Frontend Development (4 weeks)**: Nuxt.js UI, forms, search. Week 6-9.
4. **Testing/Deployment (3 weeks)**: QA, security audit, launch. Week 10-12.

Total Estimate: 12 weeks.

## Notes for Version 2

- Mobile app notifications for deadlines.
- LLM Integration (2 weeks): Setup separate endpoints, testing. Week 10-11.
- All Non-Functional Requirements: Performance: Load <2s for searches.
  Scalability: Handle 1000+ entries. Accessibility: WCAG 2.1 compliant.
  Backup: Daily MongoDB snapshots.
- All LLM Integration: Separate endpoint for LLM processing. Input: URLs from
  COP decisions/notifications. Output: Extract activities/actions, prefill
  fields as drafts. Trigger: On new document upload or scheduled review.
- Export: CSV/PDF of filtered views.
- Notifications: Alert parties on upcoming actions/deadlines.
- Automated reminders for updates (e.g., email to responsible officers).
- Prefill drafts via LLM: Review COP decisions and notifications to suggest
  activities/actions. Mark as draft for approval.
- Date format: Qx yyyy for imprecise dates (e.g., Q1 2025).
- Suggestions for Improvement: Add AI chat for queries (e.g., "Show actions
  due in Q3 2025"). Integrate calendar export to Google/iCal. Analytics:
  Track user views to prioritize maintenance.
