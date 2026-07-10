// sw.js — Ready or Not（都市防災カードバトル）Service Worker
// 軽量化②-a：画像はcache-first、HTML(ナビゲーション)はnetwork-firstで扱う。
// SW_VERSIONを更新すると旧キャッシュ（ron-images-*/ron-html-*のうち現行版以外）を
// activate時に自動で掃除する。
// 登録側（game_online.html）はCapacitor/file://環境では登録をスキップするため、
// このファイルはGitHub Pages等http(s)配信でのみ有効になる。

const SW_VERSION = 'v1';
const IMG_CACHE = `ron-images-${SW_VERSION}`;
const HTML_CACHE = `ron-html-${SW_VERSION}`;
const CURRENT_CACHES = [IMG_CACHE, HTML_CACHE];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('ron-') && !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isImageRequest(url) {
  return url.pathname.includes('/images/');
}

function isHtmlRequest(request, url) {
  return request.mode === 'navigate' || request.destination === 'document' || url.pathname.endsWith('.html');
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    return cached || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw e;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Firebase・QRCode.js等のCDN（別オリジン）はSWで扱わず素通しさせる
  if (url.origin !== self.location.origin) return;

  if (isImageRequest(url)) {
    event.respondWith(cacheFirst(request, IMG_CACHE));
    return;
  }
  if (isHtmlRequest(request, url)) {
    event.respondWith(networkFirst(request, HTML_CACHE));
    return;
  }
});
