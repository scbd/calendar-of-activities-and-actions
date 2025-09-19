import { promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { consola, type ConsolaInstance } from 'consola';
import type { IndexerOptions, FsAdapter, IndexRecord, MdRecord } from '../../../server/types/tasks';
import type { MergedRecord, NormalizedInfo } from '../../../shared/types/records';
import { dateWindowOverlap, jaccardTitleSimilarity, normalizeTitle, SCORE, tokenizeDecisions, tokenizeRelatedDocs } from '../../../shared/utils/merge-helpers';

const defaultFs: FsAdapter = {
  async readFile(path, enc = 'utf8') { return fsp.readFile(path, enc); },
  async writeFile(path, data) { return fsp.writeFile(path, data, 'utf8'); },
  async mkdir(path, opts) { return fsp.mkdir(path, { recursive: true, ...(opts || {}) }); },
  async exists(path) { try { await fsp.access(path); return true; } catch { return false; } },
};

export async function runIndexingTask(options: IndexerOptions) {
  const logger = options.logger || consola.withTag('indexer');
  const fs = options.fs || defaultFs;
  const cwd = process.cwd();
  const outDir = join(cwd, 'shared', 'data');
  const publicDir = join(cwd, 'public', 'data');

  const since = options.since;
  const mdPaths = options.dataPaths;

  logger.info(`Starting indexing task. since=${since || 'N/A'} files=${mdPaths.length}`);

  let indexResponse: { response: { docs: IndexRecord[] } };
  try {
    indexResponse = await fetchIndexRaw({ since, logger });
  } catch {
    logger.warn('Index fetch failed, continuing with empty set:');
    indexResponse = { response: { docs: [] } };
  }
  const indexDocs: IndexRecord[] = indexResponse.response.docs || [];

  const mdRows: MdRecord[] = [];
  for (const p of mdPaths) {
    const abs = join(cwd, p);
    const exists = await fs.exists(abs);
    if (!exists) {
      logger.warn(`MD file not found: ${abs}`);
      continue;
    }
    const raw = await fs.readFile(abs, 'utf8');
    const rows = parseMdTable(raw);
    mdRows.push(...rows);
  }

  const { merged, unmergedIndex, unmergedActions } = mergeRecords(indexDocs, mdRows);

  if (!options.dryRun) {
    await fs.mkdir(outDir, { recursive: true });
    await fs.mkdir(publicDir, { recursive: true });
    const rawIndexPath = join(outDir, 'raw-index.json');
    const mergedPath = join(outDir, 'merged.json');
    const unmergedIndexPath = join(outDir, 'unmerged_index.json');
    const unmergedActionsPath = join(outDir, 'unmerged_actions.json');

    await fs.writeFile(rawIndexPath, JSON.stringify(indexResponse, null, 2));
    await fs.writeFile(mergedPath, JSON.stringify(merged, null, 2));
    await fs.writeFile(unmergedIndexPath, JSON.stringify(unmergedIndex, null, 2));
    await fs.writeFile(unmergedActionsPath, JSON.stringify(unmergedActions, null, 2));
    // mirror to public for UI consumption without API
    await fs.writeFile(join(publicDir, 'raw-index.json'), JSON.stringify(indexResponse, null, 2));
    await fs.writeFile(join(publicDir, 'merged.json'), JSON.stringify(merged, null, 2));
    await fs.writeFile(join(publicDir, 'unmerged_index.json'), JSON.stringify(unmergedIndex, null, 2));
    await fs.writeFile(join(publicDir, 'unmerged_actions.json'), JSON.stringify(unmergedActions, null, 2));

    logger.success('Wrote outputs to shared/data');
    return {
      counts: {
        index: indexDocs.length,
        md: mdRows.length,
        merged: merged.length,
        unmergedIndex: unmergedIndex.length,
        unmergedActions: unmergedActions.length,
      },
      outputs: {
        rawIndex: rawIndexPath,
        merged: mergedPath,
        unmergedIndex: unmergedIndexPath,
        unmergedActions: unmergedActionsPath,
      },
      warnings: [],
    };
  }

  logger.info('Dry run complete');
  return {
    counts: {
      index: indexDocs.length,
      md: mdRows.length,
      merged: merged.length,
      unmergedIndex: unmergedIndex.length,
      unmergedActions: unmergedActions.length,
    },
    outputs: {},
    warnings: [],
  };
}

export async function fetchIndexRaw(opts: { since?: string; logger?: ConsolaInstance }): Promise<{ response: { docs: IndexRecord[] } }> {
  const logger = opts.logger || consola;
  const since = opts.since || '2024-12-01T00:00:00.000Z';
  const url = 'https://api.cbd.int/api/v2013/index/select';

  const body = {
    df: 'text_EN_txt',
    q: `((updatedDate_dt:[ ${since} TO * ]))`,
    sort: 'updatedDate_dt desc',
    wt: 'json',
    start: 0,
    rows: 1000,
    facet: true,
    'facet.field': [
      '{!ex=schemaType}schemaType_s',
      '{!ex=schema,schemaType,schemaSub}schema_s',
      '{!ex=government}countryRegions_ss',
      '{!ex=keywords}all_terms_ss',
      '{!ex=region}countryRegions_REL_ss',
    ],
    'facet.mincount': 1,
    'facet.limit': 512,
    'facet.pivot': 'schema_s, all_terms_ss',
  } as Record<string, unknown>;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // Narrow expected shape
    const docs = (json?.response?.docs ?? []) as IndexRecord[];
    return { response: { docs } };
  } catch (e) {
    logger.warn('Network fetch failed, returning empty response');
    return { response: { docs: [] } };
  }
}

export function parseMdTable(md: string): MdRecord[] {
  const lines = md.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const tableLines = lines.filter((l) => l.includes('|'));
  if (tableLines.length < 2) return [];
  const headerLine = tableLines[0];
  const headers = headerLine
    .split('|')
    .map((h) => h.trim())
    .filter((h) => h.length > 0);

  const records: MdRecord[] = [];
  // Skip separator line (2nd line) and process remaining
  for (let i = 2; i < tableLines.length; i++) {
    const row = tableLines[i];
    const cells = row
      .split('|')
      .map((c) => c.trim())
      .filter((_, idx, arr) => !(idx === 0 && arr.length && row.trim().startsWith('|') === false));
    // Normalize cells count to headers length
    const normalized = [...cells];
    if (normalized.length > headers.length) normalized.length = headers.length;
    while (normalized.length < headers.length) normalized.push('');
    const rec: MdRecord = {};
    headers.forEach((h, idx) => {
      rec[normalizeKey(h)] = normalized[idx] || '';
    });
    records.push(rec);
  }
  return records;
}

export function mergeRecords(indexDocs: IndexRecord[], mdRows: MdRecord[]) {
  const merged: MergedRecord[] = [];
  const matchedIndex = new Set<number>();
  const mdUnmatched: MdRecord[] = [];

  for (const md of mdRows) {
    const mdTitleRaw = (md.title || md.Title || '') as string;
    const mdTitle = normalizeTitle(mdTitleRaw);
    const mdDecisionRaw = (md.copdecision || md.COPDecision || '') as string;
    const mdDecisionTokens = tokenizeDecisions(mdDecisionRaw);
    const mdRelatedRaw = (md.related_documents || md.Related_documents || '') as string;
    const mdRelatedTokens = tokenizeRelatedDocs(mdRelatedRaw);
    const mdStart = (md.StartDate || md.Startdate || md.startdate) as string | undefined;
    const mdEnd = (md.EndDate || md.Enddate || md.enddate) as string | undefined;

  type Candidate = { i: number; score: number; reason: string; norm: NormalizedInfo };
    const candidates: Candidate[] = [];

    for (let i = 0; i < indexDocs.length; i++) {
      if (matchedIndex.has(i)) continue;
      const doc = indexDocs[i];
      const docTitleRaw = (doc.title || doc.Title || '') as string;
      const docTitle = normalizeTitle(docTitleRaw);
      const docDecisionRaw = (doc.copDecision || doc.COPDecision || '') as string;
      const docDecisionTokens = tokenizeDecisions(docDecisionRaw);
  const docText = String(doc.text_EN_txt || doc.text || '');

      let score = 0;
      let reason = '';

      // Decision exact token match priority
      const decisionIntersect = mdDecisionTokens.filter((t) => docDecisionTokens.includes(t));
      if (mdDecisionTokens.length && decisionIntersect.length) {
        score += SCORE.decisionToken;
        reason = 'decision-token';
        if (docDecisionRaw && mdDecisionRaw && docDecisionRaw === mdDecisionRaw) {
          score += SCORE.decisionExact;
          reason = 'decision-exact';
        }
      }

      // Related doc tokens present in index text
      let hasRelated = false;
      for (const t of mdRelatedTokens) {
        if (t && docText.toUpperCase().includes(t.toUpperCase())) {
          score += SCORE.relatedDocToken;
          hasRelated = true;
        }
      }
      if (hasRelated && !reason) reason = 'related-doc-token';

      // Title similarity
      const titleSim = jaccardTitleSimilarity(docTitle, mdTitle);
      if (titleSim >= 0.6) { score += SCORE.titleHigh; if (!reason) reason = 'title-high'; }
      else if (titleSim >= 0.35) { score += SCORE.titleMedium; if (!reason) reason = 'title-medium'; }

      // Date overlap (weak prior)
      const over = dateWindowOverlap(doc.startDate as string, doc.endDate as string, mdStart, mdEnd);
      if (over) { score += SCORE.dateOverlap; if (!reason) reason = 'date-overlap'; }

      if (score > 0) {
        candidates.push({
          i,
          score,
          reason,
          norm: {
            titleNorm: mdTitle,
            decisionTokens: mdDecisionTokens,
            relatedDocTokens: mdRelatedTokens,
            titleJaccard: titleSim,
            dateOverlap: over,
            matchReason: reason,
            matchScore: score,
          },
        });
      }
    }

    // Rank candidates by score desc; handle ambiguity if top-2 are close
    candidates.sort((a, b) => b.score - a.score);
    const top = candidates[0];
    const second = candidates[1];
    const ambiguous = top && second && Math.abs(top.score - second.score) <= 10;

    if (top && !ambiguous) {
      matchedIndex.add(top.i);
      merged.push(buildMerged(indexDocs[top.i], md, top.norm));
    } else {
      // No candidate or ambiguity → leave unmatched with reason
      const reason = !top ? 'no-candidate' : 'ambiguous-candidates';
      const mdWithReason: MdRecord = { ...md, _merge_reason: reason } as MdRecord;
      mdUnmatched.push(mdWithReason);
    }
  }

  const remainingIndex = indexDocs.filter((_, i) => !matchedIndex.has(i));

  return { merged, unmergedIndex: remainingIndex, unmergedActions: mdUnmatched };
}

function buildMerged(index: IndexRecord | undefined, md: MdRecord | undefined, normalized?: NormalizedInfo): MergedRecord {
  const m: MergedRecord = {
    title: (md?.Title || md?.title || index?.title || index?.Title || '') as string,
    // index may not have type consistently; treat as unknown string field
    type: (md?.Type || md?.type || (index && typeof index['type'] === 'string' ? (index['type'] as string) : undefined)) as string,
    subject: (md?.Subject || md?.subject) as string,
    status: (md?.Status || md?.status) as string,
    startDate: (md?.StartDate || md?.Startdate || md?.startdate) as string,
    endDate: (md?.EndDate || md?.Enddate || md?.enddate) as string,
    associatedBody: (md?.AssociatedBody || md?.Associatedbody || md?.associatedbody) as string,
    copDecision: (md?.COPDecision || md?.copdecision) as string,
    relatedDocuments: (md?.Related_Documents || md?.Related_documents || md?.related_documents) as string,
    actionRequiredByParties: (md?.['Action Required by Parties'] || (md && typeof md['action_required_by_parties'] === 'string' ? (md['action_required_by_parties'] as string) : undefined)) as string,
    provenance: { index, md },
    normalized,
  };
  return m;
}

function normalizeKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '_');
}
