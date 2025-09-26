export function normalizeUrl(value?: string | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function isAbsoluteUrl(value: string): boolean {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return false;
  }
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(normalized);
}

export function isExternalUrl(value: string): boolean {
  const normalized = normalizeUrl(value);

  if (!normalized || !isAbsoluteUrl(normalized)) {
    return false;
  }

  try {
    const parsed = new URL(normalized);

    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isInternalUrl(value: string): boolean {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return false;
  }

  if (normalized.startsWith('//')) {
    return false;
  }

  return normalized.startsWith('/');
}

export function isLikelyLink(value: string): boolean {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return false;
  }
  return isAbsoluteUrl(normalized) || isInternalUrl(normalized);
}
