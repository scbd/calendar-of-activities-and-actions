import { isLikelyLink, normalizeUrl } from './url';

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

function labelFromUrl(rawUrl: string): string {
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) {
    return '';
  }

  try {
    const parsed = new URL(normalized, 'https://example.org');
    const decisionParam = parsed.searchParams.get('m');
    if (decisionParam) {
      return decisionParam.toUpperCase();
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length > 1 && segments[0]?.toLowerCase() === 'decisions') {
      return segments
        .slice(1)
        .map(segment => decodeURIComponent(segment).toUpperCase())
        .join(' / ');
    }

    const lastSegment = segments[segments.length - 1];
    if (lastSegment) {
      return decodeURIComponent(lastSegment);
    }

    return parsed.hostname;
  } catch {
    return normalized;
  }
}

export function extractDecisionEntries(record: Record<string, unknown>): DecisionEntry[] {
  const entries: DecisionEntry[] = [];
  const labelMap = new Map<string, DecisionEntry>();
  const uniqueUrls = new Set<string>();

  const labelCandidates: string[] = [];
  const urlCandidates: string[] = [];

  const pushLabelCandidate = (value: unknown) => {
    toStringArray(value).forEach(candidate => {
      if (isLikelyLink(candidate)) {
        urlCandidates.push(candidate);
      } else {
        labelCandidates.push(candidate);
      }
    });
  };

  const pushUrlCandidate = (value: unknown) => {
    toStringArray(value).forEach(candidate => {
      urlCandidates.push(candidate);
    });
  };

  pushLabelCandidate(record['copDecision_s']);
  pushLabelCandidate(record['copDecision']);
  pushLabelCandidate(record['copDecision_ss']);
  pushLabelCandidate(record['copDecisions_ss']);
  pushLabelCandidate(record['decision_s']);
  pushLabelCandidate(record['decision_ss']);

  pushUrlCandidate(record['decisionUrl']);
  pushUrlCandidate(record['decisionUrl_s']);
  pushUrlCandidate(record['decisionUrl_ss']);
  pushUrlCandidate(record['decisionUrls_ss']);
  pushUrlCandidate(record['decisionLinks_ss']);
  pushUrlCandidate(record['decision_links_ss']);
  pushUrlCandidate(record['copDecisionUrl']);
  pushUrlCandidate(record['copDecisionUrl_s']);
  pushUrlCandidate(record['copDecisionUrl_ss']);

  toStringArray(record['links_ss']).forEach(link => {
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

  return entries;
}
