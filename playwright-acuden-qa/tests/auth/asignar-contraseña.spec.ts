import { test, expect } from '@playwright/test'
import { fakerES as faker } from '@faker-js/faker'
import { obtenerCodigoYopmail } from '../utils/yopmail'
import solicitantes from '../fixtures/solicitantes.json'
// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as path from 'path';

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

            const filePath = ('fixtures/FotoFamilia7.jpg');
            //const filePath =('fixtures/Evidencia.pdf');

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
            await page.locator('input[type="password"]').fill("Cima123...");

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

        //Crear la Cuenta CIMA
        await test.step("Creación cuenta Familia", async () => {
            // Se valida que haya realizado la validación del RU
            // const singleRecordOption = page.locator("a.identity-validation-banner__action, div.identity-validation-banner__action");
            // await expect(singleRecordOption).toHaveClass(/disabled|not-active/i, { timeout: 10000 });

            // 1. Pausa y clic en el botón 'Create user'
            await page.waitForTimeout(1000);
            const btnCreateUser = page.getByRole("button", { name: /Create user|Crear usuario/i }).first();
            await expect(btnCreateUser).toBeVisible({ timeout: 15000 });
            await btnCreateUser.scrollIntoViewIfNeeded();
            await btnCreateUser.click();

            // 2. Pausa antes del texto de recordatorio de correo
            await page.waitForTimeout(1000);
            const reminderText = page.getByText(/Remember to check your email/i);
            if (await reminderText.isVisible({ timeout: 5000 }).catch(() => false)) {
                await reminderText.click();
            }

            // 3. Pausa antes del primer botón Accept
            await page.waitForTimeout(1000);
            await page.getByRole("button", { name: /Accept|Aceptar/i }).first().click();

            // 4. Pausa antes de interactuar con el cuerpo del modal de éxito
            await page.waitForTimeout(1000);
            const modalSuccess = page.locator(".account-success-modal-body, .modal-body").first();
            if (await modalSuccess.isVisible({ timeout: 5000 }).catch(() => false)) {
                await modalSuccess.click();
            }

            // 5. Pausa antes del segundo botón Accept
            await page.waitForTimeout(1000);
            const btnAcceptFinal = page.getByRole("button", { name: /Accept|Aceptar/i }).first();
            if (await btnAcceptFinal.isVisible({ timeout: 5000 }).catch(() => false)) {
                await btnAcceptFinal.click();
            }


            // 1. Capturar el número de usuario de la pantalla
            const inputUsuario = page
                .getByLabel(/Nombre de usuario|Username/i)
                .or(page.locator('input[id*="Username" i], input[name*="Username" i]'))
                .first();

            await inputUsuario.waitFor({ state: "visible", timeout: 10000 });
            const numeroUsuario = (await inputUsuario.inputValue()).trim();

            // 2. Definir la ruta hacia el archivo fixtures/Usuario.json
            const rutaArchivo = path.resolve(__dirname, "../fixtures/Usuario.json");
            const carpetaFixtures = path.dirname(rutaArchivo);

            // Asegurar que la carpeta fixtures exista
            if (!fs.existsSync(carpetaFixtures)) {
                fs.mkdirSync(carpetaFixtures, { recursive: true });
            }

            // 3. Leer los datos existentes o inicializar un arreglo vacío
            let historialUsuarios: Array<{ fecha: string; usuarioCreado: string }> = [];

            if (fs.existsSync(rutaArchivo)) {
                try {
                    const contenidoActual = fs.readFileSync(rutaArchivo, "utf-8");
                    historialUsuarios = JSON.parse(contenidoActual);
                    if (!Array.isArray(historialUsuarios)) {
                        historialUsuarios = [];
                    }
                } catch (error) {
                    historialUsuarios = [];
                }
            }

            // 4. Crear el nuevo registro con marca de tiempo actual
            const nuevoRegistro = {
                fecha: new Date().toLocaleString("es-CO", { hour12: false }), // Ejemplo: "22/10/2026, 20:12:00"
                usuarioCreado: numeroUsuario,
            };

            // 5. Agregar el nuevo registro a la lista existente
            historialUsuarios.push(nuevoRegistro);

            // 6. Guardar la lista completa actualizada en el archivo
            fs.writeFileSync(
                rutaArchivo,
                JSON.stringify(historialUsuarios, null, 2),
                "utf-8"
            );

            console.log(`Usuario ${numeroUsuario} agregado con éxito al historial en Usuario.json`);
//-----------------------------------------------------------



            // Captura del ID / Nombre de usuario asignado en pantalla
            await page.pause();
            // Búsqueda del usuario creado en la lista de gestión
            await page.locator(".form-group").first().click();
            await page.getByRole("button", { name: /Return to search/i }).click();
            await page.getByRole("button", { name: /Accept/i }).click();

            await page.getByRole("button", { name: /Username/i }).click();

            const searchInput = page.getByRole("textbox", { name: /Enter the search term/i });
            await searchInput.click();
            await searchInput.fill(numeroUsuario);

            await page.getByRole("button", { name: /Search/i }).click();
            await page.waitForLoadState("networkidle");

            const filaResultado = page.locator("table tbody tr").first();
            await filaResultado.waitFor({ state: "visible", timeout: 15000 });
            await filaResultado.click();

            // Flujo de notificaciones y captura dinámica del correo
            const btnNotificaciones = page
                .getByRole("button", { name: "Notificaciones", exact: true })
                .or(page.locator("button:has(i.fa-envelope)"))
                .or(page.getByRole("button", { name: "Notifications", description: "Notifications" }))
                .first();

            await btnNotificaciones.waitFor({ state: "visible", timeout: 10000 });
            await btnNotificaciones.click();

            await page.getByText(/Password reset instructions/i).click();
            await page.getByRole("radio", { name: /Password reset instructions/i }).check();

            const radioEmail = page.getByRole("radio", { name: /Email to/i }).first();
            await radioEmail.waitFor({ state: "visible", timeout: 10000 });

            const textoRadioEmail = (await radioEmail.evaluate((el) => {
                const label = document.querySelector(`label[for="${el.id}"]`) || el.closest("label") || el.parentElement;
                return label ? label.textContent || "" : "";
            })).trim();

            const matchEmail = textoRadioEmail.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            let emailCompleto = matchEmail ? matchEmail[0] : "";

            if (!emailCompleto) {
                const emailCell = page.locator("table tbody tr td").filter({ hasText: /@yopmail\.com/i }).first();
                if (await emailCell.isVisible().catch(() => false)) {
                    emailCompleto = (await emailCell.innerText()).trim();
                }
            }

            console.log(`Correo detectado para restablecimiento: ${emailCompleto}`);

            await radioEmail.check();
            await page.getByRole("button", { name: /Send/i }).click();
            await expect(page.getByText(/Notification sent/i)).toBeVisible({ timeout: 15000 });

            // ==========================================
            // 7. ABRIR YOPMAIL Y RECUPERAR CONTRASEÑA
            // ==========================================
            const inboxName = emailCompleto.split("@")[0];

            const yopmailPage = await context.newPage();
            await yopmailPage.goto(`https://yopmail.com/?${inboxName}`, {
                waitUntil: "domcontentloaded",
            });

            const inboxInput = yopmailPage.locator("#login");
            if (await inboxInput.isVisible({ timeout: 4000 }).catch(() => false)) {
                await inboxInput.fill(inboxName);
                await yopmailPage.locator("#refreshbut button, #refreshbut").click();
            }

            // Marco con la lista de correos recibidos
            const inboxFrame = yopmailPage.frameLocator("#ifinbox");

            // Localizar el correo por el asunto en inglés o español
            const regexAsunto = /Password Change|Cambio de contraseña|Cambio de clave/i;
            const correoAsunto = inboxFrame
                .locator(".m")
                .filter({ hasText: regexAsunto })
                .first();

            try {
                await correoAsunto.waitFor({ state: "visible", timeout: 15000 });
            } catch {
                console.log("Refrescando bandeja de entrada en Yopmail...");
                await yopmailPage.locator("#refresh").click();
                await correoAsunto.waitFor({ state: "visible", timeout: 20000 });
            }

            // Seleccionar el correo que coincide con el asunto
            await correoAsunto.click();

            // Marco con el cuerpo del mensaje seleccionado
            const mailFrame = yopmailPage.frameLocator("#ifmail");

            // Localizar la etiqueta <strong>ACUDEN Digital</strong> dentro del correo abierto
            const strongAcuden = mailFrame
                .locator("strong")
                .filter({ hasText: "ACUDEN Digital" })
                .first();

            await strongAcuden.waitFor({ state: "visible", timeout: 15000 });

            // Ubicar el enlace <a> que aparece inmediatamente después de dicho <strong>
            const botonEnlace = mailFrame
                .locator("xpath=//strong[contains(text(), 'ACUDEN Digital')]/following::a[1]")
                .or(mailFrame.locator("strong:has-text('ACUDEN Digital') ~ a").first());

            await botonEnlace.waitFor({ state: "visible", timeout: 15000 });

            const urlReseteo = await botonEnlace.getAttribute("href");
            console.log(`URL de restablecimiento capturada: ${urlReseteo}`);

            if (urlReseteo) {
                await yopmailPage.goto(urlReseteo, { waitUntil: "domcontentloaded" });
            } else {
                await botonEnlace.click();
            }

            await expect(
                yopmailPage.locator('input[type="password"], input[id*="Password" i]').first()
            ).toBeVisible({ timeout: 20000 });


            // ==========================================
            // 8. ASIGNAR NUEVA CONTRASEÑA DESDE SOLICITANTES.JSON
            // ==========================================
            // 1. Cargar el JSON directamente desde disco
            //const rutaSolicitantes = path.resolve(__dirname, "../fixtures/solicitantes.json");
            //const solicitantes = JSON.parse(fs.readFileSync(rutaSolicitantes, "utf-8"));

            // 2. Obtener el valor directo del campo clavenueva
            const passwordFinal = String(persona.clavenueva).trim();
            console.log(`Clave a ingresar: ${passwordFinal}`);

            // 3. Localizar los dos campos de contraseña en la página de restablecimiento
            const inputsPassword = yopmailPage.locator('input[type="password"]');
            await inputsPassword.first().waitFor({ state: "visible", timeout: 15000 });

            // 4. Llenar campo 1 (Nueva contraseña) y campo 2 (Confirmar contraseña)
            await inputsPassword.nth(0).fill(passwordFinal);
            await inputsPassword.nth(1).fill(passwordFinal);
            await page.pause();
            // 5. Clic en el botón para guardar/confirmar el cambio
            const btnGuardarPassword = yopmailPage.getByRole("button", {
                name: /Reestablecer|Restore|Save|Reset password|Change password|Enviar/i,
            }).first();
            
            if (await btnGuardarPassword.isVisible({ timeout: 5000 }).catch(() => false)) {
                await btnGuardarPassword.click();
            }

        });
    })};