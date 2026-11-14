/* 智慧班級經營：離線用 Service Worker
 * 作用：把網頁、程式庫、字體、寵物圖存在這台裝置，沒有網路也能開、能加分、能批改作業。
 * 網頁有改版時，只要有網路，開啟就會自動拿到最新版。 */
const CORE_CACHE = 'pk-core-v1';      // 網頁本身（版本號改了就會重新下載）
const IMG_CACHE  = 'pk-img-v1';       // 寵物圖（很大，不跟著改版重下載）
const LIB_CACHE  = 'pk-lib-v1';       // Tailwind、Vue、字體
const CORE = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const LIBS = [
  'https://cdn.tailwindcss.com/3.4.17',
  'https://unpkg.com/vue@3.4.38/dist/vue.global.js',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700;900&display=swap',
  'https://fonts.googleapis.com/css2?family=Bpmf+Iansui&display=swap'
];
const LIB_HOSTS = ['cdn.tailwindcss.com', 'unpkg.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const IMGS = ["pk/1.png", "pk/10.png", "pk/104.png", "pk/105.png", "pk/11.png", "pk/113.png", "pk/12.png", "pk/123.png", "pk/129.png", "pk/13.png", "pk/130.png", "pk/132.png", "pk/133.png", "pk/134.png", "pk/135.png", "pk/136.png", "pk/14.png", "pk/143.png", "pk/147.png", "pk/148.png", "pk/149.png", "pk/15.png", "pk/150.png", "pk/151.png", "pk/152.png", "pk/153.png", "pk/154.png", "pk/155.png", "pk/156.png", "pk/157.png", "pk/158.png", "pk/159.png", "pk/16.png", "pk/160.png", "pk/17.png", "pk/172.png", "pk/173.png", "pk/174.png", "pk/175.png", "pk/176.png", "pk/179.png", "pk/18.png", "pk/180.png", "pk/181.png", "pk/196.png", "pk/197.png", "pk/2.png", "pk/212.png", "pk/242.png", "pk/246.png", "pk/247.png", "pk/248.png", "pk/249.png", "pk/25.png", "pk/250.png", "pk/252.png", "pk/253.png", "pk/254.png", "pk/255.png", "pk/256.png", "pk/257.png", "pk/258.png", "pk/259.png", "pk/26.png", "pk/260.png", "pk/270.png", "pk/271.png", "pk/272.png", "pk/280.png", "pk/281.png", "pk/282.png", "pk/3.png", "pk/333.png", "pk/334.png", "pk/35.png", "pk/36.png", "pk/37.png", "pk/371.png", "pk/372.png", "pk/373.png", "pk/374.png", "pk/375.png", "pk/376.png", "pk/38.png", "pk/382.png", "pk/383.png", "pk/384.png", "pk/387.png", "pk/388.png", "pk/389.png", "pk/39.png", "pk/390.png", "pk/391.png", "pk/392.png", "pk/393.png", "pk/394.png", "pk/395.png", "pk/4.png", "pk/40.png", "pk/43.png", "pk/44.png", "pk/440.png", "pk/443.png", "pk/444.png", "pk/445.png", "pk/446.png", "pk/447.png", "pk/448.png", "pk/45.png", "pk/462.png", "pk/468.png", "pk/470.png", "pk/471.png", "pk/479.png", "pk/483.png", "pk/484.png", "pk/487.png", "pk/491.png", "pk/493.png", "pk/495.png", "pk/496.png", "pk/497.png", "pk/498.png", "pk/499.png", "pk/5.png", "pk/500.png", "pk/501.png", "pk/502.png", "pk/503.png", "pk/52.png", "pk/53.png", "pk/54.png", "pk/55.png", "pk/570.png", "pk/571.png", "pk/582.png", "pk/583.png", "pk/584.png", "pk/6.png", "pk/610.png", "pk/611.png", "pk/612.png", "pk/63.png", "pk/633.png", "pk/634.png", "pk/635.png", "pk/64.png", "pk/643.png", "pk/644.png", "pk/65.png", "pk/650.png", "pk/651.png", "pk/652.png", "pk/653.png", "pk/654.png", "pk/655.png", "pk/656.png", "pk/657.png", "pk/658.png", "pk/66.png", "pk/67.png", "pk/68.png", "pk/7.png", "pk/700.png", "pk/704.png", "pk/705.png", "pk/706.png", "pk/722.png", "pk/723.png", "pk/724.png", "pk/725.png", "pk/726.png", "pk/727.png", "pk/728.png", "pk/729.png", "pk/730.png", "pk/778.png", "pk/782.png", "pk/783.png", "pk/784.png", "pk/79.png", "pk/8.png", "pk/80.png", "pk/802.png", "pk/81.png", "pk/810.png", "pk/811.png", "pk/812.png", "pk/813.png", "pk/814.png", "pk/815.png", "pk/816.png", "pk/817.png", "pk/818.png", "pk/82.png", "pk/821.png", "pk/822.png", "pk/823.png", "pk/885.png", "pk/886.png", "pk/887.png", "pk/9.png", "pk/906.png", "pk/907.png", "pk/908.png", "pk/909.png", "pk/910.png", "pk/911.png", "pk/912.png", "pk/913.png", "pk/914.png", "pk/92.png", "pk/93.png", "pk/935.png", "pk/937.png", "pk/94.png", "pk/957.png", "pk/958.png", "pk/959.png", "pk/996.png", "pk/997.png", "pk/998.png", "pk/shiny/1.png", "pk/shiny/10.png", "pk/shiny/104.png", "pk/shiny/105.png", "pk/shiny/11.png", "pk/shiny/113.png", "pk/shiny/12.png", "pk/shiny/123.png", "pk/shiny/129.png", "pk/shiny/13.png", "pk/shiny/130.png", "pk/shiny/132.png", "pk/shiny/133.png", "pk/shiny/134.png", "pk/shiny/135.png", "pk/shiny/136.png", "pk/shiny/14.png", "pk/shiny/143.png", "pk/shiny/147.png", "pk/shiny/148.png", "pk/shiny/149.png", "pk/shiny/15.png", "pk/shiny/150.png", "pk/shiny/151.png", "pk/shiny/152.png", "pk/shiny/153.png", "pk/shiny/154.png", "pk/shiny/155.png", "pk/shiny/156.png", "pk/shiny/157.png", "pk/shiny/158.png", "pk/shiny/159.png", "pk/shiny/16.png", "pk/shiny/160.png", "pk/shiny/17.png", "pk/shiny/172.png", "pk/shiny/173.png", "pk/shiny/174.png", "pk/shiny/175.png", "pk/shiny/176.png", "pk/shiny/179.png", "pk/shiny/18.png", "pk/shiny/180.png", "pk/shiny/181.png", "pk/shiny/196.png", "pk/shiny/197.png", "pk/shiny/2.png", "pk/shiny/212.png", "pk/shiny/242.png", "pk/shiny/246.png", "pk/shiny/247.png", "pk/shiny/248.png", "pk/shiny/249.png", "pk/shiny/25.png", "pk/shiny/250.png", "pk/shiny/252.png", "pk/shiny/253.png", "pk/shiny/254.png", "pk/shiny/255.png", "pk/shiny/256.png", "pk/shiny/257.png", "pk/shiny/258.png", "pk/shiny/259.png", "pk/shiny/26.png", "pk/shiny/260.png", "pk/shiny/270.png", "pk/shiny/271.png", "pk/shiny/272.png", "pk/shiny/280.png", "pk/shiny/281.png", "pk/shiny/282.png", "pk/shiny/3.png", "pk/shiny/333.png", "pk/shiny/334.png", "pk/shiny/35.png", "pk/shiny/36.png", "pk/shiny/37.png", "pk/shiny/371.png", "pk/shiny/372.png", "pk/shiny/373.png", "pk/shiny/374.png", "pk/shiny/375.png", "pk/shiny/376.png", "pk/shiny/38.png", "pk/shiny/382.png", "pk/shiny/383.png", "pk/shiny/384.png", "pk/shiny/387.png", "pk/shiny/388.png", "pk/shiny/389.png", "pk/shiny/39.png", "pk/shiny/390.png", "pk/shiny/391.png", "pk/shiny/392.png", "pk/shiny/393.png", "pk/shiny/394.png", "pk/shiny/395.png", "pk/shiny/4.png", "pk/shiny/40.png", "pk/shiny/43.png", "pk/shiny/44.png", "pk/shiny/440.png", "pk/shiny/443.png", "pk/shiny/444.png", "pk/shiny/445.png", "pk/shiny/446.png", "pk/shiny/447.png", "pk/shiny/448.png", "pk/shiny/45.png", "pk/shiny/462.png", "pk/shiny/468.png", "pk/shiny/470.png", "pk/shiny/471.png", "pk/shiny/479.png", "pk/shiny/483.png", "pk/shiny/484.png", "pk/shiny/487.png", "pk/shiny/491.png", "pk/shiny/493.png", "pk/shiny/495.png", "pk/shiny/496.png", "pk/shiny/497.png", "pk/shiny/498.png", "pk/shiny/499.png", "pk/shiny/5.png", "pk/shiny/500.png", "pk/shiny/501.png", "pk/shiny/502.png", "pk/shiny/503.png", "pk/shiny/52.png", "pk/shiny/53.png", "pk/shiny/54.png", "pk/shiny/55.png", "pk/shiny/570.png", "pk/shiny/571.png", "pk/shiny/582.png", "pk/shiny/583.png", "pk/shiny/584.png", "pk/shiny/6.png", "pk/shiny/610.png", "pk/shiny/611.png", "pk/shiny/612.png", "pk/shiny/63.png", "pk/shiny/633.png", "pk/shiny/634.png", "pk/shiny/635.png", "pk/shiny/64.png", "pk/shiny/643.png", "pk/shiny/644.png", "pk/shiny/65.png", "pk/shiny/650.png", "pk/shiny/651.png", "pk/shiny/652.png", "pk/shiny/653.png", "pk/shiny/654.png", "pk/shiny/655.png", "pk/shiny/656.png", "pk/shiny/657.png", "pk/shiny/658.png", "pk/shiny/66.png", "pk/shiny/67.png", "pk/shiny/68.png", "pk/shiny/7.png", "pk/shiny/700.png", "pk/shiny/704.png", "pk/shiny/705.png", "pk/shiny/706.png", "pk/shiny/722.png", "pk/shiny/723.png", "pk/shiny/724.png", "pk/shiny/725.png", "pk/shiny/726.png", "pk/shiny/727.png", "pk/shiny/728.png", "pk/shiny/729.png", "pk/shiny/730.png", "pk/shiny/778.png", "pk/shiny/782.png", "pk/shiny/783.png", "pk/shiny/784.png", "pk/shiny/79.png", "pk/shiny/8.png", "pk/shiny/80.png", "pk/shiny/802.png", "pk/shiny/81.png", "pk/shiny/810.png", "pk/shiny/811.png", "pk/shiny/812.png", "pk/shiny/813.png", "pk/shiny/814.png", "pk/shiny/815.png", "pk/shiny/816.png", "pk/shiny/817.png", "pk/shiny/818.png", "pk/shiny/82.png", "pk/shiny/821.png", "pk/shiny/822.png", "pk/shiny/823.png", "pk/shiny/885.png", "pk/shiny/886.png", "pk/shiny/887.png", "pk/shiny/9.png", "pk/shiny/906.png", "pk/shiny/907.png", "pk/shiny/908.png", "pk/shiny/909.png", "pk/shiny/910.png", "pk/shiny/911.png", "pk/shiny/912.png", "pk/shiny/913.png", "pk/shiny/914.png", "pk/shiny/92.png", "pk/shiny/93.png", "pk/shiny/935.png", "pk/shiny/937.png", "pk/shiny/94.png", "pk/shiny/957.png", "pk/shiny/958.png", "pk/shiny/959.png", "pk/shiny/996.png", "pk/shiny/997.png", "pk/shiny/998.png"];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const core = await caches.open(CORE_CACHE);
    await Promise.all(CORE.map(async u => { try { await core.put(u, await Promise.race([fetch(u, { cache: 'reload' }), timeout(8000)])); } catch (_) {} }));
    const lib = await caches.open(LIB_CACHE);
    await Promise.all(LIBS.map(async u => { try { await lib.put(u, await Promise.race([fetch(u, { mode: 'no-cors' }), timeout(8000)])); } catch (_) {} }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = [CORE_CACHE, IMG_CACHE, LIB_CACHE];
    for (const k of await caches.keys()) if (k.startsWith('pk-') && !keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }

async function networkFirst(req, cacheName, key) {
  const cache = await caches.open(cacheName);
  try {
    const res = await Promise.race([fetch(req), timeout(4000)]);
    if (res && res.ok) cache.put(key, res.clone());
    return res;
  } catch (_) {
    const hit = await cache.match(key, { ignoreSearch: true });
    if (hit) return hit;
    throw _;
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    const path = url.pathname;
    if (/\/pk\//.test(path)) { e.respondWith(cacheFirst(req, IMG_CACHE)); return; }
    if (req.mode === 'navigate' || path.endsWith('/') || path.endsWith('/index.html')) { e.respondWith(networkFirst(req, CORE_CACHE, 'index.html')); return; }
    if (/\/(config\.js|manifest\.webmanifest|icon-\d+\.png)$/.test(path)) { e.respondWith(networkFirst(req, CORE_CACHE, path.split('/').pop())); return; }
    return;
  }
  if (LIB_HOSTS.includes(url.hostname)) { e.respondWith(cacheFirst(req, LIB_CACHE)); }
  // 其他（Apps Script 雲端同步、YouTube…）一律照常連網，不經過這裡
});

// 網頁載入後，在背景慢慢把全部寵物圖存起來（一次 6 張，不影響使用）
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'warm') return;
  e.waitUntil((async () => {
    const cache = await caches.open(IMG_CACHE);
    const todo = [];
    for (const u of IMGS) if (!(await cache.match(u))) todo.push(u);
    let fail = 0;
    for (let i = 0; i < todo.length; i += 6) {
      await Promise.all(todo.slice(i, i + 6).map(async u => { try { const r = await fetch(u); if (r.ok) await cache.put(u, r); else fail++; } catch (_) { fail++; } }));
    }
    const all = await self.clients.matchAll();
    all.forEach(c => c.postMessage({ type: 'warmed', missing: fail, total: IMGS.length }));
  })());
});
