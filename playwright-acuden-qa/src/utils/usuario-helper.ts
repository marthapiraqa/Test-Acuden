/**
 * usuario-helper.ts
 * Utilidad para persistir en disco los usuarios creados durante las pruebas.
 * Encapsula toda la lógica de lectura/escritura de data/usuarios.json.
 */

import fs   from 'fs'
import path from 'path'
import { RegistroUsuario } from '../types/index.js'

/** Ruta canónica al archivo de historial de usuarios */
const RUTA_USUARIOS = path.resolve('data', 'usuarios.json')

/**
 * Lee el historial de usuarios desde disco.
 * Devuelve un arreglo vacío si el archivo no existe o está corrompido.
 */
export function leerHistorial(): RegistroUsuario[] {
  if (!fs.existsSync(RUTA_USUARIOS)) return []

  try {
    const raw = fs.readFileSync(RUTA_USUARIOS, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Agrega un nuevo registro de usuario al historial y lo persiste en disco.
 * @param usuarioCreado - número/ID del usuario recién creado en CIMA
 */
export function guardarUsuario(usuarioCreado: string): void {
  const historial = leerHistorial()

  const nuevoRegistro: RegistroUsuario = {
    fecha: new Date().toLocaleString('es-CO', { hour12: false }),
    usuarioCreado,
  }

  historial.push(nuevoRegistro)

  fs.mkdirSync(path.dirname(RUTA_USUARIOS), { recursive: true })
  fs.writeFileSync(RUTA_USUARIOS, JSON.stringify(historial, null, 2), 'utf-8')

  console.log(`✔ Usuario "${usuarioCreado}" guardado en historial (total: ${historial.length})`)
}

/**
 * Devuelve el último usuario creado del historial, o null si está vacío.
 */
export function obtenerUltimoUsuario(): RegistroUsuario | null {
  const historial = leerHistorial()
  return historial.length > 0 ? historial[historial.length - 1] : null
}

