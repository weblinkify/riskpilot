import { defineConfig, devices } from '@playwright/test';

/** Captures README media (screenshots + demo video). Run with `npm run media`. */
export default defineConfig({
  testDir: './e2e/media',
  testMatch: /.*\.media\.ts/,
  workers: 1,
  timeout: 120_000,
  reporter: 'list',
  outputDir: './e2e/.media',
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  },
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: 'API_MODE=mock npm start -- --port 4200',
        url: 'http://localhost:4200',
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
