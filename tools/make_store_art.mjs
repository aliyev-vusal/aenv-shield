// Renders Chrome Web Store artwork from the REAL extension UI (no mock-ups):
// screenshots 1280x800 per language, small promo tile 440x280, marquee 1400x560.
// Run: node tools/make_store_art.mjs   (needs puppeteer-core + Chrome)
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const puppeteer = (await import('puppeteer-core')).default;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXT = path.join(ROOT, 'extension');
const OUT = path.join(ROOT, 'store-assets');
fs.mkdirSync(OUT, { recursive: true });

// Documentation-only IP range (RFC 5737); invented server name.
const DEMO = {
  servers: [
    { id: 'demo1', name: 'Baku', country: 'AZ', host: 'demo.example', port: 443, scheme: 'HTTPS', username: 'demo', password: 'demo' },
    { id: 'demo2', name: 'Istanbul', country: 'TR', host: 'demo2.example', port: 443, scheme: 'HTTPS', username: '', password: '' },
  ],
  selectedId: 'demo1', connected: true, adblock: true, webrtc: true, killSwitch: true,
  lastIp: { ip: '203.0.113.42', country: 'AZ', city: 'Baku', at: 0 }, error: null,
};

const HEADLINES = {
  en: ['Browse from Baku.', 'Your own server, no ads, no WebRTC leaks.'],
  az: ['Bakıdan internetə çıxın.', 'Öz serveriniz, reklamsız, WebRTC sızması olmadan.'],
  tr: ['Bakü’den gezinin.', 'Kendi sunucunuz; reklamsız, WebRTC sızıntısız.'],
  de: ['Surfen wie aus Baku.', 'Eigener Server, keine Werbung, keine WebRTC-Leaks.'],
  es: ['Navega desde Bakú.', 'Tu propio servidor, sin anuncios ni fugas WebRTC.'],
};

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'aenv-art-'));
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'google-chrome',
  headless: true,
  userDataDir: profile,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--disable-features=DisableLoadExtensionCommandLineSwitch', '--no-sandbox', '--no-first-run', '--font-render-hinting=none'],
});

const sw = await (await browser.waitForTarget((t) => t.type() === 'service_worker' && t.url().endsWith('background.js'))).worker();
const extId = new URL(sw.url()).host;
const icon = 'data:image/png;base64,' + fs.readFileSync(path.join(EXT, 'icons/icon128.png')).toString('base64');

async function popupShot(lang) {
  await sw.evaluate((s) => chrome.storage.local.set(s), { ...DEMO, lang });
  const p = await browser.newPage();
  await p.setViewport({ width: 360, height: 560, deviceScaleFactor: 2 });
  await p.goto(`chrome-extension://${extId}/popup.html`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  const h = await p.evaluate(() => document.body.scrollHeight);
  const buf = await p.screenshot({ clip: { x: 0, y: 0, width: 360, height: h }, type: 'png' });
  await p.close();
  return 'data:image/png;base64,' + Buffer.from(buf).toString('base64');
}

async function optionsShot(lang) {
  await sw.evaluate((s) => chrome.storage.local.set(s), { ...DEMO, lang, bypass: ['mybank.example'] });
  const p = await browser.newPage();
  await p.setViewport({ width: 820, height: 760, deviceScaleFactor: 1 });
  await p.goto(`chrome-extension://${extId}/options.html`, { waitUntil: 'networkidle0' });
  const buf = await p.screenshot({ type: 'png' });
  await p.close();
  return 'data:image/png;base64,' + Buffer.from(buf).toString('base64');
}

const page = await browser.newPage();
async function render(html, w, h, file) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(OUT, file), type: 'png' });
  console.log('wrote', file);
}

const BASE_CSS = `*{box-sizing:border-box}body{margin:0;font-family:"Segoe UI",system-ui,sans-serif;color:#e8eef9;
  background:radial-gradient(900px 600px at 78% 40%,rgba(45,212,167,.18),transparent 60%),linear-gradient(135deg,#0f1a2f,#070c16);overflow:hidden}
  .brand{display:flex;align-items:center;gap:14px;font-weight:700;font-size:26px}
  h1{font-size:60px;line-height:1.05;margin:28px 0 18px;letter-spacing:-1px}p{font-size:26px;color:#9fb0cf;margin:0;line-height:1.35}
  .chips{display:flex;gap:10px;margin-top:34px;flex-wrap:wrap}.chip{border:1px solid #2a3c5f;border-radius:99px;padding:8px 16px;font-size:18px;color:#cfe;background:rgba(21,33,58,.7)}`;

for (const [lang, [h1, sub]] of Object.entries(HEADLINES)) {
  const shot = await popupShot(lang);
  await render(`<style>${BASE_CSS}</style>
    <div style="display:flex;align-items:center;height:800px;padding:0 90px;gap:70px">
      <div style="flex:1"><div class="brand"><img src="${icon}" width="52">AENV Shield</div>
        <h1>${h1}</h1><p>${sub}</p>
        <div class="chips"><span class="chip">🇦🇿 AZ</span><span class="chip">Ad blocker</span><span class="chip">WebRTC</span><span class="chip">Kill switch</span><span class="chip">Split tunneling</span></div></div>
      <img src="${shot}" style="width:400px;border-radius:18px;border:1px solid #2a3c5f;box-shadow:0 30px 80px rgba(0,0,0,.55)">
    </div>`, 1280, 800, `screenshot-1-popup-${lang}.png`);
}

const opt = await optionsShot('en');
await render(`<style>${BASE_CSS}</style>
  <div style="display:flex;align-items:center;justify-content:center;height:800px;padding:40px">
    <img src="${opt}" style="height:700px;border-radius:14px;border:1px solid #2a3c5f;box-shadow:0 30px 80px rgba(0,0,0,.55)">
  </div>`, 1280, 800, 'screenshot-2-settings-en.png');

await render(`<style>${BASE_CSS}</style><div style="padding:34px 36px"><div class="brand" style="font-size:30px"><img src="${icon}" width="64">AENV Shield</div>
  <p style="font-size:22px;margin-top:22px;color:#cfe">Private proxy · Ad blocker · WebRTC</p></div>`, 440, 280, 'promo-small-440x280.png');

const shotEn = await popupShot('en');
await render(`<style>${BASE_CSS}</style><div style="display:flex;align-items:center;height:560px;padding:0 90px;gap:60px">
  <div style="flex:1"><div class="brand"><img src="${icon}" width="52">AENV Shield</div><h1 style="font-size:54px">${HEADLINES.en[0]}</h1><p>${HEADLINES.en[1]}</p></div>
  <img src="${shotEn}" style="height:500px;margin-top:60px;border-radius:18px;border:1px solid #2a3c5f;box-shadow:0 30px 80px rgba(0,0,0,.55)"></div>`, 1400, 560, 'marquee-1400x560.png');

await browser.close();
fs.rmSync(profile, { recursive: true, force: true });
