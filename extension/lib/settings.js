// Default settings and pure helpers for the stored state.

export const DEFAULTS = Object.freeze({
  servers: [],
  selectedId: null,
  connected: false,
  adblock: true,
  webrtc: true,
  killSwitch: false,
  autoConnect: false,
  ipCheck: true,
  bypass: [],
  pausedSites: [],
  lang: null,
  lastIp: null,
  error: null,
});

export const BOOLEAN_OPTIONS = ['adblock', 'webrtc', 'killSwitch', 'autoConnect', 'ipCheck'];

export function withDefaults(stored) {
  const out = { ...DEFAULTS, ...(stored || {}) };
  out.servers = Array.isArray(out.servers) ? out.servers : [];
  out.bypass = Array.isArray(out.bypass) ? out.bypass : [];
  out.pausedSites = Array.isArray(out.pausedSites) ? out.pausedSites : [];
  return out;
}

export function selectedServer(state) {
  return state.servers.find((s) => s.id === state.selectedId) || state.servers[0] || null;
}

/** Registrable-ish site key for "pause on this site": hostname without leading www. */
export function siteOf(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/** Dynamic DNR rules that switch the ad blocker off for paused sites (two rules per site):
 *  allowAllRequests covers frames opened on the site; the initiator-based allow rule covers every
 *  subresource the site requests, independent of when the frame was committed. */
export const SUBRESOURCE_TYPES = [
  'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object',
  'xmlhttprequest', 'ping', 'media', 'websocket', 'other',
];

export function pauseRules(sites) {
  return [...new Set(sites)].slice(0, 500).flatMap((site, i) => [
    {
      id: 1000 + 2 * i,
      priority: 100,
      action: { type: 'allowAllRequests' },
      condition: { requestDomains: [site], resourceTypes: ['main_frame', 'sub_frame'] },
    },
    {
      id: 1001 + 2 * i,
      priority: 100,
      action: { type: 'allow' },
      condition: { initiatorDomains: [site], resourceTypes: SUBRESOURCE_TYPES },
    },
  ]);
}
