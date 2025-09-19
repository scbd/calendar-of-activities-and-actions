import type { Task, TaskEvent } from 'nitropack';
import { join } from 'node:path';
import { promises as fsp } from 'node:fs';
import { consola } from 'consola';
import { mergeRecords, parseMdTable } from '../../utils/indexers/scbd/index-meetings';
import type { MergePayload, IndexRecord, MdRecord } from '../types/tasks';

const mergeTask: Task = {
  meta: {
    name: 'merge',
    description: 'Parse MD tables and merge with raw index JSON into merged outputs',
  },
  async run(event: TaskEvent) {
  const { payload } = event;
  const logger = consola.withTag('merge');

    if (!payload || !Array.isArray((payload as MergePayload).dataPaths)) {
      logger.error('Invalid payload. Expected { dataPaths: string[]; rawIndexPath?: string; dryRun?: boolean }');
      throw new Error('Invalid payload for merge task');
    }

    const { dataPaths, rawIndexPath, dryRun } = payload as MergePayload;
    const cwd = process.cwd();
    const sharedOut = join(cwd, 'shared', 'data');
    const publicOut = join(cwd, 'public', 'data');

    const indexPath = rawIndexPath || join(sharedOut, 'raw-index.json');

    // Load raw index docs
    let indexDocs: IndexRecord[] = [];
    try {
      const raw = await fsp.readFile(indexPath, 'utf8');
      const json = JSON.parse(raw);
      indexDocs = json?.response?.docs || [];
    } catch {
      logger.warn(`Failed to read raw index at ${indexPath}; proceeding with empty docs`);
      indexDocs = [];
    }

    // Load MD rows
    const mdRows: MdRecord[] = [];
    for (const rel of dataPaths) {
      const abs = join(cwd, rel);
      try {
        const md = await fsp.readFile(abs, 'utf8');
        mdRows.push(...parseMdTable(md));
      } catch {
        logger.warn(`Failed to read MD file ${abs}`);
      }
    }

    const { merged, unmergedIndex, unmergedActions } = mergeRecords(indexDocs, mdRows);
    const ambiguousCount = (unmergedActions as Array<Record<string, unknown>>).filter((r) => r?._merge_reason === 'ambiguous-candidates').length;

    if (!dryRun) {
      await fsp.mkdir(sharedOut, { recursive: true });
      await fsp.mkdir(publicOut, { recursive: true });

      await fsp.writeFile(join(sharedOut, 'merged.json'), JSON.stringify(merged, null, 2), 'utf8');
      await fsp.writeFile(join(sharedOut, 'unmerged_index.json'), JSON.stringify(unmergedIndex, null, 2), 'utf8');
      await fsp.writeFile(join(sharedOut, 'unmerged_actions.json'), JSON.stringify(unmergedActions, null, 2), 'utf8');

      await fsp.writeFile(join(publicOut, 'merged.json'), JSON.stringify(merged, null, 2), 'utf8');
      await fsp.writeFile(join(publicOut, 'unmerged_index.json'), JSON.stringify(unmergedIndex, null, 2), 'utf8');
      await fsp.writeFile(join(publicOut, 'unmerged_actions.json'), JSON.stringify(unmergedActions, null, 2), 'utf8');
    }

    return {
      result: {
        counts: {
          index: indexDocs.length,
          md: mdRows.length,
          merged: merged.length,
          unmergedIndex: unmergedIndex.length,
          unmergedActions: unmergedActions.length,
          ambiguous: ambiguousCount,
        },
        outputs: {
          merged: join(sharedOut, 'merged.json'),
          unmergedIndex: join(sharedOut, 'unmerged_index.json'),
          unmergedActions: join(sharedOut, 'unmerged_actions.json'),
          publicMerged: join(publicOut, 'merged.json'),
        },
        warnings: [],
      },
    };
  },
};

export default mergeTask;

