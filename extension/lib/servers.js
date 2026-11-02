// Server model, validation and connection-token import. Pure module.

export const TOKEN_PREFIX = 'aenv-shield:';

// Small curated list; any ISO-3166 alpha-2 code is accepted.
export const COUNTRIES = {
  AZ: 'Azerbaijan', TR: 'Türkiye', DE: 'Germany', GE: 'Georgia', NL: 'Netherlands',
  GB: 'United Kingdom', US: 'United States', FR: 'France', ES: 'Spain', AE: 'United Arab Emirates',
  KZ: 'Kazakhstan', UZ: 'Uzbekistan', IT: 'Italy', PL: 'Poland', SE: 'Sweden',
  CH: 'Switzerland', AT: 'Austria', FI: 'Finland', JP: 'Japan', SG: 'Singapore',
};

export function flag(code) {
  if (!/^[A-Z]{2}$/.test(code || '')) return '🌐';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Country name in the UI language (Intl), falling back to English. */
export function countryName(code, lang = 'en') {
  if (!/^[A-Z]{2}$/.test(code || '')) return code || '?';
  try {
    const name = new Intl.DisplayNames([lang, 'en'], { type: 'region' }).of(code);
    if (name && name !== code) return name;
  } catch { /* old engine */ }
  return COUNTRIES[code] || code;
}

/** Returns a list of error keys (i18n keys); empty list = valid. */
export function validateServer(s) {
  const errors = [];
  if (!s || typeof s !== 'object') return ['errInvalid'];
  if (!s.name || String(s.name).trim().length === 0 || String(s.name).length > 60) errors.push('errName');
  if (!/^[A-Z]{2}$/.test(s.country || '')) errors.push('errCountry');
  if (!/^(?=.{1,253}$)[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(s.host || '')) errors.push('errHost');
  const port = Number(s.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('errPort');
  if (!['HTTPS', 'PROXY', 'SOCKS5'].includes(s.scheme)) errors.push('errScheme');
  if (s.scheme === 'SOCKS5' && (s.username || s.password)) errors.push('errSocksAuth');
  return errors;
}

export function newId() {
  const a = new Uint8Array(8);
  globalThis.crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function normaliseServer(raw) {
  return {
    id: raw.id || newId(),
    name: String(raw.name || '').trim(),
    country: String(raw.country || '').trim().toUpperCase(),
    host: String(raw.host || '').trim().toLowerCase(),
    port: Number(raw.port),
    scheme: String(raw.scheme || 'HTTPS').toUpperCase(),
    username: raw.username ? String(raw.username) : '',
    password: raw.password ? String(raw.password) : '',
  };
}

function b64decode(s) {
  const clean = s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  const bin = globalThis.atob(clean);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function b64encode(s) {
  const bytes = new TextEncoder().encode(s);
  return globalThis.btoa(String.fromCharCode(...bytes));
}

/** Parse a token printed by server/install.sh. Throws Error('errToken') on bad input. */
export function parseToken(token) {
  if (typeof token !== 'string') throw new Error('errToken');
  let t = token.trim();
  if (t.startsWith(TOKEN_PREFIX)) t = t.slice(TOKEN_PREFIX.length);
  let obj;
  try {
    obj = JSON.parse(t.startsWith('{') ? t : b64decode(t));
  } catch {
    throw new Error('errToken');
  }
  const s = normaliseServer({ ...obj, id: undefined });
  if (validateServer(s).length) throw new Error('errToken');
  return s;
}

export function makeToken(server) {
  const { name, country, host, port, scheme, username, password } = server;
  return TOKEN_PREFIX + b64encode(JSON.stringify({ name, country, host, port, scheme, username, password }));
}
