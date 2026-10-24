import { BrowserContext, Page } from '@playwright/test'

interface OpcionesOtp {
  /** Usuario de Yopmail, SIN "@yopmail.com" (ej. "qa1789774212670") */
  correo: string
  /** Remitente que debe aparecer en el correo (ej. "noreply@familia.pr.gov") */
  remitenteEsperado: string
  /** Regex para extraer el código; debe tener un grupo de captura */
  regex: RegExp
  maxIntentos?: number
  esperaEntreIntentosMs?: number
}

/**
 * Obtiene el código OTP desde Yopmail SIN tocar la pestaña original.
 *
 * Abre Yopmail en una pestaña nueva del mismo contexto de navegador,
 * revisa la bandeja (con reintentos), extrae el código con la regex
 * indicada, y cierra esa pestaña al terminar. La pestaña original
 * (por ejemplo, la de Acuden con el popup de verificación abierto)
 * nunca se navega ni se recarga.
 */
export async function obtenerCodigoYopmail(
  context: BrowserContext,
  opciones: OpcionesOtp
): Promise<string> {
  const {
    correo,
    remitenteEsperado,
    regex,
    maxIntentos = 15,
    esperaEntreIntentosMs = 5000
  } = opciones

  const yopmailPage: Page = await context.newPage()

  try {
    await yopmailPage.goto('https://yopmail.com/es/')

    // Cerrar banner de cookies/publicidad si aparece
    const botonAceptar = yopmailPage.locator('#accept')
    if (await botonAceptar.isVisible().catch(() => false)) {
      await botonAceptar.click()
    }

    await yopmailPage.fill('#login', correo)
    await yopmailPage.click('#refreshbut')

    const inboxFrame = yopmailPage.frameLocator('#ifinbox')
    const mailFrame = yopmailPage.frameLocator('#ifmail')

    for (let intento = 1; intento <= maxIntentos; intento++) {
      console.log(`YOPMAIL - Buscando correo, intento ${intento} de ${maxIntentos}`)

      const primerMensaje = inboxFrame.locator('.m').first()
      const hayMensaje = await primerMensaje.isVisible().catch(() => false)

      if (hayMensaje) {
        await primerMensaje.click()

        const texto = await mailFrame
          .locator('body')
          .innerText()
          .catch(() => '')

        if (texto.includes(remitenteEsperado)) {
          const match = texto.match(regex)
          if (match && match[1]) {
            console.log(`YOPMAIL - Código encontrado: ${match[1]}`)
            return match[1]
          }
        }
      }

      // Refrescar la bandeja para el siguiente intento. Yopmail navega de
      // /es/ a /es/wm tras la primera búsqueda, y en /es/wm ya no existe
      // #refreshbut — en ese caso recargamos la página en vez de buscarlo.
      const botonRefrescar = yopmailPage.locator('#refreshbut')
      if (await botonRefrescar.isVisible().catch(() => false)) {
        await botonRefrescar.click()
      } else {
        await yopmailPage.reload()
      }

      await yopmailPage.waitForTimeout(esperaEntreIntentosMs)
    }

    throw new Error(
      'No llegó el correo a Yopmail (o no contenía el código esperado) luego de varios intentos.'
    )
  } finally {
    // Cerramos SOLO la pestaña de Yopmail. La pestaña original sigue tal
    // cual estaba, con su popup y sus campos intactos.
    await yopmailPage.close()
  }
}
