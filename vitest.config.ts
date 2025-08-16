import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'web'),
      '@shared': resolve(__dirname, 'shared')
    }
  }
});
