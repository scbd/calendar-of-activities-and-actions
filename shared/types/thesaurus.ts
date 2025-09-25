// Localized string dictionary, e.g., { en: 'Title', fr: 'Titre' }
export type ELstring = Record<string, string>;

export interface ThesaurusTerm {
  termId: number;
  identifier: string;
  name: string;
  title: ELstring;
  shortTitle: ELstring;
  description: string;
  longDescription: ELstring;
  source: string;
  broaderTerms: string[];
  narrowerTerms: string[];
  relatedTerms: string[];
  nonPreferedTerms: string[];
}
