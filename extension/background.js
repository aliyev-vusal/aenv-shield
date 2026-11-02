// AENV Shield service worker: proxy routing, proxy auth, WebRTC policy, ad-block rulesets.
import { buildPac } from './lib/pac.js';
import { withDefaults, selectedServer, pauseRules, BOOLEAN_OPTIONS } from './lib/settings.js';
import { validateServer, normaliseServer, parseToken } from './lib/servers.js';
import { detectLang } from './lib/i18n.js';

const IP_API = 'https://ipwho.is/';
const authAttempts = new Map(); // requestId -> count, avoids endless auth loops

async function load() {
  return withDefaults(await chrome.storage.local.get(null));
}

async function save(patch) {
  await chrome.storage.local.set(patch);
  return load();
}

// ---------- proxy ----------
async function applyProxy(state) {
  const server = selectedServer(state);
  if (!state.connected || !server) {
    await chrome.proxy.settings.clear({ scope: 'regular' });
    return;
  }
  const data = buildPac(server, { bypass: state.bypass });
  await chrome.proxy.settings.set({ value: { mode: 'pac_script', pacScript: { data } }, scope: 'regular' });
}

async function applyWebRtc(state) {
  const value = state.webrtc ? 'disable_non_proxied_udp' : 'default';
  try {
    await chrome.privacy.network.webRTCIPHandlingPolicy.set({ value });
  } catch (e) {
    console.warn('WebRTC policy not applied', e);
  }
}

async function applyAdblock(state) {
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    state.adblock ? { enableRulesetIds: ['ads'] } : { disableRulesetIds: ['ads'] },
  );
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: pauseRules(state.pausedSites),
  });
}

async function updateBadge(state) {
  const server = selectedServer(state);
  if (state.error) {
    await chrome.action.setBadgeBackgroundColor({ color: '#E5484D' });
    await chrome.action.setBadgeText({ text: '!' });
  } else if (state.connected && server) {
    await chrome.action.setBadgeBackgroundColor({ color: '#1F9D6B' });
    await chrome.action.setBadgeText({ text: server.country });
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}

async function applyAll() {
  const state = await load();
  await applyProxy(state);
  await applyWebRtc(state);
  await applyAdblock(state);
  await updateBadge(state);
  return state;
}

async function checkIp() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(IP_API, { cache: 'no-store', credentials: 'omit', signal: ctrl.signal });
    const j = await res.json();
    if (!j || j.success === false) throw new Error('ip');
    const lastIp = { ip: j.ip, country: j.country_code, city: j.city || '', at: Date.now() };
    return save({ lastIp });
  } catch {
    return save({ lastIp: null });
  } finally {
    clearTimeout(timer);
  }
}

async function connect() {
  let state = await load();
  if (!selectedServer(state)) return state;
  hasError = false;
  state = await save({ connected: true, error: null, lastIp: null });
  await applyProxy(state);
  await updateBadge(state);
  if (state.ipCheck) state = await checkIp();
  return state;
}

async function disconnect() {
  hasError = false;
  const state = await save({ connected: false, error: null, lastIp: null });
  await applyProxy(state);
  await updateBadge(state);
  return state;
}

// ---------- events ----------
chrome.runtime.onInstalled.addListener(async () => {
  const state = await load();
  const patch = {};
  for (const [k, v] of Object.entries(state)) patch[k] = v; // persist defaults
  if (!state.lang) patch.lang = detectLang(chrome.i18n.getUILanguage());
  await chrome.storage.local.set(patch);
  await applyAll();
});

chrome.runtime.onStartup.addListener(async () => {
  const state = await load();
  if (state.autoConnect && selectedServer(state)) {
    await save({ connected: true, error: null });
  } else if (state.connected) {
    await save({ connected: false });
  }
  await applyAll();
});

chrome.webRequest.onAuthRequired.addListener(
  (details, callback) => {
    (async () => {
      if (!details.isProxy) return callback({});
      const n = (authAttempts.get(details.requestId) || 0) + 1;
      authAttempts.set(details.requestId, n);
      const state = await load();
      const server = selectedServer(state);
      const host = (details.challenger && details.challenger.host || '').toLowerCase();
      if (!state.connected || !server || server.host !== host || !server.username || n > 2) {
        if (n > 2) { hasError = true; await updateBadge(await save({ error: 'auth' })); }
        return callback({ cancel: true });
      }
      callback({ authCredentials: { username: server.username, password: server.password } });
    })();
  },
  { urls: ['<all_urls>'] },
  ['asyncBlocking'],
);

// Errors that mean the proxy itself is unusable (not just one website failing).
export const PROXY_FATAL = [
  'net::ERR_PROXY_CONNECTION_FAILED',
  'net::ERR_PROXY_CERTIFICATE_INVALID',
  'net::ERR_PROXY_AUTH_UNSUPPORTED',
  'net::ERR_NO_SUPPORTED_PROXIES',
  'net::ERR_MANDATORY_PROXY_CONFIGURATION_FAILED',
];
let hasError = false; // in-memory mirror so onCompleted does not hit storage per request

chrome.webRequest.onCompleted.addListener(async (d) => {
  authAttempts.delete(d.requestId);
  if (hasError && !d.fromCache) {
    hasError = false;
    const state = await load();
    if (state.error) await updateBadge(await save({ error: null }));
  }
}, { urls: ['<all_urls>'] });
chrome.webRequest.onErrorOccurred.addListener((d) => authAttempts.delete(d.requestId), { urls: ['<all_urls>'] });

chrome.proxy.onProxyError.addListener(async (details) => {
  if (!PROXY_FATAL.includes(details.error)) return;
  const state = await load();
  if (!state.connected || state.error) return;
  if (state.killSwitch) {
    // Keep blocking: nothing leaves the browser until the server is back or the user disconnects.
    hasError = true;
    await updateBadge(await save({ error: details.error }));
  } else {
    // No kill switch: fall back openly (disconnect + tell the user) instead of leaking silently.
    const next = await save({ connected: false, error: details.error, lastIp: null });
    await applyProxy(next);
    await updateBadge(next);
  }
});

// ---------- messages from popup/options ----------
const handlers = {
  async getState() { return load(); },
  connect,
  disconnect,
  checkIp,
  async select({ id }) {
    const state = await save({ selectedId: id, error: null });
    if (state.connected) return connect();
    return state;
  },
  async setOption({ key, value }) {
    if (!BOOLEAN_OPTIONS.includes(key)) throw new Error('errInvalid');
    await save({ [key]: Boolean(value) });
    return applyAll();
  },
  async setLang({ lang }) { return save({ lang }); },
  async setBypass({ list }) {
    await save({ bypass: (list || []).map(String).slice(0, 1000) });
    return applyAll();
  },
  async saveServer({ server }) {
    const s = normaliseServer(server);
    const errors = validateServer(s);
    if (errors.length) throw new Error(errors[0]);
    const state = await load();
    const servers = state.servers.some((x) => x.id === s.id)
      ? state.servers.map((x) => (x.id === s.id ? s : x))
      : [...state.servers, s];
    await save({ servers, selectedId: state.selectedId || s.id });
    return applyAll();
  },
  async importToken({ token }) {
    const s = parseToken(token);
    return handlers.saveServer({ server: s });
  },
  async deleteServer({ id }) {
    const state = await load();
    const servers = state.servers.filter((x) => x.id !== id);
    const patch = { servers };
    if (state.selectedId === id) {
      patch.selectedId = servers[0] ? servers[0].id : null;
      if (!servers.length) patch.connected = false;
    }
    await save(patch);
    return applyAll();
  },
  async togglePause({ site }) {
    if (!site) throw new Error('errInvalid');
    const state = await load();
    const set = new Set(state.pausedSites);
    if (set.has(site)) set.delete(site); else set.add(site);
    await save({ pausedSites: [...set] });
    return applyAll();
  },
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !msg || !handlers[msg.type]) return false;
  handlers[msg.type](msg)
    .then((state) => sendResponse({ ok: true, state }))
    .catch((e) => sendResponse({ ok: false, error: e.message || 'errInvalid' }));
  return true;
});
