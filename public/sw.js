// Service worker for the installable app. Game code is network-first, so a new deploy reaches players at once;
// the cached copy is used only when the network is down (then the hub offers offline training against bots).
// Three.js and fonts from CDNs are versioned and cached first. The API and the WebSocket never go through the cache.
const CACHE='relikvie-v1';
const SHELL=['/','/index.html','/client.js','/hub.js','/data.js','/sim.js','/models.js','/social.js','/audio.js','/settings.js','/manifest.webmanifest','/icon-192.png','/icon-512.png','/favicon-32.png'];

self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});

self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const url=new URL(r.url);
  if(url.origin===location.origin){
    if(url.pathname.startsWith('/api/')||url.pathname==='/ws'||url.pathname==='/healthz')return;
    // network first; a page with ?room=… or ?source=app falls back to the cached index
    e.respondWith(fetch(r).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(url.pathname==='/'?'/':r,copy))}return res})
      .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('/'):Response.error()))));
    return;
  }
  if(/^(unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy))}return res})));
  }
});
