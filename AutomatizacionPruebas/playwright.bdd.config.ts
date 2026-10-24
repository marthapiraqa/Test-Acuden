import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import baseConfig from './playwright.config';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['fixtures/bdd.ts', 'steps/**/*.ts'],
  outputDir: '.features-gen',
  missingSteps: 'fail-on-gen'
});

export default defineConfig({
  ...baseConfig,
  testDir,
  use: { ...baseConfig.use, trace: 'off', screenshot: 'off', video: 'off' },
  projects: [{ name: 'chromium-bdd', use: { ...devices['Desktop Chrome'] } }]
});
