import { test } from '../../fixtures/test';

test('LOGIN-004: accede a la pantalla autenticada de la cuenta de prueba', async ({ loginPage }) => {
  const required = [
    'ADSEF_USERNAME', 'ADSEF_PASSWORD',
    'ADSEF_AUTHENTICATED_URL', 'ADSEF_AUTHENTICATED_SELECTOR'
  ] as const;
  for (const key of required) {
    if (!process.env[key]?.trim()) {
      throw new Error(`Falta ${key} en .env. Observar el acceso real con Codegen antes de ejecutar test:auth.`);
    }
  }
  await loginPage.goto();
  await loginPage.login(process.env.ADSEF_USERNAME!, process.env.ADSEF_PASSWORD!);
  await loginPage.expectAuthenticated();
});
