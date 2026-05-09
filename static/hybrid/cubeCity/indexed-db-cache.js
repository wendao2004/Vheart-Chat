// IndexedDB持久化缓存管理器
// 提供更可靠的本地存储方案

class IDBCacheManager {
    constructor(dbName = 'CubeCityCache', storeName = 'assets') {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
        this.ready = false;
        
        this.init();
    }
    
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = (event) => {
                console.error('[IDB] 打开数据库失败:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.ready = true;
                console.log('[IDB] 数据库打开成功');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                    store.createIndex('key', 'key', { unique: true });
                    console.log('[IDB] 创建存储表');
                }
            };
        });
    }
    
    async get(key) {
        if (!this.ready) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            
            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.data);
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async set(key, data, metadata = {}) {
        if (!this.ready) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const entry = {
                key: key,
                data: data,
                timestamp: Date.now(),
                ...metadata
            };
            
            const request = store.put(entry);
            
            request.onsuccess = () => {
                console.log('[IDB] 缓存成功:', key);
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error('[IDB] 缓存失败:', key, event.target.error);
                reject(event.target.error);
            };
        });
    }
    
    async delete(key) {
        if (!this.ready) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async has(key) {
        const data = await this.get(key);
        return data !== null;
    }
    
    async clear() {
        if (!this.ready) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    
    async keys() {
        if (!this.ready) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
}

window.IDBCacheManager = IDBCacheManager;
window.idbCache = new IDBCacheManager();

console.log('[IDB] IndexedDB缓存管理器已初始化');