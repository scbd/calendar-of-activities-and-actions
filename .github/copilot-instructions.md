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

Memory & voice workflow (for Copilot Chat in VS Code):

- Start responses with "Remembering..." and consult any memory mcps installed.

If both `.github/copilot-instructions.md` and `.github/instructions/default.instructions.md` exist, treat the latter as the canonical source. This file is a short summary for Copilot context injection.
