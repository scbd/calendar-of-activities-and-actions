import type { ThesaurusTerm } from '../types/thesaurus';
import { thesaurusDomains } from '../constants/thesaurus';
import { loadDomainOptions } from '../services/thesaurus';
import type { CalendarDoc } from '../types/calendar';
import { getDocSubjects } from './document-processing';
import { ref } from 'vue';
import { subjectsUsed } from '../data/subjects-used';

export interface SubjectOption {
  value: string;
  label: string;
}

const cachedSubjectOptions: Map<string, SubjectOption[]> = new Map();
const inflightPromises: Map<string, Promise<SubjectOption[]>> = new Map();

export const subjectLabelMap = ref<Record<string, string>>({});

/**
 * Configure the localized display names for known subject identifiers.
 * @param map - Subject code to label map.
 */
export function setSubjectLabelMap(map: Record<string, string>): void {
  subjectLabelMap.value = map;
}

export function mapThesaurusTermToSubjectOption(term: ThesaurusTerm, locale: string = 'en'): SubjectOption {
  const localizedTitle = term.title?.[locale.toLowerCase()] || term.title?.en || term.title?.[Object.keys(term.title)[0]];

  return {
    value: term.identifier,
    label: localizedTitle || fallbackSubjectLabel(term.identifier),
  };
}

export function fallbackSubjectLabel(identifier: string): string {
  const cleaned = identifier
    .replace(/^CBD[-_]SUBJECT[-_]/i, '')
    .replace(/^CBD[-_]/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();

  if (!cleaned) {
    return identifier;
  }

  return cleaned
    .toLowerCase()
    .split(' ')
    .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
    .join(' ');
}

export async function loadSubjectOptions(locale: string = 'en'): Promise<SubjectOption[]> {
  const cached = cachedSubjectOptions.get(locale);

  if (cached) {
    return cached;
  }

  const inflight = inflightPromises.get(locale);

  if (inflight) {
    return inflight;
  }

  const promise = loadDomainOptions(thesaurusDomains.CBD_SUBJECTS, locale);

  inflightPromises.set(locale, promise);

  try {
    const options = await promise;
    
    // Filter options to only include subjects that are actually used in the data
    const filteredOptions = options.filter(option => subjectsUsed.has(option.value));

    cachedSubjectOptions.set(locale, filteredOptions);
    return filteredOptions;
  } finally {
    inflightPromises.delete(locale);
  }
}

export function buildSubjectLabelMap(options: Array<{ value: string; label: string }>): Record<string, string> {
  return options.reduce<Record<string, string>>((accumulator, option) => {
    accumulator[option.value] = option.label;
    return accumulator;
  }, {});
}

export function resolveSubjectLabel(identifier: string, labels: Record<string, string>): string {
  if (!identifier) {
    return '';
  }
  return labels[identifier] || '';
}

export function displaySubjectLabels(doc: CalendarDoc): string[] {
  return getDocSubjects(doc)
    .map(subject => resolveSubjectLabel(subject, subjectLabelMap.value))
    .filter(label => Boolean(label && label.trim())) as string[];
}
