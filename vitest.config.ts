import { defineConfig } from 'vitest/config';
import { defineVitestProject } from '@nuxt/test-utils/config';

// Gate E2E tests behind an env flag to keep them paused by default.
// Enable by running with VITEST_E2E=1 (or "true").
const enableE2E = process.env.VITEST_E2E === '1' || process.env.VITEST_E2E === 'true';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '.nuxt/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      }),
      // E2E project is opt-in. Set VITEST_E2E=1 to include it.
      ...(
        enableE2E
          ? [{
              test: {
                name: 'e2e',
                include: ['test/e2e/**/*.{test,spec}.ts'],
                environment: 'node',
              },
            }]
          : []
      ),
    ],
  },
});