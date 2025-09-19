/**
 * Shared record types used by both server and app layers
 */

/**
 * Index record structure representing documents from the CBD index
 * Contains various optional fields for titles, decisions, dates, and metadata
 */
export type IndexRecord = {
  /** Document title (lowercase variant) */
  title?: string;
  /** Document title (title case variant) */
  Title?: string;
  /** COP decision reference (lowercase variant) */
  copDecision?: string;
  /** COP decision reference (uppercase variant) */
  COPDecision?: string;
  /** English text content */
  text_EN_txt?: string;
  /** Generic text content */
  text?: string;
  /** Document start date */
  startDate?: string;
  /** Document end date */
  endDate?: string;
  /** Associated body or organization */
  associatedBody?: string;
  /** Document schema type */
  schema?: string;
  /** Additional flexible properties */
  [key: string]: unknown;
}

/**
 * Markdown record structure representing parsed markdown table rows
 * Simple key-value mapping where all values are strings
 */
export type MdRecord = Record<string, string>

/**
 * Normalized information used for record matching and scoring
 * Contains processed data to help match index records with markdown records
 */
export type NormalizedInfo = {
  /** Normalized title for comparison */
  titleNorm?: string;
  /** Tokenized decision identifiers */
  decisionTokens?: string[];
  /** Tokenized related document references */
  relatedDocTokens?: string[];
  /** Jaccard similarity score for titles */
  titleJaccard?: number;
  /** Whether date ranges overlap */
  dateOverlap?: boolean;
  /** Reason for the match */
  matchReason?: string;
  /** Numeric match score */
  matchScore?: number;
};

/**
 * Merged record combining information from index and markdown sources
 * Represents the final unified record after matching and merging process
 */
export type MergedRecord = {
  /** Combined title from both sources */
  title?: string;
  /** Record type classification */
  type?: string;
  /** Subject or topic */
  subject?: string;
  /** Current status */
  status?: string;
  /** Event or deadline start date */
  startDate?: string;
  /** Event or deadline end date */
  endDate?: string;
  /** Associated body or organization */
  associatedBody?: string;
  /** COP decision reference */
  copDecision?: string;
  /** Related documents */
  relatedDocuments?: string;
  /** Action required by parties */
  actionRequiredByParties?: string;
  /** Source data provenance */
  provenance: { index?: IndexRecord; md?: MdRecord };
  /** Normalized matching information */
  normalized?: NormalizedInfo;
}
