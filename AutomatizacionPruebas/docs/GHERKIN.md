# Escenarios Gherkin en español

El proyecto usa `playwright-bdd` 9.2.1 con el runner de Playwright y los Page Objects
existentes. `setup.cmd` instala también esta dependencia desde `package-lock.json`.

## Ejecutar

```powershell
.\pw.cmd run test:bdd -- --headed
.\pw.cmd run test:bdd
.\pw.cmd run test:bdd -- --grep @publico
.\pw.cmd run test:bdd -- --grep @autenticado
.\pw.cmd run test:bdd -- --headed --grep @negativo
.\pw.cmd run test:bdd -- --list
.\pw.cmd run report
```

Cada ejecución genera primero los tests a partir de los `.feature`. Si falta la
implementación de un paso, la generación falla y no se ejecutan escenarios parciales.
`bdd:generate` realiza únicamente esa generación.

## Recorrido del código

1. `features/login.feature`: define el comportamiento con Dado, Cuando, Entonces.
2. `steps/login.steps.ts`: enlaza cada frase con una función TypeScript.
3. `fixtures/bdd.ts`: proporciona una instancia de `LoginPage` por escenario.
4. `pages/LoginPage.ts`: interactúa con la aplicación y verifica el acceso.
5. `playwright.bdd.config.ts`: configura la generación y la ejecución.
6. `.features-gen/`: tests generados automáticamente; no editar ni versionar.

Ejemplo del escenario implementado:

```gherkin
# language: es
Característica: Acceso a ADSEF Digital
  @autenticado
  Escenario: Iniciar sesión con la cuenta de prueba
    Dado que estoy en la página de acceso de ADSEF Digital
    Y cierro el aviso informativo inicial
    Cuando inicio sesión con la cuenta de prueba configurada
    Entonces accedo a la pantalla autenticada de ADSEF Digital
```

El último paso exige salir del login, llegar a la URL configurada, mostrar el enlace
de salida y ocultar «Accesar». No basta con reproducir los clics.

## Credenciales

El escenario `@negativo` utiliza un usuario ficticio y una contraseña incorrecta
de formato válido. Comprueba que `#mainCopy_lblErrorMessage` esté visible y tenga
el texto exacto observado en ADSEF, que la URL siga siendo Login.aspx y que el botón
Accesar continúe visible. Los valores del escenario son datos ficticios; no son la
cuenta real. Este caso prueba un usuario inexistente, no el bloqueo ni el rechazo
de una contraseña errónea para un usuario existente.

Se utilizan `ADSEF_USERNAME` y `ADSEF_PASSWORD` de `.env`. Si ambos están vacíos,
se usa la cuenta local de `.tools/recording-inputs.json` de la grabación validada.
Si solo se configura uno, el paso falla indicando que se deben completar ambos.
La URL y el selector autenticados se obtienen de `.env`, como en la prueba anterior.
No escribir credenciales en `.feature`, ejemplos, pasos ni reportes.

## Añadir un escenario con Codegen

1. Grabar el nuevo recorrido con `.\pw.cmd run codegen`.
2. Revisar las acciones y extraerlas a un Page Object.
3. Escribir el comportamiento esperado en un `.feature`, en lenguaje de negocio.
4. Reutilizar los pasos existentes o añadir sus funciones en `steps/`.
5. Ejecutar `typecheck` y después `test:bdd`.

Codegen genera acciones de Playwright; no convierte automáticamente la grabación
en Gherkin ni decide los resultados de negocio. Esa adaptación se realiza al escribir
los escenarios y sus pasos. `playwright-bdd` convierte posteriormente esos escenarios
en tests ejecutables de Playwright.

Las pruebas `.spec.ts` anteriores conservan sus comandos. `test:bdd` ejecuta solo
Gherkin, evitando ejecutar dos veces el mismo acceso dentro de esa suite.

Documentación del proyecto: https://github.com/vitalets/playwright-bdd
