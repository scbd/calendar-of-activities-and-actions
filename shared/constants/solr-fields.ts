/**
 * SOLR facet field map.
 *
 * Each key matches a `FilterState` property; the value is the SOLR field name
 * wrapped with a `{!ex=tag}` exclusion prefix so that selecting a value in
 * one facet does not collapse counts in that same facet.
 */
export const SOLR_FACET_FIELDS = {
  schema: '{!ex=schema}schema_s',
  subjects: '{!ex=subjects}subjects_ss',
  governingBody: '{!ex=governingBody}governingBody_ss',
  subsidiaryBody: '{!ex=subsidiaryBody}subsidiaryBody_ss',
  status: '{!ex=status}status_s',
  activityStatus: '{!ex=status}activityStatus_s',
  activityType: '{!ex=activityType}type_s',
  gbfTargets: '{!ex=gbfTargets}gbfTargets_ss',
  gbfSections: '{!ex=gbfSections}gbfSections_ss',
  countries: '{!ex=countries}eventCountry_s',
  decisions: '{!ex=decisions}decisions_ss',
  themes: '{!ex=themes}themes_ss',
} as const;

export type SolrFacetFieldKey = keyof typeof SOLR_FACET_FIELDS;
