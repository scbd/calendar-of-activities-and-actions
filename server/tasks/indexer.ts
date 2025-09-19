import type { Task, TaskEvent } from 'nitropack';
import { consola } from 'consola';
import { runIndexingTask } from '../../utils/indexers/scbd/index';
import type { IndexerPayload } from '../types/tasks';

/**
 * Scaffolding task for indexing data to the index defined in .env
 * This task handles fetching index data, parsing MD tables, merging, and writing outputs under shared/data
 */
const indexerTask: Task = {
  meta: {
    name: 'indexer',
    description: 'Scaffolding for indexer tasks to the index defined in .env',
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

