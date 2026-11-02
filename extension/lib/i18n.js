// In-app localization (az, en, tr, de, es). Chrome's _locales has no Azerbaijani,
// so the UI uses this table and a live language picker; _locales only covers store metadata.

export const LANGS = ['az', 'en', 'tr', 'de', 'es'];
export const LANG_NAMES = { az: 'Azərbaycanca', en: 'English', tr: 'Türkçe', de: 'Deutsch', es: 'Español' };

// key: [az, en, tr, de, es]
const T = {
  statusDisconnected: ['Qorunmursunuz', 'Not protected', 'Korunmuyorsunuz', 'Nicht geschützt', 'Sin protección'],
  statusConnecting: ['Qoşulur…', 'Connecting…', 'Bağlanıyor…', 'Verbinde…', 'Conectando…'],
  statusConnected: ['Qorunursunuz', 'Protected', 'Korunuyorsunuz', 'Geschützt', 'Protegido'],
  statusError: ['Serverə çatmaq olmur', 'Server unreachable', 'Sunucuya ulaşılamıyor', 'Server nicht erreichbar', 'Servidor inaccesible'],
  connect: ['Qoşul', 'Connect', 'Bağlan', 'Verbinden', 'Conectar'],
  disconnect: ['Ayrıl', 'Disconnect', 'Bağlantıyı kes', 'Trennen', 'Desconectar'],
  noServer: ['Hələ server yoxdur. Ayarlarda server əlavə edin.', 'No server yet. Add one in Settings.', 'Henüz sunucu yok. Ayarlardan ekleyin.', 'Noch kein Server. In den Einstellungen hinzufügen.', 'Aún no hay servidor. Añádelo en Ajustes.'],
  selectServer: ['Məkan', 'Location', 'Konum', 'Standort', 'Ubicación'],
  yourIp: ['IP ünvanınız', 'Your IP', 'IP adresiniz', 'Ihre IP', 'Tu IP'],
  checking: ['Yoxlanılır…', 'Checking…', 'Kontrol ediliyor…', 'Wird geprüft…', 'Comprobando…'],
  ipUnknown: ['Məlum deyil', 'Unknown', 'Bilinmiyor', 'Unbekannt', 'Desconocida'],
  adBlocker: ['Reklam bloklayıcı', 'Ad blocker', 'Reklam engelleyici', 'Werbeblocker', 'Bloqueador de anuncios'],
  adBlockerDesc: ['Reklamları və izləyiciləri bloklayır', 'Blocks ads and trackers', 'Reklamları ve izleyicileri engeller', 'Blockiert Werbung und Tracker', 'Bloquea anuncios y rastreadores'],
  blockedHere: ['Bu səhifədə bloklandı: {n}', 'Blocked on this page: {n}', 'Bu sayfada engellenen: {n}', 'Auf dieser Seite blockiert: {n}', 'Bloqueados en esta página: {n}'],
  pauseSite: ['Bu saytda dayandır', 'Pause on this site', 'Bu sitede duraklat', 'Auf dieser Seite pausieren', 'Pausar en este sitio'],
  resumeSite: ['Bu saytda yenidən aç', 'Resume on this site', 'Bu sitede devam et', 'Auf dieser Seite fortsetzen', 'Reanudar en este sitio'],
  webrtc: ['WebRTC qoruması', 'WebRTC protection', 'WebRTC koruması', 'WebRTC-Schutz', 'Protección WebRTC'],
  webrtcDesc: ['Real IP-nin sızmasının qarşısını alır', 'Prevents real-IP leaks', 'Gerçek IP sızıntısını önler', 'Verhindert Leaks der echten IP', 'Evita filtraciones de tu IP real'],
  killSwitch: ['Kill switch', 'Kill switch', 'Kill switch', 'Kill-Switch', 'Kill switch'],
  killSwitchDesc: ['Server düşsə, trafik birbaşa getmir', 'If the server fails, nothing goes out directly', 'Sunucu düşerse trafik doğrudan gitmez', 'Fällt der Server aus, geht nichts direkt raus', 'Si el servidor falla, no sale nada directo'],
  settings: ['Ayarlar', 'Settings', 'Ayarlar', 'Einstellungen', 'Ajustes'],
  language: ['Dil', 'Language', 'Dil', 'Sprache', 'Idioma'],
  servers: ['Serverlər', 'Servers', 'Sunucular', 'Server', 'Servidores'],
  addServer: ['Server əlavə et', 'Add server', 'Sunucu ekle', 'Server hinzufügen', 'Añadir servidor'],
  importToken: ['Qoşulma kodu ilə idxal', 'Import connection code', 'Bağlantı koduyla içe aktar', 'Verbindungscode importieren', 'Importar código de conexión'],
  importHint: ['Server quraşdırma skriptinin verdiyi “aenv-shield:…” kodunu bura yapışdırın.', 'Paste the “aenv-shield:…” code printed by the server setup script.', 'Sunucu kurulum betiğinin verdiği “aenv-shield:…” kodunu yapıştırın.', 'Fügen Sie den „aenv-shield:…“-Code aus dem Server-Setup-Skript ein.', 'Pega el código “aenv-shield:…” que muestra el script de instalación.'],
  import: ['İdxal et', 'Import', 'İçe aktar', 'Importieren', 'Importar'],
  name: ['Ad', 'Name', 'Ad', 'Name', 'Nombre'],
  country: ['Ölkə', 'Country', 'Ülke', 'Land', 'País'],
  host: ['Host (domen və ya IP)', 'Host (domain or IP)', 'Host (alan adı veya IP)', 'Host (Domain oder IP)', 'Host (dominio o IP)'],
  port: ['Port', 'Port', 'Port', 'Port', 'Puerto'],
  protocol: ['Protokol', 'Protocol', 'Protokol', 'Protokoll', 'Protocolo'],
  protocolHint: ['HTTPS tövsiyə olunur: serverə gedən bağlantı şifrələnir.', 'HTTPS is recommended: the link to your server is encrypted.', 'HTTPS önerilir: sunucuya bağlantı şifrelenir.', 'HTTPS empfohlen: Die Verbindung zum Server ist verschlüsselt.', 'Se recomienda HTTPS: la conexión al servidor va cifrada.'],
  username: ['İstifadəçi adı', 'Username', 'Kullanıcı adı', 'Benutzername', 'Usuario'],
  password: ['Şifrə', 'Password', 'Şifre', 'Passwort', 'Contraseña'],
  save: ['Yadda saxla', 'Save', 'Kaydet', 'Speichern', 'Guardar'],
  cancel: ['Ləğv et', 'Cancel', 'İptal', 'Abbrechen', 'Cancelar'],
  edit: ['Redaktə', 'Edit', 'Düzenle', 'Bearbeiten', 'Editar'],
  delete: ['Sil', 'Delete', 'Sil', 'Löschen', 'Eliminar'],
  confirmDelete: ['“{name}” silinsin?', 'Delete “{name}”?', '“{name}” silinsin mi?', '„{name}“ löschen?', '¿Eliminar “{name}”?'],
  saved: ['Yadda saxlandı', 'Saved', 'Kaydedildi', 'Gespeichert', 'Guardado'],
  imported: ['Server əlavə olundu', 'Server added', 'Sunucu eklendi', 'Server hinzugefügt', 'Servidor añadido'],
  bypassList: ['İstisna saytlar (split tunneling)', 'Bypass list (split tunneling)', 'Hariç siteler (split tunneling)', 'Ausnahmen (Split-Tunneling)', 'Lista de exclusión (split tunneling)'],
  bypassHint: ['Hər sətirdə bir domen. Bu saytlar real IP ilə açılır (məs. bankınız).', 'One domain per line. These sites use your real IP (e.g. your bank).', 'Her satıra bir alan adı. Bu siteler gerçek IP ile açılır (ör. bankanız).', 'Eine Domain pro Zeile. Diese Seiten nutzen Ihre echte IP (z. B. Ihre Bank).', 'Un dominio por línea. Estos sitios usan tu IP real (p. ej. tu banco).'],
  general: ['Ümumi', 'General', 'Genel', 'Allgemein', 'General'],
  autoConnect: ['Brauzer açılanda avtomatik qoşul', 'Auto-connect when the browser starts', 'Tarayıcı açılınca otomatik bağlan', 'Beim Browserstart automatisch verbinden', 'Conectar al iniciar el navegador'],
  ipCheck: ['Qoşulduqdan sonra IP-ni yoxla', 'Check IP after connecting', 'Bağlandıktan sonra IP’yi kontrol et', 'IP nach dem Verbinden prüfen', 'Comprobar IP tras conectar'],
  ipCheckDesc: ['ipwho.is xidmətinə bir sorğu göndərilir (yalnız IP/ölkə).', 'Sends one request to ipwho.is (IP/country only).', 'ipwho.is’e tek bir istek gönderilir (yalnızca IP/ülke).', 'Sendet eine Anfrage an ipwho.is (nur IP/Land).', 'Envía una solicitud a ipwho.is (solo IP/país).'],
  serverSetup: ['Bakıda öz serverinizi necə qurmaq olar?', 'How to set up your own server', 'Kendi sunucunuzu nasıl kurarsınız?', 'Eigenen Server einrichten', 'Cómo montar tu propio servidor'],
  serverSetupBody: ['Bakıda Ubuntu VPS icarə edin, GitHub-dakı server/install.sh skriptini işə salın və çıxan kodu yuxarıda idxal edin.', 'Rent an Ubuntu VPS in the country you want, run server/install.sh from the GitHub repo and import the code it prints above.', 'İstediğiniz ülkede bir Ubuntu VPS kiralayın, GitHub’daki server/install.sh betiğini çalıştırın ve verdiği kodu yukarıda içe aktarın.', 'Mieten Sie einen Ubuntu-VPS im gewünschten Land, führen Sie server/install.sh aus dem GitHub-Repo aus und importieren Sie den ausgegebenen Code oben.', 'Alquila un VPS Ubuntu en el país que quieras, ejecuta server/install.sh del repositorio de GitHub e importa arriba el código que muestra.'],
  about: ['Haqqında', 'About', 'Hakkında', 'Über', 'Acerca de'],
  version: ['Versiya {v}', 'Version {v}', 'Sürüm {v}', 'Version {v}', 'Versión {v}'],
  privacy: ['Məxfilik', 'Privacy', 'Gizlilik', 'Datenschutz', 'Privacidad'],
  license: ['Lisenziya', 'License', 'Lisans', 'Lizenz', 'Licencia'],
  disclaimer: ['AENV Shield VPN xidməti satmır: trafiki yalnız sizin əlavə etdiyiniz serverlərə yönləndirir. Telemetriya yoxdur.', 'AENV Shield does not sell a VPN service: it routes traffic only to servers you add yourself. No telemetry.', 'AENV Shield bir VPN hizmeti satmaz: trafiği yalnızca sizin eklediğiniz sunuculara yönlendirir. Telemetri yoktur.', 'AENV Shield verkauft keinen VPN-Dienst: Der Verkehr geht nur an Server, die Sie selbst hinzufügen. Keine Telemetrie.', 'AENV Shield no vende un servicio VPN: solo enruta el tráfico a servidores que tú añades. Sin telemetría.'],
  errInvalid: ['Yanlış məlumat', 'Invalid data', 'Geçersiz veri', 'Ungültige Daten', 'Datos no válidos'],
  errName: ['Ad 1–60 simvol olmalıdır', 'Name must be 1–60 characters', 'Ad 1–60 karakter olmalı', 'Name muss 1–60 Zeichen haben', 'El nombre debe tener 1–60 caracteres'],
  errCountry: ['Ölkə kodu 2 hərf olmalıdır (məs. AZ)', 'Country code must be 2 letters (e.g. AZ)', 'Ülke kodu 2 harf olmalı (ör. AZ)', 'Ländercode muss 2 Buchstaben haben (z. B. AZ)', 'El código de país debe tener 2 letras (p. ej. AZ)'],
  errHost: ['Host düzgün deyil', 'Host is not valid', 'Host geçerli değil', 'Host ist ungültig', 'Host no válido'],
  errPort: ['Port 1–65535 arasında olmalıdır', 'Port must be 1–65535', 'Port 1–65535 arası olmalı', 'Port muss zwischen 1 und 65535 liegen', 'El puerto debe estar entre 1 y 65535'],
  errScheme: ['Protokol seçin', 'Choose a protocol', 'Protokol seçin', 'Protokoll wählen', 'Elige un protocolo'],
  errSocksAuth: ['Chrome SOCKS5 üçün şifrəni dəstəkləmir — HTTPS seçin', 'Chrome does not support SOCKS5 passwords — use HTTPS', 'Chrome SOCKS5 şifresini desteklemez — HTTPS seçin', 'Chrome unterstützt keine SOCKS5-Passwörter — HTTPS wählen', 'Chrome no admite contraseñas SOCKS5: usa HTTPS'],
  errToken: ['Kod tanınmadı', 'Code not recognised', 'Kod tanınmadı', 'Code nicht erkannt', 'Código no reconocido'],
};

export const KEYS = Object.keys(T);

let current = 'en';

export function detectLang(uiLang) {
  const base = String(uiLang || 'en').toLowerCase().split(/[-_]/)[0];
  return LANGS.includes(base) ? base : 'en';
}

export function setLang(lang) {
  current = LANGS.includes(lang) ? lang : 'en';
  return current;
}

export function getLang() {
  return current;
}

export function t(key, vars = {}) {
  const row = T[key];
  if (!row) return key;
  let s = row[LANGS.indexOf(current)] ?? row[1];
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Fill every [data-i18n] / [data-i18n-placeholder] / [data-i18n-title] element. */
export function applyTo(root) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
    el.setAttribute('aria-label', el.title);
  });
  if (root.documentElement) root.documentElement.lang = current;
}

export const _table = T; // exposed for tests
