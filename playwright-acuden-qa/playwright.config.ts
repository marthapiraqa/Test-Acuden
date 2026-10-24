import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // ── Directorio de tests ──────────────────────────────────────
  testDir: './tests',

  // ── Tiempos globales ─────────────────────────────────────────
  // El timeout global se sobreescribe a nivel de test cuando el flujo
  // incluye IA + OTP (hasta 480 s en el flujo completo)
  timeout: 240_000,

  // ── Ejecución ────────────────────────────────────────────────
  fullyParallel: false,  // flujos interdependientes (ACUDEN → CIMA)
  retries:       0,
  workers:       1,      // un solo worker para evitar conflictos de estado

  // ── Reporter ─────────────────────────────────────────────────
  reporter: [['html', { open: 'never' }]],

  // ── Opciones globales del navegador ──────────────────────────
  use: {
    headless:          false,       // cambiar a true en CI
    viewport:          { width: 1280, height: 800 },
    actionTimeout:     20_000,
    navigationTimeout: 30_000,
    trace:             'on-first-retry',
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
  },

  // ── Proyectos ────────────────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
  ],
})
