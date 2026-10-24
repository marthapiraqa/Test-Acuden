# language: es
@busqueda_usuarios
Característica: Búsqueda de usuarios
  Como operador de ADSEF Digital
  Quiero buscar usuarios por correo electrónico o seguro social
  Para consultar sus datos o saber que no hay coincidencias

  Antecedentes:
    Dado que estoy en la página de acceso de ADSEF Digital
    Y cierro el aviso informativo inicial
    Cuando inicio sesión con la cuenta de prueba configurada
    Entonces accedo a la pantalla autenticada de ADSEF Digital
    Cuando abro la búsqueda de usuarios

  @usuario_existente @por_correo
  Escenario: Encontrar un usuario existente por su correo electrónico
    Dado que hay un correo de usuario existente configurado para la búsqueda
    Cuando busco el usuario existente por su correo electrónico
    Entonces se muestra el usuario correspondiente al correo buscado

  @usuario_existente @por_seguro_social
  Escenario: Encontrar un usuario existente por su seguro social
    Dado que hay un seguro social de usuario existente configurado para la búsqueda
    Cuando busco el usuario existente por su seguro social
    Entonces se muestra el usuario correspondiente al seguro social buscado

  @usuario_inexistente
  Escenario: Buscar un usuario que no existe
    Cuando busco un usuario con el correo "qa.usuario.inexistente.7f9c2a@example.com"
    Entonces se muestra el aviso "Error: No se encontraron records en su búsqueda." sin resultados de usuarios
