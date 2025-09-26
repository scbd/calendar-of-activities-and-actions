import type { ThesaurusTerm } from '../types/thesaurus';

const DEFAULT_SCBD_API_BASE = 'https://api.cbd.int';

function getApiBase(): string {
  // Use Vite/Nitro exposed public env at build/runtime without relying on #app in shared code
  const base = (import.meta as unknown as { env?: Record<string, unknown> }).env?.NUXT_PUBLIC_SCBD_API_BASE as string | undefined
    || (process.env as Record<string, string | undefined>).NUXT_PUBLIC_SCBD_API_BASE
    || DEFAULT_SCBD_API_BASE;

  return base.replace(/\/$/, '');
}

/**
 * Fetch all terms under a thesaurus domain (by domain identifier).
 * Mirrors the API used in the ORT project.
 */
export async function getDomainTerms(
  termIdentifier: string,
  params: Record<string, unknown> = {},
): Promise<ThesaurusTerm[]> {
  const base = getApiBase();
  const url = `${base}/api/v2013/thesaurus/domains/${encodeURIComponent(termIdentifier)}/terms`;

  return await $fetch<ThesaurusTerm[]>(url, { method: 'GET', query: params });
}

/**
 * Fetch a single thesaurus term by identifier.
 * Mirrors the API used in the ORT project.
 */
export async function getTerm(
  termIdentifier: string,
  params: Record<string, unknown> = {},
): Promise<ThesaurusTerm> {
  const base = getApiBase();
  const url = `${base}/api/v2013/thesaurus/terms/${encodeURIComponent(termIdentifier)}`;

  return await $fetch<ThesaurusTerm>(url, { method: 'GET', query: params });
}
