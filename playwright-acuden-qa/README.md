# 🎭 playwright-acuden-qa

Proyecto de automatización de pruebas end-to-end para los portales **ACUDEN Digital** y **CIMA**, desarrollado con [Playwright](https://playwright.dev/) y TypeScript, aplicando el patrón **Page Object Model (POM)**.

---

## 📁 Estructura del Proyecto

```
playwright-acuden-qa/
│
├── data/                                   # Datos de prueba (JSON)
│   ├── solicitantes.json                   # Perfiles de solicitantes para parametrizar tests
│   └── usuarios.json                       # Historial de usuarios creados en CIMA
│
├── resources/                              # Archivos adjuntos para los tests
│   ├── foto-familia-7.jpg                  # Imagen para validación con IA
│   └── evidencia.pdf                       # PDF alternativo para validación IA
│
├── src/
│   ├── types/
│   │   └── index.ts                        # Interfaces TypeScript compartidas
│   ├── pages/                              # Page Objects (POM)
│   │   ├── acuden.page.ts                  # Portal ACUDEN Digital
│   │   └── cima.page.ts                    # Portal CIMA (administración)
│   ├── utils/                              # Utilidades reutilizables
│   │   ├── date-helper.ts                  # Generador de datos de prueba aleatorios
│   │   ├── usuario-helper.ts               # Lectura/escritura de usuarios.json
│   │   └── yopmail.ts                      # Cliente para extraer OTP desde Yopmail
│   └── fixtures/
│       └── test.fixture.ts                 # Fixtures personalizadas de Playwright
│
├── tests/
│   ├── auth/
│   │   └── asignar-contrasena.spec.ts      # Flujo completo + asignación de contraseña
│   └── cuentas/
│       ├── solicitar-cuenta-acuden.spec.ts           # Solicitud de cuenta en ACUDEN
│       ├── crear-cuenta-solicitante-completo.spec.ts # Flujo completo ACUDEN + CIMA
│       ├── confirmar-cuenta-cima.spec.ts             # Confirmación de cuenta en CIMA
│       └── crear-cuenta-familia-cima.spec.ts         # Creación directa desde CIMA
│
├── playwright.config.ts                    # Configuración global de Playwright
├── tsconfig.json                           # Configuración de TypeScript 7
└── package.json                            # Dependencias del proyecto
```

---

## 🏗️ Arquitectura — Page Object Model

El proyecto sigue una separación estricta de responsabilidades:

```
Test (.spec.ts)          Page Object (.page.ts)         Utilidades (.ts)
──────────────           ──────────────────────         ───────────────
• Orquesta el flujo  →   • Expone localizadores    →    • yopmail.ts
• Llama métodos POM      • Define acciones              • usuario-helper.ts
• Contiene expect()      • SIN expect() aquí            • date-helper.ts
• Importa datos          • Recibe datos por params
  desde data/
```

### Regla de oro
> **Los `expect()` viven ÚNICAMENTE en los archivos `.spec.ts`.**  
> Los Page Objects solo contienen localizadores y acciones.

---

## 📄 Descripción de Archivos Clave

### `src/types/index.ts`
Interfaces TypeScript centralizadas que garantizan tipado estricto en todo el proyecto:

| Interfaz | Uso |
|----------|-----|
| `Solicitante` | Perfil de datos cargado desde `data/solicitantes.json` |
| `RegistroUsuario` | Entrada del historial en `data/usuarios.json` |
| `CredencialesCima` | Usuario y contraseña del portal CIMA |
| `DatosPersonales` | Nombre, apellido, fecha, país y pueblo de nacimiento |
| `DatosContacto` | Correo Yopmail y pueblo de residencia |

---

### `src/pages/acuden.page.ts`
Page Object para el portal **ACUDEN Digital** (`acudendigital-qa2.azurewebsites.net`).

**Métodos principales:**

| Método | Descripción |
|--------|-------------|
| `navegarEIniciarFlujo()` | Navega al portal y selecciona tipo "Solicitante → Primera vez" |
| `completarValidacionIA(rutaArchivo)` | Sube el documento y espera la validación de IA |
| `completarDatosPersonales(datos)` | Rellena el formulario (solo campos vacíos) |
| `completarContactoYValidarOtp(datos, remitente, regex)` | Llena correo, dispara OTP y lo valida con Yopmail |
| `enviarSolicitud()` | Maneja radio "Ninguno de los anteriores" y envía |

---

### `src/pages/cima.page.ts`
Page Object para el portal **CIMA** (`cima-qa.azurewebsites.net`).

**Métodos principales:**

| Método | Descripción |
|--------|-------------|
| `iniciarSesion(credenciales)` | Login en CIMA |
| `gestionarSesionesActivas()` | Cierra sesiones activas si el modal aparece |
| `navegarASolicitudesFamilia()` | Seguridad → Familia → Solicitudes |
| `seleccionarUltimaSolicitud()` | Última página + última fila de la tabla |
| `seleccionarRegistroUnicoDemografico()` | Abre modal RU, navega a última página, selecciona "Persona no encontrada" |
| `crearCuentaYGuardarUsuario()` | Crea la cuenta, captura el número y lo persiste en `usuarios.json` |
| `buscarUsuario(usuario)` | Busca el usuario creado en la lista de gestión |
| `enviarNotificacionRestablecimiento()` | Envía email de reset y retorna la dirección detectada |
| `abrirEnlaceRestablecimiento(email)` | Abre Yopmail, encuentra el correo y navega al enlace de reset |
| `asignarNuevaContrasena(page, password)` | Rellena y envía el formulario de nueva contraseña |

---

### `src/utils/date-helper.ts`
Generador de datos de prueba aleatorios. Convierte el antiguo `generateDate.js` a TypeScript con tipado estricto.

```bash
# Generar 1 registro nuevo en data/solicitantes.json
node -r ts-node/register src/utils/date-helper.ts

# Generar 5 registros
node -r ts-node/register src/utils/date-helper.ts 5
```

---

### `src/utils/usuario-helper.ts`
Gestiona la persistencia del historial de usuarios creados en CIMA.

```typescript
import { guardarUsuario, leerHistorial, obtenerUltimoUsuario } from './usuario-helper'

guardarUsuario('253')           // Agrega al historial
const ultimo = obtenerUltimoUsuario()   // { fecha: '...', usuarioCreado: '253' }
```

---

### `src/utils/yopmail.ts`
Abre una pestaña nueva en el mismo contexto de navegador, accede a Yopmail, extrae el código OTP usando una regex y cierra la pestaña. **La pestaña original nunca se toca.**

---

## 🧪 Suites de Prueba

### `tests/cuentas/solicitar-cuenta-acuden.spec.ts`
**Propósito:** Solicitar una cuenta Familia en el portal ACUDEN Digital.

**Flujo:**
1. Navegar al portal → seleccionar Solicitante → Primera vez
2. Validación de identidad con IA (sube `foto-familia-7.jpg`)
3. Completar datos personales (con datos de `solicitantes.json`)
4. Ingresar correo Yopmail → solicitar código OTP → validarlo
5. Enviar solicitud y verificar confirmación

---

### `tests/cuentas/crear-cuenta-solicitante-completo.spec.ts`
**Propósito:** Flujo end-to-end completo — desde la solicitud en ACUDEN hasta la creación del usuario en CIMA.

**Flujo:**
- **Fase 1 (ACUDEN):** Mismo flujo que `solicitar-cuenta-acuden`
- **Fase 2 (CIMA):** Login → seleccionar solicitud → Registro Único → crear cuenta → guardar usuario en `usuarios.json`

---

### `tests/cuentas/confirmar-cuenta-cima.spec.ts`
**Propósito:** Confirmar el último registro pendiente en CIMA y establecer contraseña inicial.

**Flujo:**
1. Login en CIMA
2. Gestión de sesiones activas
3. Navegar a Solicitudes de Familia → última solicitud
4. Seleccionar Registro Único Demográfico → "Persona no encontrada"
5. Crear cuenta → capturar número de usuario
6. Buscar usuario → enviar notificación de restablecimiento
7. Abrir Yopmail → navegar al enlace → asignar nueva contraseña

---

### `tests/cuentas/crear-cuenta-familia-cima.spec.ts`
**Propósito:** Crear una cuenta familiar directamente desde el panel de administración de CIMA (sin pasar por el portal ACUDEN).

**Flujo:**
1. Login en CIMA
2. Seguridad → Familia → Solicitudes → Create user
3. Validación de identidad con IA
4. Completar datos personales (faker + `solicitantes.json`)
5. Enviar y confirmar creación

---

### `tests/auth/asignar-contrasena.spec.ts`
**Propósito:** Flujo completo de extremo a extremo que incluye las 3 fases:

- **Fase 1:** Solicitar cuenta en ACUDEN Digital
- **Fase 2:** Confirmar cuenta en CIMA
- **Fase 3:** Asignar contraseña inicial vía Yopmail

---

## 📊 Datos de Prueba

### `data/solicitantes.json`
```json
[
  {
    "id": 1,
    "UserCima": "Kpg2",
    "Pass": "Acuden123...",
    "clavenueva": "Acuden123...",
    "fechaNacimiento": "09/01/1975",
    "paisNacimiento": "Puerto Rico",
    "puebloNacimiento": "Toa Baja",
    "puebloResidencia": "Toa Baja"
  }
]
```

### `data/usuarios.json`
Historial auto-generado por los tests. Cada ejecución exitosa agrega una entrada:
```json
[
  {
    "fecha": "23/10/2026, 20:12:00",
    "usuarioCreado": "252"
  }
]
```

---

## ⚙️ Configuración

### `playwright.config.ts`

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `testDir` | `./tests` | Directorio raíz de los tests |
| `timeout` | `240 000 ms` | Timeout global por test |
| `fullyParallel` | `false` | Ejecución secuencial (flujos interdependientes) |
| `workers` | `1` | Un worker para evitar conflictos de estado |
| `headless` | `false` | Con interfaz visual (cambiar a `true` en CI) |
| `retries` | `0` | Sin reintentos automáticos |
| `trace` | `on-first-retry` | Trazas en primer reintento |
| `screenshot` | `only-on-failure` | Capturas solo en fallas |
| `video` | `retain-on-failure` | Video solo en fallas |

### `tsconfig.json`

| Opción | Valor |
|--------|-------|
| `target` | `ES2022` |
| `module` | `ESNext` |
| `moduleResolution` | `bundler` (TS 7) |
| `strict` | `true` |
| `resolveJsonModule` | `true` |
| `lib` | `ES2022`, `DOM` |

---

## 🚀 Comandos

```bash
# Instalar dependencias
npm install

# Verificar que TypeScript compile sin errores
npx tsc --noEmit

# Ejecutar todos los tests
npx playwright test

# Ejecutar un spec específico
npx playwright test tests/cuentas/solicitar-cuenta-acuden.spec.ts

# Ejecutar con interfaz visual (headed)
npx playwright test --headed

# Ejecutar en modo debug (paso a paso)
npx playwright test --debug

# Ver el reporte HTML del último run
npx playwright show-report

# Generar nuevos datos de prueba en data/solicitantes.json
node -r ts-node/register src/utils/date-helper.ts
```

---

## 📦 Dependencias

```json
{
  "devDependencies": {
    "@faker-js/faker":  "^10.6.0",   // Generación de datos falsos realistas
    "@playwright/test": "^1.47.0",   // Framework de automatización
    "@types/node":      "^20.19.43", // Tipos de Node.js
    "typescript":       "^7.0.2"     // Compilador TypeScript
  }
}
```

---

## 🌐 Ambientes

| Portal | URL |
|--------|-----|
| ACUDEN Digital (QA) | `https://acudendigital-qa2.azurewebsites.net/` |
| CIMA (QA) | `https://cima-qa.azurewebsites.net/` |
| Yopmail | `https://yopmail.com/es/` |

---

## 🔑 Credenciales de Prueba

> ⚠️ **Solo para ambiente QA.** No usar en producción.

| Portal | Usuario | Contraseña |
|--------|---------|------------|
| CIMA | `kpg2` | `Cima123...` |

Las credenciales están definidas como constantes en cada spec. Para mayor seguridad en entornos compartidos, se recomienda migrarlas a un archivo `.env`.

---

## 🧹 Limpieza de Archivos Obsoletos

Los siguientes archivos originales fueron reemplazados por la refactorización. Pueden eliminarse de forma segura:

```cmd
del "tests\cuentas\solicitar-cuentaacuden.spec.ts"
del "tests\cuentas\crear-cuentafamilia-cima.spec.ts"
del "src\utils\generateDate.js"
```

> El archivo `tests\auth\asignar-contraseña.spec.ts` (con ñ) debe eliminarse desde el **Explorador de Windows** o con Git.

---

## ✅ Principios de Calidad Aplicados

- **POM estricto:** Cero `expect()` en Page Objects
- **Sin hardcoding:** Datos por parámetros, credenciales como constantes explícitas
- **Tipado estricto:** `strict: true` en TypeScript, sin `any` implícito
- **Kebab-case:** Todos los archivos con nombres estandarizados sin caracteres especiales
- **Separación de concerns:** `pages/` → UI, `utils/` → lógica, `data/` → datos, `tests/` → aserciones
- **Idempotencia:** Los métodos verifican estado antes de actuar (ej. `_rellenarSiVacio`)
- **Trazabilidad:** `console.log` con prefijo `[NombrePage]` en cada acción importante
