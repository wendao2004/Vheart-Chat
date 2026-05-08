/**
 * H5页面与原生应用通信桥接工具
 * 用于在H5页面中调用原生音乐播放器
 */

class NativeBridge {
    constructor() {
        this.isReady = false;
        this.init();
    }

    init() {
        if (typeof uni !== 'undefined') {
            this.isReady = true;
            console.log('NativeBridge 初始化成功');
        } else {
            console.warn('uni 对象不存在,可能在非uni-app环境中');
        }
    }

    playAudio(audioPath, audioName) {
        if (!this.isReady) {
            console.error('NativeBridge 未初始化');
            return false;
        }

        const message = {
            action: 'playAudio',
            audioPath: audioPath,
            audioName: audioName || '未知歌曲',
            timestamp: Date.now()
        };

        console.log('发送播放音频消息:', message);

        try {
            if (typeof uni !== 'undefined' && uni.postMessage) {
                uni.postMessage({
                    data: message
                });
                return true;
            } else {
                console.error('uni.postMessage 不可用');
                return false;
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            return false;
        }
    }

    pauseAudio() {
        if (!this.isReady) {
            console.error('NativeBridge 未初始化');
            return false;
        }

        const message = {
            action: 'pauseAudio',
            timestamp: Date.now()
        };

        console.log('发送暂停音频消息:', message);

        try {
            if (typeof uni !== 'undefined' && uni.postMessage) {
                uni.postMessage({
                    data: message
                });
                return true;
            } else {
                console.error('uni.postMessage 不可用');
                return false;
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            return false;
        }
    }

    stopAudio() {
        if (!this.isReady) {
            console.error('NativeBridge 未初始化');
            return false;
        }

        const message = {
            action: 'stopAudio',
            timestamp: Date.now()
        };

        console.log('发送停止音频消息:', message);

        try {
            if (typeof uni !== 'undefined' && uni.postMessage) {
                uni.postMessage({
                    data: message
                });
                return true;
            } else {
                console.error('uni.postMessage 不可用');
                return false;
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            return false;
        }
    }
}

const nativeBridge = new NativeBridge();

if (typeof window !== 'undefined') {
    window.nativeBridge = nativeBridge;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = nativeBridge;
}

console.log('native-bridge.js 加载完成');
