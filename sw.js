/* Service worker de Hogaria Gestión: permite abrir la app sin internet.
   Para forzar que todos los celulares tomen una versión nueva, cambiá el número de CACHE. */
const CACHE = 'hogaria-v2';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];
const HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    for (const u of CORE) { try { await c.add(u); } catch (_) {} }
    for (const u of LIBS) { try { await c.put(u, await fetch(u, {mode: 'no-cors'})); } catch (_) {} }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

const guardar = (req, res) => {
  if (res && (res.ok || res.type === 'opaque')) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
  return res;
};

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    // Archivos propios: primero internet (así se actualiza), y si no hay, lo guardado
    e.respondWith(fetch(r).then(res => guardar(r, res)).catch(() => caches.match(r, {ignoreSearch: true}).then(m => m || caches.match('./index.html'))));
  } else if (HOSTS.includes(u.hostname)) {
    // Librerías y fuentes: primero lo guardado
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => guardar(r, res))));
  }
});
