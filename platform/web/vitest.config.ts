import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setupTests.ts'],
    include: [
      '__tests__/**/*.test.ts', 
      '__tests__/**/*.test.tsx',
      '../tests/contracts/*.test.ts'
    ],
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '__tests__/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        '**/coverage/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@shared': resolve(__dirname, '../shared')
    }
  },
  // @ts-ignore - classNameStrategy not typed yet
  css: { modules: { classNameStrategy: 'non-scoped' } },
});
