# GitHub Copilot Repo Instructions
# - AI Coding Agent Instructions

## Instruction Precedence (Highest → Lowest)

| Priority | File | Governs |
|----------|------|---------|
| 1 | `personal.md` | Memory, voice, user context, communication style |
| 2 | `default.instructions.md` | Code standards, naming, tools, architecture |
| 3 | `copilot-instructions.md` | Project overview, domain context |

**Conflict Resolution:**
- When instructions conflict, **higher priority wins**
- If same priority level, **more specific rule wins** over general rule
- If still ambiguous, **ask user** before proceeding
- Never silently ignore a conflict—flag it in your response

## Important!
- Follow memory rules from `.github/instructions/personal.md` for every response
- Follow code standards from `.github/instructions/default.instructions.md` as canonical source
- Jira workflow is documented in the Jira Issue Management section below

## Speed and Accuracy
- Prioritize speed and accuracy in code generation.
- Use `runSubagent` tool liberally to improve speed through parallel/async execution.
- MCP LLM tools (claude, gemini, codex) are restricted - only use when explicitly requested for collaboration/consensus.

## Overview
Multi-site headless Drupal 11 + Nuxt.js 4 system serving hundreds of CBD-related websites from a single codebase. Every request is context-driven by site code, locale, and environment.

This repository uses the default guidance at `.github/instructions/default.instructions.md` for Nuxt.js, Vue 3, TypeScript, and Node.js. Copilot should adhere to these rules and the project anchor.

Key points for Copilot:

- Prefer small, reviewable diffs and keep public APIs stable.
- Follow Nuxt conventions (Vue 3 `<script setup lang="ts">`, kebab-case filenames, semicolons).
- Add/maintain minimal tests (Vitest for unit, Playwright for e2e) when changing public behavior.
- Use Yarn scripts and strict TypeScript settings.
- Use shared utilities/composables placement rules described in the default instructions.
- ensure all dependancies and dev dependancies have no ^ in package.json
- ensure all package versions are pinned (no ^ or ~)
- use luxon for any date conversions or manipulations
- document any architectural decisions or trade-offs made during development
- always use the runtime config for any environment variables from nuxtjs https://nuxt.com/docs/4.x/guide/going-further/runtime-config
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
