import { test, expect } from '../../fixtures/test';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
});

test('LOGIN-001: muestra el formulario y las opciones de acceso', async ({ page, loginPage }) => {
  await expect(loginPage.username).toBeEditable();
  await expect(loginPage.password).toHaveAttribute('type', 'password');
  await expect(page.getByRole('link', { name: '¿Olvidó su usuario?', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '¿Olvidó su contraseña?', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Crear Cuenta', exact: true })).toBeVisible();
});

test('LOGIN-002: permite introducir y limpiar los campos sin enviar credenciales', async ({ loginPage }) => {
  await loginPage.fillCredentials('prueba_automatizada', 'TextoDePrueba_NoEsCredencial');
  await expect(loginPage.username).toHaveValue('prueba_automatizada');
  await expect(loginPage.password).toHaveValue('TextoDePrueba_NoEsCredencial');
  await loginPage.fillCredentials('', '');
  await expect(loginPage.username).toBeEmpty();
  await expect(loginPage.password).toBeEmpty();
});

test('LOGIN-003: rechaza caracteres inválidos en el nombre de usuario', async ({ loginPage }) => {
  await loginPage.username.fill('usuario con espacios!');
  await loginPage.password.focus();
  await expect(loginPage.usernameValidation).toBeVisible();
  await expect(loginPage.usernameValidation).toHaveText(
    'El nombre de usuario solo se permiten letras, números, puntos y guiones bajos.'
  );
  await loginPage.username.fill('usuario_valido.123');
  await loginPage.password.focus();
  await expect(loginPage.usernameValidation).toBeHidden();
});
