import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.ts',
        'examples/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'tests/',
        'src/index.ts',
        'dist/**/*.ts',
        'dist/**/*.js',
        'esbuild.config.js',
        'vitest.config.ts',
        'eslint.config.mjs',
      ],
      thresholds: {
        global: {
          branches: 72,
          functions: 100,
          lines: 98,
          statements: 98,
        },
      },
    },
    environment: 'node',
  },
});
