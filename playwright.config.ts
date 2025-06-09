import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    storageState: 'storageState.json',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
});
