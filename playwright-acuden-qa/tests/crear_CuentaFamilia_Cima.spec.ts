import { test, expect } from "@playwright/test";
import { fakerES as faker } from "@faker-js/faker";
import solicitantes from '../fixtures/solicitantes.json'

test.use({ launchOptions: { slowMo: 500 } });
for (const persona of solicitantes) {
test("Crear cuenta CIMA", async ({ page }) => {
  // ==========================================
  // 1. GENERACIÓN DE DATOS ALEATORIOS (FAKER)
  // ==========================================
  const fakerNombre = faker.person.firstName().trim().split(/\s+/)[0];
  const fakerApellido = faker.person.lastName().trim().split(/\s+/)[0];
  const fakerNombre2 = faker.person.middleName().trim().split(/\s+/)[0];
  const fakerApellido2 = faker.person.lastName().trim().split(/\s+/)[0];
  
  const correoYopmail = `${fakerNombre}.${fakerApellido}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.]/g, "");

  const correoYopmailCompleto = `${correoYopmail}@yopmail.com`;

  // ==========================================
  // 2. INICIO DE SESIÓN EN CIMA
  // ==========================================
  await test.step("Inicio de sesión (Login)", async () => {
    await page.goto("https://cima-qa.azurewebsites.net/", {
      waitUntil: "domcontentloaded",
    });

    await page.locator('xpath=//*[@id="Username"]').fill("kpg2");
    await page.locator('input[type="password"]').fill("Cima123...");

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
  });

  // ==========================================
  // 3. GESTIÓN DE SESIONES ACTIVAS
  // ==========================================
  await test.step("Popup: Validación y cierre de sesiones activas", async () => {
    const checkboxes = page.locator("input.form-check-input");

    if ((await checkboxes.count()) > 0) {
      console.log("Sesiones activas encontradas");
      const modalSesiones = page.locator(".modal-body");
      if ((await modalSesiones.count()) > 0) {
        console.log("Modal de sesiones detectado");

        const ultimoCheckbox = modalSesiones.locator("input.form-check-input").last();
        await ultimoCheckbox.waitFor({ state: "visible", timeout: 10000 });
        await ultimoCheckbox.click({ force: true });

        const btnCerrarSesiones = modalSesiones.locator("button.btn.btn-primary");
        await expect(btnCerrarSesiones).toBeEnabled({ timeout: 10000 });
        await btnCerrarSesiones.click();
        await page.waitForLoadState("networkidle");
      }
    }
  });

  // ==========================================
  // 4. NAVEGACIÓN SEGURIDAD / FAMILIA
  // ==========================================
  await test.step("Navegación Seguridad/Familia/Solicitudes", async () => {
    await page.locator('a[href="/Security"]').click();

    await page.locator('a[href*="PartyType=Family"]').click();
    await page.waitForLoadState("networkidle");

    const solicitudes = page.locator("a:has(i.fa-laptop-code)");
    await solicitudes.waitFor({ state: "visible", timeout: 30000 });
    await solicitudes.click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: " Create user" }).click();
    await page.getByText("Identity validation Document").click();
  });

  // ==========================================
  // 5. VALIDACIÓN DE IDENTIDAD CON IA
  // ==========================================
  await test.step("Completar validación con Inteligencia Artificial", async () => {
    const selectDocumento = page.locator("select#IdentityEvidenceId");
    await selectDocumento.waitFor({ state: "visible", timeout: 15000 });

    await selectDocumento.selectOption("834");

    const filePath = ('fixtures/FotoFamilia7.jpg');
    const inputElement = page.locator("input#FileUrl");
    await inputElement.setInputFiles(filePath);
    await inputElement.dispatchEvent("change");

    const btnContinuarIA = page.locator(
      'button[type="submit"]:has-text("Continuar"), button[type="submit"]:has-text("Continue")'
    );
    await expect(btnContinuarIA).toBeEnabled({ timeout: 20000 });
    await btnContinuarIA.click();

    // Esperar a que el formulario cargue y el placeholder del primer nombre esté visible
    await page.getByPlaceholder(/Write your first name/i).waitFor({ state: "visible", timeout: 20000 });
  });

  // ==========================================
  // 6. DILIGENCIAMIENTO DE FORMULARIO
  // ==========================================
  await test.step("Completar datos personales y finalizar registro", async () => {
    // 1. Diligenciar Nombres y Apellidos usando sus placeholders exactos de la pantalla
    const inputFirstName = page.getByPlaceholder(/Write your first name/i);
    await inputFirstName.click();
    await inputFirstName.fill(fakerNombre);

    const inputSecondName = page.getByPlaceholder(/Write your middle name/i);
    await inputSecondName.click();
    await inputSecondName.fill(fakerNombre2);

    const inputFirstLastName = page.getByPlaceholder(/Type in your first last name/i);
    await inputFirstLastName.click();
    await inputFirstLastName.fill(fakerApellido);

    const inputSecondLastName = page.getByPlaceholder(/Type in your middle last name/i);
    await inputSecondLastName.click();
    await inputSecondLastName.fill(fakerApellido2);

    // 2. Selección de País y Ciudad (usando etiquetas o selectores nativos)
    await page.getByLabel(/Country of birth/i).selectOption("1");
    await page.waitForTimeout(1000);
    await page.getByLabel(/City of birth/i).selectOption("74");

    // 3. Fecha de nacimiento
    const birthdateInput = page.getByPlaceholder(/mm\/dd\/yyyy|dd\/mm\/aaaa/i)
      .or(page.locator('input[id*="Birthdate"], input[name*="Birthdate"]')).first();
    await birthdateInput.fill(persona.fechaNacimiento);


    // 4. Correo electrónico (sección de Contact Information)
   const emailInput = page.locator('input[type="email"], input[id*="Email" i], input[name*="Email" i]').first();
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.fill(correoYopmailCompleto);

    // 5. Envío y confirmación final
    await page.getByRole("button", { name: /Create user|Crear usuario/i }).click();

    // Ahora que los campos obligatorios fueron diligenciados, se procesa la confirmación
    const registroCheckbox = page.locator('.modal-content input[type="checkbox"], input[type="checkbox"]').first();
    if (await registroCheckbox.isVisible({ timeout: 10000 }).catch(() => false)) {
      await registroCheckbox.check({ force: true });
      await page.getByRole("button", { name: /Continue|Continuar/i }).click();
      await page.getByRole("button", { name: /Create user|Crear usuario/i }).click();
    }

    await expect(
      page.getByText(/Account confirmationRemember|Confirmación de cuenta/i)
    ).toBeVisible({ timeout: 20000 });

  });
  })};