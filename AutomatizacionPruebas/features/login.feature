# language: es
Característica: Acceso a ADSEF Digital
  Como usuario del sistema
  Quiero iniciar sesión con mi cuenta
  Para acceder a las opciones que tengo autorizadas

  @publico
  Escenario: Consultar el formulario de acceso
    Dado que estoy en la página de acceso de ADSEF Digital
    Entonces el formulario permite introducir usuario y contraseña

  @autenticado
  Escenario: Iniciar sesión con la cuenta de prueba
    Dado que estoy en la página de acceso de ADSEF Digital
    Y cierro el aviso informativo inicial
    Cuando inicio sesión con la cuenta de prueba configurada
    Entonces accedo a la pantalla autenticada de ADSEF Digital

  @negativo
  Escenario: Rechazar un usuario y contraseña incorrectos
    Dado que estoy en la página de acceso de ADSEF Digital
    Y cierro el aviso informativo inicial
    Cuando intento iniciar sesión con el usuario "qa_noexiste_7f9c2a" y la contraseña "ClaveIncorrecta2026"
    Entonces se muestra el mensaje de error "Usuario no existe o este usuario aún no ha sido activado todavia(Revise su correo electrónico para enlace de activación)." y permanezco en el login
