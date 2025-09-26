import { isLikelyLink, normalizeUrl } from './url';
import { normalizeSolrDocument } from '../services/solr';

type DecisionType = 'COP' | 'CP' | 'NP';

interface ParsedDecisionLabel {
  type: DecisionType;
  meetingNumber: number;
  decisionNumber: number;
  paragraphs: string[];
}

function normalizeParagraphToken(token: string): string {
  const trimmed = token.trim();

  if (!trimmed) {
    return '';
  }

  const digitLetterMatch = trimmed.match(/^([0-9]+)\s*\(?\s*([a-z])\s*\)?$/i);

  if (digitLetterMatch) {
    const numberPart = digitLetterMatch[1] ?? '';
    const letterPart = digitLetterMatch[2] ?? '';

    if (numberPart) {
      return `${Number.parseInt(numberPart, 10)}(${letterPart.toLowerCase()})`;
    }
  }

  if (/^[0-9]+$/.test(trimmed)) {
    const numeric = Number.parseInt(trimmed, 10);

    if (Number.isFinite(numeric)) {
      return String(numeric);
    }
  }

  const cleaned = trimmed.replace(/[().]/g, '').replace(/\s+/g, ' ').replace(/,+$/, '');

  return cleaned.replace(/[a-z]/g, character => character.toUpperCase());
}

function extractParagraphTokens(label: string): string[] {
  const tokens: string[] = [];
  const paragraphPattern = /\bP(?:ARAGRAPH|ARAS?)?\.?\s*([0-9A-Z,;\-()\s]+)/gi;

  let match: RegExpExecArray | null;

  while ((match = paragraphPattern.exec(label)) !== null) {
    const raw = match[1] ?? '';
    const normalized = raw.replace(/\band\b/gi, ',');
    const withoutKeywords = normalized.replace(/\bpara(?:graphs?|s?)\b/gi, ' ');

    withoutKeywords
      .split(/[;,]/)
      .map(token => normalizeParagraphToken(token))
      .filter(Boolean)
      .forEach(token => {
        if (!tokens.includes(token)) {
          tokens.push(token);
        }
      });
  }

  return tokens;
}

function formatParagraphSegment(paragraph: string): string {
  const trimmed = paragraph.trim();

  if (!trimmed) {
    return '';
  }

  if (/^[0-9]+$/.test(trimmed)) {
    const numeric = Number.parseInt(trimmed, 10);

    if (Number.isFinite(numeric)) {
      return String(numeric);
    }
  }

  return encodeURIComponent(trimmed.replace(/\s+/g, '-').toLowerCase());
}

function formatDecisionLabel(parsed: ParsedDecisionLabel): string {
  const { type, meetingNumber, decisionNumber, paragraphs } = parsed;
  const base = type === 'COP' ? `${type} ${meetingNumber}/${decisionNumber}` : `${type}-${meetingNumber}/${decisionNumber}`;

  if (paragraphs.length === 0) {
    return base;
  }

  const paragraphSuffix = paragraphs.join(',');

  return `${base} P. ${paragraphSuffix}`;
}

const DECISION_URLS: Record<DecisionType, (parts: ParsedDecisionLabel) => string> = {
  COP: ({ meetingNumber, decisionNumber, paragraphs }) => {
    const meetingSegment = String(meetingNumber);
    const decisionSegment = decisionNumber.toString().padStart(2, '0');
    const baseUrl = `https://www.cbd.int/decisions/cop/${meetingSegment}/${decisionSegment}`;

    if (paragraphs.length === 0) {
      return baseUrl;
    }

    const paragraphSegment = formatParagraphSegment(paragraphs[0]!);

    if (!paragraphSegment) {
      return baseUrl;
    }

    return `${baseUrl}/${paragraphSegment}`;
  },
  CP: ({ meetingNumber, decisionNumber }) => {
    const meetingSegment = meetingNumber.toString().padStart(2, '0');
    const decisionSegment = decisionNumber.toString().padStart(2, '0');

    return `https://www.cbd.int/decisions/mop?m=cp-mop-${meetingSegment}-${decisionSegment}`;
  },
  NP: ({ meetingNumber, decisionNumber }) => {
    const meetingSegment = meetingNumber.toString().padStart(2, '0');
    const decisionSegment = decisionNumber.toString().padStart(2, '0');

    return `https://www.cbd.int/decisions/np-mop?m=np-mop-${meetingSegment}-${decisionSegment}`;
  },
};

function parseDecisionType(token: string): DecisionType | null {
  if (token === 'COP' || token === 'CP' || token === 'NP') {
    return token;
  }
  return null;
}

export function parseDecisionLabel(label: string | null | undefined): ParsedDecisionLabel | null {
  if (!label) {
    return null;
  }

  const trimmed = label.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toUpperCase();
  const match = normalized.match(/^(COP|CP|NP)[^0-9]*([0-9]+)[^0-9]*([0-9]+)/);

  if (!match) {
    return null;
  }

  const type = parseDecisionType(match[1]!);

  if (!type) {
    return null;
  }

  const meetingNumber = Number.parseInt(match[2]!, 10);
  const decisionNumber = Number.parseInt(match[3]!, 10);

  if (!Number.isFinite(meetingNumber) || !Number.isFinite(decisionNumber)) {
    return null;
  }

  return {
    type,
    meetingNumber,
    decisionNumber,
    paragraphs: extractParagraphTokens(trimmed),
  } satisfies ParsedDecisionLabel;
}

export function resolveDecisionHref(label: string | null | undefined): string | undefined {
  const parsed = parseDecisionLabel(label);

  if (!parsed) {
    return undefined;
  }

  return DECISION_URLS[parsed.type](parsed);
}

function stripTrailingSlash(pathname: string): string {
  return pathname.replace(/\/+$/, '');
}

function areDecisionPathsEqual(a: URL, b: URL): boolean {
  return a.hostname === b.hostname && stripTrailingSlash(a.pathname) === stripTrailingSlash(b.pathname);
}

export function resolveDecisionHrefWithFallback(
  rawHref: string | null | undefined,
  label: string | null | undefined,
): string | undefined {
  const normalizedRaw = normalizeUrl(rawHref ?? undefined);
  const expected = resolveDecisionHref(label);

  if (!normalizedRaw) {
    return expected;
  }

  if (!expected) {
    return normalizedRaw;
  }

  try {
    const explicitUrl = new URL(normalizedRaw);
    const expectedUrl = new URL(expected);

    if (!areDecisionPathsEqual(explicitUrl, expectedUrl)) {
      return normalizedRaw;
    }

    const explicitParam = explicitUrl.searchParams.get('m');
    const expectedParam = expectedUrl.searchParams.get('m');

    if (expectedParam && explicitParam !== expectedParam) {
      return expected;
    }

    if (expectedParam && !explicitParam) {
      return expected;
    }

    return normalizedRaw;
  } catch {
    return normalizedRaw;
  }
}

export interface DecisionEntry {
  label: string;
  href?: string;
}

function toStringArray(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item : String(item)))
      .map(item => item.trim())
      .filter(Boolean);
  }
  return String(value)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

function sanitizeKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function looksLikeDecisionLabel(label: string): boolean {
  const normalized = label.trim().toUpperCase();

  return /^(COP|CP|NP)[^0-9]*[0-9]+/.test(normalized);
}

function hasParagraphList(label: string): boolean {
  return /P(?:\.|\s*(?:ARAS?|ARAGRAPH))/i.test(label) && label.includes(',');
}

function forEachLabelCandidate(value: unknown, iteratee: (candidate: string) => void): void {
  if (Array.isArray(value)) {
    value.forEach(item => forEachLabelCandidate(item, iteratee));
    return;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    if (looksLikeDecisionLabel(trimmed) && hasParagraphList(trimmed)) {
      iteratee(trimmed);
      return;
    }
  }

  toStringArray(value).forEach(iteratee);
}

const PARAGRAPH_FIELD_KEYS: string[] = [
  'copParagraph',
  'copParagraphs',
  'copParagraphNo',
  'paragraph',
  'paragraphs',
];

function collectParagraphTokensFromValue(value: unknown): string[] {
  const tokens: string[] = [];

  toStringArray(value).forEach(raw => {
    const extracted = extractParagraphTokens(raw);

    if (extracted.length > 0) {
      extracted.forEach(token => tokens.push(token));
      return;
    }

    raw
      .split(/[;,]/)
      .map(part => normalizeParagraphToken(part))
      .filter(Boolean)
      .forEach(token => tokens.push(token));
  });

  return tokens;
}

function collectRecordParagraphTokens(record: Record<string, unknown>): string[] {
  const tokens = new Set<string>();

  PARAGRAPH_FIELD_KEYS.forEach(key => {
    collectParagraphTokensFromValue(record[key]).forEach(token => {
      if (token) {
        tokens.add(token);
      }
    });
  });

  return Array.from(tokens);
}

function ensureDecisionPrefix(label: string, type: DecisionType): string {
  const trimmed = label.trim();

  if (!trimmed) {
    return trimmed;
  }

  const upper = trimmed.toUpperCase();

  if (
    upper.startsWith(`${type} `) ||
    upper.startsWith(`${type}-`) ||
    upper.startsWith(`${type}/`) ||
    upper === type
  ) {
    return trimmed;
  }

  if (type === 'COP') {
    return `${type} ${trimmed}`;
  }

  return `${type}-${trimmed}`;
}

function mergeParagraphLists(primary: string[], secondary: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  const pushIfNew = (token: string) => {
    const normalized = token.trim();

    if (!normalized) {
      return;
    }

    if (!seen.has(normalized)) {
      seen.add(normalized);
      merged.push(normalized);
    }
  };

  primary.forEach(pushIfNew);
  secondary.forEach(pushIfNew);

  return merged;
}

function labelFromUrl(rawUrl: string): string {
  const normalized = normalizeUrl(rawUrl);

  if (!normalized) {
    return '';
  }

  try {
    const parsed = new URL(normalized, 'https://example.org');
    const decisionParam = parsed.searchParams.get('m');

    if (decisionParam) {
      const parsedDecision = parseDecisionLabel(decisionParam);

      if (parsedDecision) {
        return formatDecisionLabel(parsedDecision);
      }

      return decisionParam.toUpperCase();
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    const relativeSegments = segments[0]?.toLowerCase() === 'decisions' ? segments.slice(1) : segments;

    if (relativeSegments.length >= 3) {
      const type = parseDecisionType(relativeSegments[0]?.toUpperCase() ?? '');

      if (type) {
        const meetingNumber = Number.parseInt(relativeSegments[1] ?? '', 10);
        const decisionNumber = Number.parseInt(relativeSegments[2] ?? '', 10);

        if (Number.isFinite(meetingNumber) && Number.isFinite(decisionNumber)) {
          const paragraphs = relativeSegments
            .slice(3)
            .map(segment => normalizeParagraphToken(decodeURIComponent(segment)))
            .filter(Boolean);

          return formatDecisionLabel({
            type,
            meetingNumber,
            decisionNumber,
            paragraphs,
          });
        }
      }
    }

    const lastSegment = relativeSegments[relativeSegments.length - 1];

    if (lastSegment) {
      return decodeURIComponent(lastSegment);
    }

    return parsed.hostname;
  } catch {
    return normalized;
  }
}

export function extractDecisionEntries(record: Record<string, unknown>): DecisionEntry[] {
  const normalizedRecord = normalizeSolrDocument(record);
  const entries: DecisionEntry[] = [];
  const labelMap = new Map<string, DecisionEntry>();
  const uniqueUrls = new Set<string>();

  const labelCandidates: string[] = [];
  const urlCandidates: string[] = [];

  const pushLabelCandidate = (value: unknown, forcedType?: DecisionType) => {
    forEachLabelCandidate(value, candidate => {
      let labelCandidate = candidate;

      if (forcedType) {
        labelCandidate = ensureDecisionPrefix(labelCandidate, forcedType);
      }

      if (isLikelyLink(candidate)) {
        urlCandidates.push(candidate);
      } else {
        labelCandidates.push(labelCandidate);
      }
    });
  };

  const pushUrlCandidate = (value: unknown) => {
    toStringArray(value).forEach(candidate => {
      urlCandidates.push(candidate);
    });
  };

  pushLabelCandidate(normalizedRecord['copDecision'], 'COP');
  pushLabelCandidate(normalizedRecord['copDecisions'], 'COP');
  pushLabelCandidate(normalizedRecord['decision']);

  pushUrlCandidate(normalizedRecord['decisionUrl']);
  pushUrlCandidate(normalizedRecord['decisionUrls']);
  pushUrlCandidate(normalizedRecord['decisionLinks']);
  pushUrlCandidate(normalizedRecord['copDecisionUrl']);

  toStringArray(normalizedRecord['links']).forEach(link => {
    const normalized = normalizeUrl(link);

    if (normalized && /\/decisions?\//i.test(normalized)) {
      urlCandidates.push(normalized);
    }
  });

  labelCandidates.forEach(label => {
    const normalized = label.trim();

    if (!normalized) {
      return;
    }
    const key = sanitizeKey(normalized);

    if (key && labelMap.has(key)) {
      return;
    }
    const entry: DecisionEntry = { label: normalized };

    if (key) {
      labelMap.set(key, entry);
    }
    entries.push(entry);
  });

  urlCandidates.forEach(rawUrl => {
    const normalized = normalizeUrl(rawUrl);

    if (!normalized || uniqueUrls.has(normalized)) {
      return;
    }
    uniqueUrls.add(normalized);

    const derivedLabel = labelFromUrl(normalized);
    const normalizedKey = derivedLabel ? sanitizeKey(derivedLabel) : '';
    const existing = normalizedKey ? labelMap.get(normalizedKey) : undefined;

    if (existing) {
      existing.href = normalized;
      if (!existing.label) {
        existing.label = derivedLabel || normalized;
      }
      return;
    }

    const entry: DecisionEntry = {
      label: derivedLabel || normalized,
      href: normalized,
    };

    if (normalizedKey && !labelMap.has(normalizedKey)) {
      labelMap.set(normalizedKey, entry);
    }

    entries.push(entry);
  });

  const recordParagraphTokens = collectRecordParagraphTokens(normalizedRecord);
  const expandedEntries: DecisionEntry[] = [];
  const seen = new Set<string>();

  entries.forEach(entry => {
    const parsed = parseDecisionLabel(entry.label);

    if (!parsed) {
      const key = `${entry.label}::${entry.href ?? ''}`;

      if (!seen.has(key)) {
        seen.add(key);
        expandedEntries.push({ ...entry });
      }

      return;
    }

    const mergedParagraphs = mergeParagraphLists(parsed.paragraphs, recordParagraphTokens);

    if (parsed.type === 'COP' && mergedParagraphs.length > 0) {
      mergedParagraphs.forEach(paragraph => {
        const singleParagraphParsed: ParsedDecisionLabel = {
          ...parsed,
          paragraphs: [paragraph],
        };
        const formattedLabel = formatDecisionLabel(singleParagraphParsed);
        const resolvedHref = resolveDecisionHrefWithFallback(entry.href ?? null, formattedLabel);
        const key = `${formattedLabel}::${resolvedHref ?? ''}`;

        if (!seen.has(key)) {
          seen.add(key);
          expandedEntries.push({ label: formattedLabel, href: resolvedHref });
        }
      });

      return;
    }

    const parsedWithParagraphs: ParsedDecisionLabel = {
      ...parsed,
      paragraphs: mergedParagraphs,
    };
    const formattedLabel = formatDecisionLabel(parsedWithParagraphs);
    const resolvedHref = resolveDecisionHrefWithFallback(entry.href ?? null, formattedLabel);
    const key = `${formattedLabel}::${resolvedHref ?? ''}`;

    if (!seen.has(key)) {
      seen.add(key);
      expandedEntries.push({ label: formattedLabel, href: resolvedHref });
    }
  });

  return expandedEntries;
}
