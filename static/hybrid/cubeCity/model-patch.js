(function() {
    console.log('[PATCH] model-patch.js 开始执行...');
    console.log('[PATCH] window.cloudModelUrls 初始化前:', typeof window.cloudModelUrls);

    window.cloudModelUrls = {
        'tile-grass.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tile-grass.glb',
        'tile-ground.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tile-ground.glb',
        'house_level1.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house_level1.glb',
        'house_level2.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house_level2.glb',
        'house_level3.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house_level3.glb',
        'house2_level1.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house2_level1.glb',
        'house2_level2.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house2_level2.glb',
        'house2_level3.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house2_level3.glb',
        'shop_level1.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/shop_level1.glb',
        'shop_level2.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/shop_level2.glb',
        'shop_level3.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/shop_level3.glb',
        'office_level1.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/office_level1.glb',
        'office_level2.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/office_level2.glb',
        'office_level3.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/office_level3.glb',
        'tree_level1.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tree_level1.glb',
        'tree_level2.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tree_level2.glb',
        'tree_level3.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tree_level3.glb',
        'road-straight.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-straight.glb',
        'road-bend.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-bend.glb',
        'road-3way.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-3way.glb',
        'road-4way.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-4way.glb',
        'hospital.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/hospital.glb',
        'police.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/police.glb',
        'factory.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/factory.glb',
        'factory_level1.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/factory.glb',
        'fire_station.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/fire_station.glb',
        'garbage_station.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/garbage_station.glb',
        'hero_park.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/hero_park.glb',
        'chemistry_level1.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/chemistry_level1.glb',
        'chemistry_level2.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/chemistry_level2.glb',
        'chemistry_level3.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/chemistry_level3.glb',
        'nuke_factory.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/nuke_factory.glb',
        'sun_power.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/sun_power.glb',
        'water_tower.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/water_tower.glb',
        'wind_power.glb': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/wind_power.glb'
    };

    function getFilename(url) {
        var str = typeof url === 'string' ? url : (url.url || url.href || '');
        return str.split('/').pop().split('?')[0].toLowerCase();
    }

    function replaceUrl(url) {
        var str = typeof url === 'string' ? url : (url.url || url.href || '');
        if (!str.includes('.glb') && !str.includes('.gltf')) return null;
        var filename = getFilename(str);
        console.log('[PATCH] replaceUrl 原始URL:', str, '提取的文件名:', filename);
        var cloudUrl = window.cloudModelUrls[filename];
        if (cloudUrl) {
            console.log('[PATCH] 替换:', filename, '->', cloudUrl.split('/').pop());
            return cloudUrl;
        }
        console.log('[PATCH] 未找到映射:', filename);
        return null;
    }

    window.__replaceModelUrl = replaceUrl;

    var originalFetch = window.fetch;
    window.fetch = function(url, options) {
        var newUrl = replaceUrl(url);
        if (newUrl) {
            console.log('[FETCH] 拦截到模型请求:', url, '->', newUrl);
            return originalFetch(newUrl, options).catch(function(e) {
                console.error('[FETCH] 模型加载失败:', newUrl, e);
                throw e;
            });
        }
        return originalFetch(url, options);
    };

    var originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        var newUrl = replaceUrl(url);
        if (newUrl) {
            console.log('[XHR] 拦截到模型请求:', url, '->', newUrl);
            return originalOpen.call(this, method, newUrl, async, user, password);
        }
        return originalOpen.call(this, method, url, async, user, password);
    };

    var originalImport = window.importScripts;
    window.importScripts = function(url) {
        var newUrl = replaceUrl(url);
        if (newUrl) {
            console.log('[IMPORT] 拦截到脚本请求:', url, '->', newUrl);
            return originalImport.call(this, newUrl);
        }
        return originalImport.apply(this, arguments);
    };

    function patchThreeGLTFLoader() {
        if (!window.THREE || !window.THREE.GLTFLoader) {
            setTimeout(patchThreeGLTFLoader, 100);
            return;
        }

        var GLTFLoader = window.THREE.GLTFLoader;
        var originalLoad = GLTFLoader.prototype.load;

        GLTFLoader.prototype.load = function(url, onLoad, onProgress, onError) {
            var newUrl = replaceUrl(url);
            if (newUrl) {
                console.log('[GLTFLoader] 拦截到模型请求:', url, '->', newUrl);
                return originalLoad.call(this, newUrl, onLoad, onProgress, onError);
            }
            return originalLoad.apply(this, arguments);
        };

        console.log('[PATCH] THREE.GLTFLoader 已修补');
    }

    function patchThreeFileLoader() {
        if (!window.THREE || !window.THREE.FileLoader) {
            setTimeout(patchThreeFileLoader, 100);
            return;
        }

        var FileLoader = window.THREE.FileLoader;
        var originalLoad = FileLoader.prototype.load;

        FileLoader.prototype.load = function(url, onLoad, onProgress, onError) {
            var newUrl = replaceUrl(url);
            if (newUrl) {
                console.log('[FileLoader] 拦截到文件请求:', url, '->', newUrl);
                return originalLoad.call(this, newUrl, onLoad, onProgress, onError);
            }
            return originalLoad.apply(this, arguments);
        };

        console.log('[PATCH] THREE.FileLoader 已修补');
    }

    function patchThreeLoaderUtils() {
        if (!window.THREE || !window.THREE.LoaderUtils) {
            setTimeout(patchThreeLoaderUtils, 100);
            return;
        }

        var LoaderUtils = window.THREE.LoaderUtils;
        if (LoaderUtils.load) {
            var originalLoad = LoaderUtils.load;
            LoaderUtils.load = function(url, callback) {
                var newUrl = replaceUrl(url);
                if (newUrl) {
                    console.log('[LoaderUtils] 拦截到请求:', url, '->', newUrl);
                    return originalLoad.call(this, newUrl, callback);
                }
                return originalLoad.apply(this, arguments);
            };
            console.log('[PATCH] THREE.LoaderUtils.load 已修补');
        }
        if (LoaderUtils.resolveURL) {
            var originalResolveURL = LoaderUtils.resolveURL;
            LoaderUtils.resolveURL = function(url, path) {
                var newUrl = replaceUrl(url);
                if (newUrl) {
                    console.log('[LoaderUtils] 拦截到URL解析:', url, '->', newUrl);
                    return newUrl;
                }
                return originalResolveURL.apply(this, arguments);
            };
            console.log('[PATCH] THREE.LoaderUtils.resolveURL 已修补');
        }
    }

    patchThreeGLTFLoader();
    patchThreeFileLoader();
    patchThreeLoaderUtils();

    console.log('[PATCH] 模型URL补丁已安装，共', Object.keys(window.cloudModelUrls).length, '个映射');
    window.__modelPatchReady = true;
    console.log('[PATCH] model-patch.js 初始化完成');
})();