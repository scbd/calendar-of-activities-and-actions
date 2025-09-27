#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DateTime } from 'luxon';

const API_ENDPOINT = 'https://api.cbd.int/api/v2013/index/select';
const SINCE_DATE = '2024-01-01T00:00:00.000Z';
const ROWS_PER_PAGE = 1000;
const SCHEMA = 'notification';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_PATH = resolve(__dirname, '../../shared/data/notifications.js');

const solrSuffixes = ['_ss', '_dt', '_txt', '_s', '_t', '_b', '_i', '_ls', '_l'];

const isAllUpperCase = (segment) => segment.toUpperCase() === segment && segment.toLowerCase() !== segment;

const stripSolrSuffix = (field) => {
  const lowerField = field.toLowerCase();

  for (const suffix of solrSuffixes) {
    if (lowerField.endsWith(suffix)) {
      return field.slice(0, -suffix.length);
    }
  }
  return field;
};

const camelizeSegments = (segments) => {
  if (segments.length === 0) return '';

  return segments
    .map((segment, index) => {
      if (index === 0) {
        if (!segment) return segment;
        if (isAllUpperCase(segment)) return segment.toLowerCase();
        return segment.charAt(0).toLowerCase() + segment.slice(1);
      }

      const lower = segment.toLowerCase();
      if (!lower) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
};

const normalizeSolrFieldName = (field) => {
  if (field.startsWith('_')) return field;

  const withoutSuffix = stripSolrSuffix(field);
  const segments = withoutSuffix.split('_').filter(Boolean);
  if (segments.length === 0) return withoutSuffix;
  return camelizeSegments(segments);
};

const normalizeSolrDocument = (doc) => {
  const normalized = {};

  for (const [rawKey, value] of Object.entries(doc)) {
    const key = normalizeSolrFieldName(rawKey);

    if (!(key in normalized)) {
      normalized[key] = value;
      continue;
    }

    const existing = normalized[key];

    if (Array.isArray(existing)) {
      const candidates = Array.isArray(value) ? value : [value];
      for (const candidate of candidates) {
        if (candidate === undefined || candidate === null) continue;
        if (!existing.some((entry) => entry === candidate)) {
          existing.push(candidate);
        }
      }
      continue;
    }

    if (Array.isArray(value)) {
      normalized[key] = value.slice();
      continue;
    }

    if (existing === null || existing === undefined) {
      normalized[key] = value;
    }
  }

  return normalized;
};

const escapeSolrDate = (iso) => iso.replaceAll(':', '\\:').replaceAll('-', '\\-');

const arrayify = (value) => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined);
  return [value];
};

const unique = (values) => {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const key = typeof value === 'object' ? JSON.stringify(value) : value;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
};

const parseFiles = (rawFiles) => {
  const files = [];
  for (const entry of arrayify(rawFiles)) {
    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          for (const file of parsed) {
            if (file && typeof file === 'object') {
              files.push(file);
            }
          }
        } else if (parsed && typeof parsed === 'object') {
          files.push(parsed);
        }
        continue;
      } catch (error) {
        files.push({ name: trimmed, url: trimmed });
        continue;
      }
    }

    if (entry && typeof entry === 'object') {
      files.push(entry);
    }
  }

  return files;
};

const normalizeIso = (value) => {
  if (!value) return null;
  const [first] = arrayify(value);
  if (!first) return null;
  const dt = DateTime.fromISO(String(first), { zone: 'utc' });
  return dt.isValid ? dt.toUTC().toISO({ suppressMilliseconds: true }) : String(first);
};

const buildRequestBody = (start) => ({
  df: 'text_EN_txt',
  fq: [
    '_state_s:public',
    `{!tag=schema}schema_s:(${SCHEMA})`,
    '{!tag=version}(*:* NOT version_s:*)',
    '{!tag=schemaType}schemaType_s:scbd',
    '{!tag=excludeSchemas}(*:* NOT schema_s : (submission))',
  ],
  q: `date_dt:[ ${escapeSolrDate(SINCE_DATE)} TO * ]`,
  sort: 'date_dt asc',
  wt: 'json',
  start,
  rows: ROWS_PER_PAGE,
  facet: false,
});

const fetchPage = async (start) => {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildRequestBody(start)),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Solr query failed with status ${response.status}: ${text}`);
  }

  return response.json();
};

const fetchAllNotifications = async () => {
  let start = 0;
  let numFound = Infinity;
  const docs = [];

  while (start < numFound) {
    const page = await fetchPage(start);
    const pageDocs = page?.response?.docs ?? [];
    numFound = page?.response?.numFound ?? pageDocs.length;

    for (const doc of pageDocs) {
      docs.push(normalizeSolrDocument(doc));
    }

    if (pageDocs.length === 0) break;
    start += pageDocs.length;
  }

  return docs;
};

const extractThemes = (doc) => {
  const themesSources = [doc.themes, doc.thematicAreas, doc.thematicArea, doc.allTerms];
  const flattened = themesSources.flatMap((value) => arrayify(value).map(String));
  return unique(flattened).sort((a, b) => a.localeCompare(b));
};

const toAbsoluteUrls = (doc) => {
  return unique(arrayify(doc.url).map((entry) => {
    const value = String(entry);
    return value.startsWith('http') ? value : `https://www.cbd.int${value}`;
  }));
};

const mapNotification = (doc) => {
  const record = {};
  const identifier = doc.identifier ?? doc.id ?? null;

  record.id = doc.id ?? identifier ?? null;
  if (identifier) record.identifier = identifier;
  if (doc.symbol) record.symbol = doc.symbol;
  if (doc.reference) record.reference = doc.reference;
  if (doc.titleEn || doc.title) record.titleEn = doc.titleEn ?? doc.title ?? null;
  if (doc.titleFr) record.titleFr = doc.titleFr;
  if (doc.titleEs) record.titleEs = doc.titleEs;
  if (doc.titleAr) record.titleAr = doc.titleAr;
  if (doc.titleRu) record.titleRu = doc.titleRu;
  if (doc.titleZh) record.titleZh = doc.titleZh;

  const issuedDate = normalizeIso(doc.date ?? doc.createdDate);
  if (issuedDate) record.date = issuedDate;

  const actionDate = normalizeIso(doc.actionDate);
  if (actionDate) record.actionDate = actionDate;

  const deadlineDate = normalizeIso(doc.deadline);
  if (deadlineDate) record.deadline = deadlineDate;

  if (doc.sender || doc.from) record.sender = doc.sender ?? doc.from;

  const recipients = unique(arrayify(doc.recipient).map(String));
  if (recipients.length) record.recipients = recipients;

  const themes = extractThemes(doc);
  if (themes.length) record.themes = themes;

  const urls = toAbsoluteUrls(doc);
  if (urls.length) record.urls = urls;

  const files = parseFiles(doc.files);
  if (files.length) record.files = files;

  const updatedDate = normalizeIso(doc.updatedDate);
  if (updatedDate) record.updatedDate = updatedDate;

  const createdDate = normalizeIso(doc.createdDate);
  if (createdDate) record.createdDate = createdDate;

  record.source = 'index:notification';

  return record;
};

const sortNotifications = (notifications) => {
  return notifications.sort((a, b) => {
    const left = DateTime.fromISO(a.date ?? a.updatedDate ?? SINCE_DATE, { zone: 'utc' });
    const right = DateTime.fromISO(b.date ?? b.updatedDate ?? SINCE_DATE, { zone: 'utc' });

    if (left.toMillis() === right.toMillis()) {
      return (a.symbol ?? '').localeCompare(b.symbol ?? '');
    }

    return left.toMillis() - right.toMillis();
  });
};

const formatOutput = (notifications) => {
  const header = [
    '// Auto-generated snapshot of notification index results for issue dates from 2024 onwards',
    '// Source: https://api.cbd.int/api/v2013/index/select',
    '',
  ].join('\n');

  const body = JSON.stringify(notifications, null, 2);
  return `${header}const notifications = ${body};\n\nexport default notifications;\n`;
};

const ensureOutputDir = async () => {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
};

async function main() {
  const rawDocs = await fetchAllNotifications();
  const notifications = sortNotifications(rawDocs.map(mapNotification));
  await ensureOutputDir();
  await writeFile(OUTPUT_PATH, formatOutput(notifications));
  console.info(`Exported ${notifications.length} notifications to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
