# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crear_CuentaFamilia.spec.ts >> Flujo Completo Crear Cuenta Familia 2: Ana Rivera
- Location: playwright-acuden-qa\tests\crear_CuentaFamilia.spec.ts:14:7

# Error details

```
Error: locator.click: Target page, context or browser has been closed
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { fakerES as faker } from '@faker-js/faker'
  3   | import { obtenerCodigoYopmail } from '../utils/yopmail'
  4   | import solicitantes from '../fixtures/solicitantes.json'
  5   | import path from 'path'
  6   | 
  7   | 
  8   | const remitenteEsperado = 'noreply@familia.pr.gov'
  9   | const regexOtp = /es:\s*(\d{4,8})/i
  10  | 
  11  | test.use({ launchOptions: { slowMo: 800 } });
  12  | 
  13  | for (const persona of solicitantes) {
  14  |   test(`Flujo Completo Crear Cuenta Familia ${persona.id}: ${persona.nombre} ${persona.apellido}`, async ({ page, context }) => {
  15  |     test.setTimeout(360000)
  16  | 
  17  |     const fakerNombre = faker.person.firstName();
  18  |     const fakerApellido = faker.person.lastName();
  19  | 
  20  |     const correoYopmail = `${persona.correoPrefix}`
  21  |     const correoYopmailCompleto = `${correoYopmail}@yopmail.com`
  22  | 
  23  |     // ==========================================
  24  |     // FASE 1: SOLICITAR CUENTA FAMILIA
  25  |     // ==========================================
  26  | 
  27  |     //Selecciona Solicitar Cuenta - Solicitante
  28  |     await test.step('Navegar a la plataforma e iniciar flujo de solicitud', async () => {
  29  |       await page.goto('https://acudendigital-qa2.azurewebsites.net/')
  30  |       await page.getByText('Solicitar cuenta').click()
  31  |       await page.getByText('Solicitante').click()
> 32  |       await page.getByText('Es la primera vez solicitando los servicios').click()
      |                                                                           ^ Error: locator.click: Target page, context or browser has been closed
  33  |       await page.getByRole('button', { name: 'Continuar' }).click()
  34  |     })
  35  | 
  36  |     //Realiza validación de IA
  37  |     await test.step('Completar validación con Inteligencia Artificial', async () => {
  38  |       await page.locator('[href="/Applicant/ArtificialIntelligence/"]').click()
  39  |       //En el Label se selecciona el tipo de documento
  40  |       await page.locator('[name="ArtificialIntelligenceValidationModel.IdentityEvidenceId"]').selectOption({
  41  |         label: 'Certificado de Nacimiento'
  42  |       })
  43  | 
  44  |       // Si fixtures está en la raíz y tu test dentro de /tests:
  45  | // Si fixtures está en la raíz y tu test dentro de /tests:
  46  |       const filePath = path.resolve(__dirname, '../fixtures/FotoFamilia7.jpg');
  47  |       //const filePath = path.resolve(__dirname, '../fixtures/Evidencia.pdf');
  48  | 
  49  |       await page.setInputFiles('#FileUrlInput', filePath);
  50  |       await expect(page.locator('#FileUrlInput')).toHaveJSProperty('files.length', 1)
  51  |       await page.waitForTimeout(20000)
  52  |       const btnContinuarIA = page.getByRole('button', { name: 'Continuar' })
  53  |       await expect(btnContinuarIA).toBeEnabled({ timeout: 20000 })
  54  |       await btnContinuarIA.click()
  55  | 
  56  |       await expect(
  57  |         page.getByText('Su proceso de validación')
  58  |       ).toBeVisible({ timeout: 120000 })
  59  | 
  60  |       await expect(page.getByText('Primer nombre')).toBeVisible()
  61  |     })
  62  | 
  63  |     //Se ingresa datos del Formulario
  64  |     await test.step('Completar formulario de datos personales', async () => {
  65  | 
  66  |       const nombreField = page.locator('#Name')
  67  |       const nombreActual = await nombreField.inputValue()
  68  |       if (nombreActual.trim() === '') {
  69  |         await nombreField.fill(fakerNombre)
  70  |       }
  71  |       
  72  |       const apellidoField = page.locator('#LastName')
  73  |       const apellidoActual = await apellidoField.inputValue()
  74  |       if (apellidoActual.trim() === '') {
  75  |         await apellidoField.fill(fakerApellido)
  76  |       } 
  77  | 
  78  |       //OJO VALIDAR CUANDO CAMBIA IDIOMA
  79  |       const fechaField = page.locator('#Birthday input[placeholder="dd/mm/aaaa"]')
  80  |       const fechaActual = await fechaField.inputValue()
  81  |       if (fechaActual.trim() === '') {
  82  |         await fechaField.fill(persona.fechaNacimiento)
  83  |       } 
  84  |       await fechaField.blur()
  85  | 
  86  |       const paisField = page.locator('#CountryOfBirthId')
  87  |       // Obtiene el texto visible de la opción actualmente elegida
  88  |       const paisActual = await paisField.locator('option:checked').innerText()
  89  |       // Comprueba si dice "Seleccionar" (o variantes) o si está vacío
  90  |       if (paisActual.trim().toLowerCase().includes('seleccionar') || paisActual.trim() === '') {
  91  |         await paisField.selectOption({ label: persona.paisNacimiento })
  92  |       }
  93  | 
  94  |       const puebloField = page.locator('#TownOfBirthId')
  95  |       // Obtiene el texto visible de la opción actualmente elegida
  96  |       const puebloActual = await puebloField.locator('option:checked').innerText()
  97  |       // Comprueba si dice "Seleccionar" (o variantes) o si está vacío
  98  |       if (puebloActual.trim().toLowerCase().includes('seleccionar') || puebloActual.trim() === '') {
  99  |         await puebloField.selectOption({ label: persona.puebloNacimiento })
  100 |       }
  101 | 
  102 |       await page.getByRole('button', { name: 'Continuar' }).click()
  103 |     })
  104 | 
  105 |     //Se ingresa Datos de contacto
  106 |     await test.step('Datos de Contacto', async () => {
  107 |       const puebloResidenciaField = page.locator('#ResidenceTownId')
  108 |       await expect(puebloResidenciaField).toBeVisible({ timeout: 20000 })
  109 |       //await puebloResidenciaField.selectOption({ label: persona.puebloResidencia })
  110 |       await puebloResidenciaField.selectOption({ label: 'San Juan' })
  111 |       // Se valida OTP
  112 |       const emailField = page.locator('#Email')
  113 |       await expect(emailField).toBeVisible({ timeout: 20000 })
  114 |       await emailField.fill(correoYopmailCompleto)
  115 |       await emailField.blur()
  116 | 
  117 |       const btnEnviarCodigo = page.getByRole('button', { name: 'Enviar código' })
  118 |       await expect(btnEnviarCodigo).toBeEnabled({ timeout: 30000 })
  119 |       await btnEnviarCodigo.click()
  120 |       await expect(page.getByText('Verificación de código')).toBeVisible({ timeout: 30000 })
  121 |       //Abre metodo obtenerCodigoYopmail--Yopmail.ts
  122 |       const codigo = await obtenerCodigoYopmail(context, {
  123 |         correo: correoYopmail,
  124 |         remitenteEsperado,
  125 |         regex: regexOtp //Busca dentro del cuerpo del correo
  126 |       })
  127 | 
  128 |       await page.fill('#VerificationCode', codigo)
  129 |       const btnValidar = page.getByRole('button', { name: 'Validar' })
  130 |       await expect(btnValidar).toBeVisible()
  131 |       await expect(btnValidar).toBeEnabled({ timeout: 30000 })
  132 |       await btnValidar.click()
```