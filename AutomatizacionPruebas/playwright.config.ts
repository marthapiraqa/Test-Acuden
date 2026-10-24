import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.ADSEF_BASE_URL || 'http://192.168.10.68/adsefdigitalss/',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    locale: 'es-PR',
    trace: process.env.RUN_AUTH === '1' || process.env.RUN_RECORDING === '1' ? 'off' : 'retain-on-failure',
    screenshot: process.env.RUN_AUTH === '1' || process.env.RUN_RECORDING === '1' ? 'off' : 'only-on-failure',
    video: 'off'
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    testMatch: process.env.RUN_RECORDING === '1' ? '**/recorded/*.spec.ts'
      : process.env.RUN_AUTH === '1' ? '**/auth/*.spec.ts' : '**/public/*.spec.ts'
  }]
});
