/**
 * Utility for mapping between subsidiary body/protocol identifiers and their corresponding
 * subject identifiers within the Legal and Institutional Structure subject group.
 *
 * Subsidiary bodies and protocols are stored with identifiers like:
 * - CAL-SUBSIDIARY-BODY-SBI (filter value)
 * - CAL-SUBSIDIARY-BODY-SBSTTA (filter value)
 * - CAL-SUBSIDIARY-BODY-CP (filter value)
 * - CAL-SUBSIDIARY-BODY-NP (filter value)
 * - CAL-SUBSIDIARY-BODY-8J (filter value)
 *
 * These map to subject identifiers (children of CBD-SUBJECT-LEGAL-STRUCT):
 * - CBD-SUBJECT-SBI
 * - CBD-SUBJECT-SBSTTA
 * - CBD-SUBJECT-CPB (Cartagena Protocol on Biosafety)
 * - CBD-SUBJECT-NPB (Nagoya Protocol on ABS)
 * - CBD-SUBJECT-COP (Conference of the Parties)
 * - CBD-SUBJECT-8J (Article 8(j))
 */

/**
 * Mapping from subsidiary body filter identifiers to subject identifiers.
 * Key: CAL-SUBSIDIARY-BODY-* identifier used in filters
 * Value: CBD-SUBJECT-* identifier used in subject hierarchy
 */
const SUBSIDIARY_BODY_TO_SUBJECT_MAP: Record<string, string> = {
  "CAL-SUBSIDIARY-BODY-SBI": "CBD-SUBJECT-SBI",
  "CAL-SUBSIDIARY-BODY-SBSTTA": "CBD-SUBJECT-SBSTTA",
  "CAL-SUBSIDIARY-BODY-CP": "CBD-SUBJECT-CPB",
  "CAL-SUBSIDIARY-BODY-NP": "CBD-SUBJECT-NPB",
  "CAL-SUBSIDIARY-BODY-8J": "CBD-SUBJECT-8J",
  "CAL-SUBSIDIARY-BODY-COP": "CBD-SUBJECT-COP",
  SBI: "CBD-SUBJECT-SBI",
  SBSTTA: "CBD-SUBJECT-SBSTTA",
  CP: "CBD-SUBJECT-CPB",
  NP: "CBD-SUBJECT-NPB",
  "8J": "CBD-SUBJECT-8J",
  COP: "CBD-SUBJECT-COP",
};

/**
 * Reverse mapping from subject identifiers to subsidiary body filter identifiers.
 * Key: CBD-SUBJECT-* identifier used in subject hierarchy
 * Value: CAL-SUBSIDIARY-BODY-* identifier used in filters (or short name)
 */
const SUBJECT_TO_SUBSIDIARY_BODY_MAP: Record<string, string> = {
  "CBD-SUBJECT-SBI": "SBI",
  "CBD-SUBJECT-SBSTTA": "SBSTTA",
  "CBD-SUBJECT-CPB": "CP",
  "CBD-SUBJECT-NPB": "NP",
  "CBD-SUBJECT-8J": "8J",
  "CBD-SUBJECT-COP": "COP",
};

/**
 * Convert a subsidiary body filter identifier to its corresponding subject identifier.
 *
 * @param subsidiaryBodyId - The subsidiary body identifier (e.g., 'CAL-SUBSIDIARY-BODY-SBI', 'SBI')
 * @returns The corresponding subject identifier (e.g., 'CBD-SUBJECT-SBI'), or undefined if no mapping exists
 *
 * @example
 * ```typescript
 * subsidiaryBodyToSubject('CAL-SUBSIDIARY-BODY-SBI'); // 'CBD-SUBJECT-SBI'
 * subsidiaryBodyToSubject('SBI'); // 'CBD-SUBJECT-SBI'
 * subsidiaryBodyToSubject('CP'); // 'CBD-SUBJECT-CPB'
 * subsidiaryBodyToSubject('UNKNOWN'); // undefined
 * ```
 */
export function subsidiaryBodyToSubject(
  subsidiaryBodyId: string,
): string | undefined {
  if (!subsidiaryBodyId) {
    return undefined;
  }

  const normalized = subsidiaryBodyId.trim();

  return SUBSIDIARY_BODY_TO_SUBJECT_MAP[normalized];
}

/**
 * Convert a subject identifier to its corresponding subsidiary body filter identifier.
 *
 * @param subjectId - The subject identifier (e.g., 'CBD-SUBJECT-SBI', 'CBD-SUBJECT-CPB')
 * @returns The corresponding subsidiary body identifier (e.g., 'SBI', 'CP'), or undefined if no mapping exists
 *
 * @example
 * ```typescript
 * subjectToSubsidiaryBody('CBD-SUBJECT-SBI'); // 'SBI'
 * subjectToSubsidiaryBody('CBD-SUBJECT-CPB'); // 'CP'
 * subjectToSubsidiaryBody('CBD-SUBJECT-SBSTTA'); // 'SBSTTA'
 * subjectToSubsidiaryBody('CBD-SUBJECT-ABS'); // undefined (not a subsidiary body)
 * ```
 */
export function subjectToSubsidiaryBody(subjectId: string): string | undefined {
  if (!subjectId) {
    return undefined;
  }

  const normalized = subjectId.trim();

  return SUBJECT_TO_SUBSIDIARY_BODY_MAP[normalized];
}

/**
 * Bidirectional mapping function that attempts to convert an identifier in either direction.
 * First tries subsidiary body → subject, then subject → subsidiary body.
 *
 * @param identifier - Either a subsidiary body or subject identifier
 * @returns The corresponding identifier in the opposite system, or undefined if no mapping exists
 *
 * @example
 * ```typescript
 * mapIdentifier('SBI'); // 'CBD-SUBJECT-SBI'
 * mapIdentifier('CBD-SUBJECT-SBI'); // 'SBI'
 * mapIdentifier('CAL-SUBSIDIARY-BODY-CP'); // 'CBD-SUBJECT-CPB'
 * mapIdentifier('CBD-SUBJECT-CPB'); // 'CP'
 * ```
 */
export default function mapIdentifier(identifier: string): string | undefined {
  if (!identifier) {
    return undefined;
  }

  // Try subsidiary body → subject mapping first
  const subjectId = subsidiaryBodyToSubject(identifier);

  if (subjectId) {
    return subjectId;
  }

  // Try subject → subsidiary body mapping
  return subjectToSubsidiaryBody(identifier);
}

/**
 * Get all subsidiary body identifiers that have mappings.
 *
 * @returns Array of all subsidiary body identifiers (short names)
 */
export function getAllSubsidiaryBodyIdentifiers(): string[] {
  return Object.values(SUBJECT_TO_SUBSIDIARY_BODY_MAP);
}

/**
 * Get all subject identifiers that map to subsidiary bodies/protocols.
 *
 * @returns Array of all subject identifiers
 */
export function getAllSubjectIdentifiers(): string[] {
  return Object.keys(SUBJECT_TO_SUBSIDIARY_BODY_MAP);
}

/**
 * Check if a given identifier is a subsidiary body identifier.
 *
 * @param identifier - The identifier to check
 * @returns True if the identifier is a subsidiary body identifier
 */
export function isSubsidiaryBodyIdentifier(identifier: string): boolean {
  if (!identifier) {
    return false;
  }

  return identifier.trim() in SUBSIDIARY_BODY_TO_SUBJECT_MAP;
}

/**
 * Check if a given identifier is a subject identifier that maps to a subsidiary body.
 *
 * @param identifier - The identifier to check
 * @returns True if the identifier is a subject identifier with a subsidiary body mapping
 */
export function isSubjectIdentifier(identifier: string): boolean {
  if (!identifier) {
    return false;
  }

  return identifier.trim() in SUBJECT_TO_SUBSIDIARY_BODY_MAP;
}
