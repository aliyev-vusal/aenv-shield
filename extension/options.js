import { t, setLang, getLang, applyTo, LANGS, LANG_NAMES } from './lib/i18n.js';
import { flag, countryName, COUNTRIES } from './lib/servers.js';

const $ = (id) => document.getElementById(id);
let state = null;
let editingId = null;

async function send(type, payload = {}) {
  const res = await chrome.runtime.sendMessage({ type, ...payload });
  if (!res || !res.ok) throw new Error(res && res.error || 'errInvalid');
  state = res.state;
  return state;
}

function toast(text, isError = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.setAttribute('role', 'status');
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function renderServers() {
  const list = $('serverList');
  list.innerHTML = '';
  for (const s of state.servers) {
    const li = document.createElement('li');
    const f = document.createElement('span'); f.className = 'flag'; f.textContent = flag(s.country);
    const meta = document.createElement('div'); meta.className = 'meta';
    const b = document.createElement('b'); b.textContent = s.name;
    const small = document.createElement('small');
    small.textContent = `${countryName(s.country, getLang())} · ${s.scheme === 'PROXY' ? 'HTTP' : s.scheme} · ${s.host}:${s.port}`;
    meta.append(b, small);
    const edit = document.createElement('button'); edit.className = 'btn'; edit.textContent = t('edit');
    edit.addEventListener('click', () => openForm(s));
    const del = document.createElement('button'); del.className = 'btn danger'; del.textContent = t('delete');
    del.addEventListener('click', async () => {
      if (!confirm(t('confirmDelete', { name: s.name }))) return;
      await send('deleteServer', { id: s.id });
      render();
    });
    li.append(f, meta, edit, del);
    list.appendChild(li);
  }
}

function fillCountries() {
  const sel = $('countrySelect');
  const keep = sel.value || 'AZ';
  sel.innerHTML = '';
  for (const code of Object.keys(COUNTRIES)) sel.add(new Option(`${flag(code)} ${countryName(code, getLang())}`, code));
  sel.value = keep;
}

function openForm(server) {
  const form = $('serverForm');
  editingId = server ? server.id : null;
  form.reset();
  fillCountries();
  const s = server || { name: 'Baku', country: 'AZ', host: '', port: 443, scheme: 'HTTPS', username: '', password: '' };
  for (const k of ['name', 'country', 'host', 'port', 'scheme', 'username', 'password']) form.elements[k].value = s[k] ?? '';
  $('formError').textContent = '';
  form.hidden = false;
  form.elements.name.focus();
}

function render() {
  setLang(state.lang);
  applyTo(document);
  const sel = $('lang');
  sel.innerHTML = '';
  for (const l of LANGS) sel.add(new Option(LANG_NAMES[l], l, false, l === state.lang));
  renderServers();
  fillCountries();
  if (document.activeElement !== $('bypass')) $('bypass').value = state.bypass.join('\n');
  $('autoConnect').checked = state.autoConnect;
  $('ipCheck').checked = state.ipCheck;
  $('version').textContent = t('version', { v: chrome.runtime.getManifest().version });
}

$('lang').addEventListener('change', async (e) => { await send('setLang', { lang: e.target.value }); render(); });
$('newServer').addEventListener('click', () => openForm(null));
$('cancelForm').addEventListener('click', () => { $('serverForm').hidden = true; });

$('serverForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target.elements;
  const server = {
    id: editingId || undefined,
    name: f.name.value, country: f.country.value, host: f.host.value, port: Number(f.port.value),
    scheme: f.scheme.value, username: f.username.value, password: f.password.value,
  };
  try {
    await send('saveServer', { server });
    e.target.hidden = true;
    toast(t('saved'));
    render();
  } catch (err) {
    $('formError').textContent = t(err.message);
  }
});

$('importBtn').addEventListener('click', async () => {
  $('tokenError').textContent = '';
  try {
    await send('importToken', { token: $('token').value });
    $('token').value = '';
    toast(t('imported'));
    render();
  } catch (err) {
    $('tokenError').textContent = t(err.message);
  }
});

$('saveBypass').addEventListener('click', async () => {
  const list = $('bypass').value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  await send('setBypass', { list });
  toast(t('saved'));
  render();
});

for (const key of ['autoConnect', 'ipCheck']) {
  $(key).addEventListener('change', async (e) => { await send('setOption', { key, value: e.target.checked }); render(); });
}

send('getState').then(render);
