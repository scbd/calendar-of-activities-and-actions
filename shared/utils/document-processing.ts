import { normalizeSolrDocument, normalizeSolrFieldName } from '../services/solr';
import type { CalendarDoc } from '../types/calendar';
import { extractDecisionEntries, parseDecisionLabel } from './decision-links';
import { normalizeDecisionLabel } from './labels';
import { rawDocMap } from './calendar-document-normalizer';
import { splitValues } from './text';

/**
 * Raw value/label association from multi-value fields.
 */
export interface ValueLabelPair {
  value: string;
  label?: string | null;
}

/**
 * Retrieve the original raw document stored alongside the normalized document.
 * @param doc - Calendar document reference.
 * @returns Raw record when available.
 */
export function getDocRaw(doc: CalendarDoc): Record<string, unknown> | null {
  return rawDocMap.get(doc) ?? null;
}

/**
 * Resolve the first non-empty string value for any of the provided keys.
 * @param doc - Calendar document.
 * @param keys - Candidate field names.
 * @returns Normalized string or undefined.
 */
export function getDocStringValue(doc: CalendarDoc, ...keys: string[]): string | undefined {
  const anyDoc = doc as Record<string, unknown>;

  const toTrimmedString = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed) {
        return trimmed;
      }
    }
    return undefined;
  };

  for (const key of keys) {
    const normalizedKey = normalizeSolrFieldName(key);
    const value = toTrimmedString(anyDoc[normalizedKey]);

    if (value) {
      return value;
    }
  }

  const raw = getDocRaw(doc);

  if (raw) {
    const normalizedRaw = normalizeSolrDocument(raw);

    for (const key of keys) {
      const normalizedKey = normalizeSolrFieldName(key);
      const value = toTrimmedString(normalizedRaw[normalizedKey] ?? raw[key]);

      if (value) {
        return value;
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

  const raw = getDocRaw(doc);

  if (raw) {
    const normalizedRaw = normalizeSolrDocument(raw);

    for (const key of keys) {
      const normalizedKey = normalizeSolrFieldName(key);
      const value = coerce(normalizedRaw[normalizedKey] ?? raw[key]);

      if (value !== undefined) {
        return value;
      }
    }
  }

  return undefined;
}

/**
 * Extract normalized subjects from a document.
 * @param doc - Calendar document.
 * @returns Array of subject identifiers.
 */
export function getDocSubjects(doc: CalendarDoc): string[] {
  if (Array.isArray(doc.subjects)) {
    return doc.subjects.map(String).filter(Boolean);
  }
  const anyDoc = doc as Record<string, unknown>;

  if (Array.isArray(anyDoc.subjectIdentifiers)) {
    return (anyDoc.subjectIdentifiers as unknown[]).map(String).filter(Boolean);
  }
  const subjectField = anyDoc.subjectEn ?? anyDoc.subject ?? anyDoc.subjects;

  if (typeof subjectField === 'string') {
    const split = splitValues(subjectField);

    if (split.length > 0) {
      return split;
    }
  }

  const raw = getDocRaw(doc);

  if (raw) {
    const normalizedRaw = normalizeSolrDocument(raw);
    const rawSubjects = normalizedRaw['subjects']
      ?? normalizedRaw['subjectIdentifiers']
      ?? normalizedRaw['subject']
      ?? normalizedRaw['subjectEn'];

    if (Array.isArray(rawSubjects)) {
      return (rawSubjects as unknown[]).map(String).filter(Boolean);
    }

    if (typeof rawSubjects === 'string') {
      return splitValues(rawSubjects);
    }
  }

  return [];
}

/**
 * Extract subsidiary bodies from a document.
 * @param doc - Calendar document.
 * @returns Array of body names.
 */
export function getDocSubsidiaryBodies(doc: CalendarDoc): string[] {
  if (Array.isArray(doc.subsidiaryBodies)) {
    return doc.subsidiaryBodies.map(String).filter(Boolean);
  }
  const anyDoc = doc as Record<string, unknown>;
  const bodyField = anyDoc.subsidiaryBodies ?? anyDoc.subsidiaryBody;

  if (Array.isArray(bodyField)) {
    return (bodyField as unknown[]).map(String).filter(Boolean);
  }

  if (typeof bodyField === 'string') {
    const split = splitValues(bodyField);

    if (split.length > 0) {
      return split;
    }
  }

  const raw = getDocRaw(doc);

  if (raw) {
    const normalizedRaw = normalizeSolrDocument(raw);
    const rawBodies = normalizedRaw['subsidiaryBodies'] ?? normalizedRaw['subsidiaryBody'];

    if (Array.isArray(rawBodies)) {
      return (rawBodies as unknown[]).map(String).filter(Boolean);
    }

    if (typeof rawBodies === 'string') {
      return splitValues(rawBodies);
    }
  }

  return [];
}

/**
 * Retrieve normalized decision labels from the document.
 * @param doc - Calendar document.
 * @returns Decision labels list.
 */
export function getDocDecisionLabels(doc: CalendarDoc): string[] {
  const entries = extractDecisionEntries(doc as Record<string, unknown>);
  const seen = new Set<string>();
  const results: string[] = [];

  const pushBase = (label: string | null | undefined) => {
    if (!label) return;

    const trimmed = label.trim();

    if (!trimmed) return;

    const parsed = parseDecisionLabel(trimmed);

    if (parsed) {
      const base = parsed.type === 'COP'
        ? `${parsed.type} ${parsed.meetingNumber}/${parsed.decisionNumber}`
        : `${parsed.type}-${parsed.meetingNumber}/${parsed.decisionNumber}`;

      if (!seen.has(base)) {
        seen.add(base);
        results.push(base);
      }
      return;
    }

    // Fallback: strip any paragraph suffix patterns like "P. ..." or "PARA ..."
    const stripped = trimmed.replace(/\s+P(?:\.|\s*(?:ARAS?|ARAGRAPH))\.?\s*.*$/i, '').trim();
    const normalized = normalizeDecisionLabel(stripped) ?? stripped;

    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      results.push(normalized);
    }
  };

  entries.forEach(entry => pushBase(entry.label));

  return results;
}

/**
 * Collect value/label pairs from multi-value fields.
 * @param value - Value field.
 * @param label - Optional label field.
 * @returns Array of value-label mappings.
 */
export function collectValueLabelPairs(value: unknown, label?: unknown): ValueLabelPair[] {
  const values = splitValues(value);
  const labels = splitValues(label);

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

  const raw = getDocRaw(doc);

  if (raw) {
    const normalizedRaw = normalizeSolrDocument(raw);

    push(normalizedRaw['gbfTargets'], normalizedRaw['gbfTargetsEn']);
    push(normalizedRaw['globalTargets'], normalizedRaw['globalTargetsEn']);
    push(normalizedRaw['gbfTarget'], normalizedRaw['gbfTargetEn']);
  }

  return entries;
}

/**
 * Collect country entries from a document, including raw fallbacks.
 * @param doc - Calendar document.
 * @returns Array of value-label pairs.
 */
export function collectCountryEntries(doc: CalendarDoc): ValueLabelPair[] {
  const record = doc as Record<string, unknown>;
  const entries: ValueLabelPair[] = [];

  const push = (value: unknown, label?: unknown) => {
    entries.push(...collectValueLabelPairs(value, label));
  };

  push(record['country'], record['countryEn']);
  push(record['countries'], record['countriesEn']);
  push(record['countryCode'], record['countryName']);
  push(record['countryCodes'], record['countryNames']);
  push(record['hostCountry'], record['hostCountryEn']);
  push(record['hostCountries'], record['hostCountriesEn']);

  const raw = getDocRaw(doc);

  if (raw) {
    const normalizedRaw = normalizeSolrDocument(raw);

    push(normalizedRaw['country'], normalizedRaw['countryEn']);
    push(normalizedRaw['countryCode'], normalizedRaw['countryName']);
    push(normalizedRaw['countries'], normalizedRaw['countriesEn']);
    push(normalizedRaw['countryCodes'], normalizedRaw['countryNames']);
    push(normalizedRaw['countryIso2'], normalizedRaw['countryNames']);
    push(normalizedRaw['hostCountry'], normalizedRaw['hostCountryEn']);
    push(normalizedRaw['hostCountries'], normalizedRaw['hostCountriesEn']);
  }

  return entries;
}

/**
 * Retrieve the list of unique GBF target identifiers.
 * @param doc - Calendar document.
 * @returns Array of unique target identifiers.
 */
export function getDocGlobalTargets(doc: CalendarDoc): string[] {
  const values = new Set<string>();

  collectGlobalTargetEntries(doc).forEach(entry => {
    if (entry.value) {
      values.add(entry.value);
    }
  });
  return Array.from(values);
}

/**
 * Retrieve the list of unique country identifiers.
 * @param doc - Calendar document.
 * @returns Array of unique country codes or names.
 */
export function getDocCountries(doc: CalendarDoc): string[] {
  const values = new Set<string>();

  collectCountryEntries(doc).forEach(entry => {
    if (entry.value) {
      values.add(entry.value);
    }
  });
  return Array.from(values);
}
