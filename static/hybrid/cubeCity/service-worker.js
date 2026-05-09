// Service Worker 离线缓存脚本 - 邪修核心（增强版）
// 首次加载后，所有模型会被缓存到本地，后续无需网络请求

const CACHE_NAME = 'cube-city-cache-v2';
const CACHE_ASSETS = [
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tile-grass.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tile-ground.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house_level1.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house_level2.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house_level3.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house2_level1.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house2_level2.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house2_level3.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/shop_level1.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/shop_level2.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/shop_level3.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/office_level1.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/office_level2.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/office_level3.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tree_level1.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tree_level2.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tree_level3.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-straight.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-bend.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-3way.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-4way.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/hospital.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/police.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/factory.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/fire_station.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/garbage_station.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/hero_park.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/chemistry_level1.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/chemistry_level2.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/chemistry_level3.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/nuke_factory.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/sun_power.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/water_tower.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/wind_power.glb',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/audio/song01.mp3',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/audio/song02.mp3'
];

self.addEventListener('install', (event) => {
    console.log('[SW] 安装Service Worker');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] 开始缓存资源');
            
            return Promise.all(
                CACHE_ASSETS.map(url => {
                    return fetch(url, { mode: 'cors' })
                        .then(response => {
                            if (response.ok) {
                                cache.put(url, response.clone());
                                console.log('[SW] 缓存成功:', url);
                            }
                        })
                        .catch(err => {
                            console.warn('[SW] 缓存失败（继续）:', url, err);
                        });
                })
            );
        }).then(() => {
            console.log('[SW] 资源缓存完成');
            return self.skipWaiting();
        }).catch(err => {
            console.error('[SW] 安装失败:', err);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] 激活Service Worker');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('[SW] 删除旧缓存:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = request.url;
    
    if (url.includes('.glb') || url.includes('.gltf') || 
        url.includes('.mp3') || url.includes('.ogg')) {
        
        event.respondWith(
            caches.match(request).then((response) => {
                if (response) {
                    console.log('[SW] 从缓存加载:', url);
                    return response;
                }
                
                console.log('[SW] 从网络加载:', url);
                
                return fetch(request, { mode: 'cors' })
                    .then((networkResponse) => {
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, networkResponse.clone());
                            console.log('[SW] 已缓存:', url);
                            return networkResponse;
                        });
                    })
                    .catch((err) => {
                        console.error('[SW] 网络请求失败:', url, err);
                        return new Response(null, { 
                            status: 503, 
                            statusText: 'Service Unavailable' 
                        });
                    });
            })
        );
    }
});

console.log('[SW] Service Worker 已加载（增强版）');