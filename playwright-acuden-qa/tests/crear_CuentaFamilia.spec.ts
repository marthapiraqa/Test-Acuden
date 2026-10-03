import { test, expect } from '@playwright/test'
import { fakerES as faker } from '@faker-js/faker'
import { obtenerCodigoYopmail } from '../utils/yopmail'
import solicitantes from '../fixtures/solicitantes.json'
import path from 'path'


const remitenteEsperado = 'noreply@familia.pr.gov'
const regexOtp = /es:\s*(\d{4,8})/i

test.use({ launchOptions: { slowMo: 800 } });

for (const persona of solicitantes) {
  test(`Flujo Completo Crear Cuenta Familia : ${persona.id}`, async ({ page, context }) => {
    test.setTimeout(360000)

    const fakerNombre = faker.person.firstName().trim().split(/\s+/)[0];
    const fakerApellido = faker.person.lastName().trim().split(/\s+/)[0];
    const fakerNombre2 = faker.person.middleName().trim().split(/\s+/)[0];
    const fakerApellido2 = faker.person.lastName().trim().split(/\s+/)[0]; 
    
    const correoYopmail = `${fakerNombre}.${fakerApellido}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.]/g, '');

    const correoYopmailCompleto = `${correoYopmail}@yopmail.com`;

    // ==========================================
    // FASE 1: SOLICITAR CUENTA FAMILIA
    // ==========================================

    //Selecciona Solicitar Cuenta - Solicitante
    await test.step('Navegar a la plataforma e iniciar flujo de solicitud', async () => {
      await page.goto('https://acudendigital-qa2.azurewebsites.net/')
      await page.getByText('Solicitar cuenta').click()
      await page.getByText('Solicitante').click()
      await page.getByText('Es la primera vez solicitando los servicios').click()
      await page.getByRole('button', { name: 'Continuar' }).click()
    })

    //Realiza validación de IA
    await test.step('Completar validación con Inteligencia Artificial', async () => {
      await page.locator('[href="/Applicant/ArtificialIntelligence/"]').click()
      //En el Label se selecciona el tipo de documento
      await page.locator('[name="ArtificialIntelligenceValidationModel.IdentityEvidenceId"]').selectOption({
        label: 'Certificado de Nacimiento'
      })

     
      const filePath = path.resolve(__dirname, '../fixtures/FotoFamilia7.jpg');
      //const filePath = path.resolve(__dirname, '../fixtures/Evidencia.pdf');

      await page.setInputFiles('#FileUrlInput', filePath);
      await expect(page.locator('#FileUrlInput')).toHaveJSProperty('files.length', 1)
      await page.waitForTimeout(20000)
      const btnContinuarIA = page.getByRole('button', { name: 'Continuar' })
      await expect(btnContinuarIA).toBeEnabled({ timeout: 20000 })
      await btnContinuarIA.click()

      await expect(
        page.getByText('Su proceso de validación')
      ).toBeVisible({ timeout: 120000 })

      await expect(page.getByText('Primer nombre')).toBeVisible()
    })

    //Se ingresa datos del Formulario
    await test.step('Completar formulario de datos personales', async () => {

      const nombreField = page.locator('#Name')
      const nombreActual = await nombreField.inputValue()
      if (nombreActual.trim() === '') {
        await nombreField.fill(fakerNombre)
      }
      
      const apellidoField = page.locator('#LastName')
      const apellidoActual = await apellidoField.inputValue()
      if (apellidoActual.trim() === '') {
        await apellidoField.fill(fakerApellido)
      } 
       
      const nombreField2 = page.locator('#SecondName')
      const nombreActual2 = await nombreField2.inputValue()
      if (nombreActual2.trim() === '') {
        await nombreField2.fill(fakerNombre2)
      }
      
      const apellidoField2 = page.locator('#SecondLastName')
      const apellidoActual2 = await apellidoField2.inputValue()
      if (apellidoActual2.trim() === '') {
        await apellidoField2.fill(fakerApellido2)
      } 

            //OJO VALIDAR CUANDO CAMBIA IDIOMA
      const fechaField = page.locator('#Birthday input[placeholder="dd/mm/aaaa"]')
      const fechaActual = await fechaField.inputValue()
      if (fechaActual.trim() === '') {
        await fechaField.fill(persona.fechaNacimiento)
      } 
      await fechaField.blur()

      const paisField = page.locator('#CountryOfBirthId')
      // Obtiene el texto visible de la opción actualmente elegida
      const paisActual = await paisField.locator('option:checked').innerText()
      // Comprueba si dice "Seleccionar" (o variantes) o si está vacío
      if (paisActual.trim().toLowerCase().includes('seleccionar') || paisActual.trim() === '') {
        await paisField.selectOption({ label: persona.paisNacimiento })
      }

      const puebloField = page.locator('#TownOfBirthId')
      // Obtiene el texto visible de la opción actualmente elegida
      const puebloActual = await puebloField.locator('option:checked').innerText()
      // Comprueba si dice "Seleccionar" (o variantes) o si está vacío
      if (puebloActual.trim().toLowerCase().includes('seleccionar') || puebloActual.trim() === '') {
        await puebloField.selectOption({ label: persona.puebloNacimiento })
      }

      await page.getByRole('button', { name: 'Continuar' }).click()
    })

    //Se ingresa Datos de contacto
    await test.step('Datos de Contacto', async () => {
      const puebloResidenciaField = page.locator('#ResidenceTownId')
      await expect(puebloResidenciaField).toBeVisible({ timeout: 20000 })
      //await puebloResidenciaField.selectOption({ label: persona.puebloResidencia })
      await puebloResidenciaField.selectOption({ label: 'San Juan' })
      // Se valida OTP
      const emailField = page.locator('#Email')
      await expect(emailField).toBeVisible({ timeout: 20000 })
      await emailField.fill(correoYopmailCompleto)
      await emailField.blur()
      await page.pause()
      const btnEnviarCodigo = page.getByRole('button', { name: 'Enviar código' })
      await expect(btnEnviarCodigo).toBeEnabled({ timeout: 30000 })
      await btnEnviarCodigo.click()
      await expect(page.getByText('Verificación de código')).toBeVisible({ timeout: 30000 })
      //Abre metodo obtenerCodigoYopmail--Yopmail.ts
      const codigo = await obtenerCodigoYopmail(context, {
        correo: correoYopmail,
        remitenteEsperado,
        regex: regexOtp //Busca dentro del cuerpo del correo
      })

      await page.fill('#VerificationCode', codigo)
      const btnValidar = page.getByRole('button', { name: 'Validar' })
      await expect(btnValidar).toBeVisible()
      await expect(btnValidar).toBeEnabled({ timeout: 30000 })
      await btnValidar.click()
      await page.waitForTimeout(2000)
      await page.getByRole('button', { name: 'Continuar' }).click()

    })
   
    // Se crea la Solicitud
    await test.step('Enviar y finalizar la solicitud', async () => {        
        const textoSometida = page.getByText('Solicitud de Cuenta Sometida')

        let yaSometida = false
        try {
            // Espera activa de 10s usando expect
            await expect(textoSometida).toBeVisible({ timeout: 10000 })
            yaSometida = true
        } catch {
            yaSometida = false
        }

        if (yaSometida) {
            console.log('ACUDEN DIGITAL - Solicitud Creada Nuevo')
            return
        }

        // Si no existe, valida y marca el radio "Ninguno de los anteriores"
        const radioNinguno = page.locator('#related_0')
        await expect(radioNinguno).toBeVisible({ timeout: 10000 })
        if (!(await radioNinguno.isChecked())) {
            await radioNinguno.check({ force: true })
        }

        // Espera 5 segundos
        await page.waitForTimeout(5000)

        // Clic en el botón Enviar
        const btnEnviar = page.locator('button:has-text("Enviar"):has(i.fa-chevron-right)')
        await expect(btnEnviar).toBeVisible({ timeout: 10000 })
        await btnEnviar.click()

        // Confirmación final
        await expect(textoSometida).toBeVisible({ timeout: 120000 }) 
        console.log('ACUDEN DIGITAL - Solicitud Creada Coincidencia')
    })  
  
    // ==========================================
    // FASE 2: CONFIRMAR USUARIO EN CIMA
    // ==========================================

    // Inicia Sesion en CIMA
    await test.step("Inicio de sesión (Login)", async () => {      
      await page.goto("https://cima-qa.azurewebsites.net/", {
        waitUntil: "domcontentloaded",
      });


      //await page.pause();
      // Ingresar credenciales de acceso
      await page.locator('xpath=//*[@id="Username"]').fill("kpg2");
      await page.locator('input[type="password"]').fill("Cima321...");

      // --- PARTE DEL CAPTCHA ---
      // console.log("Ingrese el CAPTCHA manualmente y presione Resume");
      // await page.pause();
      // ----------------------------------

      // Inicia Sesion
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    });

    // Valida si existen sesiones activas y cierra una
    await test.step("Popup: Validación y cierre de sesiones activas", async () => {
      const checkboxes = page.locator("input.form-check-input");

      if ((await checkboxes.count()) > 0) {
        //console.log("Sesiones activas");
        const modalSesiones = page.locator(".modal-body");
        if ((await modalSesiones.count()) > 0) {
          //console.log("Modal de sesiones detectado");

          // Marcar la casilla de la última sesión para cerrarla
          const ultimoCheckbox = modalSesiones.locator("input.form-check-input").last();
          await ultimoCheckbox.waitFor({ state: "visible", timeout: 10000 });
          await ultimoCheckbox.click({ force: true });

          // Confirmar cierre de sesiones
          const btnCerrarSesiones = modalSesiones.locator("button.btn.btn-primary");
          await expect(btnCerrarSesiones).toBeEnabled({ timeout: 10000 });
          await btnCerrarSesiones.click();
          await page.waitForLoadState("networkidle");
        }
      }

      await page.waitForLoadState("networkidle");
    });

    // Ingresa a Seguridad/Familia
    await test.step("Navegación Seguridad/Familia/Solicitudes", async () => {
      await page.locator('a[href="/Security"] i.fa-user-lock').click();

      // Entrar a Familia
      await page.locator('a[href*="PartyType=Family"]').click();
      await page.waitForLoadState("networkidle");

      // Acceder a la sección de Solicitudes
      const solicitudes = page.locator("a:has(i.fa-laptop-code)");
      await solicitudes.waitFor({ state: "visible", timeout: 30000 });
      await solicitudes.click();
      await page.waitForLoadState("networkidle");
    });

    // Selecciona la Solicitud 
    await test.step("Solicitudes y selección del último registro", async () => {  
      const ultimaPagina = page.locator("ul.pagination li:last-child a");
      if (await ultimaPagina.isVisible()) {
        await ultimaPagina.click();
        await page.waitForLoadState("networkidle");
      }

      // Selecciona el ultimo registro de la tabla
      const ultimaFila = page.locator("tbody tr").last();
      await expect(ultimaFila).toBeVisible();

      // Abre el detalle de la solictud con el botón de la lupa Confirmar Cuenta
      await ultimaFila.locator("button").last().click();
      await page.waitForLoadState("networkidle");
    });

      // Selecciona Registro unico
  await test.step("Seleccion de Registro único de información demográfica", async () => {    
      // Busca el <a> que contiene el ícono de la mano
    const btnAbrirModal = page.locator('a:has(i.fa-hand-pointer)');
    await expect(btnAbrirModal).toBeVisible({ timeout: 30000 });
    await btnAbrirModal.click();

    // Seleccionar directamente el modal que esté visible
    const modalDemografico = page.locator(".modal-content:visible");
    await expect(modalDemografico).toBeVisible({ timeout: 10000 });

    // Navegar a la última página dentro del popup
    const btnUltimaPagina = modalDemografico.locator("li.page-item:has(i.bi-chevron-double-right)");
    if (await btnUltimaPagina.isVisible()) {
      const estaDeshabilitado = await btnUltimaPagina.evaluate((el) =>
        el.classList.contains("disabled")
      );
      if (!estaDeshabilitado) {
        await btnUltimaPagina.locator("a.page-link").click();
        await page.waitForLoadState("networkidle");
      }
    }

    // Ubicar fila con 'Persona no encontrada' y marcar casilla
    const filaObjetivo = modalDemografico.locator("tbody tr").filter({
      hasText: /Persona no encontrada|Person not found/i,
    }).last();

    await expect(filaObjetivo).toBeVisible({ timeout: 10000 });
    const checkbox = filaObjetivo.locator('input[type="checkbox"]');
    await checkbox.check({ force: true });

    // Clic en el botón Continuar dentro del RU
    const btnContinuar = modalDemografico.locator("button.btn-primary");
    await expect(btnContinuar).not.toHaveClass(/not-active/, { timeout: 10000 });
    await expect(btnContinuar).toBeEnabled({ timeout: 10000 });

    // Hacer clic una vez habilitado el boton Continuar
    await btnContinuar.click();

    await page.waitForLoadState("networkidle");
  });

  //Crear la Cuenta
  await test.step("Creación cuenta Familia", async () => {
    // Se valida que haya realizado la validación del RU
   // const singleRecordOption = page.locator("a.identity-validation-banner__action, div.identity-validation-banner__action");
   // await expect(singleRecordOption).toHaveClass(/disabled|not-active/i, { timeout: 10000 });

    // 2. Dar clic en el botón 'Create user'
    const btnCreateUser = page.locator("button.btn-green-007C7D");
    await expect(btnCreateUser).toBeVisible({ timeout: 10000 });
    await btnCreateUser.click();

    // 3. Primer popup de confirmación: hacer clic en Accept
    const primerModal = page.locator(".modal.show, .modal-content:visible").first();
    await expect(primerModal).toBeVisible({ timeout: 10000 });
    await primerModal.click();

    // 4. Segundo popup (éxito o confirmación final): hacer clic en Accept
    const segundoModal = page.locator(".modal.show, .modal-content:visible").first();
    await expect(segundoModal).toBeVisible({ timeout: 10000 });
    await segundoModal.click();

    // Esperar a que se procese la solicitud en red
    await page.waitForLoadState("networkidle");

    console.log("Creacion de cuenta exitosa #000");
  });
  });
}