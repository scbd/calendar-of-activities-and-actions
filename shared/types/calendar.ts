import type { MeetingDoc } from '../services/solr';

/**
 * Normalized calendar document combining meeting, activity, and notification data.
 */
export interface CalendarDoc extends MeetingDoc {
  id: string;
  subjects?: string[];
  subsidiaryBodies?: string[];
  countries?: string[];
  countriesEn?: string[];
  links?: string[];
  status?: string;
  statusKey?: string | null;
  startDate?: string;
  endDate?: string;
  responsibleUnit?: string;
  responsibleOfficer?: string;
  statusNarrative?: string | null;
  actors?: string[];
  gbfTargets?: string[];
  relatedDocuments?: string[];
  country?: string;
  countryEn?: string;
  outcome?: string;
  actionRequired?: boolean;
  schema?: string | null;
  notificationKey?: string;
  notificationKeys?: string[];
  notificationSymbol?: string;
  publishedDate?: string;
  actionDate?: string;
  deadline?: string;
  recipients?: string[];
  activityType?: string;
}

/**
 * Currently selected filter state for the calendar view.
 */
export interface FilterState {
  types: string[];
  subjects: string[];
  statuses: string[];
  subsidiaryBodies: string[];
  copDecisions: string[];
  activityTypes: string[];
  globalTargets: string[];
  countries: string[];
  startDate: string;
  endDate: string;
  actionRequired: boolean;
  sort: string[];
}

/**
 * Grouping descriptor for structuring calendar documents by time or schema.
 */
export interface GroupedItem {
  key: string;
  label: string;
  items: CalendarDoc[];
}
