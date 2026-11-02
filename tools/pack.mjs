// Packs extension/ into dist/aenv-shield-<version>.zip for the Chrome Web Store / Edge Add-ons.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'extension/manifest.json'), 'utf8'));
const dist = path.join(ROOT, 'dist');
fs.mkdirSync(dist, { recursive: true });
const out = path.join(dist, `aenv-shield-${version}.zip`);
fs.rmSync(out, { force: true });
// Source-only files (domain list, SVG master) are not shipped.
execFileSync('zip', ['-r', '-X', '-q', out, '.', '-x', 'rules/domains.txt', 'icons/icon.svg', '*.DS_Store'], { cwd: path.join(ROOT, 'extension') });
console.log(`${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
