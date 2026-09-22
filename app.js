
const devices = {
  denon: {
    id:'denon', name:'Denon AVR-X4000', room:'Wohnzimmer', power:true, volume:-38.5,
    source:'Xbox', modeText:'Dolby Digital / 5.1', activeMode:'Dolby', layout:'7.1',
    audysseyTitle:'Audyssey XT32', audyssey:true, dynEq:true, dynVol:false, sub:-2, center:0,
    mediaTitle:'Xbox Series X', mediaSub:'Wiedergabe aktiv', mediaThumb:'🎮',
    sources:[
      {label:'Xbox',icon:'🎮'},
      {label:'Apple TV',icon:'▣'},
      {label:'TV',icon:'▭'},
      {label:'Blu-ray',icon:'◉'},
      {label:'Music Server',icon:'▤'}
    ],
    modes:['Stereo','Dolby','DTS','Direct','Pure Direct']
  },
  marantz: {
    id:'marantz', name:'Marantz NR1605', room:'Wohnzimmer', power:true, volume:-42,
    source:'TV', modeText:'DTS-HD / 5.1', activeMode:'DTS', layout:'5.1 / 7.1',
    audysseyTitle:'Audyssey MultEQ', audyssey:true, dynEq:true, dynVol:true, sub:0, center:1,
    mediaTitle:'Fernsehen', mediaSub:'TV-Ton aktiv', mediaThumb:'▭',
    sources:[
      {label:'TV',icon:'▭'},
      {label:'Apple TV',icon:'▣'},
      {label:'Xbox',icon:'🎮'},
      {label:'Blu-ray',icon:'◉'},
      {label:'Media Player',icon:'▤'}
    ],
    modes:['Stereo','Dolby','DTS','Movie','Music']
  }
};

let current = 'denon';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function fmtDb(v){
  return `${Number(v).toFixed(1)} dB`;
}
function toast(msg){
  const el=$('#toast');
  el.textContent=msg;
  el.classList.remove('hidden');
  clearTimeout(window._toast);
  window._toast=setTimeout(()=>el.classList.add('hidden'),1800);
}
function mapVolume(v){
  const min=-80,max=18;
  const pct=(v-min)/(max-min);
  return Math.max(0,Math.min(1,pct))*480;
}
function setRing(v){
  $('#ringActive').style.strokeDasharray=`${mapVolume(v)} 999`;
}
function renderTicks(){
  const group=$('#ringTicks');
  if(!group) return;
  group.innerHTML='';
  const ns='http://www.w3.org/2000/svg';
  for(let i=0;i<42;i++){
    const angle=(135 + i*(270/41))*Math.PI/180;
    const r1=111,r2=i%5===0?119:116;
    const x1=130+Math.cos(angle)*r1, y1=130+Math.sin(angle)*r1;
    const x2=130+Math.cos(angle)*r2, y2=130+Math.sin(angle)*r2;
    const line=document.createElementNS(ns,'line');
    line.setAttribute('x1',x1); line.setAttribute('y1',y1);
    line.setAttribute('x2',x2); line.setAttribute('y2',y2);
    group.appendChild(line);
  }
}
function renderSources(d){
  const host=$('#sourceGrid'); host.innerHTML='';
  d.sources.forEach(src=>{
    const b=document.createElement('button');
    b.className='source-btn'+(src.label===d.source?' active':'');
    b.innerHTML=`<div class="source-icon">${src.icon}</div><div class="source-label"></div>`;
    b.querySelector('.source-label').textContent=src.label;
    b.onclick=()=>{
      d.source=src.label;
      d.mediaTitle=src.label;
      d.mediaSub='Quelle aktiv';
      if(src.label==='Xbox') d.mediaThumb='🎮';
      else if(src.label==='Blu-ray') d.mediaThumb='◉';
      else d.mediaThumb='▭';
      render();
      toast(`Quelle: ${src.label}`);
    };
    host.appendChild(b);
  });
}
function renderModes(d){
  const host=$('#modeGrid'); host.innerHTML='';
  d.modes.forEach(m=>{
    const b=document.createElement('button');
    b.className='mode-btn'+(m===d.activeMode?' active':'');
    b.textContent=m;
    b.onclick=()=>{
      d.activeMode=m;
      if(m==='Dolby') d.modeText='Dolby Digital / 5.1';
      else if(m==='DTS') d.modeText='DTS-HD / 5.1';
      else d.modeText=m;
      render(); toast(`Klangmodus: ${m}`);
    };
    host.appendChild(b);
  });
}
function renderDeviceEntries(){
  $$('.device-entry').forEach(el=>{
    el.classList.toggle('active',el.dataset.device===current);
  });
}
function render(){
  const d=devices[current];
  $('#subtitle').textContent=`${d.name} · ${d.room}`;
  $('#powerText').textContent=d.power?'EIN':'AUS';
  $('#powerBtn').classList.toggle('off',!d.power);
  $('#sourceText').textContent=d.source;
  $('#modeText').textContent=d.modeText;
  $('#volumeBig').textContent=fmtDb(d.volume);
  $('#footerDb').textContent=fmtDb(d.volume);
  $('#footerVolume').value=d.volume;
  $('#audysseyTitle').textContent=d.audysseyTitle;
  $('#audysseyToggle').checked=d.audyssey;
  $('#dynEqToggle').checked=d.dynEq;
  $('#dynVolToggle').checked=d.dynVol;
  $('#subSlider').value=d.sub;
  $('#centerSlider').value=d.center;
  $('#subValue').textContent=`${d.sub} dB`;
  $('#centerValue').textContent=`${d.center} dB`;
  $('#layoutCount').textContent=d.layout;
  $('#mediaTitle').textContent=d.mediaTitle;
  $('#mediaSub').textContent=d.mediaSub;
  $('#mediaThumb').textContent=d.mediaThumb;
  setRing(d.volume);
  renderSources(d);
  renderModes(d);
  renderDeviceEntries();
}
function applyScene(scene){
  const d=devices[current];
  if(scene==='film'){
    d.source=d.sources.some(x=>x.label==='Blu-ray')?'Blu-ray':d.source;
    d.activeMode=d.modes.includes('Dolby')?'Dolby':d.activeMode;
    d.modeText='Dolby Digital / 5.1';
    d.dynEq=true; d.dynVol=false; d.sub=1; d.center=1;
    d.mediaTitle='Filmabend'; d.mediaSub='Szene aktiv'; d.mediaThumb='🎬';
  }
  if(scene==='music'){
    d.source=d.sources.find(x=>/Music|Media/.test(x.label))?.label||d.source;
    d.activeMode=d.modes.includes('Pure Direct')?'Pure Direct':(d.modes.includes('Music')?'Music':d.activeMode);
    d.modeText=d.activeMode;
    d.dynEq=false; d.dynVol=false; d.sub=-2; d.center=0;
    d.mediaTitle='Musik'; d.mediaSub='Szene aktiv'; d.mediaThumb='♫';
  }
  if(scene==='gaming'){
    d.source='Xbox';
    d.activeMode=d.modes.includes('Dolby')?'Dolby':d.activeMode;
    d.modeText='Dolby Digital / 5.1';
    d.dynEq=true; d.dynVol=false; d.sub=0; d.center=0;
    d.mediaTitle='Gaming'; d.mediaSub='Szene aktiv'; d.mediaThumb='🎮';
  }
  if(scene==='night'){
    d.dynEq=true; d.dynVol=true; d.volume=Math.min(d.volume,-45); d.sub=-4;
    d.mediaTitle='Abends'; d.mediaSub='Szene aktiv'; d.mediaThumb='☾';
  }
  render();
  toast('Szene aktiviert');
}
function openDrawer(){ $('#deviceDrawer').classList.add('open'); }
function closeDrawer(){ $('#deviceDrawer').classList.remove('open'); }

$('#subtitle').addEventListener('click',openDrawer);
$('#settingsBtn').addEventListener('click',openConnectionModal);
$('#sceneBtn').addEventListener('click',()=>toast('Szenen sind bereits direkt verfügbar'));
$$('[data-close]').forEach(el=>el.addEventListener('click',closeDrawer));
$$('.device-entry').forEach(el=>el.addEventListener('click',()=>{
  current=el.dataset.device; closeDrawer(); render(); toast(devices[current].name);
}));
$('#addDeviceBtn').addEventListener('click',()=>toast('Gerät hinzufügen kommt in V0.3'));

$('#powerBtn').addEventListener('click',()=>{
  const d=devices[current]; d.power=!d.power; render(); toast(d.power?'Receiver EIN':'Receiver AUS');
});
$('#volUp').addEventListener('click',()=>{
  const d=devices[current]; d.volume=Math.min(18,d.volume+.5); render();
});
$('#volDown').addEventListener('click',()=>{
  const d=devices[current]; d.volume=Math.max(-80,d.volume-.5); render();
});
$('#footerVolume').addEventListener('input',e=>{
  devices[current].volume=parseFloat(e.target.value); render();
});

$$('.scene-card').forEach(el=>el.addEventListener('click',()=>applyScene(el.dataset.scene)));

$('#audysseyToggle').addEventListener('change',e=>{devices[current].audyssey=e.target.checked; toast(`Audyssey ${e.target.checked?'an':'aus'}`)});
$('#dynEqToggle').addEventListener('change',e=>{devices[current].dynEq=e.target.checked; toast(`Dynamic EQ ${e.target.checked?'an':'aus'}`)});
$('#dynVolToggle').addEventListener('change',e=>{devices[current].dynVol=e.target.checked; toast(`Dynamic Volume ${e.target.checked?'an':'aus'}`)});
$('#subSlider').addEventListener('input',e=>{devices[current].sub=parseFloat(e.target.value); $('#subValue').textContent=`${devices[current].sub} dB`});
$('#centerSlider').addEventListener('input',e=>{devices[current].center=parseFloat(e.target.value); $('#centerValue').textContent=`${devices[current].center} dB`});

$('#transportPlay').addEventListener('click',e=>{
  e.currentTarget.textContent=e.currentTarget.textContent==='Ⅱ'?'▶':'Ⅱ';
  toast('Test-Player umgeschaltet');
});

renderTicks();
render();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}


// ---- v0.3: real Marantz connection preparation ----
const conn = {
  ip: localStorage.getItem('cinema-receiver-ip') || '',
  port: localStorage.getItem('cinema-receiver-port') || '80'
};

function openConnectionModal(){
  const d = devices[current];
  $('#connDeviceName').textContent = d.name;
  $('#connDeviceInfo').textContent = `${d.room} · Web Control / Netzwerk`;
  $('#receiverIp').value = conn.ip;
  $('#receiverPort').value = conn.port || '80';
  $('#connectionModal').classList.add('open');
}

function closeConnectionModal(){
  $('#connectionModal').classList.remove('open');
}

$$('[data-conn-close]').forEach(el => el.addEventListener('click', closeConnectionModal));

function normaliseIp(v){
  return String(v || '').trim().replace(/^https?:\/\//i,'').replace(/\/.*$/,'');
}

function saveConnection(){
  const ip = normaliseIp($('#receiverIp').value);
  const port = String($('#receiverPort').value || '80').trim();
  if(!ip){
    toast('Bitte IP-Adresse eingeben');
    return false;
  }
  conn.ip = ip;
  conn.port = port || '80';
  localStorage.setItem('cinema-receiver-ip', conn.ip);
  localStorage.setItem('cinema-receiver-port', conn.port);
  $('#statusText').textContent = 'IP gespeichert';
  toast(`Receiver gespeichert: ${conn.ip}`);
  return true;
}

function receiverBase(){
  const ip = normaliseIp($('#receiverIp').value || conn.ip);
  const port = String($('#receiverPort').value || conn.port || '80').trim();
  if(!ip) return null;
  return `http://${ip}${port && port !== '80' ? ':'+port : ''}`;
}

$('#saveConnectionBtn').addEventListener('click', saveConnection);

$('#openWebUiBtn').addEventListener('click', () => {
  if(!saveConnection()) return;
  const base = receiverBase();
  window.open(base, '_blank', 'noopener');
  $('#testBadge').textContent = 'Web UI geöffnet';
  $('#testBadge').className = 'test-badge ok';
  $('#probeResult').textContent = 'Wenn jetzt das Marantz-Webinterface erscheint, ist der Receiver im LAN korrekt erreichbar.';
});

async function sendNoCors(path, label){
  if(!saveConnection()) return;
  const url = receiverBase() + path;
  $('#testBadge').textContent = 'Sende …';
  $('#testBadge').className = 'test-badge warn';
  try{
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), 3500);

    // targetAddressSpace is ignored by browsers that don't support it.
    let options = {
      method:'GET',
      mode:'no-cors',
      cache:'no-store',
      signal:controller.signal
    };

    try{
      const req = new Request(url, {...options, targetAddressSpace:'local'});
      await fetch(req);
    }catch(inner){
      // Fallback for Safari versions that reject targetAddressSpace.
      await fetch(url, options);
    }
    clearTimeout(timer);
    $('#testBadge').textContent = 'Befehl gesendet';
    $('#testBadge').className = 'test-badge ok';
    $('#probeResult').textContent = `${label}: Der Browser hat den lokalen HTTP-Request abgesendet. Prüfe am Receiver, ob die Aktion ausgeführt wurde.`;
    toast(label);
  }catch(err){
    $('#testBadge').textContent = 'Browser blockiert';
    $('#testBadge').className = 'test-badge bad';
    $('#probeResult').textContent =
      'Der direkte Aufruf wurde vom Browser blockiert oder war nicht erreichbar. Das ist bei HTTPS → lokalem HTTP möglich. Öffne testweise zuerst das Webinterface über den Button oben.';
  }
}

$('#testVolUp').addEventListener('click', () =>
  sendNoCors('/goform/formiPhoneAppDirect.xml?MVUP', 'Lautstärke + gesendet'));
$('#testVolDown').addEventListener('click', () =>
  sendNoCors('/goform/formiPhoneAppDirect.xml?MVDOWN', 'Lautstärke − gesendet'));
$('#testPowerOn').addEventListener('click', () =>
  sendNoCors('/goform/formiPhoneAppPower.xml?1+PowerOn', 'Power ON gesendet'));
$('#testStandby').addEventListener('click', () =>
  sendNoCors('/goform/formiPhoneAppPower.xml?1+PowerStandby', 'Standby gesendet'));

$('#probeBtn').addEventListener('click', async () => {
  if(!saveConnection()) return;
  const base = receiverBase();
  const candidates = [
    base + '/goform/formMainZone_MainZoneXmlStatus.xml',
    base + '/goform/formMainZone_MainZoneXmlStatusLite.xml',
    base + '/'
  ];

  $('#testBadge').textContent = 'Prüfe …';
  $('#testBadge').className = 'test-badge warn';
  $('#probeResult').textContent = 'Teste lokalen HTTP-Zugriff …';

  for(const url of candidates){
    try{
      const controller = new AbortController();
      const timer=setTimeout(()=>controller.abort(),2500);
      let ok=false;

      try{
        const req = new Request(url, {
          method:'GET',
          mode:'cors',
          cache:'no-store',
          signal:controller.signal,
          targetAddressSpace:'local'
        });
        const res = await fetch(req);
        ok = !!res;
      }catch(e){
        // no-cors fallback can tell us that request dispatch is permitted,
        // even though the response is intentionally opaque.
        try{
          const res = await fetch(url,{
            method:'GET',
            mode:'no-cors',
            cache:'no-store',
            signal:controller.signal
          });
          ok = !!res;
        }catch(e2){}
      }
      clearTimeout(timer);

      if(ok){
        $('#testBadge').textContent = 'LAN erreichbar';
        $('#testBadge').className = 'test-badge ok';
        $('#probeResult').textContent =
          'Der Browser konnte einen lokalen Request starten. Teste jetzt „+ Lautstärke“. Wenn der Marantz reagiert, können wir die echte Steuerung direkt in die App integrieren.';
        return;
      }
    }catch(e){}
  }

  $('#testBadge').textContent = 'Nicht direkt erreichbar';
  $('#testBadge').className = 'test-badge bad';
  $('#probeResult').textContent =
    'Die GitHub-Pages-App konnte den lokalen HTTP-Endpunkt nicht direkt erreichen. Das Marantz-Webinterface kann trotzdem funktionieren, wenn du es separat öffnest.';
});

// Open connection setup directly when user selects the Marantz and no IP is stored.
$$('.device-entry').forEach(el=>{
  el.addEventListener('click',()=>{
    if(el.dataset.device==='marantz' && !conn.ip){
      setTimeout(openConnectionModal,240);
    }
  });
});
