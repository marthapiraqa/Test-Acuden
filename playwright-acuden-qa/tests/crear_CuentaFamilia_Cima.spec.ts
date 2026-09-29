import { test, expect } from "@playwright/test";
import path from "path";
import { fakerES as faker } from "@faker-js/faker";

test.use({ launchOptions: { slowMo: 500 } });

test("Crear cuenta CIMA", async ({ page }) => {
  // Generar datos aleatorios para el usuario
  const randomFirstName = faker.person.firstName();
  const randomLastName = faker.person.lastName();
  const randomEmail = faker.internet.email({
    firstName: randomFirstName,
    lastName: randomLastName,
    provider: "yopmail.com",
  });

  // Inicia Sesión en CIMA
  await test.step("Inicio de sesión (Login)", async () => {
    await page.goto("https://cima-qa.azurewebsites.net/", {
      waitUntil: "domcontentloaded",
    });

    await page.locator('xpath=//*[@id="Username"]').fill("kpg2");
    await page.locator('input[type="password"]').fill("Cima321...");

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
  });

  // Valida si existen sesiones activas y cierra una
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

  // Ingresa a Seguridad/Familia
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

  // Realiza validación de IA
  await test.step("Completar validación con Inteligencia Artificial", async () => {
    const selectDocumento = page.locator("select#IdentityEvidenceId");
    await selectDocumento.waitFor({ state: "visible", timeout: 15000 });

    // Se selecciona por 'value' ("834") para evitar fallos por cambio de idioma o texto
    await selectDocumento.selectOption("834");

    // Subida del archivo usando el input real del modal (#FileUrl)
    const filePath = path.resolve(__dirname, "../fixtures/FotoFamilia7.jpg");
    const inputElement = page.locator("input#FileUrl");
    await inputElement.setInputFiles(filePath);
    await inputElement.dispatchEvent("change");

    // Clic en el botón Continuar
    const btnContinuarIA = page.locator('button[type="submit"]:has-text("Continuar"), button[type="submit"]:has-text("Continue")');
    await expect(btnContinuarIA).toBeEnabled({ timeout: 20000 });
    await btnContinuarIA.click();

        
    await expect(
      page.getByText(/Primer nombre|First name/i)
    ).toBeVisible({ timeout: 15000 });
  });

// Diligenciamiento de formulario con datos dinámicos generados por Faker
  await test.step("Completar datos personales y finalizar registro", async () => {
    // 1. Generar los datos con Faker
    const firstName = faker.person.firstName();
    const secondName = faker.person.middleName(); // o faker.person.firstName()
    const firstLastName = faker.person.lastName();
    const secondLastName = faker.person.lastName();

    // 2. Llenar los campos de nombres y apellidos (soporta inglés y español)
    await page.getByRole("textbox", { name: /First name \*|Primer nombre \*/i }).fill(firstName);

    // Si tu formulario tiene campo opcional para segundo nombre:
    const inputSecondName = page.getByRole("textbox", { name: /Second name|Segundo nombre/i });
    if (await inputSecondName.isVisible()) {
      await inputSecondName.fill(secondName);
    }

    await page.getByRole("textbox", { name: /First last name \*|Primer apellido \*/i }).fill(firstLastName);

    // Si tu formulario tiene campo para segundo apellido:
    const inputSecondLastName = page.getByRole("textbox", { name: /Second last name|Segundo apellido/i });
    if (await inputSecondLastName.isVisible()) {
      await inputSecondLastName.fill(secondLastName);
    }

    // 3. Selección de país y ciudad
    await page.getByLabel(/Country of birth|País de nacimiento/i).selectOption("1");
    await page.getByLabel(/City of birth|Ciudad de nacimiento/i).selectOption("74");
    await page.getByRole("textbox", { name: /mm\/dd\/yyyy|dd\/mm\/aaaa/i }).fill("09202000");

    // 4. Correo generado con el nombre y apellido actual
    const userEmail = faker.internet.email({
      firstName,
      lastName: firstLastName,
      provider: "yopmail.com",
    });
    await page.getByRole("textbox", { name: /Email|Correo/i }).fill(userEmail);

    // 5. Finalizar creación de usuario
    await page.getByRole("button", { name: /Create user|Crear usuario/i }).click();
    await page.getByText(/Single record selection|Selección de registro único/i).click();
    await page.locator('input[type="checkbox"]').check();

    await page.getByRole("button", { name: /Continue|Continuar/i }).click();
    await page.getByRole("button", { name: /Create user|Crear usuario/i }).click();
    await expect(page.getByText(/Account confirmationRemember|Confirmación de cuenta/i)).toBeVisible();
  });

});