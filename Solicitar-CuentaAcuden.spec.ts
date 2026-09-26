import { test, expect } from '@playwright/test'
import { obtenerCodigoYopmail } from '../utils/yopmail'
import solicitantes from '../fixtures/solicitantes.json'

const remitenteEsperado = 'noreply@familia.pr.gov'
const regexOtp = /es:\s*(\d{4,8})/i

for (const persona of solicitantes) {
  test(`Solicitar Cuenta Familia - ID ${persona.id}: ${persona.nombre} ${persona.apellido}`, async ({ page, context }) => {
    test.setTimeout(240000)

    const correoYopmail = `${persona.correoPrefix}_${Math.floor(Math.random() * 1000)}`
    const correoYopmailCompleto = `${correoYopmail}@yopmail.com`

    await test.step('Navegar a la plataforma e iniciar flujo de solicitud', async () => {
      await page.goto('https://acudendigital-qa2.azurewebsites.net/')
      await page.getByText('Solicitar cuenta').click()
      await page.getByText('Solicitante').click()
      await page.getByText('Es la primera vez solicitando los servicios').click()
      await page.getByRole('button', { name: 'Continuar' }).click()
    })

    await test.step('Completar validación con Inteligencia Artificial', async () => {
      await page.locator('[href="/Applicant/ArtificialIntelligence/"]').click()
      await page.locator('[name="ArtificialIntelligenceValidationModel.IdentityEvidenceId"]').selectOption({
        label: 'Certificado de Nacimiento'
      })

      await page.setInputFiles('#FileUrlInput', 'fixtures/Evidencia.pdf')
      await expect(page.locator('#FileUrlInput')).toHaveJSProperty('files.length', 1)
      await page.waitForTimeout(10000)
      const btnContinuarIA = page.getByRole('button', { name: 'Continuar' })
      await expect(btnContinuarIA).toBeEnabled({ timeout: 20000 })
      await btnContinuarIA.click()

      await expect(
        page.getByText('Su proceso de validación fue completado exitosamente')
      ).toBeVisible({ timeout: 120000 })

      await expect(page.getByText('Primer nombre')).toBeVisible()
    })

    await test.step('Completar formulario de datos personales', async () => {
      await page.locator('#Name').fill(persona.nombre)
      await page.locator('#LastName').fill(persona.apellido)

      const fechaField = page.locator('#Birthday input[placeholder="dd/mm/aaaa"]')
      await fechaField.fill(persona.fechaNacimiento)
      await fechaField.blur()

      await page.locator('#CountryOfBirthId').selectOption({ label: persona.paisNacimiento })
      await page.locator('#TownOfBirthId').selectOption({ label: persona.puebloNacimiento })

      await page.getByRole('button', { name: 'Continuar' }).click()
    })

    await test.step('Ingresar correo electrónico y solicitar código de verificación', async () => {
      const emailField = page.locator('#Email')
      await expect(emailField).toBeVisible({ timeout: 20000 })
      await emailField.fill(correoYopmailCompleto)
      await emailField.blur()

      const btnEnviarCodigo = page.getByRole('button', { name: 'Enviar código' })
      await expect(btnEnviarCodigo).toBeEnabled({ timeout: 30000 })
      await btnEnviarCodigo.click()

      await expect(page.getByText('Verificación de código')).toBeVisible({ timeout: 30000 })
    })

    await test.step('Obtener código OTP vía Yopmail y validar', async () => {
      const codigo = await obtenerCodigoYopmail(context, {
        correo: correoYopmail,
        remitenteEsperado,
        regex: regexOtp
      })

      await page.fill('#VerificationCode', codigo)

      const btnValidar = page.getByRole('button', { name: 'Validar' })
      await expect(btnValidar).toBeVisible()
      await expect(btnValidar).toBeEnabled({ timeout: 30000 })
      await btnValidar.click()
    })

    await test.step('Ingresar datos de residencia', async () => {
      const puebloResidenciaField =  page.locator('#ResidenceTownId')
      await expect(puebloResidenciaField).toBeVisible({ timeout: 20000 })
      //await puebloResidenciaField.selectOption({ label: persona.puebloResidencia })
      await puebloResidenciaField.selectOption({ label: 'San Juan' })
      await page.getByRole('button', { name: 'Continuar' }).click()
    })

    await test.step('Enviar y finalizar la solicitud', async () => {
      const btnEnviar = page.getByRole('button', { name: 'Enviar' })
      await expect(btnEnviar).toBeVisible({ timeout: 30000 })
      await expect(btnEnviar).toBeEnabled({ timeout: 30000 })
      await btnEnviar.click()
    })
  })
}