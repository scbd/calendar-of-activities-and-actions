import type { CalendarDoc } from '../types/calendar';
import { resolveSubjectLabel } from './subjects';
import { getDocStringValue, getDocSubjects } from './document-processing';
import { humanizeIdentifier } from './text';

let subjectLabelMap: Record<string, string> = {};
let translationExists: ((key: string) => boolean) | null = null;
let translate: ((key: string) => unknown) | null = null;
let regionDisplayNames: Intl.DisplayNames | null = null;

/**
 * Configure the localized display names for known subject identifiers.
 * @param map - Subject code to label map.
 */
export function setSubjectLabelMap(map: Record<string, string>): void {
  subjectLabelMap = map;
}

/**
 * Configure translation helpers for label utilities.
 * @param options - Optional translation utilities.
 */
export function configureLabelLocalization(options: {
  te?: (key: string) => boolean;
  t?: (key: string) => unknown;
}): void {
  translationExists = options.te ?? null;
  translate = options.t ?? null;
}

/**
 * Provide an Intl.DisplayNames instance for resolving region names.
 * @param displayNames - DisplayNames instance or null to clear.
 */
export function setRegionDisplayNames(displayNames: Intl.DisplayNames | null): void {
  regionDisplayNames = displayNames;
}

/**
 * Resolve a country label using provided information, regional display names, or heuristics.
 * @param value - Country code or name.
 * @param provided - Optional label from the dataset.
 * @returns Display label.
 */
export function resolveCountryLabel(value: string, provided?: string | null): string {
  if (provided && provided.trim()) {
    return provided.trim();
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (regionDisplayNames) {
    try {
      const display = regionDisplayNames.of(trimmed.toUpperCase());

      if (display && display.toLowerCase() !== trimmed.toLowerCase()) {
        return display;
      }
    } catch {
      // Ignore lookup failures and fall back to a humanized identifier.
    }
  }

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return humanizeIdentifier(trimmed);
}

/**
 * Map subject identifiers on a document to localized labels.
 * @param doc - Calendar document.
 * @returns Array of subject labels.
 */
export function displaySubjectLabels(doc: CalendarDoc): string[] {
  return getDocSubjects(doc)
    .map(subject => resolveSubjectLabel(subject, subjectLabelMap))
    .filter(label => Boolean(label && label.trim())) as string[];
}

/**
 * Resolve the COP label using translations when available.
 * @returns Localized COP label.
 */
export function getCopLabel(): string {
  if (translationExists?.('calendar.labels.cop')) {
    const localized = translate?.('calendar.labels.cop');

    if (typeof localized === 'string' && localized.trim().length > 0) {
      return localized.trim();
    }
  }
  return 'COP';
}

/**
 * Normalize a decision label ensuring the COP prefix is present.
 * @param label - Original decision label.
 * @returns Normalized decision label or null.
 */
export function normalizeDecisionLabel(label: string | null | undefined): string | null {
  if (label === null || label === undefined) {
    return null;
  }

  const trimmed = label.trim();

  if (!trimmed) {
    return null;
  }

  const upper = trimmed.toUpperCase();
  const hasReservedToken = ['COP', 'NP', 'CP'].some(token => upper.includes(token));

  if (hasReservedToken) {
    return trimmed;
  }

  const prefix = getCopLabel();
  const safePrefix = prefix.trim() || 'COP';

  return `${safePrefix} ${trimmed}`;
}

/**
 * Resolve the responsible unit label for a document.
 * @param doc - Calendar document.
 * @returns Responsible unit label or undefined.
 */
export function responsibleUnitLabel(doc: CalendarDoc): string | undefined {
  return getDocStringValue(doc, 'responsibleUnit');
}

/**
 * Resolve the responsible officer label for a document.
 * @param doc - Calendar document.
 * @returns Responsible officer label or undefined.
 */
export function responsibleOfficerLabel(doc: CalendarDoc): string | undefined {
  return getDocStringValue(doc, 'responsibleOfficer');
}
