// PAC script generation. Pure module: no chrome.* usage, unit-testable in Node.

const SCHEMES = new Set(['HTTPS', 'PROXY', 'SOCKS5']);

// Hosts that must never leave the local machine/network.
export const ALWAYS_DIRECT = [
  'localhost',
  '*.local',
  '127.0.0.1',
  '[::1]',
];

/** Normalise a user-entered bypass entry to a lower-case host pattern, or null. */
export function normaliseBypass(entry) {
  if (typeof entry !== 'string') return null;
  let s = entry.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^[a-z]+:\/\//, '');      // strip scheme
  s = s.split('/')[0];                     // strip path
  s = s.replace(/:\d+$/, '');              // strip port
  if (s.startsWith('.')) s = '*' + s;
  if (!/^(\*\.)?[a-z0-9.-]+$/.test(s)) return null;
  if (s.includes('..')) return null;
  return s;
}

function jsString(value) {
  return JSON.stringify(String(value));
}

/**
 * Build PAC script text.
 * @param {{scheme:string, host:string, port:number}} server
 * Never falls back to DIRECT: a silent fallback would leak the real IP while the UI says
 * "protected". What happens on server failure is decided by the kill switch in background.js.
 * @param {{bypass?:string[]}} opts
 */
export function buildPac(server, opts = {}) {
  if (!server || !SCHEMES.has(server.scheme)) throw new Error('Invalid proxy scheme');
  const port = Number(server.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  if (!/^[a-z0-9.-]+$/i.test(server.host || '')) throw new Error('Invalid host');

  const bypass = [...new Set((opts.bypass || []).map(normaliseBypass).filter(Boolean))];
  const route = `${server.scheme} ${server.host}:${port}`;

  return [
    'function FindProxyForURL(url, host) {',
    '  host = host.toLowerCase();',
    `  var always = ${JSON.stringify(ALWAYS_DIRECT)};`,
    `  var bypass = ${JSON.stringify(bypass)};`,
    '  var lists = always.concat(bypass);',
    '  for (var i = 0; i < lists.length; i++) {',
    '    var p = lists[i];',
    '    if (p.indexOf("*.") === 0) {',
    '      var base = p.substring(2);',
    '      if (host === base || dnsDomainIs(host, "." + base)) return "DIRECT";',
    '    } else if (host === p || dnsDomainIs(host, "." + p)) {',
    '      return "DIRECT";',
    '    }',
    '  }',
    '  if (isPlainHostName(host)) return "DIRECT";',
    '  if (/^(10\\.|192\\.168\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|169\\.254\\.)/.test(host)) return "DIRECT";',
    `  if (host === ${jsString(server.host.toLowerCase())}) return "DIRECT";`,
    `  return ${jsString(route)};`,
    '}',
  ].join('\n');
}
