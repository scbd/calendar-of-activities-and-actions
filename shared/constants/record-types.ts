/**
 * Static record-type options (not from thesaurus).
 *
 * Each entry corresponds to a `schema` value stored in SOLR.
 * `labelKey` references an i18n translation key.
 */
export const RECORD_TYPES = [
  { value: 'meeting', labelKey: 'calendar.types.meeting' },
  { value: 'notification', labelKey: 'calendar.types.notification' },
  { value: 'calendarActivity', labelKey: 'calendar.types.calendarActivity' },
] as const;

export type RecordType = typeof RECORD_TYPES[number]['value'];
