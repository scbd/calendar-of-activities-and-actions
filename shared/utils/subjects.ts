import type { ThesaurusTerm } from '../types/thesaurus';
import { thesaurusDomains } from '../constants/thesaurus';
import { getDomainTerms } from '../services/thesaurus';

export interface SubjectOption {
  value: string;
  label: string;
}

let cachedSubjectOptions: SubjectOption[] | null = null;
let inflightPromise: Promise<SubjectOption[]> | null = null;

export function mapThesaurusTermToSubjectOption(term: ThesaurusTerm): SubjectOption {
  const candidates = [
    term.title?.en,
    ...Object.values(term.title ?? {}),
    term.shortTitle?.en,
    ...Object.values(term.shortTitle ?? {}),
    term.name,
  ].filter((candidate): candidate is string => Boolean(candidate && candidate.trim()));

  const label = candidates.length > 0 ? candidates[0] as string : fallbackSubjectLabel(term.identifier);

  return {
    value: term.identifier,
    label,
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

export async function loadSubjectOptions(): Promise<SubjectOption[]> {
  if (cachedSubjectOptions) {
    return cachedSubjectOptions;
  }

  if (!inflightPromise) {
  inflightPromise = getDomainTerms(thesaurusDomains.CBD_SUBJECTS)
      .then(terms => terms.map(mapThesaurusTermToSubjectOption)
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
