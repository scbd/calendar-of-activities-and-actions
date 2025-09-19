// Shared record types used by both server and app layers

export type IndexRecord = {
  title?: string;
  Title?: string;
  copDecision?: string;
  COPDecision?: string;
  text_EN_txt?: string;
  text?: string;
  startDate?: string;
  endDate?: string;
  associatedBody?: string;
  schema?: string;
  [key: string]: unknown;
}

export type MdRecord = Record<string, string>

export type NormalizedInfo = {
  titleNorm?: string;
  decisionTokens?: string[];
  relatedDocTokens?: string[];
  titleJaccard?: number;
  dateOverlap?: boolean;
  matchReason?: string;
  matchScore?: number;
};

export type MergedRecord = {
  title?: string;
  type?: string;
  subject?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  associatedBody?: string;
  copDecision?: string;
  relatedDocuments?: string;
  actionRequiredByParties?: string;
  provenance: { index?: IndexRecord; md?: MdRecord };
  normalized?: NormalizedInfo;
}
