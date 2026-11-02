// Hides common ad containers that network rules cannot remove. Runs at document_start.
(() => {
  const SELECTORS = [
    'ins.adsbygoogle',
    '.adsbygoogle',
    '[id^="google_ads_iframe"]',
    '[id^="div-gpt-ad"]',
    '[data-google-query-id]',
    'iframe[src*="doubleclick.net"]',
    'iframe[src*="googlesyndication.com"]',
    'iframe[id^="aswift_"]',
    '.OUTBRAIN',
    '[id^="taboola-"]',
    '.trc_related_container',
    '[data-ad-slot]',
    '[aria-label="Advertisement"]',
  ];
  const site = location.hostname.replace(/^www\./, '').toLowerCase();
  chrome.storage.local.get(['adblock', 'pausedSites'], (s) => {
    if (chrome.runtime.lastError) return;
    const enabled = s.adblock !== false;
    const paused = Array.isArray(s.pausedSites) && s.pausedSites.some((p) => site === p || site.endsWith('.' + p));
    if (!enabled || paused) return;
    const style = document.createElement('style');
    style.id = 'aenv-shield-cosmetic';
    style.textContent = SELECTORS.join(',\n') + ' { display: none !important; }';
    (document.head || document.documentElement).appendChild(style);
  });
})();
