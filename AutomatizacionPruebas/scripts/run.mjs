import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env'), quiet: true });
const [command = 'test', ...extra] = process.argv.slice(2);
const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: path.join(root, '.tools', 'ms-playwright') };
delete env.RUN_AUTH;
delete env.RUN_RECORDING;
const commands = {
  test: ['test'], headed: ['test', '--headed'], ui: ['test', '--ui'],
  auth: ['test'], recording: ['test'], report: ['show-report'], browsers: ['install', 'chromium']
};
let args = commands[command];
if (command === 'bdd' || command === 'bddgen') {
  const generation = spawnSync(process.execPath,
    [path.join(root, 'node_modules/playwright-bdd/dist/cli/index.js'), '-c', 'playwright.bdd.config.ts'],
    { cwd: root, env, stdio: 'inherit' });
  if (generation.error) throw generation.error;
  if (generation.status !== 0) process.exit(generation.status ?? 1);
  if (command === 'bddgen') process.exit(0);
  args = ['test', '--config', 'playwright.bdd.config.ts'];
}
if (command === 'auth') env.RUN_AUTH = '1';
if (command === 'recording') env.RUN_RECORDING = '1';
if (command === 'codegen') {
  mkdirSync(path.join(root, 'recordings'), { recursive: true });
  const filename = `recordings/flow-${new Date().toISOString().replace(/[:.]/g, '-')}.spec.ts`;
  args = ['codegen', '--browser', 'chromium', '--target', 'playwright-test', '--output', filename,
    new URL('Security/Login.aspx', process.env.ADSEF_BASE_URL || 'http://192.168.10.68/adsefdigitalss/').href];
  console.log(`Grabación local: ${filename}. Sustituir credenciales antes de compartir.`);
}
if (!args) throw new Error(`Comando desconocido: ${command}`);
const child = spawn(process.execPath, [path.join(root, 'node_modules', '@playwright', 'test', 'cli.js'), ...args, ...extra],
  { cwd: root, env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
