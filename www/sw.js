// 家务积分表 Service Worker — 离线缓存
const CACHE_NAME = 'housework-scoreboard-v1';
const FILES_TO_CACHE = [
    'index.html',
    'manifest.json',
    'icon-192.png',
    'icon-512.png'
];

// 安装：预缓存核心文件
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE).catch((err) => {
                // 单个文件失败不影响整体
                console.warn('SW: cache addAll partial failure', err);
            });
        })
    );
    // 立即激活，不等待旧 SW
    self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) => {
            return Promise.all(
                names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
            );
        })
    );
    self.clients.claim();
});

// 请求拦截：缓存优先，网络回退
self.addEventListener('fetch', (event) => {
    // 跳过非 GET 请求和 chrome-extension
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                // 只缓存成功的响应
                if (!response || response.status !== 200) return response;
                let clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clone);
                });
                return response;
            }).catch(() => {
                // 离线时返回缓存（如果有）
                return cached || new Response('离线状态，请连接网络后重试', { status: 503 });
            });
        })
    );
});
