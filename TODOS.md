Notes:

- clearing-house mechanism using this link - action link


# TODOS

- [x] docker image

<!-- - [ ] deploy to dev server -->
<!--  -->
<!-- - [ ] update suggestion 1 and 2 -->

- [x] consolidate types

- [x] clean status

- [x] view docs

- [x] translations  

- [x] normalize variables

- [x] refactor code

- [x] default date to show (all future dates)

- [x] programatically change status that is confirmed to complete if date exceeds the end date if exists else 1 day after start date.

- [x] fix schemas

- [x] fix dir structure

- [x] show notifications
  - if responsible unit empty hide line
  - if responsible officer empty hide line
  - if responsible unit and officer empty hide section
  - notification shows sept 27 and under notification notification sept 28, use published date for notification in always visible section

- [x] endpoint data migration — all data from SOLR endpoint (see docs/endpoint-data-migration.md)
  - [x] SOLR query builder + types + constants (Phase 01)
  - [x] useCalendarData composable with pagination + facets (Phase 02)
  - [x] useThesaurusFilters composable — thesaurus + facet merge (Phase 02)
  - [x] Both filter components migrated to facet-driven options (Phase 03)
  - [x] Infinite scroll in list, table, and tab views (Phase 04)
  - [x] New filters: Governing Bodies, GBF Sections, COP Decisions (Phase 03)
  - [x] Removed 37 static data files, scripts, and dead code (Phase 05)
  - [x] i18n for all 6 locales (Phase 03)

- [ ] fix 30 pre-existing nuxt component test failures (mocks need updating for SOLR composable)
- [ ] move API base URL to Nuxt runtime config (currently hardcoded to api.cbddev.xyz)
- [ ] advanced search one line
- [ ] sort in advance disappear through transition
- [ ] display gbf targets https://www.cbd.int/app/images/gbf-targets/gbf-23-64.png
- [ ] update actors from notifications
- [ ] icons 
- [ ] list all Subsidiary body(ies)
- [ ] enable E2E tests with running dev server