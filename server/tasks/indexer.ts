import type { Task, TaskEvent } from 'nitropack';
import { consola } from 'consola';
import { runIndexingTask } from '../../../shared/utils/scbd-indexer';
import type { IndexerPayload } from '../types/tasks';

const indexerTask: Task = {
  meta: {
    name: 'indexer',
    description: 'Fetch index data, parse MD tables, merge, and write outputs under shared/data',
  },
  async run(event: TaskEvent) {
    const { payload } = event;
    const logger = consola.withTag('indexer');

    if (!payload || !Array.isArray((payload as IndexerPayload).dataPaths)) {
      logger.error('Invalid payload. Expected { dataPaths: string[]; since?: string; dryRun?: boolean }');
      throw new Error('Invalid payload for indexer task');
    }

    const { dataPaths, since, dryRun } = payload as IndexerPayload;

    const result = await runIndexingTask({
      dataPaths,
      since,
      dryRun,
      logger,
    });

    return { result };
  },
};

export default indexerTask;

