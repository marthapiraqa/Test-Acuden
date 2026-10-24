# De Codegen a Page Object Model

1. Ejecutar `.\pw.cmd run codegen`. Se abre el login real y Playwright Inspector.
2. Grabar un recorrido corto con datos de prueba. Agregar verificaciones de visibilidad,
   texto o valor desde el Inspector. Cerrar el navegador al terminar.
3. Revisar el archivo en `recordings/`. Sustituir usuario y contraseña por variables
   de entorno. No compartir grabaciones originales ni estados de sesión.
4. Mover los localizadores de la grabación a la clase de página correspondiente.
   Preferir `getByRole` y `getByLabel`; usar IDs comprobados cuando falten etiquetas.
5. Mover acciones repetidas a métodos con intención funcional, por ejemplo `login()`.
6. Mantener los resultados esperados del negocio en el test. No validar solamente
   que los botones se puedan pulsar. Comprobar que se obtuvo el resultado solicitado.
7. Registrar el escenario en `docs/COBERTURA.md`, ejecutar el test individual y después
   la suite. No usar pausas fijas ni reintentos para ocultar errores.

Ejemplo de acciones que puede producir Codegen (ilustrativo, no una grabación realizada):

```ts
await page.getByRole('textbox', { name: 'Nombre de Usuario', exact: true }).fill('cuenta');
await page.getByLabel('Contraseña', { exact: true }).fill('contraseña');
await page.getByRole('button', { name: 'Accesar', exact: true }).click();
```

Conversión utilizando el POM incluido:

```ts
await loginPage.goto();
await loginPage.login(process.env.ADSEF_USERNAME!, process.env.ADSEF_PASSWORD!);
await expect(page).toHaveURL(process.env.ADSEF_AUTHENTICATED_URL!);
await expect(page.locator(process.env.ADSEF_AUTHENTICATED_SELECTOR!)).toBeVisible();
```

Para este primer acceso, obtener la URL y un elemento exclusivo de la pantalla
autenticada con Codegen y completar `.env`. Cuando se conozcan los módulos reales,
crear sus Page Objects y sustituir esta configuración inicial por sus localizadores
verificados. El test autenticado falla explícitamente si falta configuración.

Web Forms: dejar que el navegador gestione ViewState y postbacks. Esperar el resultado
visible de cada operación, también cuando un UpdatePanel cambia el DOM sin cambiar URL.
No deshabilitar validaciones ni mecanismos de autenticación para hacer pasar pruebas.

Codegen necesita interacción en su navegador. Las pruebas públicas iniciales se han
escrito con los controles observados en el sitio; no se presentan como grabaciones.
