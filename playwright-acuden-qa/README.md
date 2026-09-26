# Acuden QA — Playwright

Migración del flujo de Cypress a Playwright. La diferencia clave: Playwright
sí soporta varias pestañas dentro de un mismo test, así que Yopmail se abre
en una pestaña **aparte** (`context.newPage()`) mientras la pestaña de
Acuden — con el popup de verificación de código abierto — se queda intacta.
Por eso ya no hace falta guardar/restaurar la URL ni volver a disparar el
envío del correo.

## Instalación

```bash
npm install
npx playwright install chromium
```

## Antes de correr

1. Coloca tu PDF de prueba en `fixtures/Evidencia.pdf` (o ajusta la ruta en
   `tests/solicitar-cuenta.spec.ts`).
2. Revisa `tests/solicitar-cuenta.spec.ts`:
   - `correoYopmail`: usuario de Yopmail a usar.
   - El campo de fecha de nacimiento (`#Birthday input`) tiene un valor de
     ejemplo — reemplázalo por el que usabas en tu `data.json` de Cypress.
   - `#RegionId`: falta confirmar si se autocompleta al elegir el Pueblo o
     si hay que seleccionarlo explícitamente.

## Ejecutar

```bash
npm test              # headless según playwright.config.ts (headless: false por defecto)
npm run test:headed   # fuerza ventana visible
npm run test:debug    # abre el inspector de Playwright, paso a paso
npm run report        # abre el último reporte HTML
```

## Estructura

```
playwright-acuden-qa/
├── package.json
├── playwright.config.ts
├── tests/
│   └── solicitar-cuenta.spec.ts   # el flujo completo
├── utils/
│   └── yopmail.ts                 # helper: abre Yopmail en pestaña aparte y extrae el OTP
├── fixtures/
│   └── Evidencia.pdf              # coloca aquí tu PDF de prueba
└── README.md
```
