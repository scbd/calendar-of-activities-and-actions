// Extracted from: https://www.cbd.int/images/scbd/scbd-structure-2021-12-en.pdf
// Keys are abbreviations; values are the display names.
// Per request, the word "Unit" is omitted from unit names.

export const SCBD_UNITS_DIVISIONS = {
  // Divisions
  SSSFD: 'Science, Society and Sustainable Futures Division',
  ISD: 'Implementation Support Division',
  AD: 'Administration Division',

  // Units ("Unit" removed from values)
  LIA: 'Legal and Intergovernmental Affairs',
  SS: 'Secretariat Support',
  CA: 'Communication and Awareness',
  CS: 'Conference Services',
  BSPG: 'Biodiversity Science, Policy and Governance',
  MRNR: 'Monitoring, Review and National Reporting',
  FB: 'Finance and Budget',
  ABS: 'ABS',
  BS: 'Biosafety',
  BETI: 'Biodiversity Economy Transformation and Innovation',
  PB: 'Peoples and Biodiversity',
  SEC: 'Stakeholder Engagement and Cooperation',
  CBKM: 'Capacity Building and Knowledge Management',
  HRA: 'Human Resources and Administration',
} as const;

export type ScbdUnitDivisionKey = keyof typeof SCBD_UNITS_DIVISIONS;
export type ScbdUnitDivisionName = typeof SCBD_UNITS_DIVISIONS[ScbdUnitDivisionKey];

