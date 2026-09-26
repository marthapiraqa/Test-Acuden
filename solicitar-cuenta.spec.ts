import { test, expect } from '@playwright/test'
import path from 'path'
import { obtenerCodigoYopmail } from '../utils/yopmail'

const correoYopmail = 'qa1789774212670' // usuario de Yopmail (sin @yopmail.com)
const remitenteEsperado = 'noreply@familia.pr.gov'
const regexOtp = /es:\s*(\d{4,8})/i

test('Solicitar Cuenta Familia', async ({ page, context }) => {
  await page.goto('https://acudendigital-qa2.azurewebsites.net/')

  await page.getByText('Solicitar cuenta').click()
  await page.getByText('Solicitante').click()
  await page.getByText('Es la primera vez solicitando los servicios').click()
  await page.getByText('Continuar').click()

  await page.locator('[href="/Applicant/ArtificialIntelligence/"]').click()

  await page
    .locator('[name="ArtificialIntelligenceValidationModel.IdentityEvidenceId"]')
    .selectOption({ label: 'Certificado de Nacimiento' })

  // Ruta PDF de prueba
  await page.setInputFiles('#FileUrlInput', path.join('C:\Users\kpgdev\OneDrive - KPG (Knowledge Power Group),Inc\QA\Personal\Playwright Curso\playwright-acuden-qa\playwright-acuden-qa\fixtures', '..', 'fixtures', 'Evidencia.pdf'))
  await page.waitForTimeout(10000)

  await expect(page.locator('#FileUrlInput')).toHaveJSProperty('files.length', 1)

  await expect(page.getByText('Continuar')).toBeEnabled({ timeout: 50000 })
  await page.getByText('Continuar').click()

  await expect(
    page.getByText('Su proceso de validación fue completado exitosamente')
  ).toBeVisible({ timeout: 120000 })

  await expect(page.getByText('Primer nombre')).toBeVisible()

  // =====================================================
  // DATOS PERSONALES
  // =====================================================
  const nombreField = page.locator('#Name')
  const nombreActual = await nombreField.inputValue()
  if (!nombreActual || nombreActual.trim() === 'Fabiana') {
    await nombreField.fill('Pilar')
  }

  const apellidoField = page.locator('#LastName')
  const apellidoActual = await apellidoField.inputValue()
  if (!apellidoActual || apellidoActual.trim() === 'Perez') {
    await apellidoField.fill('Reyes')
  }

    const fechaField = page.locator(
    '#Birthday input[placeholder="dd/mm/aaaa"]'
  )
  const fechaActual = await fechaField.inputValue()
  console.log('Fecha actual:', fechaActual)
  if (!fechaActual?.trim()) {
    await fechaField.fill('01/01/1990')
    await fechaField.blur()
  }

  const paisField = page.locator('#CountryOfBirthId')
  const paisActual = await paisField.inputValue()
  if (paisActual === '' || paisActual === '7') {
    await paisField.selectOption({ label: 'Puerto Rico' })
  }

  const puebloNacField = page.locator('#TownOfBirthId')
  const puebloNacActual = await puebloNacField.inputValue()
  if (puebloNacActual === '' || puebloNacActual === '0') {
    await puebloNacField.selectOption({ label: 'San Juan' })
  }

  await expect(page.getByText('Continuar')).toBeEnabled({ timeout: 30000 })
  await page.getByText('Continuar').click()

  // Esperar que cargue la pantalla de "Solicitud de Cuenta"
  await page.waitForTimeout(10000)

  // =====================================================
  // SOLICITUD DE CUENTA: VERIFICAR CORREO ELECTRÓNICO
  // =====================================================
  const correoYopmailCompleto = `${correoYopmail}@yopmail.com`

  await page.fill('#Email', correoYopmailCompleto)
  await page.locator('#Email').blur() // dispara la validación que habilita el botón

  await page.getByText('Enviar código').click()

  // Confirmar que el popup está visible antes de ir a buscar el código
  await expect(page.getByText('Verificación de código')).toBeVisible({ timeout: 30000 })

  // Se abre y se cierra una pestaña APARTE para consultar Yopmail. 
  const codigo = await obtenerCodigoYopmail(context, {
    correo: correoYopmail,
    remitenteEsperado,
    regex: regexOtp
  })

  await page.fill('#VerificationCode', codigo)

  // El botón "Validar" tarda un momento en habilitarse tras escribir el código
  await page.waitForTimeout(30000)
  await page.getByRole('button', { name: 'Validar' }).click()

  // =====================================================
  // PUEBLO Y REGIÓN DE RESIDENCIA (aparecen tras validar el código)
  // =====================================================
  const puebloResField = page.locator('#ResidenceTownId')
  const puebloResActual = await puebloResField.inputValue()
  if (!puebloResActual || puebloResActual === '0') {
    await puebloResField.selectOption({ label: 'San Juan' })
  }

  // Confirmar si Región se autocompleta al elegir el Pueblo
    const regionActual = await page.locator('#RegionId').inputValue()
  if (!regionActual || regionActual === '0') {
    console.log('RegionId quedó vacío tras elegir el Pueblo — falta indicar qué opción seleccionar')
  }

  await page.getByText('Continuar').click()
  await page.waitForTimeout(20000)
  await page.getByText('Enviar').click()
})
