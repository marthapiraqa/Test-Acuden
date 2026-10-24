# Registro de validaciones

## 25 de septiembre de 2026 — Búsqueda sin coincidencias

`pw.cmd run test:bdd -- --headed --grep '@busqueda_usuarios'`:
**3 escenarios aprobados en 19,4 segundos** contra `/adsefdigitalss/`.
El nuevo escenario `@usuario_inexistente` aprobó en 4,7 segundos y las dos búsquedas
existentes también aprobaron. TypeScript sin errores.

Se consultó un correo ficticio de example.com. Se validó el mensaje visible exacto
«Error: No se encontraron records en su búsqueda.», cero filas de datos en la tabla
de usuarios, permanencia en la pantalla de búsqueda y campo editable.
El reporte HTML más reciente corresponde a estos tres escenarios.

## 25 de septiembre de 2026 — Búsqueda de usuarios

`pw.cmd run test:bdd -- --headed --grep '@busqueda_usuarios'`:
**2 escenarios aprobados en 19,3 segundos** contra el entorno confirmado
`http://192.168.10.68/adsefdigitalss/`.

- Por correo: aprobado en 11,1 segundos.
- Por seguro social: aprobado en 7,3 segundos.
- `pw.cmd run typecheck`: correcto, sin errores.

Ambos escenarios validan la fila del Usuario ID esperado, la coincidencia del filtro
en su columna y la ausencia del aviso sin registros. El correo puede corresponder a
varias filas. Los datos proporcionados se almacenan en `.env`, ignorado por Git;
el seguro social permanece como texto y no está escrito en el feature.

La ejecución anterior tuvo un timeout al abrir Login.aspx en el escenario por correo,
mientras el escenario por seguro social aprobó. La repetición explícita de ambos pasó;
no se modificaron los tiempos de espera ni se habilitaron reintentos automáticos.
El reporte HTML más reciente corresponde a estos dos escenarios de búsqueda.

## Histórico — 24 de septiembre de 2026

## Última ejecución: escenario negativo incluido

`pw.cmd run test:bdd -- --headed`: **3 escenarios aprobados en 11,5 segundos**.
TypeScript: sin errores. El nuevo escenario `@negativo` pasó en 3,1 segundos.
Valida visibilidad y texto exacto del error, permanencia en Login.aspx y presencia
del botón Accesar. Mensaje observado y esperado:

> Usuario no existe o este usuario aún no ha sido activado todavia(Revise su correo electrónico para enlace de activación).

Se utilizó el usuario ficticio `qa_noexiste_7f9c2a` y una contraseña incorrecta de
formato válido. No se utilizaron credenciales reales para el intento negativo.
La inspección inicial con caracteres especiales produjo otra validación de formato;
el escenario final evita esos caracteres para alcanzar el rechazo del usuario.

## Gherkin: última ejecución

`pw.cmd run test:bdd -- --headed`: **2 escenarios aprobados en 7,9 segundos**:
consultar el formulario e iniciar sesión con la cuenta de prueba. La generación
detectó los dos escenarios; TypeScript pasó sin errores. Se utiliza playwright-bdd
9.2.1. El reporte HTML más reciente corresponde a esta ejecución Gherkin.

Entorno: Windows build 26200 x64. URL consultada:
`http://192.168.10.68/adsefdigital/Security/Login.aspx` (HTTP 200).

Instalado dentro del proyecto:

- Node.js 24.21.0 y npm 11.19.0. Archivo oficial verificado mediante SHA256.
- Playwright Test 1.63.0.
- TypeScript 5.9.3, tipos de Node.js 24.13.6 y dotenv 18.0.3.
- Chromium de Playwright v1243 y sus dependencias de ejecución.

## Resultado actual de la comprobación autenticada

Última ejecución: `pw.cmd run test:recording -- --headed`, **1 prueba aprobada
en 6,6 segundos**. Se observó y configuró en `.env` el destino real
`http://192.168.10.68/adsefdigital/Security/OperadorOptionsMenu.aspx` y el enlace
visible de salida `a[href="../Portal/Salida.aspx"]`. La prueba verifica la URL,
la presencia de ese enlace y la ausencia del botón «Accesar».

### Antecedente: ejecución anterior fallida

Se sustituyó la comprobación del botón por `LoginPage.expectAuthenticated()`.
Ahora exige salir de Login.aspx, coincidir con la URL autenticada configurada,
mostrar un elemento exclusivo de esa pantalla y ocultar el botón de acceso.

`pw.cmd run test:recording -- --headed`: **1 prueba fallida en 24,5 segundos**.
Motivo: el navegador permaneció en `/adsefdigital/Security/Login.aspx` durante los
20 segundos de espera. TypeScript: sin errores. Esta ejecución reemplaza el resultado
aprobado de la comprobación anterior, que solo miraba el botón.

En una inspección del recorrido no se observó un POST a ADSEF ni un mensaje de error
visible del login. No se ha determinado la causa; no se atribuye a credenciales
incorrectas. Falta observar un acceso válido para configurar la URL y el selector
autenticados en `.env`. No se inventaron valores para la pantalla de destino.

## Resultados iniciales

| Comprobación | Resultado |
| --- | --- |
| `pw.cmd run typecheck` | Correcto, sin errores |
| `pw.cmd test` | 3 pruebas aprobadas, 0 fallidas; 17,1 segundos |
| LOGIN-001 | Formulario y opciones visibles: aprobado |
| LOGIN-002 | Introducir/limpiar campos sin enviar credenciales: aprobado |
| LOGIN-003 | Validación de caracteres inválidos y corrección: aprobado |
| `pw.cmd run codegen -- --help` | CLI disponible |
| `pw.cmd run test:auth -- --list` | Detecta únicamente LOGIN-004 |

Reporte real disponible en `playwright-report/index.html`, o con `pw.cmd run report`.
Se ejecutaron las pruebas contra el servidor real, sin mocks ni alteraciones del sitio.

## Pendiente

### Ejecución posterior de la grabación

`pw.cmd run test:recording -- --headed`: **1 prueba aprobada en 5,8 segundos**.
TypeScript: sin errores. La primera ejecución falló porque el aviso `messagesLogin`
interceptaba los clics. Se corrigió la interacción del test usando el botón
«Continuar con ADSEF Digital», sin modificar la aplicación.

La grabación se adaptó a `LoginPage` y sus entradas se separaron en un archivo local
ignorado por Git. Se conserva la aserción original sobre el botón «Accesar»;
no verifica que el servidor haya aceptado las credenciales ni la pantalla de destino.
El reporte HTML más reciente corresponde a esta grabación.

### Cobertura aún pendiente

- Grabar con interacción del usuario los recorridos autenticados en Codegen.
- Configurar cuenta de prueba, rol y resultado esperado del acceso en `.env`.
- Ejecutar LOGIN-004 y observar cierre de sesión, permisos y módulos internos.
- Definir si el entorno permite operaciones que modifican datos.
- Ampliar la matriz y verificar estabilidad de los recorridos autenticados.

No se ha validado toda ADSEF Digital. La ejecución pública no envía credenciales,
no inicia sesiones ni crea/modifica registros. La prueba autenticada está preparada
pero aún no ha sido ejecutada contra una cuenta real.
