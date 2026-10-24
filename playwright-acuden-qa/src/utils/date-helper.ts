/**
 * date-helper.ts
 * Utilidad para generar datos de prueba con fechas y pueblos aleatorios.
 * Sustituye al antiguo generateDate.js, ahora con tipado estricto TypeScript.
 */

import fs from 'fs'
import path from 'path'
import { Solicitante } from '../types/index.js'

// ------------------------------------------------------------------
// Catálogos de datos válidos
// ------------------------------------------------------------------
const PUEBLOS: readonly string[] = [
  'San Juan', 'Bayamon', 'Carolina', 'Ponce', 'Caguas',
  'Guaynabo', 'Mayaguez', 'Arecibo', 'Trujillo Alto', 'Toa Baja'
]

// ------------------------------------------------------------------
// Helpers internos con tipado estricto
// ------------------------------------------------------------------

/** Elimina tildes y acentos de un texto */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Devuelve un elemento aleatorio del arreglo */
function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Devuelve un entero aleatorio en el rango [min, max] (inclusivo) */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ------------------------------------------------------------------
// Generación del dataset
// ------------------------------------------------------------------

/**
 * Genera `cantidad` registros de solicitante con datos aleatorios.
 * @param cantidad - número de registros a generar (por defecto 1)
 */
export function generarSolicitantes(cantidad = 1): Omit<Solicitante, 'UserCima' | 'Pass' | 'clavenueva'>[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const dia  = String(randomInt(1, 28)).padStart(2, '0')   // máx 28 para evitar fechas inválidas
    const mes  = String(randomInt(1, 12)).padStart(2, '0')
    const anio = randomInt(1975, 2005)

    return {
      id:               i + 1,
      fechaNacimiento:  `${dia}/${mes}/${anio}`,
      paisNacimiento:   normalizar('Puerto Rico'),
      puebloNacimiento: normalizar(randomElement(PUEBLOS)),
      puebloResidencia: normalizar(randomElement(PUEBLOS)),
    }
  })
}

// ------------------------------------------------------------------
// CLI: ejecución directa → node -r ts-node/register src/utils/date-helper.ts [cantidad]
// Detectamos si este módulo es el punto de entrada principal
// ------------------------------------------------------------------
const isMain = require.main === module
if (isMain) {
  const cantidad   = parseInt(process.argv[2] ?? '1', 10)
  const dataset    = generarSolicitantes(cantidad)
  const outputPath = path.resolve('data', 'solicitantes.json')

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2), 'utf-8')
  console.log(`✔ Generados ${dataset.length} registro(s) en: ${outputPath}`)
}
