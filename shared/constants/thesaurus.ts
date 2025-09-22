export const THESAURUS = {
  COUNTRIES: 'countries',
  GBF_GLOBAL_GOALS: 'GBF-GOALS',
  GBF_GLOBAL_TARGETS: 'GBF-TARGETS',
  CBD_SUBJECTS: 'CBD-SUBJECTS',
} as const;

export type ThesaurusDomainKey = keyof typeof THESAURUS;
export type ThesaurusDomainIdentifier = typeof THESAURUS[ThesaurusDomainKey];
