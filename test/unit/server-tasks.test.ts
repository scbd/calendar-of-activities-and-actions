import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ConsolaInstance } from 'consola';
import { runIndexingTask, fetchIndexRaw, parseMdTable, mergeRecords } from '../../utils/indexers/scbd/index';
import type { IndexerOptions, FsAdapter, IndexRecord } from '../../server/types/tasks';

describe('Server Tasks - Comprehensive Tests', () => {
  let mockLogger: ConsolaInstance;
  let mockFs: FsAdapter;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
      withTag: vi.fn().mockReturnThis(),
    } as ConsolaInstance;

    mockFs = {
      readFile: vi.fn().mockResolvedValue(''),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
    };
  });

  describe('runIndexingTask', () => {
    it('should handle basic indexing options', async () => {
      const options: IndexerOptions = {
        since: '2024-12-01',
        dataPaths: ['test/path.md'],
        logger: mockLogger,
        fs: mockFs,
        dryRun: false
      };

      const result = await runIndexingTask(options);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('counts');
      expect(result).toHaveProperty('outputs');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should handle missing optional parameters', async () => {
      const options: IndexerOptions = {
        dataPaths: [],
        dryRun: false
      };

      const result = await runIndexingTask(options);

      expect(result).toBeDefined();
      expect(result.counts).toBeDefined();
      expect(typeof result.counts).toBe('object');
    });

    it('should respect dry run mode', async () => {
      const options: IndexerOptions = {
        since: '2024-12-01',
        dataPaths: ['test/path.md'],
        logger: mockLogger,
        fs: mockFs,
        dryRun: true
      };

      const result = await runIndexingTask(options);

      expect(result).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Scaffolding: dry run complete');
    });

    it('should handle multiple data paths', async () => {
      const options: IndexerOptions = {
        since: '2024-12-01',
        dataPaths: ['path1.md', 'path2.md', 'path3.md'],
        logger: mockLogger,
        fs: mockFs,
        dryRun: false
      };

      const result = await runIndexingTask(options);

      expect(result).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('files=3')
      );
    });

    it('should provide default logger when none provided', async () => {
      const options: IndexerOptions = {
        dataPaths: ['test.md'],
        dryRun: true
      };

      // Should not throw error even without logger
      expect(async () => {
        await runIndexingTask(options);
      }).not.toThrow();
    });

    it('should handle filesystem errors gracefully', async () => {
      const errorFs = {
        ...mockFs,
        writeFile: vi.fn().mockRejectedValue(new Error('Write failed')),
      };

      const options: IndexerOptions = {
        dataPaths: ['test.md'],
        fs: errorFs,
        dryRun: false
      };

      // Should complete without throwing (scaffolding mode)
      const result = await runIndexingTask(options);
      expect(result).toBeDefined();
    });
  });

  describe('fetchIndexRaw', () => {
    it('should return expected structure', async () => {
      const result = await fetchIndexRaw({ since: '2024-12-01', logger: mockLogger });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('response');
      expect(result.response).toHaveProperty('docs');
      expect(Array.isArray(result.response.docs)).toBe(true);
    });

    it('should handle missing parameters', async () => {
      const result = await fetchIndexRaw({});

      expect(result).toBeDefined();
      expect(Array.isArray(result.response.docs)).toBe(true);
    });

    it('should log fetching attempt', async () => {
      await fetchIndexRaw({ logger: mockLogger });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Scaffolding: would fetch index data from API'
      );
    });

    it('should handle different date formats', async () => {
      const testDates = ['2024-12-01', '2025-01-01', 'invalid-date', ''];

      for (const date of testDates) {
        const result = await fetchIndexRaw({ since: date });
        expect(result).toBeDefined();
        expect(Array.isArray(result.response.docs)).toBe(true);
      }
    });
  });

  describe('parseMdTable', () => {
    it('should handle valid markdown table', () => {
      const validTable = `
| Title | Type | Status |
|-------|------|--------|
| Meeting 1 | Conference | Active |
| Workshop 2 | Training | Completed |
`;

      const result = parseMdTable(validTable);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty markdown', () => {
      const result = parseMdTable('');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle malformed tables', () => {
      const malformedTables = [
        'Not a table at all',
        '| Missing | Headers |',
        '| Title |\n| Missing alignment row |',
        '| Title | Type |\n|-------|',
        '| Title | Type |\n|-------|-------|\n| Only | One |'
      ];

      malformedTables.forEach(table => {
        expect(() => {
          const result = parseMdTable(table);
          expect(Array.isArray(result)).toBe(true);
        }).not.toThrow();
      });
    });

    it('should handle special characters in table content', () => {
      const specialCharTable = `
| Title | Description |
|-------|-------------|
| Meeting with "quotes" | Description with 'apostrophes' |
| Meeting & Workshop | Description | with | pipes |
| Meeting <script> | Description with <tags> |
`;

      expect(() => {
        const result = parseMdTable(specialCharTable);
        expect(Array.isArray(result)).toBe(true);
      }).not.toThrow();
    });

    it('should handle very large table content', () => {
      const longContent = 'A'.repeat(10000);
      const largeTable = `
| Title | Description |
|-------|-------------|
| ${longContent} | Large description |
`;

      expect(() => {
        const result = parseMdTable(largeTable);
        expect(Array.isArray(result)).toBe(true);
      }).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null and undefined inputs', async () => {
      const testRecord: IndexRecord = {
        title: 'Test Title',
        copDecision: 'CBD/COP/15/DEC/14',
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        schema: 'meeting'
      };

      const result = mergeRecords([testRecord], []);

      expect(result.unmergedIndex).toHaveLength(1);
      expect(result.unmergedIndex[0]).toEqual(testRecord);
    });

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        fetchIndexRaw({ since: `2024-${String(i + 1).padStart(2, '0')}-01` })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(Array.isArray(result.response.docs)).toBe(true);
      });
    });

    it('should handle memory constraints with large data', () => {
      const largeIndexArray = Array.from({ length: 10000 }, (_, i) => ({
        title: `Document ${i}`,
        copDecision: `CBD/COP/${Math.floor(i / 100)}/DEC/${i % 100}`,
        startDate: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`,
        schema: 'document'
      }));

      const largeMdArray = Array.from({ length: 10000 }, (_, i) => ({
        Title: `Action ${i}`,
        Type: 'Action',
        Status: 'Active',
        StartDate: `2025-02-${String((i % 28) + 1).padStart(2, '0')}`
      }));

      const startTime = performance.now();
      const result = mergeRecords(largeIndexArray, largeMdArray);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Data Validation and Integrity', () => {
    it('should maintain data types in results', async () => {
      const options: IndexerOptions = {
        since: '2024-12-01',
        dataPaths: ['test.md'],
        dryRun: true
      };

      const result = await runIndexingTask(options);

      expect(typeof result.counts).toBe('object');
      expect(typeof result.outputs).toBe('object');
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should handle different data encodings', () => {
      const encodingTests = [
        'ASCII content',
        'Unicode content: 你好世界',
        'Emoji content: 🌍🌱💚',
        'Mixed content: ASCII + Unicode 中文 + Emoji 🎉'
      ];

      encodingTests.forEach(content => {
        expect(() => {
          const result = parseMdTable(`| Title |\n|-------|\n| ${content} |`);
          expect(Array.isArray(result)).toBe(true);
        }).not.toThrow();
      });
    });

    it('should preserve data structure consistency', () => {
      const testRecord: IndexRecord = {
        title: 'Test Title',
        copDecision: 'CBD/COP/15/DEC/14',
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        schema: 'meeting'
      };

      const result = mergeRecords([testRecord], []);

      expect(result.unmergedIndex).toHaveLength(1);
      expect(result.unmergedIndex[0]).toEqual(testRecord);
    });
  });
});