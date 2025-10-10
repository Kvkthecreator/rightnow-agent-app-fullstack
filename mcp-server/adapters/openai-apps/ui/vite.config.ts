import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const outDir = path.resolve(__dirname, '../static');

export default defineConfig({
  root: __dirname,
  base: '/ui/',
  plugins: [react()],
  build: {
    outDir,
    emptyOutDir: false,
    sourcemap: true,
  },
});
