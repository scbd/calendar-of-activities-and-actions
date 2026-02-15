import { normalizeSolrFieldName } from '../services/solr';
import type { CalendarDoc } from '../types/calendar';
import { extractDecisionEntries } from './decision-links';

/**
 * Raw value/label association from multi-value fields.
 */
export interface ValueLabelPair {
  value: string;
  label?: string | null;
}

/**
 * @deprecated rawDocMap is no longer used — SOLR documents are pre-normalized.
 * Returns null unconditionally.
 */
export function getDocRaw(_doc: CalendarDoc): Record<string, unknown> | null {
  return null;
}

/**
 * Resolve the first non-empty string value for any of the provided keys.
 * Documents are pre-normalized so only the normalized doc is searched.
 * @param doc - Calendar document.
 * @param keys - Candidate field names (SOLR-style or camelCase).
 * @returns Normalized string or undefined.
 */
export function getDocStringValue(doc: CalendarDoc, ...keys: string[]): string | undefined {
  const anyDoc = doc as Record<string, unknown>;

  for (const key of keys) {
    const normalizedKey = normalizeSolrFieldName(key);
    const value = anyDoc[normalizedKey];

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed) {
        return trimmed;
      }
    }
  }

  return undefined;
}

/**
 * Resolve a boolean-like value from the document across multiple keys.
 * @param doc - Calendar document.
 * @param keys - Candidate field names.
 * @returns Boolean value when found, otherwise undefined.
 */
export function getDocBooleanValue(doc: CalendarDoc, ...keys: string[]): boolean | undefined {
  const anyDoc = doc as Record<string, unknown>;

  const coerce = (value: unknown): boolean | undefined => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      if (normalized === 'true' || normalized === 'yes' || normalized === 'y') {
        return true;
      }
      if (normalized === 'false' || normalized === 'no' || normalized === 'n') {
        return false;
      }
    }
    return undefined;
  };

  for (const key of keys) {
    const normalizedKey = normalizeSolrFieldName(key);
    const value = coerce(anyDoc[normalizedKey]);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Array field accessors
// ---------------------------------------------------------------------------

/**
 * Safely extract an array of strings from a document field.
 * Handles fields that may be a string, array, or undefined.
 */
function readStringArray(doc: CalendarDoc, ...keys: string[]): string[] {
  const anyDoc = doc as Record<string, unknown>;

  for (const key of keys) {
    const normalizedKey = normalizeSolrFieldName(key);
    const value = anyDoc[normalizedKey];

    if (Array.isArray(value)) {
      return value.map(String).filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) {
      return value.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    }
  }

  return [];
}

/**
 * Extract normalized subjects from a document.
 * @param doc - Calendar document.
 * @returns Array of subject identifiers.
 */
export function getDocSubjects(doc: CalendarDoc): string[] {
  return readStringArray(doc, 'subjects', 'subjectIdentifiers', 'subjectEn', 'subject');
}

/**
 * Extract subsidiary bodies from a document.
 * @param doc - Calendar document.
 * @returns Array of subsidiary body identifiers.
 */
export function getDocSubsidiaryBodies(doc: CalendarDoc): string[] {
  return readStringArray(doc, 'subsidiaryBody', 'subsidiaryBodies');
}

/**
 * Extract governing bodies from a document.
 * @param doc - Calendar document.
 * @returns Array of governing body identifiers.
 */
export function getDocGoverningBodies(doc: CalendarDoc): string[] {
  return readStringArray(doc, 'governingBody', 'governingBodies');
}

/**
 * Extract GBF sections from a document.
 * @param doc - Calendar document.
 * @returns Array of GBF section identifiers.
 */
export function getDocGbfSections(doc: CalendarDoc): string[] {
  return readStringArray(doc, 'gbfSections');
}

/**
 * Retrieve the list of unique GBF target identifiers.
 * @param doc - Calendar document.
 * @returns Array of unique target identifiers.
 */
export function getDocGlobalTargets(doc: CalendarDoc): string[] {
  return readStringArray(doc, 'gbfTargets', 'globalTargets');
}

/**
 * Retrieve the list of unique country identifiers.
 * @param doc - Calendar document.
 * @returns Array of unique country codes or names.
 */
export function getDocCountries(doc: CalendarDoc): string[] {
  return readStringArray(doc, 'eventCountry', 'countries', 'country', 'hostCountry', 'hostCountries');
}

/**
 * Retrieve decision identifiers from the document for filtering.
 * @param doc - Calendar document.
 * @returns Array of decision identifiers (e.g., ["CAL-DECISION-CP-11-7"]).
 */
export function getDocDecisionIdentifiers(doc: CalendarDoc): string[] {
  return readStringArray(doc, 'decisions');
}

// ---------------------------------------------------------------------------
// Decision label helpers
// ---------------------------------------------------------------------------

/**
 * Derive a human-readable label from a decision identifier.
 * E.g. "CAL-DECISION-CP-15-6" → "CP-15/6", "CAL-DECISION-COP-15-4" → "COP 15/4",
 * "CAL-DECISION-15-6" → "15/6", "CAL-DECISION-CP11-7" → "CP-11/7".
 * @param identifier - Decision thesaurus identifier.
 * @returns Human-readable label.
 */
function humanizeDecisionIdentifier(identifier: string): string {
  // Strip common prefixes
  const stripped = identifier
    .replace(/^CAL-DECISION-/i, '')
    .replace(/^CBD-DECISION-/i, '');

  // COP-15-6, CP-11-7, NP-4-1 (with hyphen between type and number)
  const typeDashMatch = stripped.match(/^(COP|CP|NP)-(\d+)-(\d+)$/i);

  if (typeDashMatch) {
    const type = typeDashMatch[1]!.toUpperCase();
    const meetingNum = typeDashMatch[2]!;
    const decisionNum = typeDashMatch[3]!;

    return type === 'COP'
      ? `${type} ${meetingNum}/${decisionNum}`
      : `${type}-${meetingNum}/${decisionNum}`;
  }

  // COP15-6, CP11-7, NP4-1 (no hyphen between type and number)
  const typeNoHyphenMatch = stripped.match(/^(COP|CP|NP)(\d+)-(\d+)$/i);

  if (typeNoHyphenMatch) {
    const type = typeNoHyphenMatch[1]!.toUpperCase();
    const meetingNum = typeNoHyphenMatch[2]!;
    const decisionNum = typeNoHyphenMatch[3]!;

    return type === 'COP'
      ? `${type} ${meetingNum}/${decisionNum}`
      : `${type}-${meetingNum}/${decisionNum}`;
  }

  // Bare number-number (implied COP): 15-6 → 15/6
  const bareMatch = stripped.match(/^(\d+)-(\d+)$/);

  if (bareMatch) {
    return `${bareMatch[1]}/${bareMatch[2]}`;
  }

  return stripped || identifier;
}

/**
 * Retrieve readable decision labels from the document.
 * @param doc - Calendar document.
 * @param labelMap - Optional map of identifier → display label (e.g., from thesaurus).
 *                   When not provided, labels are derived from identifiers.
 * @returns Decision labels list.
 */
export function getDocDecisionLabels(
  doc: CalendarDoc,
  labelMap?: Map<string, string>,
): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  const push = (label: string) => {
    const trimmed = label.trim();

    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      results.push(trimmed);
    }
  };

  // Primary: decisions array (identifiers)
  const identifiers = getDocDecisionIdentifiers(doc);

  if (identifiers.length > 0) {
    identifiers.forEach(id => {
      const label = labelMap?.get(id) ?? humanizeDecisionIdentifier(id);

      push(label);
    });
    return results;
  }

  // Fallback: legacy copDecision fields
  const record = doc as Record<string, unknown>;
  const entries = extractDecisionEntries(record);

  entries.forEach(entry => {
    // Strip "COP " prefix for filtering consistency (e.g., "COP 15/6" → "15/6")
    const withoutPrefix = entry.label.replace(/^COP\s+/i, '');
    // Strip paragraph suffix patterns (e.g., "16/22 P. 12" → "16/22")
    const base = withoutPrefix.replace(/\s+P(?:\.|\s*(?:ARAS?|ARAGRAPH))\.?\s*.*$/i, '').trim();

    if (base) {
      push(base);
    }
  });

  return results;
}

/**
 * Collect value/label pairs from multi-value fields.
 * @param value - Value field.
 * @param label - Optional label field.
 * @returns Array of value-label mappings.
 */
export function collectValueLabelPairs(value: unknown, label?: unknown): ValueLabelPair[] {
  const toArray = (v: unknown): string[] => {
    if (Array.isArray(v)) {
      return v.map(String).filter(Boolean);
    }
    if (typeof v === 'string' && v.trim()) {
      return v.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const values = toArray(value);
  const labels = toArray(label);

  if (values.length === 0 && labels.length > 0) {
    const fallback = labels[0];

    return fallback ? [{ value: fallback, label: fallback }] : [];
  }

  return values.map((val, index) => ({
    value: val,
    label: labels[index] ?? labels[0] ?? null,
  }));
}

/**
 * Collect GBF target entries from a document.
 * @param doc - Calendar document.
 * @returns Array of value-label pairs for targets.
 */
export function collectGlobalTargetEntries(doc: CalendarDoc): ValueLabelPair[] {
  const record = doc as Record<string, unknown>;
  const entries: ValueLabelPair[] = [];

  const push = (value: unknown, label?: unknown) => {
    entries.push(...collectValueLabelPairs(value, label));
  };

  push(record['gbfTargets'], record['gbfTargetsEn']);
  push(record['globalTargets'], record['globalTargetsEn']);
  push(record['gbfTarget'], record['gbfTargetEn']);

  return entries;
}

/**
 * Collect country entries from a document.
 * @param doc - Calendar document.
 * @returns Array of value-label pairs.
 */
export function collectCountryEntries(doc: CalendarDoc): ValueLabelPair[] {
  const record = doc as Record<string, unknown>;
  const entries: ValueLabelPair[] = [];

  const push = (value: unknown, label?: unknown) => {
    entries.push(...collectValueLabelPairs(value, label));
  };

  push(record['eventCountry'], record['eventCountryEn']);
  push(record['country'], record['countryEn']);
  push(record['countries'], record['countriesEn']);
  push(record['countryCode'], record['countryName']);
  push(record['countryCodes'], record['countryNames']);
  push(record['hostCountry'], record['hostCountryEn']);
  push(record['hostCountries'], record['hostCountriesEn']);

  return entries;
}
