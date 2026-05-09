// 邪修级性能优化 - 预加载管理器（增强版）
// 核心原理：在游戏启动前预先加载所有资源到内存，实现秒开

class PreloadManager {
    constructor() {
        this.assets = {};
        this.queue = [];
        this.loadedCount = 0;
        this.totalCount = 0;
        this.progress = 0;
        this.callbacks = {
            progress: [],
            complete: [],
            error: []
        };
        this.failedModels = [];
        this.maxRetries = 3;
        
        this.init();
    }
    
    init() {
        this.modelUrls = {
            'tile-grass': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tile-grass.glb',
            'tile-ground': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tile-ground.glb',
            'house_level1': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house_level1.glb',
            'house_level2': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house_level2.glb',
            'house_level3': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house_level3.glb',
            'house2_level1': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house2_level1.glb',
            'house2_level2': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house2_level2.glb',
            'house2_level3': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/house2_level3.glb',
            'shop_level1': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/shop_level1.glb',
            'shop_level2': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/shop_level2.glb',
            'shop_level3': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/shop_level3.glb',
            'office_level1': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/office_level1.glb',
            'office_level2': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/office_level2.glb',
            'office_level3': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/office_level3.glb',
            'tree_level1': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tree_level1.glb',
            'tree_level2': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tree_level2.glb',
            'tree_level3': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/tree_level3.glb',
            'road-straight': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-straight.glb',
            'road-bend': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-bend.glb',
            'road-3way': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-3way.glb',
            'road-4way': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/road-4way.glb',
            'hospital': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/hospital.glb',
            'police': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/police.glb',
            'factory': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/factory.glb',
            'fire_station': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/fire_station.glb',
            'garbage_station': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/garbage_station.glb',
            'hero_park': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/hero_park.glb',
            'chemistry_level1': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/chemistry_level1.glb',
            'chemistry_level2': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/chemistry_level2.glb',
            'chemistry_level3': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/chemistry_level3.glb',
            'nuke_factory': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/nuke_factory.glb',
            'sun_power': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/sun_power.glb',
            'water_tower': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/water_tower.glb',
            'wind_power': 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/models/wind_power.glb'
        };
    }
    
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }
    
    async fetchWithRetry(url, key, retries = this.maxRetries) {
        for (let i = 0; i < retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);
                
                const response = await fetch(url, {
                    signal: controller.signal,
                    mode: 'cors'
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                return await response.arrayBuffer();
                
            } catch (error) {
                const isLastRetry = i === retries - 1;
                
                if (isLastRetry) {
                    console.error(`[PRELOAD] ${key} 加载失败（已重试${retries}次）:`, error);
                    throw error;
                }
                
                const delay = Math.pow(2, i) * 1000;
                console.warn(`[PRELOAD] ${key} 加载失败，${delay/1000}秒后重试 (${i+1}/${retries}):`, error.message);
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    async loadModel(key, retryCount = 0) {
        const url = this.modelUrls[key];
        
        try {
            if (window.idbCache) {
                const cached = await window.idbCache.get(key);
                if (cached) {
                    console.log(`[PRELOAD] ${key} 从IndexedDB加载`);
                    this.assets[key] = cached;
                    this.loadedCount++;
                    this.lastLoadedModel = key;
                    this.updateProgress();
                    return;
                }
            }
            
            const data = await this.fetchWithRetry(url, key);
            this.assets[key] = data;
            
            if (window.idbCache) {
                await window.idbCache.set(key, data);
            }
            
            this.loadedCount++;
            this.lastLoadedModel = key;
            console.log(`[PRELOAD] ${key} 加载成功 (${this.loadedCount}/${this.totalCount})`);
            this.updateProgress();
            
        } catch (error) {
            console.error(`[PRELOAD] ${key} 加载失败:`, error);
            this.failedModels.push(key);
            this.updateProgress();
        }
    }
    
    updateProgress() {
        this.progress = Math.round((this.loadedCount / this.totalCount) * 100);
        this.emit('progress', {
            progress: this.progress,
            loaded: this.loadedCount,
            total: this.totalCount,
            failed: this.failedModels.length
        });
        
        if (window.__setLoadingProgress) {
            window.__setLoadingProgress(this.progress, `已加载 ${this.loadedCount}/${this.totalCount}`);
        }
        if (window.__onModelLoaded && this.lastLoadedModel) {
            window.__onModelLoaded(this.lastLoadedModel);
            this.lastLoadedModel = null;
        }
    }
    
    async start() {
        const keys = Object.keys(this.modelUrls);
        this.totalCount = keys.length;
        this.loadedCount = 0;
        this.failedModels = [];
        
        console.log('[PRELOAD] 开始预加载', this.totalCount, '个模型');
        
        const smallModels = keys.filter(k => !['factory', 'chemistry_level3'].includes(k));
        const largeModels = ['factory', 'chemistry_level3'];
        
        await this.loadModelsInBatches(smallModels, 4);
        await this.loadModelsInBatches(largeModels, 1);
        
        if (this.failedModels.length > 0) {
            console.warn('[PRELOAD] 加载失败的模型:', this.failedModels);
        }
        
        console.log('[PRELOAD] 预加载完成，成功:', this.loadedCount, '/', this.totalCount);
        this.emit('complete', {
            total: this.totalCount,
            loaded: this.loadedCount,
            failed: this.failedModels
        });
        
        return this.assets;
    }
    
    async loadModelsInBatches(keys, batchSize) {
        for (let i = 0; i < keys.length; i += batchSize) {
            const batch = keys.slice(i, i + batchSize);
            await Promise.all(
                batch.map(key => this.loadModel(key))
            );
        }
    }
    
    getAsset(key) {
        return this.assets[key];
    }
    
    hasAsset(key) {
        return !!this.assets[key];
    }
    
    clear() {
        this.assets = {};
        this.loadedCount = 0;
        this.progress = 0;
        this.failedModels = [];
    }
}

window.PreloadManager = PreloadManager;
window.preloadManager = new PreloadManager();

console.log('[PRELOAD] 预加载管理器已初始化（增强版）');