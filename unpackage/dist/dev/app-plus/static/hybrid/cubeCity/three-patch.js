// 邪修级性能优化 - Three.js渲染器补丁

(function() {
    console.log('[PERF] 正在安装性能优化补丁...');

    var qualityLevel = 'high';
    var maxFrameSkip = 0;

    function detectDevice() {
        var memory = navigator.deviceMemory || 4;
        var cores = navigator.hardwareConcurrency || 4;

        if (memory < 3 || cores < 4) {
            qualityLevel = 'low';
            maxFrameSkip = 2;
        } else if (memory < 5 || cores < 6) {
            qualityLevel = 'medium';
            maxFrameSkip = 1;
        }
        console.log('[PERF] 设备检测完成:', qualityLevel);
    }

    detectDevice();

    function patchWebGLContext() {
        var originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, attrs) {
            if (type === 'webgl' || type === 'experimental-webgl') {
                attrs = attrs || {};
                attrs.antialias = false;
                attrs.powerPreference = 'high-performance';
                attrs.preserveDrawingBuffer = false;
            }
            return originalGetContext.call(this, type, attrs);
        };
        console.log('[PERF] WebGL上下文已优化');
    }

    function patchThreeRenderer() {
        if (!window.THREE || !window.THREE.WebGLRenderer) {
            console.log('[PERF] THREE.WebGLRenderer未找到');
            return;
        }

        var OriginalRenderer = window.THREE.WebGLRenderer;
        window.THREE.WebGLRenderer = function(params) {
            params = params || {};
            params.antialias = false;
            params.powerPreference = 'high-performance';

            var renderer = new OriginalRenderer(params);

            var originalRender = renderer.render.bind(renderer);
            var skipCount = 0;

            renderer.render = function(scene, camera, buffer) {
                if (skipCount < maxFrameSkip) {
                    skipCount++;
                    return;
                }
                skipCount = 0;
                originalRender(scene, camera, buffer);
            };

            renderer.setPixelRatio = renderer.setPixelRatio.bind(renderer);
            renderer.setPixelRatio = function(val) {
                var max = qualityLevel === 'low' ? 0.5 : (qualityLevel === 'medium' ? 1 : 1.5);
                THREE.WebGLRenderer.prototype.setPixelRatio.call(this, Math.min(val, max));
            };

            renderer.shadowMap.enabled = false;
            console.log('[PERF] Three.js渲染器已优化');
            return renderer;
        };
        window.THREE.WebGLRenderer.prototype = OriginalRenderer.prototype;
    }

    patchWebGLContext();

    if (window.THREE && window.THREE.WebGLRenderer) {
        patchThreeRenderer();
        console.log('[PERF] 所有补丁安装完成！');
    } else {
        window.addEventListener('load', function() {
            if (window.THREE && window.THREE.WebGLRenderer) {
                patchThreeRenderer();
                console.log('[PERF] 所有补丁安装完成！');
            }
        });
    }

    window.__setPerformanceMode = function(mode) {
        if (mode === 'ultra') {
            maxFrameSkip = 4;
        } else if (mode === 'low') {
            maxFrameSkip = 2;
        } else if (mode === 'medium') {
            maxFrameSkip = 1;
        } else if (mode === 'high') {
            maxFrameSkip = 0;
        }
        console.log('[PERF] 性能模式:', mode, '帧跳过:', maxFrameSkip);
    };

})();