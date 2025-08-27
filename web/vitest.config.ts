import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
    passWithNoTests: false,
  },
  css: { modules: { classNameStrategy: 'non-scoped' } },
});
