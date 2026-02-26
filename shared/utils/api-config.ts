/**
 * Centralized API base URL configuration.
 *
 * In **Nuxt context** (composables, pages, components) the canonical source is
 * `useRuntimeConfig().public.scbdApiBase`.  Shared services that run outside
 * the Nuxt lifecycle (e.g. direct `$fetch` calls in `shared/services/`) cannot
 * call `useRuntimeConfig`, so they resolve the base URL from environment
 * variables with a static default fallback.
 *
 * A single env var controls every endpoint:
 *   NUXT_PUBLIC_SCBD_API_BASE
 *
 * Values per environment:
 *   dev     → https://api.cbddev.xyz   (default when env var is unset)
 *   staging → https://api.cbdstg.xyz
 *   prod    → https://api.cbd.int
 */

const DEFAULT_API_BASE = 'https://api.cbd.int';

// ---------------------------------------------------------------------------
// Core resolver
// ---------------------------------------------------------------------------

/**
 * Resolve the SCBD API base URL from the environment.
 *
 * Resolution order:
 * 1. Vite/Nitro `import.meta.env.NUXT_PUBLIC_SCBD_API_BASE`
 * 2. Node `process.env.NUXT_PUBLIC_SCBD_API_BASE`
 * 3. `DEFAULT_API_BASE` (`https://api.cbddev.xyz`)
 *
 * A trailing slash is always stripped.
 */
export function getApiBase(): string {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const fromMeta =
    typeof import.meta !== 'undefined'
      ? ((import.meta as any).env?.NUXT_PUBLIC_SCBD_API_BASE as string | undefined)
      : undefined;

  const fromProcess =
    typeof process !== 'undefined'
      ? (process.env as Record<string, string | undefined>).NUXT_PUBLIC_SCBD_API_BASE
      : undefined;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const base = fromMeta || fromProcess || DEFAULT_API_BASE;

  return base.replace(/\/$/, '');
}

// ---------------------------------------------------------------------------
// Derived endpoints
// ---------------------------------------------------------------------------

/**
 * SOLR calls always point to **dev** (`api.cbddev.xyz`) because the
 * production SOLR endpoint returns bad-request errors.
 */
const SOLR_API_BASE = 'https://api.cbd.int';

/** SOLR select endpoint — used by `useCalendarData` and `fetchNotificationDetails`. */
export function getSolrSelectUrl(): string {
  return `${SOLR_API_BASE}/api/v2013/index/select`;
}

/** SOLR index base — used by `solr-index.ts` helpers. */
export function getSolrIndexUrl(): string {
  return `${SOLR_API_BASE}/api/v2013/index`;
}

/**
 * Thesaurus root — used by `thesaurus.ts` service.
 *
 * Always points to **production** (`api.cbd.int`) because the dev/staging
 * thesaurus endpoints are unreliable (many domains return 404).
 */
const THESAURUS_API_BASE = 'https://api.cbd.int';

export function getThesaurusBaseUrl(): string {
  return `${THESAURUS_API_BASE}/api/v2013/thesaurus`;
}

/** Articles endpoint — used by notification article lookups. */
export function getArticlesBaseUrl(): string {
  return `${getApiBase()}/api/v2017/articles`;
}
