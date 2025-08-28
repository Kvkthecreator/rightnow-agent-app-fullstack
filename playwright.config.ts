import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  projects: [
    // Setup project for authentication
    { 
      name: 'setup', 
      testMatch: /.*\.setup\.ts/
    },
    
    // Canon v1.4.0 compliance tests (uses test auth bypass)
    {
      name: 'canon-v1.4',
      testDir: './tests/canon-v1.4',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
          'x-playwright-test': 'true'
        }
      },
    },
    
    // API contract tests (uses test auth bypass)
    {
      name: 'api-contracts',
      testDir: './tests/api-contracts',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
          'x-playwright-test': 'true'
        }
      },
    },

    // Integration tests (requires auth)
    {
      name: 'integration',
      testDir: './tests/integration',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        storageState: 'tests/setup/.auth/user.json'
      },
      dependencies: ['setup'],
    },

    // Legacy canon tests (DEPRECATED - will be removed)
    {
      name: 'legacy-canon',
      testDir: './tests/canon',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
          'x-playwright-test': 'true'
        }
      },
    },

    // Cleanup
    { 
      name: 'cleanup', 
      testMatch: /.*\.cleanup\.ts/
    }
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },

  // Set environment variables for all tests
  globalSetup: require.resolve('./tests/global-setup.ts'),

  webServer: {
    command: './start-dev.sh',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      PLAYWRIGHT_TEST: 'true',
      NODE_ENV: 'test'
    },
  },
});
