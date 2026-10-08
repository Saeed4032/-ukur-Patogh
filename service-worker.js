/* پاتوق تخته‌نرد — service worker v5
   - صفحه و کدهای برنامه (html/js/css): اول شبکه (با timeout)، اگه نشد از کش.
     این‌طوری نسخه‌ی جدید با اولین رفرش دیده می‌شه.
   - فونت، آیکون و supabase.js: اول کش، پشت‌صحنه تازه می‌شن. */
var VERSION = 'v8';
var CACHE = 'patogh-' + VERSION;
var CORE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/local-mode.js',
  './js/supabase-loader.js',
  './js/sync.js',
  './js/signup.js',
  './js/sounds.js',
  './js/bottom-nav.js',
  './js/scroll.js',
  './supabase.js',
  './fonts/Vazirmatn-Variable.woff2',
  './manifest.json',
  './icon-192.png',
  './apple-touch-icon.png'
];
var NET_TIMEOUT = 4000;

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(CORE.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf('patogh-') === 0 && k !== CACHE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isAppShell(url) {
  var p = url.pathname;
  return p.endsWith('/') || p.endsWith('/index.html');
}

function cacheKeyFor(req, url) {
  // همه‌ی ناوبری‌ها به صفحه‌ی اصلی، فقط با یک کلید کش می‌شن
  if (req.mode === 'navigate' && isAppShell(url)) return './index.html';
  url.search = '';
  return url.toString();
}

function store(key, res) {
  if (res && res.status === 200 && !res.redirected && res.type === 'basic') {
    var copy = res.clone();
    return caches.open(CACHE).then(function (c) { return c.put(key, copy); });
  }
}

function offline() {
  return new Response('Offline', { status: 503, statusText: 'Offline' });
}

function networkFirst(e, key) {
  var req = e.request;
  var netP = fetch(req);
  e.waitUntil(netP.then(function (res) { return store(key, res); }).catch(function () {}));
  var timer;
  var timeoutP = new Promise(function (_, rej) {
    timer = setTimeout(function () { rej(new Error('timeout')); }, NET_TIMEOUT);
  });
  return Promise.race([netP, timeoutP]).then(function (res) {
    clearTimeout(timer);
    if (res && res.ok) return res;
    throw new Error('bad status');
  }).catch(function () {
    clearTimeout(timer);
    return caches.match(key).then(function (hit) {
      if (hit) return hit;
      if (req.mode === 'navigate') return caches.match('./index.html');
      return netP;
    }).then(function (hit) { return hit || offline(); }, offline);
  });
}

function cacheFirst(e, key) {
  var netP = fetch(e.request);
  e.waitUntil(netP.then(function (res) { return store(key, res); }).catch(function () {}));
  return caches.match(key).then(function (hit) {
    return hit || netP.catch(offline);
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  var key = cacheKeyFor(req, new URL(req.url));
  var p = url.pathname;
  var isCode = req.mode === 'navigate' || /\.(html|js|css|json)$/.test(p);
  var isPinned = /\/supabase\.js$/.test(p);

  e.respondWith(isCode && !isPinned ? networkFirst(e, key) : cacheFirst(e, key));
});
