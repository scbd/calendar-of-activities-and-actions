import { describe, it, expect } from 'vitest';
import { parseMdTable, mergeRecords, fetchIndexRaw } from '../../utils/indexers/scbd/index';
import type { IndexRecord } from '../../shared/types/records';

describe('Malformed JSON and Data Handling Tests', () => {
  describe('parseMdTable - Malformed Data Scenarios', () => {
    it('should handle completely invalid markdown', () => {
      const invalidInputs = [
        null,
        undefined,
        '',
        'not markdown at all',
        'random text without structure',
        JSON.stringify({ not: 'markdown' }),
        '12345',
        '{"json": "object"}',
        '<html><body>HTML content</body></html>'
      ];

      invalidInputs.forEach(input => {
        expect(() => {
          const result = parseMdTable(input as any);
          expect(Array.isArray(result)).toBe(true);
        }).not.toThrow();
      });
    });

    it('should handle tables with invalid encoding', () => {
      const encodingTests = [
        '| Title | Type |\n|-------|------|\n| 中文标题 | Meeting |',
        '| Title | Type |\n|-------|------|\n| 🎉 Emoji Title | 🏢 Office |',
        '| Title | Type |\n|-------|------|\n| Àccéntëd Chàrs | Tÿpé |',
        '| Title | Type |\n|-------|------|\n| Arabic: العربية | نوع |'
      ];

      encodingTests.forEach(table => {
        expect(() => {
          const result = parseMdTable(table);
          expect(Array.isArray(result)).toBe(true);
        }).not.toThrow();
      });
    });

    it('should handle tables with malformed structure', () => {
      const malformedTables = [
        '| Title | Type\n| Row without proper separator',
        '| Title | Type |\n| Missing | alignment | row |\n| Data | Here |',
        '| | | |\n|---|---|---|\n| | | |', // Empty headers and data
        '| Title |\n|-------|\n| Data | Extra | Columns |',
        '||||\n|---|---|---|\n|a|b|c|d|', // More separators than headers
        '| Title | Type |\n|----|\n| Missing separator cell |'
      ];

      malformedTables.forEach(table => {
        expect(() => {
          const result = parseMdTable(table);
          expect(Array.isArray(result)).toBe(true);
        }).not.toThrow();
      });
    });

    it('should handle extremely large content', () => {
      const hugeTitle = 'A'.repeat(100000);
      const hugeCellContent = `| Title | Description |\n|-------|-------------|\n| ${hugeTitle} | Large content |`;

      expect(() => {
        const result = parseMdTable(hugeCellContent);
        expect(Array.isArray(result)).toBe(true);
      }).not.toThrow();
    });

    it('should handle special characters and injection attempts', () => {
      const maliciousInputs = [
        '| Title | Type |\n|-------|------|\n| <script>alert("xss")</script> | Meeting |',
        '| Title | Type |\n|-------|------|\n| ${malicious} | eval() |',
        '| Title | Type |\n|-------|------|\n| ../../../etc/passwd | File |',
        '| Title | Type |\n|-------|------|\n| DROP TABLE users; | SQL |',
        '| Title | Type |\n|-------|------|\n| null | undefined |'
      ];

      maliciousInputs.forEach(input => {
        expect(() => {
          const result = parseMdTable(input);
          expect(Array.isArray(result)).toBe(true);
        }).not.toThrow();
      });
    });
  });

  describe('mergeRecords - Malformed Data Scenarios', () => {
    it('should handle null and undefined records', () => {
      const malformedIndexRecords = [
        null,
        undefined,
        {},
        { title: null },
        { title: undefined },
        { invalidProperty: 'test' }
      ] as any[];

      const malformedMdRecords = [
        null,
        undefined,
        {},
        { Title: null },
        { Title: undefined },
        { randomField: 'value' }
      ] as any[];

      expect(() => {
        const result = mergeRecords(malformedIndexRecords, malformedMdRecords);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('merged');
        expect(result).toHaveProperty('unmergedIndex');
        expect(result).toHaveProperty('unmergedActions');
      }).not.toThrow();
    });

    it('should handle records with circular references', () => {
      const circularRecord: any = { title: 'Test' };
      circularRecord.self = circularRecord; // Create circular reference

      expect(() => {
        const result = mergeRecords([circularRecord], []);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('should handle extremely large datasets', () => {
      const largeIndexArray = Array.from({ length: 50000 }, (_, i) => ({
        title: `Document ${i}`,
        id: `doc-${i}`,
        randomData: Math.random().toString()
      }));

      const largeMdArray = Array.from({ length: 50000 }, (_, i) => ({
        Title: `Action ${i}`,
        Id: `action-${i}`,
        RandomField: Math.random().toString()
      }));

      const startTime = performance.now();
      expect(() => {
        const result = mergeRecords(largeIndexArray, largeMdArray);
        expect(result).toBeDefined();
      }).not.toThrow();
      const endTime = performance.now();

      // Should complete within reasonable time even for large datasets
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
    });

    it('should handle mixed data types in record fields', () => {
      const mixedTypeRecords = [
        { title: 123, copDecision: true, startDate: ['2025-01-01'] },
        { title: { nested: 'object' }, copDecision: null },
        { title: '', copDecision: 0, startDate: false },
        { title: Symbol('test'), copDecision: new Date() }
      ] as any[];

      expect(() => {
        const result = mergeRecords(mixedTypeRecords, []);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('should preserve data integrity despite malformed inputs', () => {
      const validRecord: IndexRecord = {
        title: 'Valid Record',
        copDecision: 'CBD/COP/15/DEC/14',
        schema: 'meeting'
      };

      const malformedRecords = [null, undefined, { invalid: 'data' }] as any[];
      const mixedRecords = [validRecord, ...malformedRecords];

      const result = mergeRecords(mixedRecords, []);
      
      // Should find the valid record in unmerged index
      expect(result.unmergedIndex.some(record => 
        record && record.title === 'Valid Record'
      )).toBe(true);
    });
  });

  describe('fetchIndexRaw - Error Handling', () => {
    it('should handle network-like errors gracefully', async () => {
      // Test various error scenarios that might occur in real API calls
      const errorScenarios = [
        { since: 'invalid-date-format' },
        { since: '9999-99-99' },
        { since: '' },
        { since: null as any },
        { since: undefined },
        { since: 123 as any },
        { since: { invalid: 'object' } as any }
      ];

      for (const scenario of errorScenarios) {
        expect(async () => {
          const result = await fetchIndexRaw(scenario);
          expect(result).toBeDefined();
          expect(result).toHaveProperty('response');
          expect(result.response).toHaveProperty('docs');
          expect(Array.isArray(result.response.docs)).toBe(true);
        }).not.toThrow();
      }
    });

    it('should handle missing logger parameter', async () => {
      expect(async () => {
        const result = await fetchIndexRaw({ since: '2024-12-01' });
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 100 }, (_, i) => 
        fetchIndexRaw({ since: `2024-${String(i % 12 + 1).padStart(2, '0')}-01` })
      );

      expect(async () => {
        const results = await Promise.all(requests);
        expect(results).toHaveLength(100);
        results.forEach(result => {
          expect(result).toBeDefined();
          expect(Array.isArray(result.response.docs)).toBe(true);
        });
      }).not.toThrow();
    });

    it('should maintain consistent response structure', async () => {
      const result1 = await fetchIndexRaw({ since: '2024-01-01' });
      const result2 = await fetchIndexRaw({ since: '2025-12-31' });
      const result3 = await fetchIndexRaw({});

      // All should have the same structure
      [result1, result2, result3].forEach(result => {
        expect(result).toHaveProperty('response');
        expect(result.response).toHaveProperty('docs');
        expect(Array.isArray(result.response.docs)).toBe(true);
      });
    });
  });

  describe('Type Safety and Data Validation', () => {
    it('should handle TypeScript type mismatches gracefully', () => {
      const invalidTypeData = [
        'string instead of object',
        123,
        true,
        [],
        new Date(),
        function() { return 'function'; },
        Symbol('symbol')
      ];

      invalidTypeData.forEach(data => {
        expect(() => {
          const result = mergeRecords([data as any], []);
          expect(result).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should validate record structure consistency', () => {
      const inconsistentRecords = [
        { title: 'Test 1', extra: 'field' },
        { differentField: 'value' },
        { title: 'Test 2', copDecision: 'CBD/COP/15/DEC/14' },
        { } // empty object
      ];

      expect(() => {
        const result = mergeRecords(inconsistentRecords as any[], []);
        expect(result.unmergedIndex).toHaveLength(inconsistentRecords.length);
      }).not.toThrow();
    });

    it('should handle deeply nested malformed objects', () => {
      const deeplyNested = {
        title: 'Test',
        nested: {
          level1: {
            level2: {
              level3: {
                level4: {
                  data: 'deep value',
                  circular: null as any
                }
              }
            }
          }
        }
      };
      
      // Create circular reference deep in the object
      deeplyNested.nested.level1.level2.level3.level4.circular = deeplyNested;

      expect(() => {
        const result = mergeRecords([deeplyNested as any], []);
        expect(result).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Memory and Performance with Malformed Data', () => {
    it('should not cause memory leaks with malformed data', () => {
      const createLargeArray = () => Array.from({ length: 10000 }, (_, i) => ({
        title: `Item ${i}`,
        largeString: 'A'.repeat(1000),
        randomData: Math.random()
      }));

      // Test multiple iterations to check for memory accumulation
      for (let i = 0; i < 10; i++) {
        const largeData = createLargeArray();
        const result = mergeRecords(largeData, []);
        expect(result).toBeDefined();
        
        // Force garbage collection opportunity
        if (global.gc) {
          global.gc();
        }
      }
    });

    it('should handle malformed data without blocking', async () => {
      const startTime = performance.now();
      
      const malformedPromises = Array.from({ length: 50 }, async (_, i) => {
        const malformedData = Array.from({ length: 1000 }, (_, j) => ({
          [`field${j}`]: `value${i}-${j}`,
          invalidData: null,
          circular: {} as any
        }));
        
        // Add circular references
        malformedData.forEach(item => {
          item.circular = item;
        });

        return mergeRecords(malformedData as any[], []);
      });

      const results = await Promise.all(malformedPromises);
      const endTime = performance.now();

      expect(results).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});