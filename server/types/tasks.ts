// Deliberately re-export from shared; no local use to avoid unused warnings
import type { ConsolaInstance } from 'consola';

// File-system adapter abstraction used by indexers
export type FsAdapter = {
  readFile: (path: string, enc?: BufferEncoding) => Promise<string>
  writeFile: (path: string, data: string) => Promise<void>
  mkdir: (path: string, opts?: { recursive?: boolean }) => Promise<string | undefined>
  exists: (path: string) => Promise<boolean>
}

// Options for the top-level indexing task
export type IndexerOptions = {
  dataPaths: string[]
  since?: string
  dryRun?: boolean
  logger?: ConsolaInstance
  fs?: FsAdapter
}

// Task payloads
export type IndexerPayload = {
  dataPaths: string[]
  since?: string
  dryRun?: boolean
}

export type MergePayload = {
  dataPaths: string[]
  rawIndexPath?: string // default: shared/data/raw-index.json
  dryRun?: boolean
}

// Re-export commonly used shared types for server modules
export type { IndexRecord, MdRecord } from 'shared/types/records';
