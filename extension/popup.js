import { t, setLang, getLang, applyTo, LANGS, LANG_NAMES } from './lib/i18n.js';
import { flag, countryName } from './lib/servers.js';
import { selectedServer, siteOf } from './lib/settings.js';

const $ = (id) => document.getElementById(id);
let state = null;
let busy = false;
let site = null;
let tabId = null;

async function send(type, payload = {}) {
  const res = await chrome.runtime.sendMessage({ type, ...payload });
  if (!res || !res.ok) throw new Error(res && res.error || 'errInvalid');
  state = res.state;
  return state;
}

function renderLangs() {
  const sel = $('lang');
  sel.innerHTML = '';
  for (const l of LANGS) sel.add(new Option(LANG_NAMES[l], l, false, l === state.lang));
}

function renderServers() {
  const sel = $('server');
  sel.innerHTML = '';
  const has = state.servers.length > 0;
  sel.closest('.select-wrap').hidden = !has;
  $('serverCard').querySelector('.field-label').hidden = !has;
  $('empty').hidden = has;
  const current = selectedServer(state);
  for (const s of state.servers) {
    sel.add(new Option(`${flag(s.country)}  ${s.name} — ${countryName(s.country, getLang())}`, s.id, false, current && s.id === current.id));
  }
}

function renderStatus() {
  const hero = $('hero');
  const server = selectedServer(state);
  let status = 'off';
  if (busy) status = 'busy';
  else if (state.error) status = 'error';
  else if (state.connected) status = 'on';
  hero.dataset.status = status;
  $('status').textContent = t({ off: 'statusDisconnected', busy: 'statusConnecting', on: 'statusConnected', error: 'statusError' }[status]);
  const power = $('power');
  power.disabled = !server || busy;
  power.title = t(state.connected ? 'disconnect' : 'connect');
  power.setAttribute('aria-label', power.title);
  power.setAttribute('aria-pressed', String(state.connected));

  const ip = $('ip');
  if (busy) ip.textContent = t('checking');
  else if (state.lastIp) ip.textContent = `${t('yourIp')}: ${state.lastIp.ip}  ${flag(state.lastIp.country)} ${state.lastIp.city || countryName(state.lastIp.country, getLang())}`;
  else if (state.connected && server) ip.textContent = `${flag(server.country)} ${server.name}`;
  else ip.textContent = '';
}

function renderToggles() {
  for (const k of ['adblock', 'webrtc', 'killSwitch']) $(k).checked = Boolean(state[k]);
  const pause = $('pauseSite');
  pause.hidden = !site || !state.adblock;
  if (site) pause.textContent = `${t(state.pausedSites.includes(site) ? 'resumeSite' : 'pauseSite')} (${site})`;
}

async function renderBlocked() {
  const el = $('blocked');
  el.textContent = t('adBlockerDesc');
  if (!state.adblock || tabId == null || !chrome.declarativeNetRequest.getMatchedRules) return;
  try {
    const { rulesMatchedInfo } = await chrome.declarativeNetRequest.getMatchedRules({ tabId });
    const n = rulesMatchedInfo.filter((r) => r.rule.rulesetId === 'ads').length;
    if (n > 0) el.textContent = t('blockedHere', { n });
  } catch { /* no access for this tab */ }
}

function render() {
  setLang(state.lang);
  applyTo(document);
  renderLangs();
  renderServers();
  renderStatus();
  renderToggles();
  renderBlocked();
}

async function run(fn) {
  try { await fn(); } catch (e) { console.warn(e); state = (await chrome.runtime.sendMessage({ type: 'getState' })).state; }
  render();
}

$('power').addEventListener('click', () => run(async () => {
  busy = true; render();
  try { await send(state.connected ? 'disconnect' : 'connect'); } finally { busy = false; }
}));
$('server').addEventListener('change', (e) => run(async () => {
  busy = state.connected; render();
  try { await send('select', { id: e.target.value }); } finally { busy = false; }
}));
$('lang').addEventListener('change', (e) => run(() => send('setLang', { lang: e.target.value })));
for (const key of ['adblock', 'webrtc', 'killSwitch']) {
  $(key).addEventListener('change', (e) => run(() => send('setOption', { key, value: e.target.checked })));
}
$('pauseSite').addEventListener('click', () => run(async () => {
  await send('togglePause', { site });
  if (tabId != null) chrome.tabs.reload(tabId);
}));
$('openSettings').addEventListener('click', () => chrome.runtime.openOptionsPage());
$('addServer').addEventListener('click', () => chrome.runtime.openOptionsPage());

(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) { tabId = tab.id; site = siteOf(tab.url || ''); }
  } catch { /* ignore */ }
  await run(() => send('getState'));
})();
