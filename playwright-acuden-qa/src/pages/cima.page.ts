/**
 * cima.page.ts
 * Page Object para el portal CIMA (administración de cuentas).
 * Cubre: login, gestión de sesiones, navegación, confirmación de usuario.
 *
 * REGLA: sin `expect()` aquí — solo localizadores y acciones.
 */

import { Page, BrowserContext, Locator } from '@playwright/test'
import { CredencialesCima } from '../types/index.js'
import { guardarUsuario } from '../utils/usuario-helper.js'

const URL_CIMA = 'https://cima-qa.azurewebsites.net/'

export class CimaPage {
  readonly page: Page
  readonly context: BrowserContext

  // ------------------------------------------------------------------
  // Localizadores — Login
  // ------------------------------------------------------------------
  readonly inputUsername: Locator
  readonly inputPassword: Locator
  readonly btnLogin:      Locator

  // ------------------------------------------------------------------
  // Localizadores — Modal de sesiones activas
  // ------------------------------------------------------------------
  readonly modalSesiones:      Locator
  readonly checkboxesSesiones: Locator
  readonly btnCerrarSesiones:  Locator

  // ------------------------------------------------------------------
  // Localizadores — Navegación
  // ------------------------------------------------------------------
  readonly enlaceSeguridad:  Locator
  readonly enlaceFamilia:    Locator
  readonly enlaceSolicitudes: Locator

  // ------------------------------------------------------------------
  // Localizadores — Tabla de solicitudes
  // ------------------------------------------------------------------
  readonly btnUltimaPaginacion: Locator
  readonly ultimaFilaTabla:     Locator

  // ------------------------------------------------------------------
  // Localizadores — Modal demográfico (Registro Único)
  // ------------------------------------------------------------------
  readonly btnAbrirModalRU:     Locator
  readonly modalDemografico:    Locator
  readonly btnUltimaPaginaModal: Locator

  // ------------------------------------------------------------------
  // Localizadores — Creación de cuenta
  // ------------------------------------------------------------------
  readonly btnCrearUsuario:   Locator
  readonly inputNombreUsuario: Locator

  // ------------------------------------------------------------------
  // Localizadores — Notificaciones y restablecimiento de contraseña
  // ------------------------------------------------------------------
  readonly btnNotificaciones:    Locator
  readonly radioPasswordReset:   Locator
  readonly radioEmailA:          Locator
  readonly btnSendNotification:  Locator
  readonly textoNotificacionOk:  Locator

  constructor(page: Page, context: BrowserContext) {
    this.page    = page
    this.context = context

    // Login
    this.inputUsername = page.locator('#Username')
    this.inputPassword = page.locator('input[type="password"]')
    this.btnLogin      = page.locator('button[type="submit"]')

    // Modal sesiones
    this.modalSesiones      = page.locator('.modal-body')
    this.checkboxesSesiones = page.locator('input.form-check-input')
    this.btnCerrarSesiones  = page.locator('.modal-body button.btn.btn-primary')

    // Navegación
    this.enlaceSeguridad   = page.locator('a[href="/Security"] i.fa-user-lock')
    this.enlaceFamilia     = page.locator('a[href*="PartyType=Family"]')
    this.enlaceSolicitudes = page.locator('a:has(i.fa-laptop-code)')

    // Tabla
    this.btnUltimaPaginacion = page.locator('ul.pagination li:last-child a')
    this.ultimaFilaTabla     = page.locator('tbody tr').last()

    // Modal RU
    this.btnAbrirModalRU      = page.locator('a:has(i.fa-hand-pointer)')
    this.modalDemografico     = page.locator('.modal-content:visible')
    this.btnUltimaPaginaModal = page.locator('.modal-content:visible li.page-item:has(i.bi-chevron-double-right)')

    // Creación cuenta
    this.btnCrearUsuario   = page.getByRole('button', { name: /Create user|Crear usuario/i }).first()
    this.inputNombreUsuario = page
      .getByLabel(/Nombre de usuario|Username/i)
      .or(page.locator('input[id*="Username" i], input[name*="Username" i]'))
      .first()

    // Notificaciones
    this.btnNotificaciones   = page
      .getByRole('button', { name: 'Notificaciones', exact: true })
      .or(page.locator('button:has(i.fa-envelope)'))
      .first()
    this.radioPasswordReset  = page.getByRole('radio', { name: /Password reset instructions/i })
    this.radioEmailA         = page.getByRole('radio', { name: /Email to/i }).first()
    this.btnSendNotification = page.getByRole('button', { name: /Send/i })
    this.textoNotificacionOk = page.getByText(/Notification sent/i)
  }

  // ------------------------------------------------------------------
  // Acciones
  // ------------------------------------------------------------------

  /** Navega a CIMA e inicia sesión con las credenciales dadas */
  async iniciarSesion(credenciales: CredencialesCima): Promise<void> {
    await this.page.goto(URL_CIMA, { waitUntil: 'domcontentloaded' })
    await this.inputUsername.fill(credenciales.username)
    await this.inputPassword.fill(credenciales.password)
    await this.btnLogin.click()
    await this.page.waitForTimeout(3_000)
  }

  /** Cierra sesiones activas si el modal aparece */
  async gestionarSesionesActivas(): Promise<void> {
    if ((await this.checkboxesSesiones.count()) > 0) {
      if ((await this.modalSesiones.count()) > 0) {
        const ultimoCheckbox = this.modalSesiones.locator('input.form-check-input').last()
        await ultimoCheckbox.waitFor({ state: 'visible', timeout: 10_000 })
        await ultimoCheckbox.click({ force: true })
        await this.btnCerrarSesiones.click()
        await this.page.waitForLoadState('networkidle')
      }
    }
    await this.page.waitForLoadState('networkidle')
  }

  /** Navega a Seguridad → Familia → Solicitudes */
  async navegarASolicitudesFamilia(): Promise<void> {
    await this.enlaceSeguridad.click()
    await this.enlaceFamilia.click()
    await this.page.waitForLoadState('networkidle')
    await this.enlaceSolicitudes.waitFor({ state: 'visible', timeout: 30_000 })
    await this.enlaceSolicitudes.click()
    await this.page.waitForLoadState('networkidle')
  }

  /** Selecciona la última solicitud de la tabla (última página, última fila) */
  async seleccionarUltimaSolicitud(): Promise<void> {
    if (await this.btnUltimaPaginacion.isVisible()) {
      await this.btnUltimaPaginacion.click()
      await this.page.waitForLoadState('networkidle')
    }
    await this.ultimaFilaTabla.locator('button').last().click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Abre el modal de Registro Único, navega a la última página,
   * selecciona la fila "Persona no encontrada" y confirma.
   */
  async seleccionarRegistroUnicoDemografico(): Promise<void> {
    await this.btnAbrirModalRU.click()
    await this.modalDemografico.waitFor({ state: 'visible', timeout: 10_000 })

    // Ir a la última página del modal si está habilitada
    if (await this.btnUltimaPaginaModal.isVisible()) {
      const deshabilitado = await this.btnUltimaPaginaModal.evaluate(el =>
        el.classList.contains('disabled')
      )
      if (!deshabilitado) {
        await this.btnUltimaPaginaModal.locator('a.page-link').click()
        await this.page.waitForLoadState('networkidle')
      }
    }

    const filaObjetivo = this.modalDemografico
      .locator('tbody tr')
      .filter({ hasText: /Persona no encontrada|Person not found/i })
      .last()

    await filaObjetivo.waitFor({ state: 'visible', timeout: 10_000 })
    const checkbox = filaObjetivo.locator('input[type="checkbox"]')
    await checkbox.check({ force: true })

    const btnContinuar = this.modalDemografico.locator('button.btn-primary')
    await btnContinuar.waitFor({ state: 'visible', timeout: 10_000 })
    await btnContinuar.click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Crea la cuenta familiar y persiste el número de usuario en disco.
   * @returns número de usuario CIMA recién creado
   */
  async crearCuentaYGuardarUsuario(): Promise<string> {
    await this.page.waitForTimeout(1_000)
    await this.btnCrearUsuario.scrollIntoViewIfNeeded()
    await this.btnCrearUsuario.click()

    // Confirmaciones de modales (recordatorio + éxito)
    await this.page.waitForTimeout(1_000)
    const reminderText = this.page.getByText(/Remember to check your email/i)
    if (await reminderText.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await reminderText.click()
    }

    await this.page.waitForTimeout(1_000)
    await this.page.getByRole('button', { name: /Accept|Aceptar/i }).first().click()

    await this.page.waitForTimeout(1_000)
    const modalSuccess = this.page.locator('.account-success-modal-body, .modal-body').first()
    if (await modalSuccess.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await modalSuccess.click()
    }

    await this.page.waitForTimeout(1_000)
    const btnAcceptFinal = this.page.getByRole('button', { name: /Accept|Aceptar/i }).first()
    if (await btnAcceptFinal.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnAcceptFinal.click()
    }

    await this.page.waitForTimeout(1_000)
    await this.page.locator('.form-group').first().click()

    // Capturar el número de usuario asignado
    await this.inputNombreUsuario.waitFor({ state: 'visible', timeout: 10_000 })
    const numeroUsuario = (await this.inputNombreUsuario.inputValue()).trim()
    console.log(`[CimaPage] Usuario creado: ${numeroUsuario}`)

    guardarUsuario(numeroUsuario)
    return numeroUsuario
  }

  /** Busca un usuario por nombre en la lista de gestión */
  async buscarUsuario(usuario: string): Promise<void> {
    await this.page.locator('.form-group').first().click()
    await this.page.getByRole('button', { name: /Return to search/i }).click()
    await this.page.getByRole('button', { name: /Accept/i }).click()
    await this.page.getByRole('button', { name: /Username/i }).click()

    const searchInput = this.page.getByRole('textbox', { name: /Enter the search term/i })
    await searchInput.click()
    await searchInput.fill(usuario)
    await this.page.getByRole('button', { name: /Search/i }).click()
    await this.page.waitForLoadState('networkidle')

    const primeraFila = this.page.locator('table tbody tr').first()
    await primeraFila.waitFor({ state: 'visible', timeout: 15_000 })
    await primeraFila.click()
  }

  /**
   * Envía la notificación de restablecimiento de contraseña al correo del usuario.
   * @returns correo electrónico detectado en la pantalla
   */
  async enviarNotificacionRestablecimiento(): Promise<string> {
    await this.btnNotificaciones.waitFor({ state: 'visible', timeout: 10_000 })
    await this.btnNotificaciones.click()

    await this.page.getByText(/Password reset instructions/i).click()
    await this.radioPasswordReset.check()

    await this.radioEmailA.waitFor({ state: 'visible', timeout: 10_000 })

    // Extraer la dirección de correo del label del radio
    const textoLabel = (await this.radioEmailA.evaluate(el => {
      const label =
        document.querySelector(`label[for="${(el as HTMLInputElement).id}"]`) ||
        el.closest('label') ||
        el.parentElement
      return label ? label.textContent ?? '' : ''
    })).trim()

    const matchEmail = textoLabel.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    let emailCompleto = matchEmail ? matchEmail[0] : ''

    if (!emailCompleto) {
      const emailCell = this.page
        .locator('table tbody tr td')
        .filter({ hasText: /@yopmail\.com/i })
        .first()
      if (await emailCell.isVisible().catch(() => false)) {
        emailCompleto = (await emailCell.innerText()).trim()
      }
    }

    console.log(`[CimaPage] Correo para restablecimiento: ${emailCompleto}`)

    await this.radioEmailA.check()
    await this.btnSendNotification.click()

    return emailCompleto
  }

  /**
   * Abre Yopmail, encuentra el correo de restablecimiento y navega a la URL de reset.
   * @param emailCompleto - dirección completa (ej. user@yopmail.com)
   * @returns la Page de Yopmail ya en la pantalla de nueva contraseña
   */
  async abrirEnlaceRestablecimiento(emailCompleto: string): Promise<Page> {
    const inboxName = emailCompleto.split('@')[0]
    const yopmailPage = await this.context.newPage()

    await yopmailPage.goto(`https://yopmail.com/?${inboxName}`, { waitUntil: 'domcontentloaded' })

    const inboxInput = yopmailPage.locator('#login')
    if (await inboxInput.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await inboxInput.fill(inboxName)
      await yopmailPage.locator('#refreshbut button, #refreshbut').click()
    }

    const inboxFrame = yopmailPage.frameLocator('#ifinbox')
    const correoAsunto = inboxFrame
      .locator('.m')
      .filter({ hasText: /Password Change|Cambio de contraseña|Cambio de clave/i })
      .first()

    try {
      await correoAsunto.waitFor({ state: 'visible', timeout: 15_000 })
    } catch {
      console.log('[CimaPage] Refrescando bandeja Yopmail...')
      await yopmailPage.locator('#refresh').click()
      await correoAsunto.waitFor({ state: 'visible', timeout: 20_000 })
    }

    await correoAsunto.click()

    const mailFrame = yopmailPage.frameLocator('#ifmail')
    const botonEnlace = mailFrame
      .locator("xpath=//strong[contains(text(), 'ACUDEN Digital')]/following::a[1]")
      .or(mailFrame.locator("strong:has-text('ACUDEN Digital') ~ a").first())

    await botonEnlace.waitFor({ state: 'visible', timeout: 15_000 })
    const urlReseteo = await botonEnlace.getAttribute('href')
    console.log(`[CimaPage] URL de restablecimiento: ${urlReseteo}`)

    if (urlReseteo) {
      await yopmailPage.goto(urlReseteo, { waitUntil: 'domcontentloaded' })
    } else {
      await botonEnlace.click()
    }

    return yopmailPage
  }

  /**
   * Ingresa la nueva contraseña en la pantalla de restablecimiento.
   * @param yopmailPage - página de Yopmail ya en el formulario de reset
   * @param password    - nueva contraseña a establecer
   */
  async asignarNuevaContrasena(yopmailPage: Page, password: string): Promise<void> {
    const inputsPassword = yopmailPage.locator('input[type="password"]')
    await inputsPassword.first().waitFor({ state: 'visible', timeout: 15_000 })
    await inputsPassword.nth(0).fill(password)
    await inputsPassword.nth(1).fill(password)

    const btnGuardar = yopmailPage.getByRole('button', {
      name: /Reestablecer|Restore|Save|Reset password|Change password|Enviar|Guardar/i,
    }).first()

    if (await btnGuardar.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnGuardar.click()
    }
  }
}

