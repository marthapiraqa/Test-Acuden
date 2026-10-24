/**
 * confirmar-cuenta-cima.spec.ts
 * Suite: Confirmar el último usuario en CIMA y enviar notificación de
 *        restablecimiento de contraseña.
 *
 * Usa: CimaPage (login → sesiones → navegación → selección → RU → crear cuenta
 *               → notificación → Yopmail → nueva contraseña)
 */

import { test, expect } from '@playwright/test'
import { CimaPage } from '../../src/pages/cima.page'
import solicitantes from '../../data/solicitantes.json'

// ------------------------------------------------------------------
// Constantes del dominio
// ------------------------------------------------------------------
const CREDENCIALES_CIMA = { username: 'kpg2', password: 'Cima123...' }

test.use({ launchOptions: { slowMo: 500 } })

test('Confirmar Usuario - Último registro', async ({ page, context }) => {
  test.setTimeout(300_000)

  const cima     = new CimaPage(page, context)
  // La contraseña nueva viene del JSON de solicitantes (primer elemento)
  const password = String(solicitantes[0]?.clavenueva ?? '').trim()

  // ── 1. Login ────────────────────────────────────────────────
  await test.step('Inicio de sesión en CIMA', async () => {
    await cima.iniciarSesion(CREDENCIALES_CIMA)
  })

  // ── 2. Gestión de sesiones activas ──────────────────────────
  await test.step('Gestionar sesiones activas (si aplica)', async () => {
    await cima.gestionarSesionesActivas()
  })

  // ── 3. Navegar a Solicitudes de Familia ─────────────────────
  await test.step('Navegar a Seguridad → Familia → Solicitudes', async () => {
    await cima.navegarASolicitudesFamilia()
  })

  // ── 4. Seleccionar la última solicitud ──────────────────────
  await test.step('Seleccionar última solicitud de la tabla', async () => {
    await expect(cima.ultimaFilaTabla).toBeVisible()
    await cima.seleccionarUltimaSolicitud()
  })

  // ── 5. Registro Único Demográfico ───────────────────────────
  await test.step('Seleccionar Registro Único Demográfico', async () => {
    await expect(cima.btnAbrirModalRU).toBeVisible({ timeout: 30_000 })
    await cima.seleccionarRegistroUnicoDemografico()
  })

  // ── 6. Crear cuenta y guardar número de usuario ─────────────
  let numeroUsuario = ''
  await test.step('Crear cuenta Familia y guardar usuario', async () => {
    numeroUsuario = await cima.crearCuentaYGuardarUsuario()
    expect(numeroUsuario).toBeTruthy()
    console.log(`✔ Usuario creado: ${numeroUsuario}`)
  })

  // ── 7. Buscar el usuario creado y enviar notificación ───────
  let emailCompleto = ''
  await test.step('Buscar usuario y enviar notificación de restablecimiento', async () => {
    await cima.buscarUsuario(numeroUsuario)
    emailCompleto = await cima.enviarNotificacionRestablecimiento()
    await expect(cima.textoNotificacionOk).toBeVisible({ timeout: 15_000 })
    expect(emailCompleto).toContain('@')
    console.log(`✔ Notificación enviada a: ${emailCompleto}`)
  })

  // ── 8. Yopmail: navegar al enlace de restablecimiento ───────
  await test.step('Recuperar enlace de restablecimiento desde Yopmail', async () => {
    const yopmailPage = await cima.abrirEnlaceRestablecimiento(emailCompleto)
    await expect(
      yopmailPage.locator('input[type="password"], input[id*="Password" i]').first()
    ).toBeVisible({ timeout: 20_000 })

    // ── 9. Asignar nueva contraseña ─────────────────────────
    await cima.asignarNuevaContrasena(yopmailPage, password)
    console.log('✔ Contraseña restablecida correctamente')
  })
})
