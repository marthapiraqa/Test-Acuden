import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 180_000, // el flujo completo (IA + OTP) puede tardar varios minutos
  fullyParallel: false,
  retries: 0,
  reporter: 'html',

  use: {
    headless: false, // ponlo en true cuando ya lo tengas estable
    viewport: { width: 1280, height: 800 },
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
