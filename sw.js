const CACHE='cinema-control-v0.6.0';
const FILES=[
  './',
  './index.html',
  './styles.css?v=0.6.0',
  './app.js?v=0.6.0',
  './manifest.webmanifest?v=0.6.0',
  './icon.svg?v=0.6.0',
  './icon-192.png?v=0.6.0'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)));
});
