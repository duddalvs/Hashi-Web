import { defineConfig } from '@playwright/test';
const port = process.env.HASHI_TEST_PORT || '3000';
const origin = `http://localhost:${port}`;
export default defineConfig({
  testDir: './tests/ui',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 8000 },
  reporter: [['list']],
  outputDir: 'test-results/ui',
  use: {
    baseURL: origin,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm.cmd run dev',
    url: `${origin}/api/config`,
    env: { PORT: port, APP_ORIGIN: origin, ENABLE_DEMO: 'true' },
    reuseExistingServer: true,
    timeout: 45000,
  },
});
