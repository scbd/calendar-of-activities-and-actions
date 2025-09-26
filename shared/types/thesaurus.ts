// Localized string dictionary, e.g., { en: 'Title', fr: 'Titre' }
export type ElString = Record<string, string>;

export interface ThesaurusTerm {
  termId: number;
  identifier: string;
  name: string;
  title: ElString;
  shortTitle: ElString;
  description: string;
  longDescription: ElString;
  source: string;
  broaderTerms: string[];
  narrowerTerms: string[];
  relatedTerms: string[];
  nonPreferedTerms: string[];
}
