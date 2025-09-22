import { useRuntimeConfig } from '#app';
import type { ThesaurusTerm } from '../types/thesaurus';

function getApiBase(): string {
  const config = useRuntimeConfig();
  const base = (config.public as Record<string, unknown>).SCBD_API_BASE as string | undefined;
  if (!base) {
    throw new Error('Missing env var NUXT_PUBLIC_SCBD_API_BASE');
  }
  return base;
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
