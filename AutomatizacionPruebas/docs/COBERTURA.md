# Matriz de cobertura

| Caso | Comportamiento | Estado inicial |
| --- | --- | --- |
| BUS-USR-003 | Usuario inexistente: aviso exacto visible y ausencia de filas | Aprobado el 25/09/2026 en /adsefdigitalss/ |
| BUS-USR-001 | Buscar por correo y validar Usuario ID y correo en la misma fila | Aprobado el 25/09/2026 en /adsefdigitalss/ |
| BUS-USR-002 | Buscar por seguro social y validar Usuario ID y seguro social en la misma fila | Aprobado el 25/09/2026 en /adsefdigitalss/ |
| BDD negativo | Usuario ficticio y contraseña incorrecta: mensaje exacto visible y permanencia en login | Ejecutado: aprobado |
| BDD público | Gherkin: formulario editable y contraseña enmascarada | Ejecutado: aprobado |
| BDD autenticado | Gherkin: acceso a pantalla autenticada mediante el POM existente | Ejecutado: aprobado |
| REC-001 | Exige salida del login, URL de OperadorOptionsMenu, enlace de salida y ausencia de Accesar | Ejecutado: aprobado en 6,6 segundos |
| LOGIN-001 | Formulario, contraseña enmascarada y opciones de acceso | Implementado; ver VALIDACION.md |
| LOGIN-002 | Introducir y limpiar campos sin enviar credenciales | Implementado; ver VALIDACION.md |
| LOGIN-003 | Validación de caracteres del usuario | Implementado; ver VALIDACION.md |
| LOGIN-004 | Acceso válido y evidencia de pantalla autenticada | Preparado; pendiente cuenta y resultado esperado real |
| LOGIN-005 | Campos obligatorios | Pendiente observar respuesta real al envío vacío |
| LOGIN-006 | Credenciales incorrectas | Cubierto para usuario inexistente; pendiente contraseña incorrecta de usuario existente |
| LOGIN-007 | Cierre de sesión y acceso posterior denegado | Pendiente acceso autenticado |
| ROLES-001 | Permisos por rol | Pendiente roles y cuentas |
| FLUJOS-001 | Recorridos completos por módulo | Pendiente inventario de módulos y datos autorizados |

`npm test` ejecuta exclusivamente LOGIN-001 a LOGIN-003. Su resultado no representa
cobertura de toda la aplicación. `npm run test:auth` ejecuta LOGIN-004 de forma explícita.
No se han aprobado ni realizado altas, modificaciones, borrados ni envíos de correos.
