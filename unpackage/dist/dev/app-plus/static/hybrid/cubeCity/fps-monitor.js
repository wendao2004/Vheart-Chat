// 独立FPS监控系统
(function() {
    var frameCount = 0;
    var lastTime = performance.now();
    var fps = 0;

    function update() {
        frameCount++;
        var now = performance.now();
        var delta = now - lastTime;

        if (delta >= 1000) {
            fps = Math.round(frameCount * 1000 / delta);
            frameCount = 0;
            lastTime = now;
        }

        requestAnimationFrame(update);
    }

    update();

    window.__getFPS = function() {
        return fps;
    };

    console.log('[FPS] 独立FPS监控已启动');
})();