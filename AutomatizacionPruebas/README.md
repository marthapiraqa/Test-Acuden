# ADSEF Digital: Playwright + Codegen + POM

Proyecto independiente de pruebas para `http://192.168.10.68/adsefdigitalss/Security/Login.aspx`.
La URL se puede cambiar en `.env` mediante `ADSEF_BASE_URL`.

## Instalación

Requiere Windows 11/Windows Server 2019 o posterior, PowerShell, red interna/VPN para
ADSEF e Internet para descargar Node.js, paquetes npm y Chromium. La instalación
incluida está preparada para Windows x64.

```powershell
.\setup.cmd
```

Instala Node.js 24.21.0 con npm dentro de `.tools/`, verifica el SHA256 del archivo
oficial, instala las versiones del `package-lock.json` y descarga Chromium en
`.tools/ms-playwright/`. No modifica el PATH permanente. VS Code y su extensión
Playwright son opcionales. No se necesita instalar IIS ni .NET para ejecutar esta suite.

Los lanzadores `.cmd` usan una política de PowerShell temporal para su proceso;
no cambian la política permanente del equipo.

## Comandos desde esta carpeta

También hay escenarios **Gherkin en español**, implementados con `playwright-bdd`
y el mismo POM. Ver [guía Gherkin](docs/GHERKIN.md).

La [búsqueda de usuarios](docs/BUSQUEDA-USUARIOS.md) tiene escenarios por correo y seguro
social. Los datos esperados se configuran localmente en `.env`. Ver la guía para conocer
los comandos y el estado de la validación contra el servidor.

```powershell
.\pw.cmd run test:bdd -- --headed
```

```powershell
.\pw.cmd test
.\pw.cmd run test:headed
.\pw.cmd run test:ui
.\pw.cmd run typecheck
.\pw.cmd run report
.\pw.cmd run codegen
.\pw.cmd run test:recording -- --headed
```

`pw.ps1` habilita temporalmente Node.js local. Con Node.js 24 disponible en PATH,
también se pueden usar `npm test`, `npm run codegen`, etc. Usar estos scripts para
que Playwright encuentre el navegador local del proyecto.

## Credenciales y prueba autenticada

La grabación del 24 de septiembre está adaptada en
`tests/recorded/login-recording.spec.ts` y se ejecuta con `test:recording`.
Sus valores de entrada se guardan localmente en `.tools/recording-inputs.json`,
fuera de Git; son necesarios para reproducirla. Ahora exige abandonar `Login.aspx`,
llegar a `ADSEF_AUTHENTICATED_URL`, mostrar `ADSEF_AUTHENTICATED_SELECTOR` y ocultar
«Accesar». Los dos valores de destino deben configurarse en `.env` tras observar
un acceso válido; sin ellos la prueba no puede aprobarse. El aviso inicial se cierra
mediante `LoginPage.dismissBenefitsNotice()`.

El instalador crea `.env` desde `.env.example` si todavía no existe. Completar ahí
usuario, contraseña, URL absoluta de destino y selector exclusivo de la pantalla
autenticada, después de observarlos con Codegen. Las variables del proceso tienen
prioridad sobre `.env`.

```powershell
.\pw.cmd run test:auth -- --headed
```

Sin esos datos el test falla con un mensaje explícito. No hay una cuenta predeterminada.
No se reutiliza estado autenticado hasta verificar el comportamiento de Session.
Las trazas y capturas de las pruebas autenticadas están deshabilitadas para evitar
guardar credenciales. Las grabaciones de Codegen pueden contenerlas: son locales,
están ignoradas por Git y deben revisarse antes de compartirlas.

## Estructura y ampliación

- `pages/LoginPage.ts`: acciones y localizadores reales del login.
- `fixtures/test.ts`: una instancia de página por test y contexto aislado.
- `tests/public/`: pruebas sin cuenta ni envío de credenciales.
- `tests/auth/`: prueba de acceso configurable, pendiente validación real.
- `recordings/`: grabaciones locales de Codegen, fuera de la suite.
- `docs/CODEGEN-POM.md`: cómo convertir grabaciones a páginas y tests.
- `docs/COBERTURA.md`: escenarios cubiertos y pendientes.
- `docs/VALIDACION.md`: evidencia de ejecución y limitaciones.

Cada test usa un contexto nuevo, un solo worker y cero reintentos. Los fallos públicos
guardan captura y traza; el reporte HTML queda en `playwright-report/`.
Las pruebas detectan regresiones de los escenarios implementados; no garantizan que
todos los módulos funcionen. Faltan cuentas, roles y recorridos reales para ampliar
la cobertura autenticada y validar operaciones de negocio.

Documentación oficial: https://playwright.dev/docs/codegen y https://playwright.dev/docs/pom.
