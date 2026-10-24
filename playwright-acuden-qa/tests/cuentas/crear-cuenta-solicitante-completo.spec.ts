/**
 * crear-cuenta-solicitante-completo.spec.ts
 * Suite: Flujo Completo — Solicitar cuenta en ACUDEN + Confirmar en CIMA
 *
 * Fase 1: Portal ACUDEN Digital (solicitud de cuenta Familia)
 * Fase 2: Portal CIMA (confirmar cuenta + envío notificación de contraseña)
 */

import { test, expect } from '@playwright/test'
import { fakerES as faker } from '@faker-js/faker'
import path from 'path'
import { AcudenPage } from '../../src/pages/acuden.page'
import { CimaPage }   from '../../src/pages/cima.page'
import solicitantes   from '../../data/solicitantes.json'

// ------------------------------------------------------------------
// Constantes del dominio
// ------------------------------------------------------------------
const REMITENTE_OTP = 'noreply@familia.pr.gov'
const REGEX_OTP     = /es:\s*(\d{4,8})/i
const RUTA_FOTO     = path.resolve('resources', 'foto-familia-7.jpg')
const CREDENCIALES_CIMA = { username: 'kpg2', password: 'Cima123...' }

function generarCorreoYopmail(): { prefijo: string; completo: string } {
  const prefijo = `${faker.person.firstName()}.${faker.person.lastName()}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]/g, '')
  return { prefijo, completo: `${prefijo}@yopmail.com` }
}

// ------------------------------------------------------------------
// Suite parametrizada
// ------------------------------------------------------------------
test.use({ launchOptions: { slowMo: 800 } })

for (const persona of solicitantes) {
  test(`Flujo Completo Crear Cuenta Familia - ID ${persona.id}`, async ({ page, context }) => {
    test.setTimeout(360_000)

    const correo  = generarCorreoYopmail()
    const acuden  = new AcudenPage(page, context)
    const cima    = new CimaPage(page, context)

    const datosPersonales = {
      nombre:           faker.person.firstName().split(' ')[0],
      apellido:         faker.person.lastName().split(' ')[0],
      nombre2:          faker.person.middleName().split(' ')[0],
      apellido2:        faker.person.lastName().split(' ')[0],
      fechaNacimiento:  persona.fechaNacimiento,
      paisNacimiento:   persona.paisNacimiento,
      puebloNacimiento: persona.puebloNacimiento,
    }

    // ════════════════════════════════════════════════════════════
    // FASE 1: SOLICITAR CUENTA EN ACUDEN DIGITAL
    // ════════════════════════════════════════════════════════════

    await test.step('Navegar e iniciar flujo de solicitud', async () => {
      await acuden.navegarEIniciarFlujo()
    })

    await test.step('Completar validación con Inteligencia Artificial', async () => {
      await acuden.completarValidacionIA(RUTA_FOTO)
      await expect(acuden.mensajeValidacion).toBeVisible({ timeout: 120_000 })
      await expect(acuden.labelPrimerNombre).toBeVisible()
    })

    await test.step('Completar formulario de datos personales', async () => {
      await acuden.completarDatosPersonales(datosPersonales)
    })

    await test.step('Ingresar contacto y validar código OTP', async () => {
      await expect(acuden.selectPuebloRes).toBeVisible({ timeout: 20_000 })
      await acuden.completarContactoYValidarOtp(
        { correoYopmail: correo.prefijo, puebloResidencia: 'San Juan' },
        REMITENTE_OTP,
        REGEX_OTP
      )

//      await expect(acuden.textoVerificacion).toBeVisible({ timeout: 30_000 })
    })

    await test.step('Enviar y finalizar solicitud ACUDEN', async () => {
      await acuden.enviarSolicitud()
      await expect(acuden.textoSometida).toBeVisible({ timeout: 120_000 })
      console.log('✔ FASE 1 completada: solicitud enviada')
    })

    // ════════════════════════════════════════════════════════════
    // FASE 2: CONFIRMAR USUARIO EN CIMA
    // ════════════════════════════════════════════════════════════

    await test.step('Login en CIMA', async () => {
      await cima.iniciarSesion(CREDENCIALES_CIMA)
    })

    await test.step('Gestionar sesiones activas (si aplica)', async () => {
      await cima.gestionarSesionesActivas()
    })

    await test.step('Navegar a Seguridad → Familia → Solicitudes', async () => {
      await cima.navegarASolicitudesFamilia()
    })

    await test.step('Seleccionar última solicitud de la tabla', async () => {
      await expect(cima.ultimaFilaTabla).toBeVisible()
      await cima.seleccionarUltimaSolicitud()
    })

    await test.step('Seleccionar Registro Único Demográfico', async () => {
      await expect(cima.btnAbrirModalRU).toBeVisible({ timeout: 30_000 })
      await cima.seleccionarRegistroUnicoDemografico()
    })

    await test.step('Crear cuenta CIMA y guardar usuario', async () => {
      const numeroUsuario = await cima.crearCuentaYGuardarUsuario()
      expect(numeroUsuario).toBeTruthy()
      console.log(`✔ FASE 2 completada: usuario ${numeroUsuario} creado`)
    })
  })
}
