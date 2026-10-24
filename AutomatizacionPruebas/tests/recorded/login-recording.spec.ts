import { test } from '../../fixtures/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
const inputs: string[] = JSON.parse(readFileSync(path.join(__dirname, '../../.tools/recording-inputs.json'), 'utf8'));

test('REC-001: la cuenta grabada accede a la pantalla autenticada', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.dismissBenefitsNotice();
  await loginPage.username.click();
  await loginPage.username.fill(inputs[0]);
  await loginPage.password.click();
  await loginPage.password.fill(inputs[1]);  
  await loginPage.accessButton.click();
  await loginPage.expectAuthenticated();
});
