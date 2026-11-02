// Unit + static consistency tests. Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { buildPac, normaliseBypass } from '../extension/lib/pac.js';
import { validateServer, parseToken, makeToken, flag, normaliseServer } from '../extension/lib/servers.js';
import { t, setLang, detectLang, LANGS, KEYS, _table } from '../extension/lib/i18n.js';
import { withDefaults, selectedServer, siteOf, pauseRules } from '../extension/lib/settings.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXT = path.join(ROOT, 'extension');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// Evaluate a PAC script the way Chrome does (with the PAC helper functions).
function runPac(script, host) {
  const ctx = {
    dnsDomainIs: (h, d) => h.length >= d.length && h.slice(-d.length) === d,
    isPlainHostName: (h) => !h.includes('.'),
  };
  vm.createContext(ctx);
  vm.runInContext(script, ctx);
  return ctx.FindProxyForURL(`https://${host}/`, host);
}

const SERVER = { scheme: 'HTTPS', host: '1-2-3-4.sslip.io', port: 443 };

test('PAC routes public hosts through the server and never falls back to DIRECT', () => {
  const pac = buildPac(SERVER, { bypass: [] });
  assert.equal(runPac(pac, 'example.com'), 'HTTPS 1-2-3-4.sslip.io:443');
  assert.equal(runPac(pac, 'WWW.Example.COM'), 'HTTPS 1-2-3-4.sslip.io:443');
  assert.ok(!/;\s*DIRECT/.test(pac), 'no silent DIRECT fallback');
});

test('PAC keeps local and private addresses direct', () => {
  const pac = buildPac(SERVER);
  for (const h of ['localhost', 'router', '192.168.1.1', '10.0.0.5', '172.16.3.4', '169.254.1.1', 'printer.local', '127.0.0.1']) {
    assert.equal(runPac(pac, h), 'DIRECT', h);
  }
  assert.equal(runPac(pac, '172.32.0.1'), 'HTTPS 1-2-3-4.sslip.io:443', '172.32 is public');
  assert.equal(runPac(pac, '1-2-3-4.sslip.io'), 'DIRECT', 'the proxy host itself');
});

test('PAC bypass list matches domain and subdomains, not look-alikes', () => {
  const pac = buildPac(SERVER, { bypass: ['https://www.MyBank.de/login', '*.sparkasse.de', 'bad entry!', '.gov.az'] });
  assert.equal(runPac(pac, 'www.mybank.de'), 'DIRECT');
  assert.equal(runPac(pac, 'sparkasse.de'), 'DIRECT');
  assert.equal(runPac(pac, 'online.sparkasse.de'), 'DIRECT');
  assert.equal(runPac(pac, 'e.gov.az'), 'DIRECT');
  assert.equal(runPac(pac, 'notsparkasse.de'), 'HTTPS 1-2-3-4.sslip.io:443');
  assert.equal(runPac(pac, 'mybank.de.evil.com'), 'HTTPS 1-2-3-4.sslip.io:443');
  const plain = buildPac(SERVER, { bypass: ['bank.de'] });
  assert.equal(runPac(plain, 'bank.de'), 'DIRECT');
  assert.equal(runPac(plain, 'online.bank.de'), 'DIRECT');
  assert.equal(runPac(plain, 'evilbank.de'), 'HTTPS 1-2-3-4.sslip.io:443', 'suffix look-alike must stay proxied');
});

test('PAC rejects injection through host/port/scheme', () => {
  assert.throws(() => buildPac({ ...SERVER, host: 'a"; return "DIRECT' }));
  assert.throws(() => buildPac({ ...SERVER, port: 70000 }));
  assert.throws(() => buildPac({ ...SERVER, scheme: 'DIRECT' }));
  const pac = buildPac(SERVER, { bypass: ['"];alert(1);//'] });
  assert.ok(!pac.includes('alert'));
});

test('normaliseBypass', () => {
  assert.equal(normaliseBypass(' HTTP://Foo.com:8080/x '), 'foo.com');
  assert.equal(normaliseBypass('.az'), '*.az');
  assert.equal(normaliseBypass('a..b'), null);
  assert.equal(normaliseBypass(''), null);
  assert.equal(normaliseBypass(42), null);
});

test('validateServer catches each field', () => {
  const ok = { name: 'Baku', country: 'AZ', host: 'vpn.example.az', port: 443, scheme: 'HTTPS' };
  assert.deepEqual(validateServer(ok), []);
  assert.deepEqual(validateServer({ ...ok, name: ' ' }), ['errName']);
  assert.deepEqual(validateServer({ ...ok, country: 'aze' }), ['errCountry']);
  assert.deepEqual(validateServer({ ...ok, host: 'has space' }), ['errHost']);
  assert.deepEqual(validateServer({ ...ok, host: '-bad.com' }), ['errHost']);
  assert.deepEqual(validateServer({ ...ok, port: 0 }), ['errPort']);
  assert.deepEqual(validateServer({ ...ok, scheme: 'FTP' }), ['errScheme']);
  assert.deepEqual(validateServer({ ...ok, scheme: 'SOCKS5', username: 'u' }), ['errSocksAuth']);
  assert.deepEqual(validateServer(null), ['errInvalid']);
});

test('token round trip, unicode, raw JSON and garbage', () => {
  const s = normaliseServer({ name: 'Bakı Ş', country: 'az', host: 'X.sslip.io', port: '443', scheme: 'https', username: 'u', password: 'p:ä"' });
  const back = parseToken(makeToken(s));
  for (const k of ['name', 'country', 'host', 'port', 'scheme', 'username', 'password']) assert.equal(back[k], s[k]);
  assert.equal(back.country, 'AZ');
  assert.equal(back.host, 'x.sslip.io');
  assert.ok(back.id && back.id !== s.id, 'imported servers get a fresh id');
  assert.equal(parseToken('  ' + makeToken(s) + '\n').host, 'x.sslip.io');
  assert.equal(parseToken(JSON.stringify({ name: 'J', country: 'AZ', host: 'h.az', port: 1, scheme: 'PROXY' })).name, 'J');
  for (const bad of ['', 'aenv-shield:!!!', 'aenv-shield:e30=', 42, null]) {
    assert.throws(() => parseToken(bad), /errToken/);
  }
});

test('flag emoji', () => {
  assert.equal(flag('AZ'), '🇦🇿');
  assert.equal(flag('zz'), '🌐');
});

test('settings helpers', () => {
  const st = withDefaults({ servers: [{ id: 'a' }, { id: 'b' }], selectedId: 'b', bypass: 'oops' });
  assert.equal(selectedServer(st).id, 'b');
  assert.deepEqual(st.bypass, []);
  assert.equal(selectedServer(withDefaults({ servers: [{ id: 'a' }], selectedId: 'gone' })).id, 'a');
  assert.equal(selectedServer(withDefaults({})), null);
  assert.equal(siteOf('https://www.Example.com/x'), 'example.com');
  assert.equal(siteOf('chrome://extensions'), null);
  assert.equal(siteOf('not a url'), null);
  const rules = pauseRules(['a.com', 'a.com', 'b.com']);
  assert.equal(rules.length, 2);
  assert.ok(rules.every((r) => r.id >= 1000 && r.action.type === 'allowAllRequests'));
});

test('i18n: every key has 5 non-empty translations with matching placeholders', () => {
  for (const key of KEYS) {
    const row = _table[key];
    assert.equal(row.length, LANGS.length, key);
    const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    for (const s of row) {
      assert.ok(s && s.trim(), `${key} empty`);
      assert.equal(ph(s), ph(row[1]), `${key} placeholders`);
    }
  }
  setLang('az'); assert.equal(t('connect'), 'Qoşul');
  setLang('de'); assert.equal(t('blockedHere', { n: 7 }), 'Auf dieser Seite blockiert: 7');
  setLang('xx'); assert.equal(t('connect'), 'Connect');
  assert.equal(t('noSuchKey'), 'noSuchKey');
  assert.equal(detectLang('tr-TR'), 'tr');
  assert.equal(detectLang('fr'), 'en');
});

test('i18n: every key used in HTML/JS exists', () => {
  const used = new Set();
  for (const f of ['popup.html', 'options.html']) {
    for (const m of read(`extension/${f}`).matchAll(/data-i18n(?:-title|-placeholder)?="(\w+)"/g)) used.add(m[1]);
  }
  for (const f of ['popup.js', 'options.js']) {
    for (const m of read(`extension/${f}`).matchAll(/\bt\('(\w+)'/g)) used.add(m[1]);
  }
  for (const m of read('extension/lib/servers.js').matchAll(/'(err\w+)'/g)) used.add(m[1]);
  for (const m of read('extension/popup.js').matchAll(/(\w+): '(status\w+)'/g)) used.add(m[2]);
  for (const k of used) assert.ok(KEYS.includes(k), `missing i18n key ${k}`);
});

test('manifest: files exist, permissions are exactly what the code needs', () => {
  const m = JSON.parse(read('extension/manifest.json'));
  assert.equal(m.manifest_version, 3);
  const files = [m.background.service_worker, m.action.default_popup, m.options_page,
    ...Object.values(m.icons), ...Object.values(m.action.default_icon),
    ...m.declarative_net_request.rule_resources.map((r) => r.path),
    ...m.content_scripts.flatMap((c) => c.js), 'legal/LICENSE.txt', 'legal/PRIVACY.txt'];
  for (const f of files) assert.ok(fs.existsSync(path.join(EXT, f)), f);
  assert.deepEqual([...m.permissions].sort(), ['activeTab', 'declarativeNetRequest', 'privacy', 'proxy', 'storage', 'webRequest', 'webRequestAuthProvider']);
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, m.version, 'package.json and manifest versions match');
  for (const lang of fs.readdirSync(path.join(EXT, '_locales'))) {
    const msgs = JSON.parse(read(`extension/_locales/${lang}/messages.json`));
    assert.ok(msgs.appName.message.length <= 75, `${lang} name length`);
    assert.ok(msgs.appDesc.message.length <= 132, `${lang} desc length`);
  }
});

test('every local module import / script / stylesheet resolves', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(EXT)) {
    if (f.endsWith('.js')) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/from '(\.[^']+)'/g)) {
        assert.ok(fs.existsSync(path.resolve(path.dirname(f), m[1])), `${f} -> ${m[1]}`);
      }
    }
    if (f.endsWith('.html')) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/(?:src|href)="([^":#]+)"/g)) {
        assert.ok(fs.existsSync(path.resolve(path.dirname(f), m[1])), `${f} -> ${m[1]}`);
      }
    }
  }
});

test('HTML: element ids referenced from JS exist, icon-only buttons have labels', () => {
  for (const [html, js] of [['popup.html', 'popup.js'], ['options.html', 'options.js']]) {
    const h = read(`extension/${html}`);
    const ids = new Set([...h.matchAll(/id="([\w-]+)"/g)].map((m) => m[1]));
    for (const m of read(`extension/${js}`).matchAll(/\$\('([\w-]+)'\)/g)) assert.ok(ids.has(m[1]), `${html} #${m[1]}`);
    for (const m of h.matchAll(/<button[^>]*>\s*<svg/g)) assert.match(m[0], /data-i18n-title=/, 'icon button needs label');
  }
});

test('ad-block ruleset is valid and in sync with domains.txt', () => {
  const rules = JSON.parse(read('extension/rules/ads.json'));
  const domains = read('extension/rules/domains.txt').split('\n').map((l) => l.split('#')[0].trim()).filter(Boolean);
  assert.equal(rules.length, new Set(domains).size);
  const ids = new Set();
  for (const r of rules) {
    assert.ok(Number.isInteger(r.id) && r.id > 0 && r.id < 1000, 'static ids < 1000 (dynamic pause rules use 1000+)');
    assert.ok(!ids.has(r.id)); ids.add(r.id);
    assert.equal(r.action.type, 'block');
    assert.match(r.condition.urlFilter, /^\|\|[a-z0-9.-]+\^$/);
    assert.ok(!r.condition.resourceTypes.includes('main_frame'), 'never block top-level navigation');
  }
  for (const essential of ['doubleclick.net', 'googlesyndication.com', 'taboola.com']) assert.ok(domains.includes(essential));
});

test('server install script is valid bash and hardened', () => {
  execFileSync('bash', ['-n', path.join(ROOT, 'server/install.sh')]);
  const sh = read('server/install.sh');
  assert.match(sh, /set -euo pipefail/);
  assert.match(sh, /proxy_auth REQUIRED/);
  assert.match(sh, /http_access deny all/);
  assert.match(sh, /forwarded_for delete/);
  assert.match(sh, /access_log none/);
  assert.match(sh, /aenv-shield:/);
});

test('no AI-tool vendor names anywhere in the repo', () => {
  const banned = new RegExp(['cl' + 'aude', 'anth' + 'ropic'].join('|'), 'i');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
    .filter((e) => !['node_modules', '.git', 'dist'].includes(e.name))
    .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(ROOT)) {
    if (/\.(png|ico|zip)$/.test(f)) continue;
    assert.ok(!banned.test(fs.readFileSync(f, 'utf8')), f);
  }
});
