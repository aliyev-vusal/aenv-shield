// End-to-end smoke test: loads the real extension in Chrome and checks proxy routing,
// proxy authentication, bypass list, kill switch and the ad blocker against a local
// fake proxy + web server. Run: node tests/e2e/smoke.mjs  (needs puppeteer-core + Chrome)
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const puppeteer = (await import('puppeteer-core')).default;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EXT = path.join(ROOT, 'extension');
const CHROME = process.env.CHROME_PATH || 'google-chrome';
const USER = 'tester';
const PASS = 's3cret!';

// ---- local web server: the "internet" ----
const seenDirect = [];
const web = http.createServer((req, res) => {
  if (!req.headers['x-via-proxy']) seenDirect.push(req.url);
  if (req.url.startsWith('/page')) {
    res.setHeader('content-type', 'text/html');
    res.end(`<!doctype html><title>t</title><ins class="adsbygoogle" id="slot">AD</ins>
      <script src="http://doubleclick.net/ad.js"></script>
      <script src="http://cdn.example-ok.test/ok.js"></script>`);
  } else if (req.url.endsWith('.js')) {
    res.setHeader('content-type', 'text/javascript');
    res.end('window.loaded = (window.loaded || []).concat(document.currentScript.src);');
  } else {
    res.end('ok');
  }
});

// ---- fake proxy with Basic auth; every host is served by the local web server ----
const seen = [];
let authFails = 0;
const proxy = http.createServer((req, res) => {
  const expected = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');
  if (req.headers['proxy-authorization'] !== expected) {
    authFails++;
    res.writeHead(407, { 'Proxy-Authenticate': 'Basic realm="aenv"' });
    return res.end();
  }
  const u = new URL(req.url);
  seen.push(u.host);
  const up = http.request({ host: '127.0.0.1', port: web.address().port, path: u.pathname + u.search, method: req.method, headers: { ...req.headers, 'x-via-proxy': '1' } }, (r) => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });
  up.on('error', () => { res.writeHead(502); res.end(); });
  req.pipe(up);
});
proxy.on('connect', (req, sock) => { seen.push(req.url); sock.end('HTTP/1.1 502 Bad Gateway\r\n\r\n'); });

await new Promise((r) => web.listen(0, '127.0.0.1', r));
await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
const proxyPort = proxy.address().port;
const webPort = web.address().port;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'aenv-'));
const env = { ...process.env };
for (const k of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy', 'NO_PROXY', 'no_proxy']) delete env[k];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  env,
  userDataDir: profile,
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--disable-features=DisableLoadExtensionCommandLineSwitch',
    '--no-sandbox',
    '--no-first-run',
    // Make every test hostname resolve locally so DIRECT (bypass) requests are distinguishable.
    `--host-resolver-rules=MAP *.test 127.0.0.1:${webPort}, MAP doubleclick.net 127.0.0.1:${webPort}, EXCLUDE 127.0.0.1`,
  ],
});

let failed = false;
const step = async (name, fn) => {
  try { await fn(); console.log('✔', name); } catch (e) { failed = true; console.error('✘', name, '\n ', e.message); }
};

try {
  const swTarget = await browser.waitForTarget((t) => t.type() === 'service_worker' && t.url().endsWith('background.js'), { timeout: 15000 });
  const extId = new URL(swTarget.url()).host;
  const sw = await swTarget.worker();
  const swErrors = [];
  sw.on('console', (m) => { if (m.type() === 'error') swErrors.push(m.text()); });

  const page = await browser.newPage();
  await page.goto(`chrome-extension://${extId}/options.html`);
  const call = (type, payload = {}) => page.evaluate((m) => chrome.runtime.sendMessage(m), { type, ...payload });

  await step('defaults stored on install', async () => {
    const { state } = await call('getState');
    assert.equal(state.adblock, true);
    assert.equal(state.webrtc, true);
    assert.ok(['az', 'en', 'tr', 'de', 'es'].includes(state.lang));
  });

  await step('invalid server rejected with i18n key', async () => {
    const res = await call('saveServer', { server: { name: 'x', country: 'AZ', host: 'bad host', port: 1, scheme: 'HTTPS' } });
    assert.equal(res.ok, false);
    assert.equal(res.error, 'errHost');
  });

  await step('import token adds server', async () => {
    const token = 'aenv-shield:' + Buffer.from(JSON.stringify({
      name: 'Local', country: 'AZ', host: '127.0.0.1', port: proxyPort, scheme: 'PROXY', username: USER, password: PASS,
    })).toString('base64');
    const res = await call('importToken', { token });
    assert.equal(res.ok, true, res.error);
    assert.equal(res.state.servers.length, 1);
  });

  await step('connect sets PAC proxy and badge', async () => {
    const res = await call('connect');
    assert.equal(res.ok, true);
    assert.equal(res.state.connected, true);
    const cfg = await sw.evaluate(() => chrome.proxy.settings.get({}));
    assert.equal(cfg.value.mode, 'pac_script');
    assert.match(cfg.value.pacScript.data, new RegExp(`return "PROXY 127\\.0\\.0\\.1:${proxyPort}";`));
    assert.equal(await sw.evaluate(() => chrome.action.getBadgeText({})), 'AZ');
  });

  await step('WebRTC policy applied', async () => {
    const v = await sw.evaluate(() => chrome.privacy.network.webRTCIPHandlingPolicy.get({}));
    assert.equal(v.value, 'disable_non_proxied_udp');
  });

  await step('traffic goes through proxy with auth; ad script blocked; ad slot hidden', async () => {
    seen.length = 0;
    const tab = await browser.newPage();
    await tab.goto('http://site.test/page', { waitUntil: 'networkidle0' });
    const loaded = await tab.evaluate(() => window.loaded || []);
    assert.ok(seen.includes('site.test'), `proxy saw: ${seen}`);
    assert.ok(seen.includes('cdn.example-ok.test'), 'normal script via proxy');
    assert.ok(!seen.includes('doubleclick.net'), 'ad host must never reach the proxy');
    assert.deepEqual(loaded, ['http://cdn.example-ok.test/ok.js']);
    const display = await tab.evaluate(() => getComputedStyle(document.getElementById('slot')).display);
    assert.equal(display, 'none');
    await tab.close();
  });

  await step('bypass list goes DIRECT', async () => {
    await call('setBypass', { list: ['direct.test'] });
    seen.length = 0;
    const tab = await browser.newPage();
    await tab.goto('http://direct.test/page', { waitUntil: 'networkidle0' });
    assert.ok(!seen.includes('direct.test'), 'bypassed host must not use the proxy');
    assert.ok(seen.includes('cdn.example-ok.test'), 'other hosts still proxied');
    await tab.close();
    await call('setBypass', { list: [] });
  });

  await step('pause ad blocker on a site', async () => {
    await call('togglePause', { site: 'paused.test' });
    const tab = await browser.newPage();
    await tab.goto('http://paused.test/page', { waitUntil: 'networkidle0' });
    const loaded = await tab.evaluate(() => window.loaded || []);
    assert.ok(loaded.includes('http://doubleclick.net/ad.js'), 'ads allowed while paused');
    await tab.close();
    await call('togglePause', { site: 'paused.test' });
  });

  await step('ad blocker off lets ads through', async () => {
    await call('setOption', { key: 'adblock', value: false });
    const enabled = await sw.evaluate(() => chrome.declarativeNetRequest.getEnabledRulesets());
    assert.deepEqual(enabled, []);
    await call('setOption', { key: 'adblock', value: true });
    assert.deepEqual(await sw.evaluate(() => chrome.declarativeNetRequest.getEnabledRulesets()), ['ads']);
  });

  await step('wrong password does not loop forever', async () => {
    const { state } = await call('getState');
    const s = { ...state.servers[0], password: 'wrong' };
    await call('saveServer', { server: s });
    authFails = 0;
    const tab = await browser.newPage();
    await tab.goto('http://site.test/page', { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
    await tab.close();
    assert.ok(authFails < 20, `auth attempts: ${authFails}`);
    await call('saveServer', { server: { ...s, password: PASS } });
  });

  const deadServer = async () => {
    const dead = net.createServer(); await new Promise((r) => dead.listen(0, '127.0.0.1', r));
    const port = dead.address().port; await new Promise((r) => dead.close(r));
    return port;
  };
  const settle = () => new Promise((r) => setTimeout(r, 600));

  await step('server down, kill switch OFF: disconnects openly, never leaks silently', async () => {
    const good = (await call('getState')).state.servers[0];
    await call('setOption', { key: 'killSwitch', value: false });
    await call('saveServer', { server: { ...good, port: await deadServer() } });
    await call('connect');
    seenDirect.length = 0;
    const tab = await browser.newPage();
    await tab.goto('http://leak.test/page').catch(() => {});
    await settle();
    const s = (await call('getState')).state;
    assert.equal(s.connected, false);
    assert.equal(s.error, 'net::ERR_PROXY_CONNECTION_FAILED');
    assert.equal(await sw.evaluate(() => chrome.action.getBadgeText({})), '!');
    // The PAC itself has no DIRECT fallback; going direct only happens after the visible disconnect.
    const cfg = await sw.evaluate(() => chrome.proxy.settings.get({}));
    assert.notEqual(cfg.value.mode, 'pac_script');
    await tab.close();
    await call('saveServer', { server: good });
  });

  await step('server down, kill switch ON: blocks traffic, recovers when server is back', async () => {
    const good = (await call('getState')).state.servers[0];
    await call('setOption', { key: 'killSwitch', value: true });
    await call('saveServer', { server: { ...good, port: await deadServer() } });
    await call('connect');
    seenDirect.length = 0;
    const tab = await browser.newPage();
    await tab.goto('http://leak.test/page').catch(() => {});
    await settle();
    let s = (await call('getState')).state;
    assert.equal(s.connected, true);
    assert.equal(s.error, 'net::ERR_PROXY_CONNECTION_FAILED');
    assert.deepEqual(seenDirect, [], 'nothing may go direct');
    await call('saveServer', { server: good });
    await settle();
    await tab.goto('http://site.test/page', { waitUntil: 'networkidle0' });
    await settle();
    s = (await call('getState')).state;
    assert.equal(s.error, null);
    assert.equal(await sw.evaluate(() => chrome.action.getBadgeText({})), 'AZ');
    await tab.close();
    await call('setOption', { key: 'killSwitch', value: false });
  });

  await step('disconnect clears proxy', async () => {
    const res = await call('disconnect');
    assert.equal(res.state.connected, false);
    const cfg = await sw.evaluate(() => chrome.proxy.settings.get({}));
    assert.notEqual(cfg.value.mode, 'pac_script');
  });

  await step('popup renders without errors', async () => {
    const errors = [];
    const p = await browser.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    await p.setViewport({ width: 360, height: 600 });
    await p.goto(`chrome-extension://${extId}/popup.html`, { waitUntil: 'networkidle0' });
    const status = await p.$eval('#status', (e) => e.textContent);
    assert.ok(status.length > 0);
    assert.deepEqual(errors, []);
    await p.close();
  });

  await step('no service-worker errors', async () => { assert.deepEqual(swErrors, []); });
} catch (e) {
  failed = true;
  console.error(e);
} finally {
  await browser.close();
  web.close();
  proxy.close();
  fs.rmSync(profile, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
