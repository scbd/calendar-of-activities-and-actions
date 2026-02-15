/**
 * Thesaurus domain identifiers used for filter option lookups.
 *
 * Each key maps to the domain string expected by the CBD thesaurus API.
 */
export const thesaurusDomains = {
  COUNTRIES: 'countries',
  GBF_GOALS: 'GBF-GOALS',
  GBF_TARGETS: 'GBF-TARGETS',
  GBF_SECTIONS: 'GBF-SECTIONS',
  EVENT_STATUS: 'NCHM-EVENT-STATUS',
  ACTIVITY_TYPES: 'CALENDAR-OF-ACTIVITY-TYPES',
  CBD_SUBJECTS: 'CBD-SUBJECTS',
  SCBD_UNITS: 'SCBD-UNITS',
  GOVERNING_BODIES: 'GOVERNING-BODIES',
  SUBSIDIARY_BODIES: 'SUBSIDIARY-BODIES',
} as const;

export type ThesaurusDomainKey = keyof typeof thesaurusDomains;
export type ThesaurusDomainIdentifier = typeof thesaurusDomains[ThesaurusDomainKey];
