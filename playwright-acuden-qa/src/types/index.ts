/**
 * Tipos compartidos del proyecto QA Acuden
 */

/** Datos de un solicitante cargados desde data/solicitantes.json */
export interface Solicitante {
  id: number
  UserCima?: string
  Pass?: string
  clavenueva?: string
  fechaNacimiento: string
  paisNacimiento: string
  puebloNacimiento: string
  puebloResidencia: string
}

/** Registro de usuario creado en CIMA, guardado en data/usuarios.json */
export interface RegistroUsuario {
  fecha: string
  usuarioCreado: string
}

/** Datos de credenciales de CIMA */
export interface CredencialesCima {
  username: string
  password: string
}

/** Datos del formulario de cuenta en ACUDEN Digital */
export interface DatosPersonales {
  nombre: string
  apellido: string
  nombre2?: string
  apellido2?: string
  fechaNacimiento: string
  paisNacimiento: string
  puebloNacimiento: string
}

/** Datos de contacto para el flujo de OTP */
export interface DatosContacto {
  correoYopmail: string
  puebloResidencia: string
}

