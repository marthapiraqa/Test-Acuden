# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crear_CuentaFamilia.spec.ts >> Flujo Completo Crear Cuenta Familia 1: Carmen Torres
- Location: tests\crear_CuentaFamilia.spec.ts:11:7

# Error details

```
Error: page.goto: Target page, context or browser has been closed
Call log:
  - navigating to "https://yopmail.com/es/", waiting until "load"

```

# Test source

```ts
  1  | import { BrowserContext, Page } from '@playwright/test'
  2  | 
  3  | interface OpcionesOtp {
  4  |   /** Usuario de Yopmail, SIN "@yopmail.com" (ej. "qa1789774212670") */
  5  |   correo: string
  6  |   /** Remitente que debe aparecer en el correo (ej. "noreply@familia.pr.gov") */
  7  |   remitenteEsperado: string
  8  |   /** Regex para extraer el código; debe tener un grupo de captura */
  9  |   regex: RegExp
  10 |   maxIntentos?: number
  11 |   esperaEntreIntentosMs?: number
  12 | }
  13 | 
  14 | /**
  15 |  * Obtiene el código OTP desde Yopmail SIN tocar la pestaña original.
  16 |  *
  17 |  * Abre Yopmail en una pestaña nueva del mismo contexto de navegador,
  18 |  * revisa la bandeja (con reintentos), extrae el código con la regex
  19 |  * indicada, y cierra esa pestaña al terminar. La pestaña original
  20 |  * (por ejemplo, la de Acuden con el popup de verificación abierto)
  21 |  * nunca se navega ni se recarga.
  22 |  */
  23 | export async function obtenerCodigoYopmail(
  24 |   context: BrowserContext,
  25 |   opciones: OpcionesOtp
  26 | ): Promise<string> {
  27 |   const {
  28 |     correo,
  29 |     remitenteEsperado,
  30 |     regex,
  31 |     maxIntentos = 15,
  32 |     esperaEntreIntentosMs = 5000
  33 |   } = opciones
  34 | 
  35 |   const yopmailPage: Page = await context.newPage()
  36 | 
  37 |   try {
> 38 |     await yopmailPage.goto('https://yopmail.com/es/')
     |                       ^ Error: page.goto: Target page, context or browser has been closed
  39 | 
  40 |     // Cerrar banner de cookies/publicidad si aparece
  41 |     const botonAceptar = yopmailPage.locator('#accept')
  42 |     if (await botonAceptar.isVisible().catch(() => false)) {
  43 |       await botonAceptar.click()
  44 |     }
  45 | 
  46 |     await yopmailPage.fill('#login', correo)
  47 |     await yopmailPage.click('#refreshbut')
  48 | 
  49 |     const inboxFrame = yopmailPage.frameLocator('#ifinbox')
  50 |     const mailFrame = yopmailPage.frameLocator('#ifmail')
  51 | 
  52 |     for (let intento = 1; intento <= maxIntentos; intento++) {
  53 |       console.log(`YOPMAIL - Buscando correo, intento ${intento} de ${maxIntentos}`)
  54 | 
  55 |       const primerMensaje = inboxFrame.locator('.m').first()
  56 |       const hayMensaje = await primerMensaje.isVisible().catch(() => false)
  57 | 
  58 |       if (hayMensaje) {
  59 |         await primerMensaje.click()
  60 | 
  61 |         const texto = await mailFrame
  62 |           .locator('body')
  63 |           .innerText()
  64 |           .catch(() => '')
  65 | 
  66 |         if (texto.includes(remitenteEsperado)) {
  67 |           const match = texto.match(regex)
  68 |           if (match && match[1]) {
  69 |             console.log(`YOPMAIL - Código encontrado: ${match[1]}`)
  70 |             return match[1]
  71 |           }
  72 |         }
  73 |       }
  74 | 
  75 |       // Refrescar la bandeja para el siguiente intento. Yopmail navega de
  76 |       // /es/ a /es/wm tras la primera búsqueda, y en /es/wm ya no existe
  77 |       // #refreshbut — en ese caso recargamos la página en vez de buscarlo.
  78 |       const botonRefrescar = yopmailPage.locator('#refreshbut')
  79 |       if (await botonRefrescar.isVisible().catch(() => false)) {
  80 |         await botonRefrescar.click()
  81 |       } else {
  82 |         await yopmailPage.reload()
  83 |       }
  84 | 
  85 |       await yopmailPage.waitForTimeout(esperaEntreIntentosMs)
  86 |     }
  87 | 
  88 |     throw new Error(
  89 |       'No llegó el correo a Yopmail (o no contenía el código esperado) luego de varios intentos.'
  90 |     )
  91 |   } finally {
  92 |     // Cerramos SOLO la pestaña de Yopmail. La pestaña original sigue tal
  93 |     // cual estaba, con su popup y sus campos intactos.
  94 |     await yopmailPage.close()
  95 |   }
  96 | }
  97 | 
```