const enabled = document.getElementById('enabled');
const muted = document.getElementById('muted');
const alwaysOnTop = document.getElementById('alwaysOnTop');
const launchAtLogin = document.getElementById('launchAtLogin');
const sources = [...document.querySelectorAll('.source')];
let current = null;

function render(settings) {
  if (!settings || typeof settings !== 'object') return;
  current = settings;
  enabled.checked = settings.enabled !== false;
  muted.checked = settings.muted === false;
  alwaysOnTop.checked = settings.alwaysOnTop !== false;
  launchAtLogin.checked = settings.launchAtLogin === true;
  for (const input of sources) input.checked = settings.enabledSources?.[input.dataset.source] === true;
}

function update(patch) {
  window.controlCenter.update(patch);
}

enabled.addEventListener('change', () => update({ enabled: enabled.checked }));
muted.addEventListener('change', () => update({ muted: !muted.checked }));
alwaysOnTop.addEventListener('change', () => update({ alwaysOnTop: alwaysOnTop.checked }));
launchAtLogin.addEventListener('change', () => update({ launchAtLogin: launchAtLogin.checked }));
for (const input of sources) input.addEventListener('change', () => update({ enabledSources: { ...current.enabledSources, [input.dataset.source]: input.checked } }));
window.controlCenter.onSettings(render);
window.controlCenter.getSettings().then(render);
