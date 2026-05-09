// 邪修级性能监控面板
// 实时监控FPS、内存、渲染调用等关键指标

class PerformancePanel {
    constructor() {
        this.panel = null;
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createPanel();
        this.addToggleListener();
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'performance-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 15px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            min-width: 180px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: bold; color: #4CAF50;">性能监控</span>
                <button id="perf-close" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 14px;">✕</button>
            </div>
            <div style="display: grid; gap: 5px;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #aaa;">FPS:</span>
                    <span id="perf-fps" style="color: #4CAF50; font-weight: bold;">--</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #aaa;">帧时间:</span>
                    <span id="perf-frametime" style="color: #2196F3;">--ms</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #aaa;">内存:</span>
                    <span id="perf-memory" style="color: #FF9800;">--MB</span>
                </div>
            </div>
            <div id="perf-bar-container" style="margin-top: 10px; height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
                <div id="perf-bar" style="height: 100%; background: linear-gradient(90deg, #4CAF50, #FF9800, #F44336); width: 0%; transition: width 0.3s ease;"></div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;

        document.getElementById('perf-close').addEventListener('click', () => {
            this.hide();
        });

        this.hide();
    }

    updateDisplay() {
        if (!this.isVisible) return;

        const fps = window.performanceStats ? window.performanceStats.fps : 0;
        const frameTime = window.performanceStats ? window.performanceStats.frameTime : 0;

        document.getElementById('perf-fps').textContent = fps || '--';
        document.getElementById('perf-frametime').textContent = frameTime ? frameTime.toFixed(2) + 'ms' : '--ms';

        if (window.performance && window.performance.memory) {
            const memory = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
            document.getElementById('perf-memory').textContent = memory + 'MB';
        }

        const fpsColor = fps >= 30 ? '#4CAF50' : (fps >= 20 ? '#FF9800' : '#F44336');
        document.getElementById('perf-fps').style.color = fpsColor;

        const barWidth = Math.min((fps / 60) * 100, 100);
        document.getElementById('perf-bar').style.width = barWidth + '%';
    }

    show() {
        if (this.panel) {
            this.panel.style.display = 'block';
            this.isVisible = true;
            this.updateDisplay();
        }
    }

    hide() {
        if (this.panel) {
            this.panel.style.display = 'none';
            this.isVisible = false;
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    addToggleListener() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                this.toggle();
            }
        });
    }
}

window.PerformancePanel = PerformancePanel;
window.performancePanel = new PerformancePanel();

console.log('[PERF] 性能监控面板已初始化 (按P键切换显示)');