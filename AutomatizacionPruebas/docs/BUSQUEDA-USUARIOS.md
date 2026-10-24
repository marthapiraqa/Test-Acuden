# Búsqueda de usuarios por correo y seguro social

Escenario: `features/busqueda-usuarios.feature`.
Pasos: `steps/user-search.steps.ts`.
Page Object: `pages/UserSearchPage.ts`.

Los dos escenarios positivos inician sesión y abren Búsqueda de usuarios. Uno consulta por
correo y otro por seguro social. Ambos comprueban el Usuario ID esperado y el dato
buscado en la misma fila. El correo puede tener varias coincidencias; no se exige
que toda la búsqueda devuelva un único registro. También se exige que no aparezca
el aviso sin resultados. No se crean ni modifican usuarios.

El escenario `@usuario_inexistente` consulta un correo ficticio y exige el aviso
exacto «Error: No se encontraron records en su búsqueda.», sin filas de usuarios.
También comprueba que se conserve la pantalla de búsqueda y el campo editable.

## Estado

Última ejecución, 25 de septiembre de 2026: **3 escenarios aprobados en 19,4 segundos**
contra `/adsefdigitalss/`. Correo: 8,3 segundos; seguro social: 5,2 segundos;
usuario inexistente: 4,7 segundos. TypeScript sin errores.

Se comprobaron el acceso al menú, la URL `Security/OperadorBusquedaUsuarios.aspx`,
el campo `mainCopy_txtBuscar`, el botón Buscar y el envío de la consulta.
Las inspecciones iniciales en `/adsefdigital/` habían devuelto el aviso sin registros;
ese resultado no corresponde a la última ejecución en el entorno confirmado.

Se incorporaron los datos y la estructura de columnas de la captura proporcionada.
El entorno actual confirmado por el usuario es `/adsefdigitalss/`.
Consultar `VALIDACION.md` para los resultados de la ejecución más reciente.

## Configuración local

En `.env`:

```dotenv
ADSEF_SEARCH_EMAIL=
ADSEF_SEARCH_USER_ID=
ADSEF_SEARCH_SSN=
```

Los tres valores deben corresponder al usuario esperado. El seguro social se guarda
como texto de nueve dígitos, conservando ceros iniciales. Los datos reales permanecen
en `.env`, fuera del feature y del repositorio. La validación se limita a la tabla,
no utiliza el encabezado de la sesión para buscar coincidencias.

```powershell
.\pw.cmd run test:bdd -- --headed --grep '@busqueda_usuarios'
.\pw.cmd run test:bdd -- --headed --grep '@por_correo'
.\pw.cmd run test:bdd -- --headed --grep '@por_seguro_social'
.\pw.cmd run test:bdd -- --headed --grep '@usuario_inexistente'
```

Para ejecutar solamente los escenarios de acceso:

```powershell
.\pw.cmd run test:bdd -- --grep-invert '@busqueda_usuarios'
```
