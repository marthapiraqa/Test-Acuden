/**
 * solicitar-cuenta-acuden.spec.ts
 * Suite: Solicitar Cuenta Familia en ACUDEN Digital
 *
 * Flujo: Selección tipo → Validación IA → Datos personales →
 *        Contacto + OTP → Envío de solicitud
 */

import { test, expect } from '@playwright/test'
import { fakerES as faker } from '@faker-js/faker'
import path from 'path'
import { AcudenPage } from '../../src/pages/acuden.page'
import solicitantes from '../../data/solicitantes.json'

// ------------------------------------------------------------------
// Constantes del dominio
// ------------------------------------------------------------------
const REMITENTE_OTP  = 'noreply@familia.pr.gov'
const REGEX_OTP      = /es:\s*(\d{4,8})/i
const RUTA_FOTO      = path.resolve('resources', 'foto-familia-7.jpg')

// ------------------------------------------------------------------
// Helper: genera un correo Yopmail limpio a partir de faker
// ------------------------------------------------------------------
function generarCorreoYopmail(): { prefijo: string; completo: string } {
  const prefijo = `${faker.person.firstName()}.${faker.person.lastName()}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]/g, '')
  return { prefijo, completo: `${prefijo}@yopmail.com` }
}

// ------------------------------------------------------------------
// Suite parametrizada (un test por cada entrada en solicitantes.json)
// ------------------------------------------------------------------
for (const persona of solicitantes) {
  test(`Solicitar Cuenta Familia - ID ${persona.id}`, async ({ page, context }) => {
    test.setTimeout(360_000)
    test.use({ launchOptions: { slowMo: 800 } })

    const correo = generarCorreoYopmail()
    const acuden  = new AcudenPage(page, context)

    // ----------------------------------------------------------
    // Datos personales generados (la IA puede pre-llenar algunos)
    // ----------------------------------------------------------
    const datosPersonales = {
      nombre:          faker.person.firstName().split(' ')[0],
      apellido:        faker.person.lastName().split(' ')[0],
      nombre2:         faker.person.middleName().split(' ')[0],
      apellido2:       faker.person.lastName().split(' ')[0],
      fechaNacimiento: persona.fechaNacimiento,
      paisNacimiento:  persona.paisNacimiento,
      puebloNacimiento: persona.puebloNacimiento,
    }

    // ── Paso 1: Navegar e iniciar flujo ────────────────────────
    await test.step('Navegar e iniciar flujo de solicitud', async () => {
      await acuden.navegarEIniciarFlujo()
    })

    // ── Paso 2: Validación IA ──────────────────────────────────
    await test.step('Completar validación con Inteligencia Artificial', async () => {
      await acuden.completarValidacionIA(RUTA_FOTO)

      await expect(acuden.mensajeValidacion).toBeVisible({ timeout: 120_000 })
      await expect(acuden.labelPrimerNombre).toBeVisible()
    })

    // ── Paso 3: Datos personales ───────────────────────────────
    await test.step('Completar formulario de datos personales', async () => {
      await acuden.completarDatosPersonales(datosPersonales)
    })

    // ── Paso 4: Contacto + OTP ─────────────────────────────────
    await test.step('Ingresar contacto y validar código OTP', async () => {
      await expect(acuden.selectPuebloRes).toBeVisible({ timeout: 20_000 })
      await expect(acuden.inputEmail).toBeVisible({ timeout: 20_000 })

      await acuden.completarContactoYValidarOtp(
        { correoYopmail: correo.prefijo, puebloResidencia: 'San Juan' },
        REMITENTE_OTP,
        REGEX_OTP
      )

      await expect(acuden.textoVerificacion).toBeVisible({ timeout: 30_000 })
    })

    // ── Paso 5: Envío de solicitud ─────────────────────────────
    await test.step('Enviar y finalizar la solicitud', async () => {
      await acuden.enviarSolicitud()
      await expect(acuden.textoSometida).toBeVisible({ timeout: 120_000 })
      console.log('✔ ACUDEN DIGITAL - Solicitud enviada correctamente')
    })
  })
}

