import { test, expect } from '@playwright/test'
import { obtenerCodigoYopmail } from '../utils/yopmail'

const remitenteEsperado = 'noreply@familia.pr.gov'
const regexOtp = /es:\s*(\d{4,8})/i

test('Solicitar Cuenta Familia', async ({ page, context }) => {
  // Correo Autogenerado
  const correoYopmail = `qa${Date.now()}${Math.floor(Math.random() * 100)}`
  const correoYopmailCompleto = `${correoYopmail}@yopmail.com`
  console.log(`Correo generado: ${correoYopmailCompleto}`)

  await page.goto('https://acudendigital-qa2.azurewebsites.net/')

  // =====================================================
  // INICIO SOLICITUD
  // =====================================================

  await page.getByText('Solicitar cuenta').click()
  await page.getByText('Solicitante').click()
  await page.getByText('Es la primera vez solicitando los servicios').click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  // =====================================================
  // VALIDACIÓN IA
  // =====================================================

  await page.locator('[href="/Applicant/ArtificialIntelligence/"]').click()
  await page.locator('[name="ArtificialIntelligenceValidationModel.IdentityEvidenceId"]')
    .selectOption({
      label: 'Certificado de Nacimiento'
    })

  await page.setInputFiles('#FileUrlInput','fixtures/Evidencia.pdf'  )
  await page.waitForTimeout(10000)
  await expect(page.locator('#FileUrlInput')).toHaveJSProperty('files.length', 1 )

  const btnContinuarIA = page.getByRole('button', {
    name: 'Continuar'
  })

  await expect(btnContinuarIA).toBeEnabled({
    timeout: 50000
  })

  await btnContinuarIA.click()

  await expect(
    page.getByText(
      'Su proceso de validación fue completado exitosamente'
    )
  ).toBeVisible({
    timeout: 120000
  })

  await expect(page.getByText('Primer nombre') ).toBeVisible()

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

  console.log(`Fecha actual: ${fechaActual}`)

  if (!fechaActual?.trim()) {
    await fechaField.fill('01/01/1990')
    await fechaField.blur()
  }

  const paisField = page.locator('#CountryOfBirthId')
  const paisActual = await paisField.inputValue()

  if (!paisActual || paisActual === '7') {
    await paisField.selectOption({
      label: 'Puerto Rico'
    })
  }

  const puebloNacimientoField = page.locator('#TownOfBirthId')
  const puebloNacimientoActual =
    await puebloNacimientoField.inputValue()

  if (
    !puebloNacimientoActual ||
    puebloNacimientoActual === '0'
  ) {
    await puebloNacimientoField.selectOption({
      label: 'San Juan'
    })
  }

  await page.getByRole('button', {
    name: 'Continuar'
  }).click()

  // =====================================================
  // SOLICITUD DE CUENTA
  // =====================================================

  await page.waitForTimeout(10000)

  await page.fill(
    '#Email',
    correoYopmailCompleto
  )

  await page.locator('#Email').blur()

  const btnEnviarCodigo = page.getByRole('button', {
    name: 'Enviar código'
  })

  await expect(btnEnviarCodigo).toBeEnabled({
    timeout: 30000
  })

  await btnEnviarCodigo.click()

  await expect(
    page.getByText('Verificación de código')
  ).toBeVisible({
    timeout: 30000
  })

  // =====================================================
  // OBTENER OTP DESDE YOPMAIL
  // =====================================================

  const codigo = await obtenerCodigoYopmail(
    context,
    {
      correo: correoYopmail,
      remitenteEsperado,
      regex: regexOtp
    }
  )

  console.log(`OTP obtenido: ${codigo}`)

  await page.fill(
    '#VerificationCode',
    codigo
  )

  const btnValidar = page.getByRole('button', {
    name: 'Validar'
  })

  await expect(btnValidar).toBeVisible()

  await expect(btnValidar).toBeEnabled({
    timeout: 30000
  })

  await btnValidar.click()

  // =====================================================
  // RESIDENCIA
  // =====================================================

  await page.waitForTimeout(5000)

  const puebloResidenciaField =
    page.locator('#ResidenceTownId')

  const puebloResidenciaActual =
    await puebloResidenciaField.inputValue()

  if (
    !puebloResidenciaActual ||
    puebloResidenciaActual === '0'
  ) {
    await puebloResidenciaField.selectOption({
      label: 'San Juan'
    })
  }

  const regionField = page.locator('#RegionId')

  const regionActual =
    await regionField.inputValue()

  console.log(
    `Region seleccionada: ${regionActual}`
  )

  if (
    !regionActual ||
    regionActual === '0'
  ) {
    console.log(
      'RegionId quedó vacío tras elegir el Pueblo'
    )
  }

  await page.getByRole('button', {
    name: 'Continuar'
  }).click()

  await page.waitForTimeout(20000)

  const btnEnviar = page.getByRole('button', {
    name: 'Enviar'
  })

  await expect(btnEnviar).toBeVisible()

  await expect(btnEnviar).toBeEnabled({
    timeout: 30000
  })

  await btnEnviar.click()
})