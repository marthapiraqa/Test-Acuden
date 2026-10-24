import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Given, When, Then } from '../fixtures/bdd';

function testCredentials(): { username: string; password: string } {
  const username = process.env.ADSEF_USERNAME;
  const password = process.env.ADSEF_PASSWORD;
  if (username || password) {
    if (!username || !password) throw new Error('Completar ADSEF_USERNAME y ADSEF_PASSWORD en .env.');
    return { username, password };
  }
  // Compatibilidad con la cuenta local utilizada en la grabación ya validada.
  let inputs: unknown;
  try {
    inputs = JSON.parse(readFileSync(path.join(__dirname, '../.tools/recording-inputs.json'), 'utf8'));
  } catch {
    throw new Error('Configurar ADSEF_USERNAME y ADSEF_PASSWORD en .env; no hay cuenta grabada disponible.');
  }
  if (!Array.isArray(inputs) || inputs.length !== 2 ||
      !inputs.every(value => typeof value === 'string' && value.length > 0)) {
    throw new Error('La cuenta grabada no tiene el formato esperado. Configurar la cuenta en .env.');
  }
  return { username: inputs[0], password: inputs[1] };
}

Given('que estoy en la página de acceso de ADSEF Digital', async ({ loginPage }) => {
  await loginPage.goto();
});

Given('cierro el aviso informativo inicial', async ({ loginPage }) => {
  await loginPage.dismissBenefitsNotice();
});

When('inicio sesión con la cuenta de prueba configurada', async ({ loginPage }) => {
  const { username, password } = testCredentials();
  await loginPage.login(username, password);
});

Then('el formulario permite introducir usuario y contraseña', async ({ loginPage }) => {
  await expect(loginPage.username).toBeEditable();
  await expect(loginPage.password).toBeEditable();
  await expect(loginPage.password).toHaveAttribute('type', 'password');
});

Then('accedo a la pantalla autenticada de ADSEF Digital', async ({ loginPage }) => {
  await loginPage.expectAuthenticated();
});

When('intento iniciar sesión con el usuario {string} y la contraseña {string}',
  async ({ loginPage }, username: string, password: string) => {
    await loginPage.login(username, password);
  }
);

Then('se muestra el mensaje de error {string} y permanezco en el login',
  async ({ loginPage }, message: string) => {
    await loginPage.expectLoginError(message);
  }
);
