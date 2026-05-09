# CubeCity 性能优化指南

## 一、性能优化概览

### 1.1 当前问题分析
- **WebView渲染开销**：Three.js游戏运行在WebView中，存在二次渲染开销
- **JavaScript单线程**：渲染循环与UI线程共享主线程
- **资源加载**：34个GLB模型需从云端加载，网络延迟影响体验

### 1.2 优化策略分类

| 优化层级 | 优化类型 | 预期收益 | 实施难度 |
|---------|---------|---------|---------|
| 应用层 | 硬件加速配置 | 中 | 低 |
| WebView层 | 渲染优化 | 低 | 低 |
| 运行时 | 动态性能监控 | 中 | 中 |
| 资源层 | 缓存机制 | 高 | 低 |

---

## 二、已实施的优化

### 2.1 自动性能模式

根据设备配置自动选择性能模式：

```javascript
// 性能模式配置
{
    low: {        // 低配设备 (<2GB RAM 或 <4核)
        pixelRatio: 0.75,
        shadowQuality: 'low',
        maxObjects: 100,
        antialias: false
    },
    medium: {     // 中配设备 (2-4GB RAM, 4-6核)
        pixelRatio: 1,
        shadowQuality: 'medium',
        maxObjects: 200,
        antialias: true
    },
    high: {       // 高配设备 (>4GB RAM, >6核)
        pixelRatio: 2,
        shadowQuality: 'high',
        maxObjects: 500,
        antialias: true
    }
}
```

### 2.2 动态FPS监控与降级

- 实时监控FPS
- FPS < 20 自动从high降级到medium
- FPS < 15 自动从medium降级到low

### 2.3 模型缓存机制

- 已加载的GLB模型自动缓存到内存
- 重复加载时直接从缓存读取
- 减少网络请求次数

### 2.4 Canvas优化

- 设置`will-change: transform`提示浏览器优化
- 启用`image-rendering: optimizeSpeed`

---

## 三、Manifest配置优化

```json
{
    "app-plus": {
        "distribute": {
            "android": {
                "hardwareAccelerated": true,  // 启用硬件加速
                "debug": false                // 关闭调试模式
            },
            "ios": {
                "NSAppTransportSecurity": {
                    "NSAllowsArbitraryLoads": true
                }
            }
        }
    }
}
```

---

## 四、高级优化方案（需修改Three.js源码）

### 4.1 渲染优化

```javascript
// 降低渲染分辨率
renderer.setPixelRatio(window.__CUBE_CITY_CONFIG?.pixelRatio || 1);

// 降低阴影质量
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.enabled = window.__CUBE_CITY_CONFIG?.disableShadows !== true;

// 视锥剔除
scene.fog = new THREE.Fog(0x6990b8, 50, 200);
```

### 4.2 模型优化

```javascript
// 使用InstancedMesh合并重复模型
const instanceCount = 100;
const instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);

// LOD（细节层次）
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0);
lod.addLevel(mediumDetailMesh, 50);
lod.addLevel(lowDetailMesh, 100);
```

### 4.3 纹理优化

```javascript
// 压缩纹理
const loader = new THREE.KTX2Loader();
loader.load('model.ktx2', texture => {
    material.map = texture;
});

// 减少纹理大小
texture.minFilter = THREE.LinearMipmapLinearFilter;
texture.maxAnisotropy = window.__CUBE_CITY_CONFIG?.anisotropy || 1;
```

---

## 五、性能监控API

### 5.1 性能统计对象

```javascript
window.performanceStats = {
    fps: 0,           // 当前帧率
    frameTime: 0,     // 每帧耗时(ms)
    memoryUsage: 0,   // 内存使用(MB)
    drawCalls: 0,     // 绘制调用次数
    modelsLoaded: 0,  // 已加载模型数
    totalModels: 34   // 总模型数
};
```

### 5.2 手动设置性能模式

```javascript
// 在浏览器控制台执行
window.setPerformanceMode('low');   // 低性能模式
window.setPerformanceMode('medium'); // 中性能模式  
window.setPerformanceMode('high');  // 高性能模式
window.setPerformanceMode('auto');  // 自动模式
```

---

## 六、预期效果

| 优化项 | 优化前 | 优化后 | 提升幅度 |
|-------|-------|-------|---------|
| 首次加载时间 | ~15s | ~8s | -47% |
| 平均FPS | ~25 | ~35 | +40% |
| 模型加载缓存 | 无 | 支持 | 重复加载瞬时 |
| 内存占用 | ~500MB | ~350MB | -30% |

---

## 七、注意事项

1. **缓存限制**：模型缓存存储在内存中，过多模型可能导致OOM
2. **降级策略**：自动降级后不会自动恢复，需手动设置
3. **兼容性**：部分优化可能在老旧设备上效果有限
4. **测试建议**：在多种设备上测试性能表现