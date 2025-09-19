import type { ConsolaInstance } from 'consola';

/**
 * File-system adapter abstraction used by indexers
 * Provides methods for reading, writing, and checking file system operations
 */
export type FsAdapter = {
  /** Read a file as a string with optional encoding */
  readFile: (path: string, enc?: BufferEncoding) => Promise<string>
  /** Write data to a file */
  writeFile: (path: string, data: string) => Promise<void>
  /** Create a directory with optional recursive creation */
  mkdir: (path: string, opts?: { recursive?: boolean }) => Promise<string | undefined>
  /** Check if a file or directory exists */
  exists: (path: string) => Promise<boolean>
}

/**
 * Options for the top-level indexing task
 * Configures how the indexing process should behave
 */
export type IndexerOptions = {
  /** Paths to data files that should be processed */
  dataPaths: string[]
  /** Optional timestamp to filter data since this date */
  since?: string
  /** Whether to run in dry-run mode without making changes */
  dryRun?: boolean
  /** Optional logger instance for output */
  logger?: ConsolaInstance
  /** Optional file system adapter for testing */
  fs?: FsAdapter
}

/**
 * Task payload for indexer operations
 * Simplified version of IndexerOptions for task execution
 */
export type IndexerPayload = {
  /** Paths to data files that should be processed */
  dataPaths: string[]
  /** Optional timestamp to filter data since this date */
  since?: string
  /** Whether to run in dry-run mode without making changes */
  dryRun?: boolean
}

/**
 * Task payload for merge operations
 * Configures how the merge process should behave
 */
export type MergePayload = {
  /** Paths to data files that should be processed */
  dataPaths: string[]
  /** Optional path to raw index file (default: shared/data/raw-index.json) */
  rawIndexPath?: string
  /** Whether to run in dry-run mode without making changes */
  dryRun?: boolean
}

// Re-export commonly used shared types for server modules
export type { IndexRecord, MdRecord } from '../../shared/types/records';
