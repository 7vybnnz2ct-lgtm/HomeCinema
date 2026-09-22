
const devices = {
  denon: {
    id: 'denon',
    name: 'Denon AVR-X4000',
    room: 'Wohnzimmer',
    power: true,
    volume: -38.5,
    source: 'Xbox',
    soundMode: 'Dolby Digital / 5.1',
    sources: [
      {id:'xbox', label:'Xbox', icon:'🎮'},
      {id:'appletv', label:'Apple TV', icon:'📺'},
      {id:'tv', label:'TV', icon:'🖥️'},
      {id:'bluray', label:'Blu-ray', icon:'💿'},
      {id:'musicserver', label:'Music Server', icon:'🗄️'}
    ],
    modes: ['Stereo','Dolby','DTS','Direct','Pure Direct'],
    activeMode: 'Dolby',
    roomLayout: '7.1',
    audysseyLabel: 'Raumkorrektur (XT32)',
    audyssey: true,
    dynamicEq: true,
    dynamicVolume: false,
    subLevel: -2,
    centerLevel: 0,
    activityTitle: 'Xbox Series X',
    activitySub: 'Wiedergabe aktiv'
  },
  marantz: {
    id: 'marantz',
    name: 'Marantz NR1605',
    room: 'Wohnzimmer',
    power: true,
    volume: -42.0,
    source: 'TV',
    soundMode: 'DTS-HD / 5.1',
    sources: [
      {id:'tv', label:'TV', icon:'🖥️'},
      {id:'appletv', label:'Apple TV', icon:'📺'},
      {id:'xbox', label:'Xbox', icon:'🎮'},
      {id:'bluray', label:'Blu-ray', icon:'💿'},
      {id:'media', label:'Media Player', icon:'📀'}
    ],
    modes: ['Stereo','Dolby','DTS','Movie','Music'],
    activeMode: 'DTS',
    roomLayout: '5.1 / 7.1',
    audysseyLabel: 'Raumkorrektur (MultEQ)',
    audyssey: true,
    dynamicEq: true,
    dynamicVolume: true,
    subLevel: 0,
    centerLevel: 1,
    activityTitle: 'Fernsehen',
    activitySub: 'TV-Ton aktiv'
  }
};

let currentDevice = 'denon';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.add('hidden'), 2200);
}

function formatDb(v){
  return `${v.toFixed(1)} dB`;
}

function clamp(v, min, max){
  return Math.max(min, Math.min(max, v));
}

function volumeToProgress(v){
  // Map -80 ... +18 to approx 0..420
  const pct = (v + 80) / 98;
  return Math.max(0, Math.min(1, pct)) * 420;
}

function renderSources(device){
  const host = $('#sourceGrid');
  host.innerHTML = '';
  device.sources.forEach(src => {
    const el = document.createElement('button');
    el.className = 'source-card' + (device.source === src.label ? ' active' : '');
    el.innerHTML = `<div class="source-emoji">${src.icon}</div><div class="source-name">${src.label}</div>`;
    el.onclick = () => {
      device.source = src.label;
      device.activityTitle = src.label;
      device.activitySub = 'Quelle aktiv';
      render();
      toast(`Quelle: ${src.label}`);
    };
    host.appendChild(el);
  });
}

function renderModes(device){
  const host = $('#modeGrid');
  host.innerHTML = '';
  device.modes.forEach(mode => {
    const btn = document.createElement('button');
    btn.className = 'mode-btn' + (device.activeMode === mode ? ' active' : '');
    btn.textContent = mode;
    btn.onclick = () => {
      device.activeMode = mode;
      if (mode === 'Dolby') device.soundMode = 'Dolby Digital / 5.1';
      else if (mode === 'DTS') device.soundMode = 'DTS-HD / 5.1';
      else device.soundMode = mode;
      render();
      toast(`Klangmodus: ${mode}`);
    };
    host.appendChild(btn);
  });
}

function renderDeviceChips(){
  $$('.device-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.device === currentDevice);
  });
}

function render(){
  const d = devices[currentDevice];

  $('#deviceName').textContent = d.name;
  $('#deviceRoom').textContent = `${d.room} · Verbunden im Demo-Modus`;
  $('#brandSub').textContent = `Demo-Modus · ${d.name}`;
  $('#powerState').textContent = d.power ? 'EIN' : 'AUS';
  $('#sourceState').textContent = d.source;
  $('#soundModeState').textContent = d.soundMode;
  $('#volumeDisplay').textContent = formatDb(d.volume);
  $('#footerVolValue').textContent = formatDb(d.volume);
  $('#footerVol').value = d.volume;
  $('#audysseyLabel').textContent = d.audysseyLabel;
  $('#layoutBadge').textContent = d.roomLayout;
  $('#activityTitle').textContent = d.activityTitle;
  $('#activitySub').textContent = d.activitySub;

  $('#audysseyToggle').checked = d.audyssey;
  $('#dynEqToggle').checked = d.dynamicEq;
  $('#dynVolToggle').checked = d.dynamicVolume;
  $('#subSlider').value = d.subLevel;
  $('#centerSlider').value = d.centerLevel;
  $('#subValue').textContent = `${d.subLevel} dB`;
  $('#centerValue').textContent = `${d.centerLevel} dB`;

  const progress = volumeToProgress(d.volume);
  $('#dialProgress').style.strokeDasharray = `${progress} 999`;

  renderSources(d);
  renderModes(d);
  renderDeviceChips();
}

function applyScene(scene){
  const d = devices[currentDevice];
  if(scene === 'film'){
    d.source = d.id === 'marantz' ? 'Blu-ray' : 'Xbox';
    d.activeMode = 'Dolby';
    d.soundMode = 'Dolby Digital / 5.1';
    d.dynamicEq = true;
    d.dynamicVolume = false;
    d.subLevel = 1;
    d.centerLevel = 1;
    d.activityTitle = 'Filmabend';
    d.activitySub = 'Szene aktiviert';
  }
  if(scene === 'music'){
    d.source = d.id === 'marantz' ? 'Media Player' : 'Music Server';
    d.activeMode = d.modes.includes('Pure Direct') ? 'Pure Direct' : 'Music';
    d.soundMode = d.activeMode;
    d.dynamicEq = false;
    d.dynamicVolume = false;
    d.subLevel = -2;
    d.centerLevel = 0;
    d.activityTitle = 'Musik';
    d.activitySub = 'Szene aktiviert';
  }
  if(scene === 'gaming'){
    d.source = 'Xbox';
    d.activeMode = d.modes.includes('Dolby') ? 'Dolby' : d.modes[0];
    d.soundMode = 'Dolby Digital / 5.1';
    d.dynamicEq = true;
    d.dynamicVolume = false;
    d.subLevel = 0;
    d.centerLevel = 0;
    d.activityTitle = 'Gaming';
    d.activitySub = 'Szene aktiviert';
  }
  if(scene === 'night'){
    d.dynamicEq = true;
    d.dynamicVolume = true;
    d.volume = Math.min(d.volume, -45);
    d.subLevel = -4;
    d.activityTitle = 'Abends';
    d.activitySub = 'Szene aktiviert';
  }
  render();
  toast(`Szene aktiviert: ${scene}`);
}

function setupEvents(){
  $$('.device-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      currentDevice = btn.dataset.device;
      render();
      toast(`Gerät gewechselt: ${devices[currentDevice].name}`);
    });
  });

  $$('#app .scene-card').forEach(btn => {
    btn.addEventListener('click', () => applyScene(btn.dataset.scene));
  });

  $('#volUpBtn').addEventListener('click', () => {
    const d = devices[currentDevice];
    d.volume = clamp(d.volume + 0.5, -80, 18);
    render();
  });
  $('#volDownBtn').addEventListener('click', () => {
    const d = devices[currentDevice];
    d.volume = clamp(d.volume - 0.5, -80, 18);
    render();
  });

  $('#footerVol').addEventListener('input', (e) => {
    const d = devices[currentDevice];
    d.volume = parseFloat(e.target.value);
    render();
  });

  $('#audysseyToggle').addEventListener('change', (e) => {
    devices[currentDevice].audyssey = e.target.checked;
    toast(`Audyssey ${e.target.checked ? 'aktiv' : 'aus'}`);
  });
  $('#dynEqToggle').addEventListener('change', (e) => {
    devices[currentDevice].dynamicEq = e.target.checked;
    toast(`Dynamic EQ ${e.target.checked ? 'aktiv' : 'aus'}`);
  });
  $('#dynVolToggle').addEventListener('change', (e) => {
    devices[currentDevice].dynamicVolume = e.target.checked;
    toast(`Dynamic Volume ${e.target.checked ? 'aktiv' : 'aus'}`);
  });

  $('#subSlider').addEventListener('input', (e) => {
    devices[currentDevice].subLevel = parseFloat(e.target.value);
    $('#subValue').textContent = `${devices[currentDevice].subLevel} dB`;
  });
  $('#centerSlider').addEventListener('input', (e) => {
    devices[currentDevice].centerLevel = parseFloat(e.target.value);
    $('#centerValue').textContent = `${devices[currentDevice].centerLevel} dB`;
  });

  $('#playPauseBtn').addEventListener('click', (e) => {
    e.currentTarget.textContent = e.currentTarget.textContent === '⏸' ? '▶' : '⏸';
    toast('Test-Player umgeschaltet');
  });

  $('#settingsBtn').addEventListener('click', () => toast('Einstellungen folgen in V0.2'));
  $('#sceneMenuBtn').addEventListener('click', () => toast('Szenen-Übersicht folgt in V0.2'));
}

setupEvents();
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
