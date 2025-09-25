import type { ConsolaInstance } from 'consola';

// Task-related type definitions consumed by scaffolding indexer utilities

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
