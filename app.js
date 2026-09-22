
const devices = {
  denon: {
    id:'denon', name:'Denon AVR-X4000', room:'Wohnzimmer', power:true, volume:-38.5,
    source:'Xbox', modeText:'Dolby Digital / 5.1', activeMode:'Dolby', layout:'7.1',
    audysseyTitle:'Audyssey XT32', audyssey:true, dynEq:true, dynVol:false, sub:-2, center:0,
    mediaTitle:'Xbox Series X', mediaSub:'Wiedergabe aktiv', mediaThumb:'🎮', muted:false,
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
    mediaTitle:'Fernsehen', mediaSub:'TV-Ton aktiv', mediaThumb:'▭', muted:false,
    sources:[
      {label:'TV',icon:'▭',command:'SITV'},
      {label:'Apple TV',icon:'▣',command:null},
      {label:'Xbox',icon:'🎮',command:'SIGAME'},
      {label:'Blu-ray',icon:'◉',command:'SIBD'},
      {label:'Media Player',icon:'▤',command:'SIMPLAY'}
    ],
    modes:['Stereo','Dolby','DTS','Movie','Music']
  }
};

let current = 'denon';

const legacyIp = localStorage.getItem('cinema-receiver-ip') || '';
const receiverConfig = {
  marantz: {
    ip: localStorage.getItem('cinema-marantz-ip') || legacyIp,
    port: localStorage.getItem('cinema-marantz-port') || localStorage.getItem('cinema-receiver-port') || '80'
  },
  denon: {
    ip: localStorage.getItem('cinema-denon-ip') || '',
    port: localStorage.getItem('cinema-denon-port') || '80'
  }
};

function isLiveDevice(){
  return current === 'marantz' && !!receiverConfig.marantz.ip;
}

function currentReceiverBase(){
  const cfg = receiverConfig[current];
  if(!cfg || !cfg.ip) return null;
  return `http://${cfg.ip}${cfg.port && cfg.port !== '80' ? ':'+cfg.port : ''}`;
}

function commandUrl(command){
  const base = currentReceiverBase();
  if(!base) return null;
  return `${base}/goform/formiPhoneAppDirect.xml?${encodeURIComponent(command).replace(/%2F/g,'%2F')}`;
}

async function sendReceiverCommand(command, label='', quiet=false){
  if(current !== 'marantz'){
    if(!quiet) toast('Denon läuft noch im Demo-Modus');
    return false;
  }
  const url = commandUrl(command);
  if(!url){
    if(!quiet) toast('Marantz-IP fehlt');
    openConnectionModal();
    return false;
  }

  try{
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), 3200);
    const options = {method:'GET',mode:'no-cors',cache:'no-store',signal:controller.signal};
    try{
      const req = new Request(url,{...options,targetAddressSpace:'local'});
      await fetch(req);
    }catch(inner){
      await fetch(url,options);
    }
    clearTimeout(timer);
    if(!quiet && label) toast(label);
    return true;
  }catch(err){
    if(!quiet) toast('Receiver nicht erreichbar');
    return false;
  }
}

async function sendReceiverSequence(commands, label='Szene aktiviert'){
  if(current !== 'marantz'){
    toast('Szene im Demo-Modus');
    return false;
  }
  for(const cmd of commands){
    const ok = await sendReceiverCommand(cmd,'',true);
    if(!ok){
      toast('Szene konnte nicht vollständig gesendet werden');
      return false;
    }
    await new Promise(r=>setTimeout(r,180));
  }
  toast(label);
  return true;
}

function dbToMvCommand(db){
  const value = Math.max(-79.5,Math.min(18,Number(db)));
  const protocol = 80 + value;
  if(Number.isInteger(protocol)){
    return 'MV' + String(Math.round(protocol)).padStart(2,'0');
  }
  const whole = Math.floor(protocol);
  return 'MV' + String(whole).padStart(2,'0') + '5';
}

function dbToChannelCommand(prefix, db){
  const value = Math.max(-12,Math.min(12,Number(db)));
  const protocol = 50 + value;
  if(Number.isInteger(protocol)){
    return prefix + ' ' + String(Math.round(protocol));
  }
  const whole = Math.floor(protocol);
  return prefix + ' ' + String(whole) + '5';
}

function setLiveBadge(){
  const pill = document.querySelector('.status-pill');
  if(isLiveDevice()){
    $('#statusText').textContent='LIVE';
    pill?.classList.add('live');
    pill?.classList.remove('demo');
  }else{
    $('#statusText').textContent='Demo';
    pill?.classList.add('demo');
    pill?.classList.remove('live');
  }
}
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
    b.onclick=async ()=>{
      if(current==='marantz'){
        if(!src.command){
          toast(`${src.label}: Eingang noch nicht zugeordnet`);
          return;
        }
        b.classList.add('pending');
        const ok=await sendReceiverCommand(src.command,`Quelle: ${src.label}`);
        b.classList.remove('pending');
        if(!ok) return;
      }
      d.source=src.label;
      d.mediaTitle=src.label;
      d.mediaSub=current==='marantz'?'Receiver-Quelle aktiv':'Quelle aktiv';
      if(src.label==='Xbox') d.mediaThumb='🎮';
      else if(src.label==='Blu-ray') d.mediaThumb='◉';
      else d.mediaThumb='▭';
      render();
    };
    host.appendChild(b);
  });
}
function renderModes(d){
  const host=$('#modeGrid'); host.innerHTML='';
  const modeCommands={
    'Stereo':'MSSTEREO',
    'Dolby':'MSDOLBY DIGITAL',
    'DTS':'MSDTS SURROUND',
    'Direct':'MSDIRECT',
    'Pure Direct':'MSPURE DIRECT',
    'Movie':'MSMOVIE',
    'Music':'MSMUSIC'
  };
  d.modes.forEach(m=>{
    const b=document.createElement('button');
    b.className='mode-btn'+(m===d.activeMode?' active':'');
    b.textContent=m;
    b.onclick=async ()=>{
      if(current==='marantz'){
        const cmd=modeCommands[m];
        if(cmd){
          b.classList.add('pending');
          const ok=await sendReceiverCommand(cmd,`Klangmodus: ${m}`);
          b.classList.remove('pending');
          if(!ok) return;
        }
      }
      d.activeMode=m;
      if(m==='Dolby') d.modeText='Dolby Digital / 5.1';
      else if(m==='DTS') d.modeText='DTS / 5.1';
      else d.modeText=m;
      render();
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
  $('#muteBtn').classList.toggle('active',d.muted);
  $('#muteBtn').textContent=d.muted?'🔇':'🔊';
  $('#speakerMini').textContent=d.muted?'🔇':'🔊';
  setRing(d.volume);
  setLiveBadge();
  renderSources(d);
  renderModes(d);
  renderDeviceEntries();
}
async function applyScene(scene){
  const d=devices[current];
  let commands=[];

  if(scene==='film'){
    d.source=d.sources.some(x=>x.label==='Blu-ray')?'Blu-ray':d.source;
    d.activeMode=d.modes.includes('Dolby')?'Dolby':d.activeMode;
    d.modeText='Dolby Digital / 5.1';
    d.dynEq=true; d.dynVol=false; d.sub=1; d.center=1;
    d.mediaTitle='Filmabend'; d.mediaSub='Szene aktiv'; d.mediaThumb='🎬';
    commands=['SIBD','MSMOVIE','PSDYNEQ ON','PSDYNVOL OFF',dbToMvCommand(d.volume)];
  }
  if(scene==='music'){
    d.source=d.sources.find(x=>/Music|Media/.test(x.label))?.label||d.source;
    d.activeMode=d.modes.includes('Pure Direct')?'Pure Direct':(d.modes.includes('Music')?'Music':d.activeMode);
    d.modeText=d.activeMode;
    d.dynEq=false; d.dynVol=false; d.sub=-2; d.center=0;
    d.mediaTitle='Musik'; d.mediaSub='Szene aktiv'; d.mediaThumb='♫';
    commands=['SIMPLAY',d.activeMode==='Pure Direct'?'MSPURE DIRECT':'MSMUSIC','PSDYNVOL OFF'];
  }
  if(scene==='gaming'){
    d.source='Xbox';
    d.activeMode=d.modes.includes('Dolby')?'Dolby':d.activeMode;
    d.modeText='Dolby Digital / 5.1';
    d.dynEq=true; d.dynVol=false; d.sub=0; d.center=0;
    d.mediaTitle='Gaming'; d.mediaSub='Szene aktiv'; d.mediaThumb='🎮';
    commands=['SIGAME','MSGAME','PSDYNEQ ON','PSDYNVOL OFF'];
  }
  if(scene==='night'){
    d.dynEq=true; d.dynVol=true; d.volume=Math.min(d.volume,-45); d.sub=-4;
    d.mediaTitle='Abends'; d.mediaSub='Szene aktiv'; d.mediaThumb='☾';
    commands=['PSDYNEQ ON','PSDYNVOL LIT',dbToMvCommand(d.volume)];
  }

  render();
  if(current==='marantz') await sendReceiverSequence(commands);
  else toast('Szene aktiviert (Demo)');
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
$('#addDeviceBtn').addEventListener('click',()=>toast('Weitere Geräteprofile folgen'));

$('#powerBtn').addEventListener('click',async ()=>{
  const d=devices[current];
  const next=!d.power;
  if(current==='marantz'){
    const ok=await sendReceiverCommand(next?'PWON':'PWSTANDBY',next?'Receiver EIN':'Receiver Standby');
    if(!ok) return;
    if(next) await new Promise(r=>setTimeout(r,1000));
  }
  d.power=next;
  render();
  if(current!=='marantz') toast(d.power?'Receiver EIN (Demo)':'Receiver AUS (Demo)');
});
$('#volUp').addEventListener('click',async ()=>{
  const d=devices[current];
  if(current==='marantz'){
    const ok=await sendReceiverCommand('MVUP','',true);
    if(!ok){ toast('Lautstärke nicht gesendet'); return; }
  }
  d.volume=Math.min(18,d.volume+.5); render();
});
$('#volDown').addEventListener('click',async ()=>{
  const d=devices[current];
  if(current==='marantz'){
    const ok=await sendReceiverCommand('MVDOWN','',true);
    if(!ok){ toast('Lautstärke nicht gesendet'); return; }
  }
  d.volume=Math.max(-80,d.volume-.5); render();
});
$('#footerVolume').addEventListener('input',e=>{
  devices[current].volume=parseFloat(e.target.value); render();
});
$('#footerVolume').addEventListener('change',async e=>{
  const d=devices[current];
  d.volume=parseFloat(e.target.value);
  if(current==='marantz'){
    await sendReceiverCommand(dbToMvCommand(d.volume),`Lautstärke ${fmtDb(d.volume)}`);
  }
});

$$('.scene-card').forEach(el=>el.addEventListener('click',()=>applyScene(el.dataset.scene)));

$('#audysseyToggle').addEventListener('change',async e=>{
  const next=e.target.checked;
  if(current==='marantz'){
    const ok=await sendReceiverCommand(next?'PSMULTEQ:AUDYSSEY':'PSMULTEQ:OFF',`Audyssey ${next?'an':'aus'}`);
    if(!ok){ e.target.checked=!next; return; }
  }
  devices[current].audyssey=next;
  if(current!=='marantz') toast(`Audyssey ${next?'an':'aus'} (Demo)`);
});
$('#dynEqToggle').addEventListener('change',async e=>{
  const next=e.target.checked;
  if(current==='marantz'){
    const ok=await sendReceiverCommand(next?'PSDYNEQ ON':'PSDYNEQ OFF',`Dynamic EQ ${next?'an':'aus'}`);
    if(!ok){ e.target.checked=!next; return; }
  }
  devices[current].dynEq=next;
  if(current!=='marantz') toast(`Dynamic EQ ${next?'an':'aus'} (Demo)`);
});
$('#dynVolToggle').addEventListener('change',async e=>{
  const next=e.target.checked;
  if(current==='marantz'){
    const ok=await sendReceiverCommand(next?'PSDYNVOL LIT':'PSDYNVOL OFF',`Dynamic Volume ${next?'an (Light)':'aus'}`);
    if(!ok){ e.target.checked=!next; return; }
  }
  devices[current].dynVol=next;
  if(current!=='marantz') toast(`Dynamic Volume ${next?'an':'aus'} (Demo)`);
});
$('#subSlider').addEventListener('input',e=>{
  devices[current].sub=parseFloat(e.target.value);
  $('#subValue').textContent=`${devices[current].sub} dB`;
});
$('#subSlider').addEventListener('change',async e=>{
  if(current==='marantz') await sendReceiverCommand(dbToChannelCommand('CVSW',parseFloat(e.target.value)),`Subwoofer ${e.target.value} dB`);
});
$('#centerSlider').addEventListener('input',e=>{
  devices[current].center=parseFloat(e.target.value);
  $('#centerValue').textContent=`${devices[current].center} dB`;
});
$('#centerSlider').addEventListener('change',async e=>{
  if(current==='marantz') await sendReceiverCommand(dbToChannelCommand('CVC',parseFloat(e.target.value)),`Center ${e.target.value} dB`);
});

$('#muteBtn').addEventListener('click',async ()=>{
  const d=devices[current];
  const next=!d.muted;
  if(current==='marantz'){
    const ok=await sendReceiverCommand(next?'MUON':'MUOFF',next?'Stumm':'Ton an');
    if(!ok) return;
  }
  d.muted=next;
  render();
  if(current!=='marantz') toast(next?'Stumm (Demo)':'Ton an (Demo)');
});

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
  get ip(){ return receiverConfig[current]?.ip || ''; },
  set ip(v){ if(receiverConfig[current]) receiverConfig[current].ip=v; },
  get port(){ return receiverConfig[current]?.port || '80'; },
  set port(v){ if(receiverConfig[current]) receiverConfig[current].port=v; }
};

function openConnectionModal(){
  const d = devices[current];
  $('#connDeviceName').textContent = d.name;
  $('#connDeviceInfo').textContent = `${d.room} · Web Control / Netzwerk`;
  $('#receiverIp').value = conn.ip;
  $('#receiverPort').value = conn.port || '80';
  $('#liveSummaryText').textContent = conn.ip
    ? `${d.name} wird direkt über ${conn.ip}:${conn.port || '80'} gesteuert.`
    : 'Noch keine IP-Adresse gespeichert.';
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
  localStorage.setItem(`cinema-${current}-ip`, conn.ip);
  localStorage.setItem(`cinema-${current}-port`, conn.port);
  if(current==='marantz'){
    localStorage.setItem('cinema-receiver-ip', conn.ip); // v0.3 migration compatibility
    localStorage.setItem('cinema-receiver-port', conn.port);
  }
  $('#liveSummaryText').textContent = `${devices[current].name} wird direkt über ${conn.ip}:${conn.port} gesteuert.`;
  setLiveBadge();
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
