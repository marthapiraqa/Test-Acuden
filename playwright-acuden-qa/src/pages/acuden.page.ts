/**
 * acuden.page.ts
 * Page Object para el portal ACUDEN Digital.
 * Cubre el flujo completo de solicitud de cuenta Familia.
 *
 * REGLA: sin `expect()` aquí — solo localizadores y acciones.
 */

import { Page, BrowserContext, Locator } from '@playwright/test'
import { DatosPersonales, DatosContacto } from '../types/index.js'
import { obtenerCodigoYopmail } from '../utils/yopmail.js'

const URL_ACUDEN = 'https://acudendigital-qa2.azurewebsites.net/'

export class AcudenPage {
  readonly page: Page
  readonly context: BrowserContext

  // ------------------------------------------------------------------
  // Localizadores — Paso 1: Selección de tipo de cuenta
  // ------------------------------------------------------------------
  readonly btnSolicitarCuenta: Locator
  readonly btnTipoSolicitante:  Locator
  readonly btnPrimeraVez:       Locator
  readonly btnContinuar:        Locator

  // ------------------------------------------------------------------
  // Localizadores — Paso 2: Validación IA
  // ------------------------------------------------------------------
  readonly enlaceIA:         Locator
  readonly selectDocumento:  Locator
  readonly inputArchivoIA:   Locator
  readonly btnContinuarIA:   Locator
  readonly mensajeValidacion: Locator
  readonly labelPrimerNombre: Locator

  // ------------------------------------------------------------------
  // Localizadores — Paso 3: Datos personales
  // ------------------------------------------------------------------
  readonly inputNombre:      Locator
  readonly inputApellido:    Locator
  readonly inputNombre2:     Locator
  readonly inputApellido2:   Locator
  readonly inputFecha:       Locator
  readonly selectPais:       Locator
  readonly selectPuebloNac:  Locator

  // ------------------------------------------------------------------
  // Localizadores — Paso 4: Contacto + OTP
  // ------------------------------------------------------------------
  readonly selectPuebloRes:     Locator
  readonly inputEmail:          Locator
  readonly btnEnviarCodigo:     Locator
  readonly textoVerificacion:   Locator
  readonly inputCodigo:         Locator
  readonly btnValidar:          Locator

  // ------------------------------------------------------------------
  // Localizadores — Paso 5: Envío
  // ------------------------------------------------------------------
  readonly radioNinguno:        Locator
  readonly btnEnviar:           Locator
  readonly textoSometida:       Locator

  constructor(page: Page, context: BrowserContext) {
    this.page    = page
    this.context = context

    // Paso 1
    this.btnSolicitarCuenta = page.getByText('Solicitar cuenta')
    this.btnTipoSolicitante = page.getByText('Solicitante')
    this.btnPrimeraVez      = page.getByText('Es la primera vez solicitando los servicios')
    this.btnContinuar       = page.getByRole('button', { name: 'Continuar' })

    // Paso 2 — IA
    this.enlaceIA          = page.locator('[href="/Applicant/ArtificialIntelligence/"]')
    this.selectDocumento   = page.locator('[name="ArtificialIntelligenceValidationModel.IdentityEvidenceId"]')
    this.inputArchivoIA    = page.locator('#FileUrlInput')
    this.btnContinuarIA    = page.locator('button, input[type="submit"]')
      .filter({ hasText: /^Continuar$/i })
      .first()
    this.mensajeValidacion = page.getByText(/Su proceso de validaci[oó]n|validaci[oó]n fue completado exitosamente/i)
    this.labelPrimerNombre = page.getByText('Primer nombre')

    // Paso 3 — Datos personales
    this.inputNombre     = page.locator('#Name')
    this.inputApellido   = page.locator('#LastName')
    this.inputNombre2    = page.locator('#SecondName')
    this.inputApellido2  = page.locator('#SecondLastName')
    this.inputFecha      = page.locator('#Birthday input[placeholder="dd/mm/aaaa"]')
    this.selectPais      = page.locator('#CountryOfBirthId')
    this.selectPuebloNac = page.locator('#TownOfBirthId')

    // Paso 4 — Contacto + OTP
    this.selectPuebloRes   = page.locator('#ResidenceTownId')
    this.inputEmail        = page.locator('#Email')
    this.btnEnviarCodigo   = page.getByRole('button', { name: 'Enviar código' })
    this.textoVerificacion = page.getByText('Verificación de código')
    this.inputCodigo       = page.locator('#VerificationCode')
    this.btnValidar        = page.getByRole('button', { name: 'Validar' })

    // Paso 5 — Envío
    this.radioNinguno  = page.locator('#related_0')
    this.btnEnviar     = page.locator('button:has-text("Enviar"):has(i.fa-chevron-right)')
    this.textoSometida = page.getByText('Solicitud de Cuenta Sometida')
  }

  // ------------------------------------------------------------------
  // Acciones
  // ------------------------------------------------------------------

  /** Navega al portal y selecciona el tipo de solicitante */
  async navegarEIniciarFlujo(): Promise<void> {
    await this.page.goto(URL_ACUDEN)
    await this.btnSolicitarCuenta.click()
    await this.btnTipoSolicitante.click()
    await this.btnPrimeraVez.click()
    await this.btnContinuar.click()
  }

  /**
   * Completa la validación con IA subiendo el archivo indicado.
   * @param rutaArchivo - ruta absoluta al PDF o JPG de evidencia
   */
  async completarValidacionIA(rutaArchivo: string): Promise<void> {
    await this.enlaceIA.click()
    await this.selectDocumento.selectOption({ label: 'Certificado de Nacimiento' })
    await this.inputArchivoIA.setInputFiles(rutaArchivo)
    await this.inputArchivoIA.dispatchEvent('change')
    await this.page.waitForTimeout(20_000)

    await this.btnContinuarIA.scrollIntoViewIfNeeded()

    // Fallback JS-click si el clic nativo falla (overlay invisible)
    try {
      await this.btnContinuarIA.click({ timeout: 5_000 })
    } catch {
      console.log('[AcudenPage] Clic nativo falló — usando evaluate click')
      await this.btnContinuarIA.evaluate((el: HTMLElement) => el.click())
    }
  }

  /**
   * Completa el formulario de datos personales.
   * Solo rellena campos que estén vacíos (la IA puede haberlos pre-llenado).
   */
  async completarDatosPersonales(datos: DatosPersonales): Promise<void> {
    await this._rellenarSiVacio(this.inputNombre,    datos.nombre)
    await this._rellenarSiVacio(this.inputApellido,  datos.apellido)
    if (datos.nombre2)   await this._rellenarSiVacio(this.inputNombre2,   datos.nombre2)
    if (datos.apellido2) await this._rellenarSiVacio(this.inputApellido2, datos.apellido2)

    const fechaActual = await this.inputFecha.inputValue()
    if (fechaActual.trim() === '') {
      await this.inputFecha.fill(datos.fechaNacimiento)
    }
    await this.inputFecha.blur()

    await this._selectSiNoSeleccionado(this.selectPais,      datos.paisNacimiento)
    await this._selectSiNoSeleccionado(this.selectPuebloNac, datos.puebloNacimiento)

    await this.btnContinuar.click()
  }

  /**
   * Completa la sección de contacto, dispara el OTP y lo valida vía Yopmail.
   * @param datos         - pueblo de residencia y prefijo del correo Yopmail
   * @param remitenteOtp  - remitente esperado del correo OTP
   * @param regexOtp      - regex con grupo de captura para extraer el código
   */
  async completarContactoYValidarOtp(
    datos: DatosContacto,
    remitenteOtp: string,
    regexOtp: RegExp
  ): Promise<void> {
    await this.selectPuebloRes.selectOption({ label: datos.puebloResidencia })

    const correoCompleto = `${datos.correoYopmail}@yopmail.com`
    await this.inputEmail.fill(correoCompleto)
    await this.inputEmail.blur()

    await this.btnEnviarCodigo.click()

    const codigo = await obtenerCodigoYopmail(this.context, {
      correo: datos.correoYopmail,
      remitenteEsperado: remitenteOtp,
      regex: regexOtp,
    })

    await this.page.fill('#VerificationCode', codigo)
    await this.btnValidar.click()
    await this.page.waitForTimeout(2_000)
    await this.btnContinuar.click()
  }

  /**
   * Envía la solicitud final.
   * Maneja el caso donde ya fue sometida (idempotencia) y el caso con radio.
   */
  async enviarSolicitud(): Promise<void> {
    // ¿Ya fue sometida en este flujo?
    let yaSometida = false
    try {
      await this.textoSometida.waitFor({ state: 'visible', timeout: 10_000 })
      yaSometida = true
    } catch {
      yaSometida = false
    }

    if (yaSometida) {
      console.log('[AcudenPage] Solicitud ya estaba sometida')
      return
    }

    // Marcar radio "Ninguno de los anteriores" si está presente
    if (await this.radioNinguno.isVisible({ timeout: 5_000 }).catch(() => false)) {
      if (!(await this.radioNinguno.isChecked())) {
        await this.radioNinguno.check({ force: true })
      }
    }

    await this.page.waitForTimeout(5_000)
    await this.btnEnviar.click()
  }

  // ------------------------------------------------------------------
  // Helpers privados
  // ------------------------------------------------------------------

  private async _rellenarSiVacio(locator: Locator, valor: string): Promise<void> {
    const actual = await locator.inputValue()
    if (actual.trim() === '') await locator.fill(valor)
  }

  private async _selectSiNoSeleccionado(locator: Locator, label: string): Promise<void> {
    const opcionActual = await locator.locator('option:checked').innerText()
    if (opcionActual.trim().toLowerCase().includes('seleccionar') || opcionActual.trim() === '') {
      await locator.selectOption({ label })
    }
  }
}

