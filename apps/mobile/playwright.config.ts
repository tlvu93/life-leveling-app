import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: 'test-results',
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8084',
    browserName: 'chromium',
    channel: 'msedge',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run serve:web:test',
    reuseExistingServer: true,
    timeout: 120_000,
    url: 'http://127.0.0.1:8084',
  },
});
