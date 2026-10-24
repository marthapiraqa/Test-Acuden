// Importa la grabación conocida sin imprimir sus valores de entrada.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
if (fs.existsSync(path.join(root, 'tests/recorded/login-recording.spec.ts'))) {
  throw new Error('El test ya fue adaptado a POM. No se sobrescribe: integrar nuevas grabaciones manualmente para conservar sus aserciones.');
}
const sourcePath = path.join(root, 'recordings/flow-2026-09-24T22-28-16-954Z.spec.ts');
let source = fs.readFileSync(sourcePath, 'utf8');
const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true);
const inputs = [];
const replacements = [];
function visit(node) {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
      && node.expression.name.text === 'fill' && node.arguments.length === 1
      && ts.isStringLiteralLike(node.arguments[0])) {
    const arg = node.arguments[0];
    const index = inputs.push(arg.text) - 1;
    replacements.push({ start: arg.getStart(ast), end: arg.end, text: `inputs[${index}]` });
  }
  ts.forEachChild(node, visit);
}
visit(ast);
if (inputs.length < 2) throw new Error('La grabación no contiene las entradas del login.');
for (const edit of replacements.reverse()) {
  source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
}
source = source.replace("import { test, expect } from '@playwright/test';", `import { test, expect } from '../../fixtures/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
const inputs: string[] = JSON.parse(readFileSync(path.join(__dirname, '../../.tools/recording-inputs.json'), 'utf8'));`);
source = source.replace("test('test', async ({ page })", "test('REC-001: reproduce el intento de acceso grabado', async ({ page, loginPage })");
source = source.replace("page.goto('http://192.168.10.68/adsefdigital/Security/Login.aspx')", 'loginPage.goto()');
source = source.replace("page.locator('#messagesLogin').click()", 'loginPage.dismissBenefitsNotice()');
source = source.replaceAll("page.getByRole('textbox', { name: 'Nombre de Usuario' })", 'loginPage.username');
source = source.replaceAll("page.getByRole('textbox', { name: 'Contraseña' })", 'loginPage.password');
source = source.replaceAll("page.getByRole('button', { name: 'Accesar' })", 'loginPage.accessButton');
fs.mkdirSync(path.join(root, 'tests/recorded'), { recursive: true });
fs.writeFileSync(path.join(root, '.tools/recording-inputs.json'), JSON.stringify(inputs));
fs.writeFileSync(path.join(root, 'tests/recorded/login-recording.spec.ts'), source);
console.log('Grabación importada a POM; entradas almacenadas localmente en .tools (ignorado por Git).');
