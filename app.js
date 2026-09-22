const APP_VERSION='0.6.0';
const APP_BUILD='2026-09-22';

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

const INPUT_OPTIONS=[
  {cmd:'SITV',label:'TV Audio',icon:'▭'},
  {cmd:'SIGAME',label:'Game',icon:'🎮'},
  {cmd:'SIBD',label:'Blu-ray',icon:'◉'},
  {cmd:'SIMPLAY',label:'Media Player',icon:'▤'},
  {cmd:'SISAT/CBL',label:'CBL/SAT',icon:'▦'},
  {cmd:'SIDVD',label:'DVD',icon:'◌'},
  {cmd:'SIAUX1',label:'AUX1',icon:'◆'},
  {cmd:'SIAUX2',label:'AUX2',icon:'◇'},
  {cmd:'SICD',label:'CD',icon:'◎'},
  {cmd:'SINET',label:'Online Music',icon:'⌁'},
  {cmd:'SISERVER',label:'Media Server',icon:'▥'},
  {cmd:'SIBT',label:'Bluetooth',icon:'ᛒ'},
  {cmd:'SIUSB/IPOD',label:'USB / iPod',icon:'⌗'},
  {cmd:'SITUNER',label:'Tuner',icon:'⌁'}
];

const DEFAULT_SOURCES=[
  {label:'TV',command:'SITV'},
  {label:'XBOX',command:'SIBD'},
  {label:'Blu-ray',command:'SIBD'},
  {label:'Media Player',command:'SIMPLAY'},
  {label:'AUX1',command:'SIAUX1'}
];

const MODE_OPTIONS=[
  {label:'Movie',cmd:'MSMOVIE'},
  {label:'Music',cmd:'MSMUSIC'},
  {label:'Game',cmd:'MSGAME'},
  {label:'Stereo',cmd:'MSSTEREO'},
  {label:'Auto',cmd:'MSAUTO'},
  {label:'Direct',cmd:'MSDIRECT'},
  {label:'Pure Direct',cmd:'MSPURE DIRECT'}
];

const state={
  power:false,
  volume:-73.5,
  muted:false,
  sourceLabel:'Online Music',
  sourceCommand:'SINET',
  activeMode:'Stereo',
  multEq:'AUDYSSEY',
  dynEq:true,
  refLevel:'0',
  dynVol:'OFF',
  sub:0,
  center:0,
  tone:false, bass:0, treble:0, dialogOn:false, dialog:0, subLevelOn:false, subLevel:0,
  cinemaEq:false, mdax:'OFF', drc:'OFF', audioDelay:0, pictureMode:'OFF', hdmiAudio:'AMP', videoSelect:'SOURCE',
  dimmer:'BRI', sleep:'OFF', eco:'OFF', autoStandby:'OFF',
  zone2Power:false, zone2Muted:false, zone2Volume:-40, zone2Source:'SINET', zone2Left:0, zone2Right:0, zone2Bass:0, zone2Treble:0,
  commandLog:[],
  layout:localStorage.getItem('cinema-layout')||'5.1',
  sources:loadJSON('cinema-source-slots',DEFAULT_SOURCES),
  sceneSources:loadJSON('cinema-scene-sources',{
    film:'SIBD',music:'SIMPLAY',gaming:'SIGAME'
  })
};

const legacyIp=localStorage.getItem('cinema-receiver-ip')||'';
const receiver={
  ip:localStorage.getItem('cinema-marantz-ip')||legacyIp,
  port:localStorage.getItem('cinema-marantz-port')||localStorage.getItem('cinema-receiver-port')||'80'
};

function loadJSON(key,fallback){
  try{
    const v=JSON.parse(localStorage.getItem(key)||'null');
    return v??structuredClone(fallback);
  }catch{return structuredClone(fallback)}
}
function saveJSON(key,v){localStorage.setItem(key,JSON.stringify(v))}
function migrateV060(){
  const key='cinema-source-slots';
  try{
    const saved=JSON.parse(localStorage.getItem(key)||'null');
    if(Array.isArray(saved)&&saved.length===5){
      const oldDefault=saved[0]?.command==='SITV'&&saved[1]?.label==='Xbox'&&saved[1]?.command==='SIGAME'&&saved[2]?.command==='SIBD';
      if(oldDefault){saved[1]={label:'XBOX',command:'SIBD'};saved[2]={label:'Game',command:'SIGAME'};localStorage.setItem(key,JSON.stringify(saved));state.sources=saved}
    }
  }catch{}
}
function logCommand(command){
  const t=new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  state.commandLog.unshift({t,command});state.commandLog=state.commandLog.slice(0,30);renderCommandLog();
}
function renderCommandLog(){
  const host=$('#commandLog');if(!host)return;
  if(!state.commandLog.length){host.innerHTML='<div class="log-empty">Noch kein Befehl in dieser Sitzung gesendet.</div>';return}
  host.innerHTML=state.commandLog.map(x=>`<div class="log-line"><span class="log-time">${x.t}</span><span class="log-cmd"></span></div>`).join('');
  [...host.querySelectorAll('.log-cmd')].forEach((el,i)=>el.textContent=state.commandLog[i].command);
}
function dbToPsLevel(db){
  const v=Math.max(-12,Math.min(12,Number(db)));const p=50+v;
  return Number.isInteger(p)?String(Math.round(p)):String(Math.floor(p))+'5';
}
function dbToToneLevel(db){return String(50+Math.max(-6,Math.min(6,Math.round(Number(db)))))}
function dbToZoneToneLevel(db){return String(50+Math.max(-10,Math.min(10,Math.round(Number(db)))))}
function dbToZoneVolume(db){
  const v=Math.max(-80,Math.min(18,Number(db))), p=80+v;
  return Number.isInteger(p)?String(Math.round(p)).padStart(2,'0'):String(Math.floor(p)).padStart(2,'0')+'5';
}
function sourceToZoneParam(cmd){
  const map={SITV:'TV',SIGAME:'GAME',SIBD:'BD',SIMPLAY:'MPLAY',SISAT_CBL:'SAT/CBL','SISAT/CBL':'SAT/CBL',SIDVD:'DVD',SIAUX1:'AUX1',SIAUX2:'AUX2',SICD:'CD',SINET:'NET',SIBT:'BT','SIUSB/IPOD':'USB/IPOD',SITUNER:'TUNER'};
  return map[cmd]||cmd.replace(/^SI/,'');
}
function sourceToVideoParam(cmd){
  const map={SITV:'TV',SIGAME:'GAME',SIBD:'BD',SIMPLAY:'MPLAY','SISAT/CBL':'SAT/CBL',SIDVD:'DVD',SIAUX1:'AUX1',SIAUX2:'AUX2',SICD:'CD'};
  return map[cmd]||null;
}
function toast(msg){
  const el=$('#toast'); el.textContent=msg; el.classList.remove('hidden');
  clearTimeout(window._toast); window._toast=setTimeout(()=>el.classList.add('hidden'),1900);
}
function fmtDb(v){return `${Number(v).toFixed(1)} dB`}
function baseUrl(){
  if(!receiver.ip)return null;
  return `http://${receiver.ip}${receiver.port&&receiver.port!=='80'?':'+receiver.port:''}`;
}
function commandUrl(command){
  const base=baseUrl(); if(!base)return null;
  return `${base}/goform/formiPhoneAppDirect.xml?${encodeURIComponent(command).replace(/%2F/g,'%2F')}`;
}
async function send(command,label='',quiet=false){
  logCommand(command);
  const url=commandUrl(command);
  if(!url){if(!quiet)toast('Receiver zuerst verbinden');openConnectionModal();return false}
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),3200);
    const options={method:'GET',mode:'no-cors',cache:'no-store',signal:controller.signal};
    try{
      const req=new Request(url,{...options,targetAddressSpace:'local'});
      await fetch(req);
    }catch{await fetch(url,options)}
    clearTimeout(timer);
    if(label&&!quiet)toast(label);
    return true;
  }catch{
    if(!quiet)toast('Receiver nicht erreichbar');
    return false;
  }
}
async function sendSequence(commands,label){
  for(const cmd of commands){
    if(!cmd)continue;
    if(!await send(cmd,'',true)){toast('Szene nicht vollständig gesendet');return false}
    await new Promise(r=>setTimeout(r,190));
  }
  toast(label); return true;
}
function dbToMvCommand(db){
  const v=Math.max(-79.5,Math.min(18,Number(db)));
  const p=80+v;
  return 'MV'+(Number.isInteger(p)?String(Math.round(p)).padStart(2,'0'):String(Math.floor(p)).padStart(2,'0')+'5');
}
function dbToChannelCommand(prefix,db){
  const v=Math.max(-12,Math.min(12,Number(db)));
  const p=50+v;
  return prefix+' '+(Number.isInteger(p)?String(Math.round(p)):String(Math.floor(p))+'5');
}
function mapVolume(v){return Math.max(0,Math.min(1,(v+80)/98))*480}
function setRing(v){$('#ringActive').style.strokeDasharray=`${mapVolume(v)} 999`}
function renderTicks(){
  const group=$('#ringTicks'); group.innerHTML='';
  const ns='http://www.w3.org/2000/svg';
  for(let i=0;i<42;i++){
    const a=(135+i*(270/41))*Math.PI/180,r1=111,r2=i%5===0?119:116;
    const line=document.createElementNS(ns,'line');
    line.setAttribute('x1',130+Math.cos(a)*r1);line.setAttribute('y1',130+Math.sin(a)*r1);
    line.setAttribute('x2',130+Math.cos(a)*r2);line.setAttribute('y2',130+Math.sin(a)*r2);
    group.appendChild(line);
  }
}
function inputMeta(command){return INPUT_OPTIONS.find(x=>x.cmd===command)||{label:command,icon:'◉'}}
function renderSources(){
  const host=$('#sourceGrid');host.innerHTML='';
  state.sources.forEach(src=>{
    const meta=inputMeta(src.command);
    const b=document.createElement('button');
    b.className='source-btn'+(src.command===state.sourceCommand?' active':'');
    b.innerHTML=`<div class="source-icon">${meta.icon}</div><div class="source-label"></div>`;
    b.querySelector('.source-label').textContent=src.label;
    b.onclick=async()=>{
      b.classList.add('pending');
      const ok=await send(src.command,`Quelle: ${src.label}`);
      b.classList.remove('pending');
      if(!ok)return;
      state.sourceCommand=src.command;state.sourceLabel=src.label;
      $('#mediaThumb').textContent=meta.icon;
      render();
    };
    host.appendChild(b);
  });
}
function renderModes(){
  const host=$('#modeGrid');host.innerHTML='';
  MODE_OPTIONS.forEach(m=>{
    const b=document.createElement('button');
    b.className='mode-btn'+(m.label===state.activeMode?' active':'');
    b.textContent=m.label;
    b.onclick=async()=>{
      b.classList.add('pending');
      const ok=await send(m.cmd,`Klangmodus: ${m.label}`);
      b.classList.remove('pending');
      if(!ok)return;
      state.activeMode=m.label;
      render();
    };
    host.appendChild(b);
  });
}
function audysseyBlocked(){return state.activeMode==='Direct'||state.activeMode==='Pure Direct'}
function updateAudioAvailability(){
  const blocked=audysseyBlocked();
  $$('[data-audyssey-control]').forEach(row=>row.classList.toggle('disabled-control',blocked));
  $('#multEqSelect').disabled=blocked;
  $('#dynEqToggle').disabled=blocked||state.multEq==='OFF';
  $('#dynVolSelect').disabled=blocked||state.multEq==='OFF';
  const refBlocked=blocked||state.multEq==='OFF'||!state.dynEq;
  $('[data-dyneq-control]').classList.toggle('disabled-control',refBlocked);
  $('#refLevelSelect').disabled=refBlocked;
  $('#audioAvailabilityText').textContent=blocked
    ? 'In Direct / Pure Direct sperrt der NR1605 Audyssey-Einstellungen.'
    : 'Dokumentierte NR1605-Steuerung';
}
function renderSpeakerLayout(){
  $('#layoutCount').textContent=state.layout;
  const rear=state.layout==='7.1';
  $('.sp-sbl').classList.toggle('hidden-speaker',!rear);
  $('.sp-sbr').classList.toggle('hidden-speaker',!rear);
}
function render(){
  $('#subtitle').textContent='Marantz NR1605 · Wohnzimmer';
  $('#statusText').textContent=receiver.ip?'Bereit':'Nicht verbunden';
  const pill=$('.status-pill');
  pill?.classList.toggle('live',!!receiver.ip);
  pill?.classList.toggle('demo',!receiver.ip);
  $('#powerText').textContent=state.power?'EIN':'STANDBY';
  $('#powerBtn').classList.toggle('off',!state.power);
  $('#sourceText').textContent=state.sourceLabel;
  $('#modeText').textContent=state.activeMode;
  $('#volumeBig').textContent=fmtDb(state.volume);
  $('#footerDb').textContent=fmtDb(state.volume);
  $('#footerVolume').value=state.volume;
  $('#muteBtn').classList.toggle('active',state.muted);
  $('#muteBtn').textContent=state.muted?'🔇':'🔊';
  $('#speakerMini').textContent=state.muted?'🔇':'🔊';
  $('#mediaTitle').textContent=state.sourceLabel;
  $('#mediaSub').textContent=receiver.ip?'Direktsteuerung bereit':'Receiver nicht verbunden';
  $('#mediaThumb').textContent=inputMeta(state.sourceCommand).icon;
  $('#multEqSelect').value=state.multEq;
  $('#dynEqToggle').checked=state.dynEq;
  $('#refLevelSelect').value=state.refLevel;
  $('#dynVolSelect').value=state.dynVol;
  $('#subSlider').value=state.sub;$('#subValue').textContent=`${state.sub} dB`;
  $('#centerSlider').value=state.center;$('#centerValue').textContent=`${state.center} dB`;
  $('#toneToggle').checked=state.tone;$('#bassSlider').value=state.bass;$('#bassValue').textContent=`${state.bass} dB`;$('#trebleSlider').value=state.treble;$('#trebleValue').textContent=`${state.treble} dB`;
  $('#dialogToggle').checked=state.dialogOn;$('#dialogSlider').value=state.dialog;$('#dialogValue').textContent=`${state.dialog} dB`;
  $('#subLevelToggle').checked=state.subLevelOn;$('#subLevelSlider').value=state.subLevel;$('#subLevelValue').textContent=`${state.subLevel} dB`;
  $('#cinemaEqToggle').checked=state.cinemaEq;$('#mdaxSelect').value=state.mdax;$('#drcSelect').value=state.drc;$('#delaySlider').value=state.audioDelay;$('#delayValue').textContent=`${state.audioDelay} ms`;
  $('#pictureModeSelect').value=state.pictureMode;$('#hdmiAudioSelect').value=state.hdmiAudio;$('#videoSelectSelect').value=state.videoSelect;
  $('#dimmerSelect').value=state.dimmer;$('#sleepSelect').value=state.sleep;$('#ecoSelect').value=state.eco;$('#standbySelect').value=state.autoStandby;
  $('#zone2PowerBtn').textContent=state.zone2Power?'Zone 2 EIN':'Zone 2 AUS';$('#zone2PowerBtn').classList.toggle('active',state.zone2Power);
  $('#zone2MuteBtn').classList.toggle('active',state.zone2Muted);$('#zone2MuteBtn').querySelector('strong').textContent=state.zone2Muted?'Ein':'Aus';
  $('#zone2VolumeSlider').value=state.zone2Volume;$('#zone2VolumeValue').textContent=fmtDb(state.zone2Volume);$('#zone2SourceSelect').value=state.zone2Source;
  $('#zone2LeftSlider').value=state.zone2Left;$('#zone2LeftValue').textContent=`${state.zone2Left} dB`;$('#zone2RightSlider').value=state.zone2Right;$('#zone2RightValue').textContent=`${state.zone2Right} dB`;
  $('#zone2Bass').value=state.zone2Bass;$('#zone2BassValue').textContent=`${state.zone2Bass} dB`;$('#zone2Treble').value=state.zone2Treble;$('#zone2TrebleValue').textContent=`${state.zone2Treble} dB`;
  setRing(state.volume);
  renderSources();renderModes();updateAudioAvailability();renderSpeakerLayout();
}
function scrollToId(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'})}

function sceneCommandSource(scene){return state.sceneSources[scene]||null}
function labelForCommand(cmd){
  return state.sources.find(s=>s.command===cmd)?.label||inputMeta(cmd).label;
}
async function runScene(scene){
  let cmds=[],title='';
  if(scene==='film'){
    const src=sceneCommandSource('film'); title='Filmabend';
    cmds=[src,'MSMOVIE','PSMULTEQ:AUDYSSEY','PSDYNEQ ON','PSDYNVOL OFF'];
    state.activeMode='Movie';state.multEq='AUDYSSEY';state.dynEq=true;state.dynVol='OFF';
    if(src){state.sourceCommand=src;state.sourceLabel=labelForCommand(src)}
  }else if(scene==='music'){
    const src=sceneCommandSource('music');title='Musik';
    cmds=[src,'MSSTEREO','PSMULTEQ:AUDYSSEY','PSDYNEQ ON','PSDYNVOL OFF'];
    state.activeMode='Stereo';state.multEq='AUDYSSEY';state.dynEq=true;state.dynVol='OFF';
    if(src){state.sourceCommand=src;state.sourceLabel=labelForCommand(src)}
  }else if(scene==='gaming'){
    const src=sceneCommandSource('gaming');title='Gaming';
    cmds=[src,'MSGAME','PSMULTEQ:AUDYSSEY','PSDYNEQ ON','PSDYNVOL OFF'];
    state.activeMode='Game';state.multEq='AUDYSSEY';state.dynEq=true;state.dynVol='OFF';
    if(src){state.sourceCommand=src;state.sourceLabel=labelForCommand(src)}
  }else if(scene==='night'){
    title='Abends';
    state.volume=Math.min(state.volume,-45);state.multEq='AUDYSSEY';state.dynEq=true;state.dynVol='MED';
    cmds=['PSMULTEQ:AUDYSSEY','PSDYNEQ ON','PSDYNVOL MED',dbToMvCommand(state.volume)];
  }
  render();
  await sendSequence(cmds,`${title} aktiviert`);
}

function openConnectionModal(){
  $('#receiverIp').value=receiver.ip;
  $('#receiverPort').value=receiver.port;
  $('#connDeviceName').textContent='Marantz NR1605';
  $('#connDeviceInfo').textContent='Web Control · lokales Netzwerk';
  $('#liveSummaryText').textContent=receiver.ip
    ? `Direkte Steuerung über ${receiver.ip}:${receiver.port}.`
    : 'Noch keine IP-Adresse gespeichert.';
  renderMappingSettings();
  $('#connectionModal').classList.add('open');
}
function closeConnectionModal(){$('#connectionModal').classList.remove('open')}
function normaliseIp(v){return String(v||'').trim().replace(/^https?:\/\//i,'').replace(/\/.*$/,'')}
function saveConnection(){
  const ip=normaliseIp($('#receiverIp').value),port=String($('#receiverPort').value||'80').trim();
  if(!ip){toast('Bitte IP-Adresse eingeben');return false}
  receiver.ip=ip;receiver.port=port||'80';
  localStorage.setItem('cinema-marantz-ip',receiver.ip);
  localStorage.setItem('cinema-marantz-port',receiver.port);
  localStorage.setItem('cinema-receiver-ip',receiver.ip);
  localStorage.setItem('cinema-receiver-port',receiver.port);
  saveMappingSettings();
  $('#liveSummaryText').textContent=`Direkte Steuerung über ${receiver.ip}:${receiver.port}.`;
  render();toast('Einstellungen gespeichert');return true;
}
function optionMarkup(selected){
  return INPUT_OPTIONS.map(x=>`<option value="${x.cmd}" ${x.cmd===selected?'selected':''}>${x.label}</option>`).join('');
}
function renderMappingSettings(){
  const rows=$('#sourceMappingRows');rows.innerHTML='';
  state.sources.forEach((src,i)=>{
    const row=document.createElement('div');row.className='mapping-row';
    row.innerHTML=`<input data-source-label="${i}" maxlength="20"><select data-source-command="${i}">${optionMarkup(src.command)}</select>`;
    row.querySelector('input').value=src.label;
    rows.appendChild(row);
  });
  ['film','music','gaming'].forEach(k=>{
    const el=$(`#${k}SourceSelect`);
    el.innerHTML=optionMarkup(state.sceneSources[k]);
    el.value=state.sceneSources[k];
  });
  $('#layoutSelect').value=state.layout;
}
function saveMappingSettings(){
  const next=state.sources.map((src,i)=>({
    label:document.querySelector(`[data-source-label="${i}"]`)?.value.trim()||src.label,
    command:document.querySelector(`[data-source-command="${i}"]`)?.value||src.command
  }));
  state.sources=next;saveJSON('cinema-source-slots',state.sources);
  state.sceneSources={
    film:$('#filmSourceSelect').value,
    music:$('#musicSourceSelect').value,
    gaming:$('#gamingSourceSelect').value
  };
  saveJSON('cinema-scene-sources',state.sceneSources);
  state.layout=$('#layoutSelect').value;
  localStorage.setItem('cinema-layout',state.layout);
}

$('#settingsBtn').onclick=openConnectionModal;
$('#navSetup').onclick=openConnectionModal;
$('#sceneBtn').onclick=()=>scrollToId('scenesSection');
$$('[data-conn-close]').forEach(el=>el.onclick=closeConnectionModal);
$$('[data-close]').forEach(el=>el.onclick=()=>$('#deviceDrawer').classList.remove('open'));
$('#subtitle').onclick=()=>$('#deviceDrawer').classList.add('open');

$$('[data-scroll]').forEach(btn=>btn.onclick=()=>{
  scrollToId(btn.dataset.scroll);
  $$('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
});
$$('.scene-card').forEach(btn=>btn.onclick=()=>runScene(btn.dataset.scene));

$('#saveConnectionBtn').onclick=saveConnection;
$('#openWebUiBtn').onclick=()=>{
  if(!saveConnection())return;
  window.open(baseUrl(),'_blank','noopener');
};
$('#probeBtn').onclick=()=>{
  $('#testBadge').textContent='Direktmodus';
  $('#testBadge').className='test-badge ok';
  $('#probeResult').textContent='Steuerbefehle werden per no-cors direkt an den Marantz gesendet. Status 0 im HAR ist dabei normal; Funktion wird am Receiver geprüft.';
};
$('#testVolUp').onclick=()=>send('MVUP','Lautstärke + ausgelöst');
$('#testVolDown').onclick=()=>send('MVDOWN','Lautstärke − ausgelöst');
$('#testPowerOn').onclick=()=>send('PWON','Power ON ausgelöst');
$('#testStandby').onclick=()=>send('PWSTANDBY','Standby ausgelöst');

$('#powerBtn').onclick=async()=>{
  const next=!state.power;
  if(!await send(next?'PWON':'PWSTANDBY',next?'Receiver EIN':'Receiver Standby'))return;
  state.power=next;render();
};
$('#volUp').onclick=async()=>{if(await send('MVUP','',true)){state.volume=Math.min(18,state.volume+.5);render()}};
$('#volDown').onclick=async()=>{if(await send('MVDOWN','',true)){state.volume=Math.max(-80,state.volume-.5);render()}};
$('#footerVolume').oninput=e=>{state.volume=parseFloat(e.target.value);render()};
$('#footerVolume').onchange=()=>send(dbToMvCommand(state.volume),`Lautstärke ${fmtDb(state.volume)}`);
$('#muteBtn').onclick=async()=>{
  const next=!state.muted;
  if(!await send(next?'MUON':'MUOFF',next?'Stumm':'Ton an'))return;
  state.muted=next;render();
};

$('#multEqSelect').onchange=async e=>{
  const v=e.target.value;
  if(!await send(`PSMULTEQ:${v}`,`MultEQ: ${e.target.options[e.target.selectedIndex].text}`)){render();return}
  state.multEq=v;
  if(v==='OFF'){state.dynEq=false;state.dynVol='OFF'}
  render();
};
$('#dynEqToggle').onchange=async e=>{
  const next=e.target.checked;
  if(!await send(next?'PSDYNEQ ON':'PSDYNEQ OFF',`Dynamic EQ ${next?'an':'aus'}`)){render();return}
  state.dynEq=next;render();
};
$('#refLevelSelect').onchange=async e=>{
  const v=e.target.value;
  if(await send(`PSREFLEV ${v}`,`Referenzpegel ${v} dB`))state.refLevel=v;
  render();
};
$('#dynVolSelect').onchange=async e=>{
  const v=e.target.value;
  if(await send(`PSDYNVOL ${v}`,`Dynamic Volume: ${e.target.options[e.target.selectedIndex].text}`))state.dynVol=v;
  render();
};
$('#subSlider').oninput=e=>{$('#subValue').textContent=`${e.target.value} dB`};
$('#subSlider').onchange=async e=>{
  const v=parseFloat(e.target.value);
  if(await send(dbToChannelCommand('CVSW',v),`Subwoofer ${v} dB`))state.sub=v;
  render();
};
$('#centerSlider').oninput=e=>{$('#centerValue').textContent=`${e.target.value} dB`};
$('#centerSlider').onchange=async e=>{
  const v=parseFloat(e.target.value);
  if(await send(dbToChannelCommand('CVC',v),`Center ${v} dB`))state.center=v;
  render();
};

function initExtendedUi(){
  const sleep=$('#sleepSelect');sleep.innerHTML='<option value="OFF">Aus</option>'+Array.from({length:12},(_,i)=>{const m=(i+1)*10;return `<option value="${String(m).padStart(3,'0')}">${m} Min.</option>`}).join('');
  const video=$('#videoSelectSelect');video.innerHTML='<option value="SOURCE">Aus</option>'+INPUT_OPTIONS.filter(x=>sourceToVideoParam(x.cmd)).map(x=>`<option value="${x.cmd}">${x.label}</option>`).join('');
  const z2=$('#zone2SourceSelect');z2.innerHTML=INPUT_OPTIONS.map(x=>`<option value="${x.cmd}">${x.label}</option>`).join('');
  z2.value=state.zone2Source;
  const sg=$('#smartGrid');sg.innerHTML='';
  [1,2,3,4].forEach(n=>{
    const card=document.createElement('div');card.className='smart-card';
    card.innerHTML=`<strong>Smart Select ${n}</strong><div class="smart-actions"><button data-recall="${n}">Abrufen</button><button class="memory" data-memory="${n}">Speichern</button></div>`;sg.appendChild(card);
  });
  $$('[data-recall]').forEach(b=>b.onclick=()=>send(`MSQUICK${b.dataset.recall}`,`Smart Select ${b.dataset.recall}`));
  $$('[data-memory]').forEach(b=>b.onclick=()=>{const n=b.dataset.memory;if(confirm(`Aktuellen Receiver-Zustand in Smart Select ${n} speichern?`))send(`MSQUICK${n} MEMORY`,`Smart Select ${n} gespeichert`)});
}

$('#toneToggle').onchange=async e=>{const n=e.target.checked;if(await send(`PSTONE CTRL ${n?'ON':'OFF'}`,`Tone Control ${n?'an':'aus'}`))state.tone=n;render()};
$('#bassSlider').oninput=e=>$('#bassValue').textContent=`${e.target.value} dB`;
$('#bassSlider').onchange=async e=>{const v=Number(e.target.value);if(await send(`PSBAS ${dbToToneLevel(v)}`,`Bass ${v} dB`))state.bass=v;render()};
$('#trebleSlider').oninput=e=>$('#trebleValue').textContent=`${e.target.value} dB`;
$('#trebleSlider').onchange=async e=>{const v=Number(e.target.value);if(await send(`PSTRE ${dbToToneLevel(v)}`,`Höhen ${v} dB`))state.treble=v;render()};
$('#dialogToggle').onchange=async e=>{const n=e.target.checked;if(await send(`PSDIL ${n?'ON':'OFF'}`,`Dialog Level ${n?'an':'aus'}`))state.dialogOn=n;render()};
$('#dialogSlider').oninput=e=>$('#dialogValue').textContent=`${e.target.value} dB`;
$('#dialogSlider').onchange=async e=>{const v=Number(e.target.value);if(await send(`PSDIL ${dbToPsLevel(v)}`,`Dialog ${v} dB`))state.dialog=v;render()};
$('#subLevelToggle').onchange=async e=>{const n=e.target.checked;if(await send(`PSSWL ${n?'ON':'OFF'}`,`Subwoofer Level ${n?'an':'aus'}`))state.subLevelOn=n;render()};
$('#subLevelSlider').oninput=e=>$('#subLevelValue').textContent=`${e.target.value} dB`;
$('#subLevelSlider').onchange=async e=>{const v=Number(e.target.value);if(await send(`PSSWL ${dbToPsLevel(v)}`,`Subwoofer Level ${v} dB`))state.subLevel=v;render()};
$('#cinemaEqToggle').onchange=async e=>{const n=e.target.checked;if(await send(`PSCINEMA EQ.${n?'ON':'OFF'}`,`Cinema EQ ${n?'an':'aus'}`))state.cinemaEq=n;render()};
$('#mdaxSelect').onchange=async e=>{const v=e.target.value;if(await send(`PSRSTR ${v}`,`M-DAX ${v}`))state.mdax=v;render()};
$('#drcSelect').onchange=async e=>{const v=e.target.value;if(await send(`PSDRC ${v}`,`DRC ${v}`))state.drc=v;render()};
$('#delaySlider').oninput=e=>$('#delayValue').textContent=`${e.target.value} ms`;
$('#delaySlider').onchange=async e=>{const v=Number(e.target.value);if(await send(`PSDELAY ${String(v).padStart(3,'0')}`,`Audio Delay ${v} ms`))state.audioDelay=v;render()};

$('#pictureModeSelect').onchange=async e=>{const v=e.target.value;if(await send(`PV${v}`,`Bildmodus ${e.target.options[e.target.selectedIndex].text}`))state.pictureMode=v;render()};
$('#hdmiAudioSelect').onchange=async e=>{const v=e.target.value;if(await send(`VSAUDIO ${v}`,`HDMI Audio ${v==='AMP'?'AVR':'TV'}`))state.hdmiAudio=v;render()};
$('#videoSelectSelect').onchange=async e=>{const v=e.target.value;const p=v==='SOURCE'?'SOURCE':sourceToVideoParam(v);if(p&&await send(`SV${p}`,`Video Select ${e.target.options[e.target.selectedIndex].text}`))state.videoSelect=v;render()};

$('#dimmerSelect').onchange=async e=>{const v=e.target.value;if(await send(`DIM ${v}`,`Display ${e.target.options[e.target.selectedIndex].text}`))state.dimmer=v;render()};
$('#sleepSelect').onchange=async e=>{const v=e.target.value;if(await send(v==='OFF'?'SLPOFF':`SLP${v}`,`Sleep ${e.target.options[e.target.selectedIndex].text}`))state.sleep=v;render()};
$('#ecoSelect').onchange=async e=>{const v=e.target.value;if(await send(`ECO${v}`,`ECO ${v}`))state.eco=v;render()};
$('#standbySelect').onchange=async e=>{const v=e.target.value;if(await send(`STBY${v}`,`Auto Standby ${e.target.options[e.target.selectedIndex].text}`))state.autoStandby=v;render()};

$('#zone2PowerBtn').onclick=async()=>{const n=!state.zone2Power;if(await send(n?'Z2ON':'Z2OFF',`Zone 2 ${n?'ein':'aus'}`))state.zone2Power=n;render()};
$('#zone2MuteBtn').onclick=async()=>{const n=!state.zone2Muted;if(await send(n?'Z2MUON':'Z2MUOFF',`Zone 2 Mute ${n?'an':'aus'}`))state.zone2Muted=n;render()};
$('#zone2SourceSelect').onchange=async e=>{const v=e.target.value;if(await send(`Z2${sourceToZoneParam(v)}`,`Zone 2 Quelle: ${e.target.options[e.target.selectedIndex].text}`))state.zone2Source=v;render()};
$('#zone2VolumeSlider').oninput=e=>$('#zone2VolumeValue').textContent=fmtDb(e.target.value);
$('#zone2VolumeSlider').onchange=async e=>{const v=Number(e.target.value);if(await send(`Z2${dbToZoneVolume(v)}`,`Zone 2 ${fmtDb(v)}`))state.zone2Volume=v;render()};
$('#zone2LeftSlider').oninput=e=>$('#zone2LeftValue').textContent=`${e.target.value} dB`;
$('#zone2LeftSlider').onchange=async e=>{const v=Number(e.target.value);if(await send(`Z2CVFL ${dbToPsLevel(v)}`,`Zone 2 links ${v} dB`))state.zone2Left=v;render()};
$('#zone2RightSlider').oninput=e=>$('#zone2RightValue').textContent=`${e.target.value} dB`;
$('#zone2RightSlider').onchange=async e=>{const v=Number(e.target.value);if(await send(`Z2CVFR ${dbToPsLevel(v)}`,`Zone 2 rechts ${v} dB`))state.zone2Right=v;render()};
$('#zone2Bass').oninput=e=>$('#zone2BassValue').textContent=`${e.target.value} dB`;
$('#zone2Bass').onchange=async e=>{const v=Number(e.target.value);if(await send(`Z2PSBAS ${dbToZoneToneLevel(v)}`,`Zone 2 Bass ${v} dB`))state.zone2Bass=v;render()};
$('#zone2Treble').oninput=e=>$('#zone2TrebleValue').textContent=`${e.target.value} dB`;
$('#zone2Treble').onchange=async e=>{const v=Number(e.target.value);if(await send(`Z2PSTRE ${dbToZoneToneLevel(v)}`,`Zone 2 Höhen ${v} dB`))state.zone2Treble=v;render()};

migrateV060();initExtendedUi();renderTicks();render();renderCommandLog();

if('serviceWorker'in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`).catch(()=>{}));
}
(function(){
  $('#versionText').textContent='v'+APP_VERSION;
  $('#versionBadge').title=`Cinema Control ${APP_VERSION} · Build ${APP_BUILD}`;
})();
