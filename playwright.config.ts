import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    storageState: 'storageState.json',
    headless: true,
  },
  webServer: {
    // Use the helper script so Playwright starts the Next.js dev server
    // from the correct directory during tests.
    command: './start-dev.sh',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
});
