import { test, expect } from "@playwright/test";

//Rápido (ejecución ágil, pero visible al ojo): 100 a 200 ms
//Normal (ideal para demos o revisar el flujo con calma): 500 ms (medio segundo entre cada clic o tipeo)
//Lento (para depurar paso a paso visualmente): 1000 a 1500 ms (1 a 1.5 segundos por acción)
test.use({ launchOptions: { slowMo: 500 } });

test("Confirmar Usuario - Último registro", async ({ page }) => {


  //Inicia Sesion en CIMA
  await test.step("Inicio de sesión (Login)", async () => {
    // Navegar a la página principal de la aplicación
    await page.goto("https://cima-qa.azurewebsites.net/", {
      waitUntil: "domcontentloaded",
    });
    // Ingresar credenciales de acceso
    await page.locator('xpath=//*[@id="Username"]').fill("kpg2");
    await page.locator('input[type="password"]').fill("Cima321...");

    // --- PARTE DEL CAPTCHA ---
    // console.log("Ingrese el CAPTCHA manualmente y presione Resume");
    // await page.pause();
    // ----------------------------------

    //  Inicia Sesion
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

    console.log("Detalle del último registro abierto y procesado correctamente");
  });

});