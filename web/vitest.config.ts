import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
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
  // @ts-ignore - classNameStrategy not typed yet
  css: { modules: { classNameStrategy: 'non-scoped' } },
});
