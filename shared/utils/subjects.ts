import type { ThesaurusTerm } from '../types/thesaurus';
import { thesaurusDomains } from '../constants/thesaurus';
import { getDomainTerms } from '../services/thesaurus';

export interface SubjectOption {
  value: string;
  label: string;
}

let cachedSubjectOptions: SubjectOption[] | null = null;
let inflightPromise: Promise<SubjectOption[]> | null = null;

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
  if (cachedSubjectOptions) {
    return cachedSubjectOptions;
  }

  if (!inflightPromise) {
  inflightPromise = getDomainTerms(thesaurusDomains.CBD_SUBJECTS)
      .then(terms => terms.map(term => mapThesaurusTermToSubjectOption(term, locale))
        .sort((a, b) => a.label.localeCompare(b.label)))
      .catch(() => []);
  }

  const options = await inflightPromise;

  inflightPromise = null;
  cachedSubjectOptions = options;
  return options;
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
  return labels[identifier] ?? fallbackSubjectLabel(identifier);
}
