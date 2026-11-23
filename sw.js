/* Service worker: برنامه را آفلاین قابل‌اجرا می‌کند (فایل‌ها یک‌بار ذخیره می‌شوند و بعد بدون اینترنت بالا می‌آیند). */
const VER = 'lc-1.2.0';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon-48.png', 'fonts/Vazirmatn-Regular.woff2', 'fonts/Vazirmatn-Bold.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// stale-while-revalidate: instant from cache, refreshed in the background (new version shows on next launch)
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(r, {ignoreSearch: true});
    const net = fetch(r).then(res => {
      if (res && res.ok) { const cp = res.clone(); caches.open(VER).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (r.mode === 'navigate') { const idx = await caches.match('index.html'); if (idx) return idx; }
    return new Response('offline', {status: 503, headers: {'Content-Type': 'text/plain'}});
  })());
});
