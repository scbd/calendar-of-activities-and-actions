import type { ThesaurusTerm } from '../types/thesaurus';
import { thesaurusDomains } from '../constants/thesaurus';
import { loadDomainOptions, getDomainTerms } from '../services/thesaurus';
import type { CalendarDoc } from '../types/calendar';
import { getDocSubjects } from './document-processing';
import { ref } from 'vue';
import { subjectsUsed } from '../data/subjects-used';

export interface SubjectOption {
  value: string;
  label: string;
  children?: SubjectOption[];
}

const cachedSubjectOptions: Map<string, SubjectOption[]> = new Map();
const cachedGroupedSubjectOptions: Map<string, SubjectOption[]> = new Map();
const inflightPromises: Map<string, Promise<SubjectOption[]>> = new Map();
const inflightGroupedPromises: Map<string, Promise<SubjectOption[]>> = new Map();

export const subjectLabelMap = ref<Record<string, string>>({});

/**
 * Configure the localized display names for known subject identifiers.
 * @param map - Subject code to label map.
 */
export function setSubjectLabelMap(map: Record<string, string>): void {
  subjectLabelMap.value = map;
}

export function mapThesaurusTermToSubjectOption(term: ThesaurusTerm, locale: string = 'en'): SubjectOption {
  const titleObj = term.title || {};
  const localeKey = locale.toLowerCase();
  const firstKey = Object.keys(titleObj)[0];
  const localizedTitle = titleObj[localeKey] || titleObj['en'] || (firstKey ? titleObj[firstKey] : undefined);

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

/**
 * Load subject options organized into hierarchical groups.
 * Top-level subjects (without narrower terms) become group headers,
 * and their narrower terms become children.
 */
export async function loadGroupedSubjectOptions(locale: string = 'en'): Promise<SubjectOption[]> {
  const cached = cachedGroupedSubjectOptions.get(locale);

  if (cached) {
    return cached;
  }

  const inflight = inflightGroupedPromises.get(locale);

  if (inflight) {
    return inflight;
  }

  const promise = (async () => {
    try {
      const terms = await getDomainTerms(thesaurusDomains.CBD_SUBJECTS);
      
      console.log('[loadGroupedSubjectOptions] Total terms loaded:', terms.length);
      
      // Filter to only used subjects
      const usedTerms = terms.filter(term => subjectsUsed.has(term.identifier));
      
      console.log('[loadGroupedSubjectOptions] Used terms after filtering:', usedTerms.length);
      console.log('[loadGroupedSubjectOptions] subjectsUsed size:', subjectsUsed.size);
      
      // Create a map of all terms for easy lookup
      const termMap = new Map(usedTerms.map(term => [term.identifier, term]));
      
      // Find top-level subjects (those without broader terms or whose broader terms are not in the used set)
      const topLevelTerms = usedTerms.filter(term => {
        if (!term.broaderTerms || term.broaderTerms.length === 0) {
          return true;
        }
        // Check if any broader term exists in our used set
        return !term.broaderTerms.some(broaderId => termMap.has(broaderId));
      });
      
      console.log('[loadGroupedSubjectOptions] Top-level terms:', topLevelTerms.length);
      
      // Build hierarchical structure
      const buildHierarchy = (term: ThesaurusTerm): SubjectOption => {
        const titleObj = term.title || {};
        const localeKey = locale.toLowerCase();
        const firstKey = Object.keys(titleObj)[0];
        const localizedTitle = titleObj[localeKey] || titleObj['en'] || (firstKey ? titleObj[firstKey] : undefined);
        
        const option: SubjectOption = {
          value: term.identifier,
          label: localizedTitle || fallbackSubjectLabel(term.identifier),
        };
        
        // Add children if this term has narrower terms
        if (term.narrowerTerms && term.narrowerTerms.length > 0) {
          const children = term.narrowerTerms
            .map(narrowerId => termMap.get(narrowerId))
            .filter((childTerm): childTerm is ThesaurusTerm => Boolean(childTerm))
            .map(childTerm => buildHierarchy(childTerm))
            .sort((a, b) => a.label.localeCompare(b.label));
          
          if (children.length > 0) {
            option.children = children;
          }
        }
        
        return option;
      };
      
      const groupedOptions = topLevelTerms
        .map(term => buildHierarchy(term))
        .sort((a, b) => a.label.localeCompare(b.label));
      
      console.log('[loadGroupedSubjectOptions] Final grouped options:', groupedOptions.length);
      console.log('[loadGroupedSubjectOptions] Sample options:', groupedOptions.slice(0, 3));
      
      cachedGroupedSubjectOptions.set(locale, groupedOptions);
      return groupedOptions;
    } catch (error) {
      console.error('[loadGroupedSubjectOptions] Error loading grouped subjects:', error);
      return [];
    }
  })();

  inflightGroupedPromises.set(locale, promise);

  try {
    return await promise;
  } finally {
    inflightGroupedPromises.delete(locale);
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
