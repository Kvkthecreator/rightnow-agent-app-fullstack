// Global setup for Playwright tests
export default function globalSetup() {
  // Set environment flag to identify Playwright test execution
  process.env.PLAYWRIGHT_TEST = 'true';
  process.env.NODE_ENV = 'test';
}