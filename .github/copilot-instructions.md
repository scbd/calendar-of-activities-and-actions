# GitHub Copilot Repo Instructions

This repository uses the default guidance at `.github/instructions/default.instructions.md` for Nuxt.js, Vue 3, TypeScript, and Node.js. Copilot should adhere to these rules and the project anchor.

Key points for Copilot:

- Prefer small, reviewable diffs and keep public APIs stable.
- Follow Nuxt conventions (Vue 3 `<script setup lang="ts">`, kebab-case filenames, semicolons).
- Add/maintain minimal tests (Vitest for unit, Playwright for e2e) when changing public behavior.
- Use Yarn scripts and strict TypeScript settings.
- Ground planning in `.github/requirements/index.md` (Purpose, Scope, Users, Functional/NFRs) otherwise provided in context.
- Use shared utilities/composables placement rules described in the default instructions.
- ensure all dependancies and dev dependancies have no ^ in package.json
- ensure all package versions are pinned (no ^ or ~)
- use luxon for any date conversions or manipulations
- ensure all commits relate to a jira ID, ask user for one if not provided
- document any architectural decisions or trade-offs made during development
- always use the runtime config for any environment variables from nuxtjs https://nuxt.com/docs/4.x/guide/going-further/runtime-config
- ensure all new code is covered by unit tests where applicable
- ensure all new code is covered by e2e tests where applicable
- ensure all tests pass before suggesting code changes
- ensure all code is formatted with prettier and linted before suggesting code changes
- ensure all new code is accessible and follows WCAG guidelines
- ensure all new code is internationalized and follows i18n guidelines using @nuxtjs/i18n
- ensure all new code is optimized for performance, is secure, maintainable, scailable and follows best practices
- Always use useFetch instead of fetch for HTTP requests in Nuxt applications or useLazyFetch for lazy loading data where appropriate.  Use $fetch on the server.
- always use https://vue-multiselect.js.org  for select inputs.
- always use NuxtLink for <a> links within nuxtjs applications, except where the component will be exported alone out of nuxtjs.
- always follow nuxtjs4 directory structure.  https://nuxt.com/docs/4.x/guide/directory-structure


Memory & voice workflow (for Copilot Chat in VS Code):

- Start responses with "Remembering..." and consult any memory mcps installed.

If both `.github/copilot-instructions.md` and `.github/instructions/default.instructions.md` exist, treat the latter as the canonical source. This file is a short summary for Copilot context injection.
