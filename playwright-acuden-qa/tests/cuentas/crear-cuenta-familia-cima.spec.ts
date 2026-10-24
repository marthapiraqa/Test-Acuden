/**
 * crear-cuenta-familia-cima.spec.ts
 * Suite: Crear cuenta familiar directamente desde CIMA (flujo administrador).
 * El admin crea el usuario manualmente con validación IA desde el panel CIMA.
 *
 * (Renombrado desde: crear-cuentafamilia-cima.spec.ts)
 */

import { test, expect } from '@playwright/test'
import { fakerES as faker } from '@faker-js/faker'
import path from 'path'
import { CimaPage } from '../../src/pages/cima.page'
import solicitantes from '../../data/solicitantes.json'

// ------------------------------------------------------------------
// Constantes del dominio
// ------------------------------------------------------------------
const CREDENCIALES_CIMA = { username: 'kpg2', password: 'Cima123...' }
const RUTA_FOTO = path.resolve('resources', 'foto-familia-7.jpg')

function generarCorreoYopmail(): string {
  return `${faker.person.firstName()}.${faker.person.lastName()}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]/g, '') + '@yopmail.com'
}

// ------------------------------------------------------------------
// Suite parametrizada
// ------------------------------------------------------------------
test.use({ launchOptions: { slowMo: 500 } })

for (const persona of solicitantes) {
  test(`Crear cuenta CIMA - ID ${persona.id}`, async ({ page, context }) => {
    test.setTimeout(240_000)

    const cima             = new CimaPage(page, context)
    const correoYopmail    = generarCorreoYopmail()
    const fakerNombre      = faker.person.firstName().split(' ')[0]
    const fakerApellido    = faker.person.lastName().split(' ')[0]
    const fakerNombre2     = faker.person.middleName().split(' ')[0]
    const fakerApellido2   = faker.person.lastName().split(' ')[0]

    // ── 1. Login ────────────────────────────────────────────────
    await test.step('Inicio de sesión en CIMA', async () => {
      await cima.iniciarSesion(CREDENCIALES_CIMA)
    })

    // ── 2. Sesiones activas ─────────────────────────────────────
    await test.step('Gestionar sesiones activas', async () => {
      await cima.gestionarSesionesActivas()
    })

    // ── 3. Navegar a Seguridad / Familia ────────────────────────
    await test.step('Navegar a Seguridad → Familia → Solicitudes', async () => {
      // Navega al módulo de seguridad (sin ícono fa-user-lock — flujo CIMA directo)
      await page.locator('a[href="/Security"]').click()
      await page.locator('a[href*="PartyType=Family"]').click()
      await page.waitForLoadState('networkidle')

      const solicitudes = page.locator('a:has(i.fa-laptop-code)')
      await solicitudes.waitFor({ state: 'visible', timeout: 30_000 })
      await solicitudes.click()
      await page.waitForLoadState('networkidle')

      await page.getByRole('button', { name: ' Create user' }).click()
      await page.getByText('Identity validation Document').click()
    })

    // ── 4. Validación IA ────────────────────────────────────────
    await test.step('Completar validación con Inteligencia Artificial', async () => {
      const selectDocumento = page.locator('select#IdentityEvidenceId')
      await selectDocumento.waitFor({ state: 'visible', timeout: 15_000 })
      await selectDocumento.selectOption('834')

      const inputArchivo = page.locator('input#FileUrl')
      await inputArchivo.setInputFiles(RUTA_FOTO)
      await inputArchivo.dispatchEvent('change')

      const btnContinuar = page.locator(
        'button[type="submit"]:has-text("Continuar"), button[type="submit"]:has-text("Continue")'
      )
      await expect(btnContinuar).toBeEnabled({ timeout: 20_000 })
      await btnContinuar.click()

      await expect(
        page.getByPlaceholder(/Write your first name/i)
      ).toBeVisible({ timeout: 20_000 })
    })

    // ── 5. Completar datos personales ───────────────────────────
    await test.step('Completar datos personales y finalizar registro', async () => {
      await page.getByPlaceholder(/Write your first name/i).fill(fakerNombre)
      await page.getByPlaceholder(/Write your middle name/i).fill(fakerNombre2)
      await page.getByPlaceholder(/Type in your first last name/i).fill(fakerApellido)
      await page.getByPlaceholder(/Type in your middle last name/i).fill(fakerApellido2)

      await page.getByLabel(/Country of birth/i).selectOption('1')
      await page.waitForTimeout(1_000)
      await page.getByLabel(/City of birth/i).selectOption('74')

      const birthdateInput = page
        .getByPlaceholder(/mm\/dd\/yyyy|dd\/mm\/aaaa/i)
        .or(page.locator('input[id*="Birthdate"], input[name*="Birthdate"]'))
        .first()
      await birthdateInput.fill(persona.fechaNacimiento)

      const emailInput = page
        .locator('input[type="email"], input[id*="Email" i], input[name*="Email" i]')
        .first()
      await emailInput.scrollIntoViewIfNeeded()
      await emailInput.fill(correoYopmail)

      await page.getByRole('button', { name: /Create user|Crear usuario/i }).click()

      // Confirmación modal de checkbox (si aparece)
      const registroCheckbox = page
        .locator('.modal-content input[type="checkbox"], input[type="checkbox"]')
        .first()
      if (await registroCheckbox.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await registroCheckbox.check({ force: true })
        await page.getByRole('button', { name: /Continue|Continuar/i }).click()
        await page.getByRole('button', { name: /Create user|Crear usuario/i }).click()
      }

      await expect(
        page.getByText(/Account confirmationRemember|Confirmación de cuenta/i)
      ).toBeVisible({ timeout: 20_000 })

      console.log(`✔ Cuenta creada para: ${correoYopmail}`)
    })
  })
}

