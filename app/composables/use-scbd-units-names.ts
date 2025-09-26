import { useI18n } from '#imports';
import { scbdUnitsDivisions } from 'shared/constants/scbd-units-divisions';

type UnitsDivisionsKey = keyof typeof scbdUnitsDivisions;

const extraAliases: Record<string, UnitsDivisionsKey> = {
  // Divisions
  'SCIENCE SOCIETY AND SUSTAINABLE FUTURES': 'SSSFD',
  'SCIENCE DIVISION': 'SSSFD',
  'IMPLEMENTATION SUPPORT': 'ISD',
  'IMPLEMENTATION SUPPORT DIVISION': 'ISD',
  'ADMINISTRATION': 'AD',
  'ADMIN DIVISION': 'AD',

  // Units
  'LEGAL AND INTERGOVERNMENTAL AFFAIRS': 'LIA',
  'SECRETARIAT SUPPORT': 'SS',
  'COMMUNICATION AND AWARENESS': 'CA',
  'COMMUNICATION': 'CA',
  'CONFERENCE SERVICES': 'CS',
  'BIODIVERSITY SCIENCE POLICY AND GOVERNANCE': 'BSPG',
  'MONITORING REVIEW AND NATIONAL REPORTING': 'MRNR',
  'FINANCE AND BUDGET': 'FB',
  'ABS': 'ABS',
  'BIOSAFETY': 'BS',
  'BIODIVERSITY ECONOMY TRANSFORMATION AND INNOVATION': 'BETI',
  'PEOPLES AND BIODIVERSITY': 'PB',
  'STAKEHOLDER ENGAGEMENT AND COOPERATION': 'SEC',
  'CAPACITY BUILDING AND KNOWLEDGE MANAGEMENT': 'CBKM',
  'HUMAN RESOURCES AND ADMINISTRATION': 'HRA',
  // Known abbreviations as aliases too
  'SSSFD': 'SSSFD',
  'ISD': 'ISD',
  'AD': 'AD',
  'LIA': 'LIA',
  'SS': 'SS',
  'CA': 'CA',
  'CS': 'CS',
  'BSPG': 'BSPG',
  'MRNR': 'MRNR',
  'FB': 'FB',
  'BS': 'BS',
  'BETI': 'BETI',
  'PB': 'PB',
  'SEC': 'SEC',
  'CBKM': 'CBKM',
  'HRA': 'HRA',
};

const normalize = (value: string) =>
  value
    .toUpperCase()
    .replace(/\b(UNIT|DIVISION|OFFICE|TEAM|SECRETARIAT|SECRETARY)\b/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const buildAliasIndex = () => {
  const idx = new Map<string, UnitsDivisionsKey>();
  // Abbreviation aliases (normalized)

  for (const abbr of Object.keys(scbdUnitsDivisions) as UnitsDivisionsKey[]) {

    idx.set(normalize(abbr), abbr);

    const name = scbdUnitsDivisions[abbr];

    idx.set(normalize(name), abbr);
  }
  // Extra aliases
  for (const [alias, abbr] of Object.entries(extraAliases)) {
    idx.set(normalize(alias), abbr);
  }
  return idx;
};

const aliasIndex = buildAliasIndex();

interface UnitsMessages {
  [locale: string]: {
    scbd?: {
      unitsDivisions?: Record<string, string>;
    };
  } | undefined;
}

export const useScbdUnitsNames = (
  keyOrAlias: string,
  targetLocale?: string,
) => {
  const { locale, messages } = useI18n();

  const normalized = normalize(keyOrAlias);
  const abbr = aliasIndex.get(normalized);

  if (!abbr) return keyOrAlias; // Unknown: return input as-is

  const desiredLocale = targetLocale || locale.value;
  const msgs = messages.value as UnitsMessages;
  const byLocale = msgs?.[desiredLocale]?.scbd?.unitsDivisions?.[abbr];

  if (byLocale) return byLocale as string;

  // Fallback to English, then constant name
  const en = msgs?.en?.scbd?.unitsDivisions?.[abbr];

  return (en as string) || scbdUnitsDivisions[abbr] || keyOrAlias;
};

export default useScbdUnitsNames;
