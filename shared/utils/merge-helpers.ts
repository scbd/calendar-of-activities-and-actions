/**
 * Scaffolding for merge normalization and tokenization helpers used for local one-off comparisons,
 * since the remote index does not support vector search.
 */

export function normalizeTitle(input?: string): string {
  // Scaffolding implementation - TODO: implement title normalization
  if (!input) return '';
  return String(input).toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9-\s:()/.]/g, '').trim();
}

export function tokenizeDecisions(input?: string): string[] {
  // Scaffolding implementation - TODO: implement decision tokenization
  if (!input) return [];
  const s = input.toUpperCase();
  const tokens = s.split(/[^A-Z0-9/-]+/).filter(Boolean);
  const parts = new Set<string>();
  for (const t of tokens) {
    parts.add(t);
    t.split(/[/-]/).forEach((p) => p && parts.add(p));
  }
  return [...parts];
}

export function tokenizeRelatedDocs(input?: string): string[] {
  // Scaffolding implementation - TODO: implement related docs tokenization
  if (!input) return [];
  return input
    .split(/[,;]+/)
    .flatMap((seg) => seg.trim().split(/\s+/))
    .map((t) => t.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''))
    .filter((t) => t.length > 1)
    .slice(0, 50);
}

export function jaccardTitleSimilarity(a?: string, b?: string): number {
  // Scaffolding implementation - TODO: implement Jaccard similarity
  const A = new Set(normalizeTitle(a).split(' ').filter(Boolean));
  const B = new Set(normalizeTitle(b).split(' ').filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function parseMaybeDate(s?: string): Date | undefined {
  // Scaffolding implementation - TODO: implement date parsing
  if (!s) return undefined;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t);
  return undefined;
}

export function dateWindowOverlap(aStart?: string, aEnd?: string, bStart?: string, bEnd?: string): boolean {
  // Scaffolding implementation - TODO: implement date overlap logic
  const aS = parseMaybeDate(aStart)?.getTime() ?? Number.NEGATIVE_INFINITY;
  const aE = parseMaybeDate(aEnd)?.getTime() ?? Number.POSITIVE_INFINITY;
  const bS = parseMaybeDate(bStart)?.getTime() ?? Number.NEGATIVE_INFINITY;
  const bE = parseMaybeDate(bEnd)?.getTime() ?? Number.POSITIVE_INFINITY;
  return aS <= bE && aE >= bS;
}

export const SCORE = {
  decisionExact: 100,
  decisionToken: 40,
  relatedDocToken: 15,
  titleHigh: 20,
  titleMedium: 10,
  dateOverlap: 5,
};
