// import { defineConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import { VitePluginNode } from 'vite-plugin-node';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineVitestConfig({
  server: {
    port: 3000
  },
  plugins: [
    ...VitePluginNode({
      adapter: 'express',
      appPath: './src/index.ts',
      exportName: 'viteNodeApp',
      tsCompiler: 'swc',
      swcOptions: {
        sourceMaps: true,
      },
    }),
    // visualizer({
    //     template: 'network',
    //     filename: 'network.html',
    //     projectRoot: process.cwd(),
    // }),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      exclude: ['./tests/**/*.ts'],
      include: ['./src/**/*.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
    },
    rollupOptions: {
      input: 'src/index.ts',
      external: [
        '@fjell/core',
        '@fjell/lib',
        '@fjell/logging',
        'deepmerge',
        'express'
      ],
      output: [
        {
          format: 'esm',
          entryFileNames: '[name].js',
          preserveModules: true,
          exports: 'named',
        },
        {
          format: 'cjs',
          entryFileNames: '[name].cjs',
          preserveModules: true,
          exports: 'named',
        },
      ],
    },
    // Make sure Vite generates ESM-compatible code
    modulePreload: false,
    minify: false,
    sourcemap: true
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
      exclude: [
        'node_modules/',
        'tests/',
        'src/index.ts',
        'dist/**/*.ts',
        'dist/**/*.js',
        'vite.config.ts',
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
