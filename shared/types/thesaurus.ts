export interface Dictionary<T> {
  [key: string]: T;
}

// Localized string dictionary, e.g., { en: 'Title', fr: 'Titre' }
export interface ELstring extends Dictionary<string> {}

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

