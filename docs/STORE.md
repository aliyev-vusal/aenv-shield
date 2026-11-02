# Publishing AENV Shield

Package: `npm run pack` → `dist/aenv-shield-<version>.zip` (also built by CI on every push to `main`
and attached to GitHub Releases for `v*` tags).

## 1. Chrome Web Store

1. Developer account: <https://chrome.google.com/webstore/devconsole> — one-time registration fee
   (check the current amount on the registration page), identity verification.
2. **New item** → upload the zip.
3. **Store listing** — texts below, category *Privacy & Security*, language(s), artwork from `store-assets/`:

   | Field | File |
   |---|---|
   | Icon 128×128 | `store-assets/icon-128.png` |
   | Screenshots 1280×800 | `screenshot-1-popup-<lang>.png`, `screenshot-2-settings-en.png` |
   | Small promo tile 440×280 | `promo-small-440x280.png` |
   | Marquee 1400×560 | `marquee-1400x560.png` |

4. **Privacy practices**
   - Single purpose: *"Protect the user's browsing privacy: route browser traffic through the user's own proxy server and block ads/trackers that track the user."*
   - Permission justifications:
     - `proxy` — send browser traffic to the proxy server the user configured.
     - `webRequest`, `webRequestAuthProvider` — answer the username/password challenge of that proxy server.
     - `privacy` — set the WebRTC IP handling policy so WebRTC cannot reveal the real IP.
     - `declarativeNetRequest` — block requests to ad and tracker domains.
     - `activeTab` — read the current site to offer "pause on this site" and show its blocked count.
     - `storage` — keep the user's servers and settings locally.
     - Host access `<all_urls>` — needed for proxy authentication on every site and to hide empty ad slots.
   - Remote code: **No**.
   - Data usage: no data collected. Tick the certifications. Privacy policy URL:
     `https://github.com/aliyev-vusal/aenv-shield/blob/main/docs/privacy-policy.md`
5. Submit. Reviews of extensions with broad permissions usually take longer than normal ones.

### Review risk: single purpose
Google has rejected VPN extensions that bundle many unrelated features. AENV Shield keeps everything
under one purpose (browsing privacy: hide IP, stop IP leaks, block trackers). Describe it that way
everywhere. If a reviewer still objects, publish the ad blocker as a separate extension — the code is
already isolated (`rules/`, `cosmetic.js`, `applyAdblock`).

## 2. Microsoft Edge Add-ons

Partner Center → Edge program (registration free) → **Create new extension** → same zip, same texts and
artwork. Edge supports `az` listings directly.

## Certification notes (paste into "Notes for reviewers")

```
AENV Shield is a proxy client. It ships with no servers and sells no service.
To test: Settings → Add server → use any HTTPS/HTTP proxy you control, or run server/install.sh
from https://github.com/aliyev-vusal/aenv-shield on an Ubuntu VPS and import the printed code.
The ad blocker works without any server: open a news site and check the counter in the popup.
No data is sent to the developer; the only external request is an optional IP check to ipwho.is.
```

## Listing texts

### en
**Name:** AENV Shield — Private Proxy & Ad Blocker
**Summary:** Route your browser through your own server (e.g. in Baku) and browse privately without ads, trackers or WebRTC leaks.
**Description:**
AENV Shield connects your browser to a proxy server you own — for example a small VPS in Baku, so websites see an Azerbaijani IP address.
• One-click connect with location picker
• HTTPS proxies with automatic login (paste a connection code from our free setup script)
• Built-in ad & tracker blocker with per-site pause
• WebRTC leak protection
• Kill switch — nothing leaks if your server goes down
• Split tunneling — let your bank use your real IP
• No account, no telemetry, 5 languages
AENV Shield does not sell a VPN service; it routes traffic only to servers you add.

### az
**Ad:** AENV Shield — Şəxsi Proxy və Reklam Bloklayıcı
**Qısa:** Brauzerinizi öz serveriniz (məs. Bakıda) üzərindən işlədin; reklamsız, izləyicisiz, WebRTC sızması olmadan.
**Təsvir:**
AENV Shield brauzerinizi sizə məxsus proxy serverə qoşur — məsələn Bakıdakı kiçik bir VPS-ə; saytlar Azərbaycan IP ünvanı görür.
• Bir kliklə qoşulma və məkan seçimi
• Avtomatik girişli HTTPS proxy (pulsuz quraşdırma skriptinin verdiyi kodu yapışdırın)
• Daxili reklam və izləyici bloklayıcı, sayt üzrə pauza
• WebRTC sızma qoruması
• Kill switch — server düşsə, heç nə sızmır
• Split tunneling — bankınız real IP ilə açılsın
• Hesab yoxdur, telemetriya yoxdur, 5 dil
AENV Shield VPN xidməti satmır; trafiki yalnız sizin əlavə etdiyiniz serverlərə yönləndirir.

### tr
**Ad:** AENV Shield — Özel Proxy ve Reklam Engelleyici
**Özet:** Tarayıcınızı kendi sunucunuz (ör. Bakü) üzerinden yönlendirin; reklamsız, izleyicisiz ve WebRTC sızıntısı olmadan gezinin.
**Açıklama:**
AENV Shield tarayıcınızı size ait bir proxy sunucuya bağlar — örneğin Bakü’deki küçük bir VPS; siteler Azerbaycan IP adresi görür.
• Tek tıkla bağlantı ve konum seçimi
• Otomatik girişli HTTPS proxy (ücretsiz kurulum betiğinin verdiği kodu yapıştırın)
• Dahili reklam ve izleyici engelleyici, site bazında duraklatma
• WebRTC sızıntı koruması
• Kill switch — sunucu düşerse hiçbir şey sızmaz
• Split tunneling — bankanız gerçek IP’nizle açılsın
• Hesap yok, telemetri yok, 5 dil
AENV Shield VPN hizmeti satmaz; trafiği yalnızca sizin eklediğiniz sunuculara yönlendirir.

### de
**Name:** AENV Shield — Privater Proxy & Werbeblocker
**Kurzbeschreibung:** Leiten Sie Ihren Browser über Ihren eigenen Server (z. B. in Baku) und surfen Sie privat ohne Werbung, Tracker oder WebRTC-Leaks.
**Beschreibung:**
AENV Shield verbindet Ihren Browser mit einem Proxy-Server, der Ihnen gehört – zum Beispiel einem kleinen VPS in Baku, sodass Websites eine aserbaidschanische IP-Adresse sehen.
• Verbinden mit einem Klick, Standortauswahl
• HTTPS-Proxys mit automatischer Anmeldung (Verbindungscode aus dem kostenlosen Setup-Skript einfügen)
• Integrierter Werbe- und Trackerblocker, pro Website pausierbar
• Schutz vor WebRTC-Leaks
• Kill-Switch – fällt der Server aus, gelangt nichts nach außen
• Split-Tunneling – Ihre Bank nutzt weiter Ihre echte IP
• Kein Konto, keine Telemetrie, 5 Sprachen
AENV Shield verkauft keinen VPN-Dienst; der Verkehr geht nur an Server, die Sie selbst hinzufügen.

### es
**Nombre:** AENV Shield — Proxy privado y bloqueador
**Resumen:** Enruta tu navegador por tu propio servidor (p. ej. en Bakú) y navega en privado, sin anuncios, rastreadores ni fugas WebRTC.
**Descripción:**
AENV Shield conecta tu navegador a un servidor proxy tuyo — por ejemplo un VPS pequeño en Bakú, para que los sitios vean una IP de Azerbaiyán.
• Conexión con un clic y selector de ubicación
• Proxies HTTPS con inicio de sesión automático (pega el código del script de instalación gratuito)
• Bloqueador de anuncios y rastreadores integrado, con pausa por sitio
• Protección contra fugas WebRTC
• Kill switch: si el servidor cae, no se filtra nada
• Split tunneling: tu banco sigue usando tu IP real
• Sin cuenta, sin telemetría, 5 idiomas
AENV Shield no vende un servicio VPN; solo enruta el tráfico a servidores que tú añades.
