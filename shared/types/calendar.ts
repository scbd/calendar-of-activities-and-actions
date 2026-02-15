/**
 * Calendar document types aligned with camelCased SOLR field names.
 *
 * Uses a discriminated union on `schema` so that
 * `if (doc.schema === 'meeting')` narrows the type to `MeetingDoc`.
 */

// ---------------------------------------------------------------------------
// Base document — common fields shared by every schema
// ---------------------------------------------------------------------------

/**
 * Fields present on every calendar document regardless of schema.
 * All property names are camelCase with no SOLR suffixes.
 */
export interface BaseCalendarDoc {
  id: string;
  schema: string;
  identifier: string;

  /** Localized title fields produced by SOLR normalization */
  titleEn?: string;
  titleFr?: string;
  titleEs?: string;
  titleAr?: string;
  titleRu?: string;
  titleZh?: string;

  startDate?: string;
  endDate?: string;
  createdDate?: string;
  updatedDate?: string;

  status?: string;
  statusKey?: string;
  url?: string[];

  /** Related record identifiers (embedded or cross-referenced) */
  notifications?: string[];
  meetings?: string[];
  activities?: string[];
}

// ---------------------------------------------------------------------------
// Schema-specific documents
// ---------------------------------------------------------------------------

/** Meeting document — `schema === 'meeting'` */
export interface MeetingDoc extends BaseCalendarDoc {
  schema: 'meeting';

  eventCity?: string;
  eventCountry?: string;
  meetingCode?: string;
  hostGovernments?: string[];
  themes?: string[];
  thematicAreas?: string[];
}

/** Notification document — `schema === 'notification'` */
export interface NotificationDoc extends BaseCalendarDoc {
  schema: 'notification';

  symbol?: string;
  reference?: string;
  sender?: string;
  recipients?: string[];
  actionDate?: string;
  deadline?: string;
  date?: string;

  /** Localized full-text body */
  fulltextEn?: string;
  fulltextFr?: string;
  fulltextEs?: string;
  fulltextAr?: string;
  fulltextRu?: string;
  fulltextZh?: string;

  files?: string[];
}

/** Calendar-activity document — `schema === 'calendarActivity'` */
export interface CalendarActivityDoc extends BaseCalendarDoc {
  schema: 'calendarActivity';

  /** Activity type thesaurus identifier */
  type?: string;
  subType?: string;

  /** Localized description */
  descriptionEn?: string;
  descriptionFr?: string;
  descriptionEs?: string;
  descriptionAr?: string;
  descriptionRu?: string;
  descriptionZh?: string;

  actionRequiredByParties?: boolean;

  /** Localized status narrative */
  statusNarrativeEn?: string;
  statusNarrativeFr?: string;
  statusNarrativeEs?: string;
  statusNarrativeAr?: string;
  statusNarrativeRu?: string;
  statusNarrativeZh?: string;

  agendaItems?: string[];
  subjects?: string[];
  governingBody?: string[];
  subsidiaryBody?: string[];
  decisions?: string[];
  responsibleUnitsAndOfficers?: string[];
  gbfTargets?: string[];
  gbfSections?: string[];
  outcome?: string;
}

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

/**
 * Any calendar SOLR document.
 * Narrow via `doc.schema` to access schema-specific properties.
 */
export type CalendarDoc = MeetingDoc | NotificationDoc | CalendarActivityDoc;

// ---------------------------------------------------------------------------
// Filter & pagination helpers
// ---------------------------------------------------------------------------

/** Currently selected filter state for the calendar view. */
export interface FilterState {
  types: string[];
  subjects: string[];
  statuses: string[];
  subsidiaryBodies: string[];
  governingBodies: string[];
  copDecisions: string[];
  activityTypes: string[];
  globalTargets: string[];
  gbfSections: string[];
  countries: string[];
  startDate: string;
  endDate: string;
  actionRequired: boolean;
  searchText: string;
  sort: string[];
}

/** Single option in a filter dropdown (thesaurus term + optional facet count). */
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

/** Facet values parsed from a SOLR response — field name → value/count pairs. */
export type ParsedFacets = Record<string, Array<{ value: string; count: number }>>;

/** Paginated result set returned by the SOLR query composable. */
export interface PaginatedResult<T> {
  docs: T[];
  total: number;
  start: number;
  facets: ParsedFacets;
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

/** Grouping descriptor for structuring calendar documents by time or schema. */
export interface GroupedItem {
  key: string;
  label: string;
  items: CalendarDoc[];
}
