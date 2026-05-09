<template>
	<view class="container">
		<web-view :src="webViewUrl" @load="onWebViewLoad" @message="handleMessage"></web-view>

		<view v-if="showLoading" class="loading-container">
			<view class="loading-box">
				<view class="loading-title">小小城市</view>
				<view class="loading-progress">
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: loadProgress + '%' }"></view>
					</view>
					<view class="progress-text">{{ loadProgress }}%</view>
				</view>
				<view class="loading-status">{{ loadStatus }}</view>
				<view class="loading-tips" v-if="loadingTips">{{ loadingTips }}</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const innerAudioContext = ref(null);
const isPlaying = ref(false);
const webViewUrl = ref('/static/hybrid/cubeCity/index.html');
const showLoading = ref(true);

const loadProgress = ref(0);
const loadStatus = ref('正在初始化...');
const loadingTips = ref('');

const cloudAudioUrls = [
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/audio/song01.mp3',
    'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/audio/song02.mp3'
];

const cloudModelUrls = {
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

const totalModels = Object.keys(cloudModelUrls).length;
let loadedModels = 0;
let modelsLoaded = {};
let checkLoadInterval = null;
let tipsInterval = null;

const loadingTipsList = [
    '正在加载建筑模型...',
    '正在加载道路模型...',
    '正在加载植被模型...',
    '正在加载设施模型...',
    '即将开始游戏...'
];

let tipsIndex = 0;

const onWebViewLoad = () => {
    console.log('cubeCity页面加载完成');
    loadStatus.value = '正在加载模型资源...';

    setTimeout(() => {
        sendModelUrlsToWebView();
        playBackgroundMusic();
        startLoadCheck();
        startTipsRotation();
    }, 1000);
};

const handleMessage = (e) => {
    console.log('收到H5消息:', JSON.stringify(e.detail));

    let data = null;
    if (e.detail && e.detail.data) {
        if (Array.isArray(e.detail.data) && e.detail.data.length > 0) {
            data = e.detail.data[0];
        } else if (typeof e.detail.data === 'object') {
            data = e.detail.data;
        }
    }

    console.log('解析后的数据:', JSON.stringify(data));

    if (data && data.action === 'modelLoaded') {
        handleModelLoaded(data.modelName);
    } else if (data && data.action === 'getModelUrls') {
        sendModelUrlsToWebView();
    } else if (data && data.action === 'gameReady') {
        hideLoading();
        console.log('游戏已准备就绪！');
    } else if (data && data.action === 'playBackgroundMusic') {
        console.log('收到播放背景音乐请求');
        playBackgroundMusic();
    } else if (data && data.action === 'pauseBackgroundMusic') {
        console.log('收到暂停背景音乐请求');
        pauseMusic();
    } else if (data && data.action === 'playAudio') {
        console.log('收到播放音频请求:', data.src);
        playAudio(data.src);
    } else if (data && data.action === 'pauseAudio') {
        console.log('收到暂停音频请求');
        pauseMusic();
    } else {
        console.log('未知消息类型:', data ? data.action : 'no action');
    }
};

const handleModelLoaded = (modelName) => {
    if (!modelsLoaded[modelName]) {
        modelsLoaded[modelName] = true;
        loadedModels++;
        loadProgress.value = Math.floor((loadedModels / totalModels) * 100);
        loadStatus.value = `已加载 ${loadedModels}/${totalModels} 个模型`;

        if (loadedModels >= totalModels) {
            loadStatus.value = '所有模型加载完成！';
            setTimeout(() => {
                hideLoading();
            }, 500);
        }
    }
};

const hideLoading = () => {
    showLoading.value = false;
    stopLoadCheck();
    if (tipsInterval) {
        clearInterval(tipsInterval);
        tipsInterval = null;
    }
};

const startLoadCheck = () => {
    checkLoadInterval = setInterval(() => {
        if (loadedModels < totalModels && loadProgress.value < 95) {
            loadProgress.value = Math.min(loadProgress.value + Math.random() * 5, 95);
        }
    }, 1000);
};

const stopLoadCheck = () => {
    if (checkLoadInterval) {
        clearInterval(checkLoadInterval);
        checkLoadInterval = null;
    }
};

const startTipsRotation = () => {
    tipsInterval = setInterval(() => {
        if (loadedModels >= totalModels) {
            loadingTips.value = '即将开始游戏...';
            if (tipsInterval) {
                clearInterval(tipsInterval);
                tipsInterval = null;
            }
        } else {
            tipsIndex = (tipsIndex + 1) % loadingTipsList.length;
            loadingTips.value = loadingTipsList[tipsIndex];
        }
    }, 2000);
};

const sendModelUrlsToWebView = () => {
    try {
        const message = {
            action: 'modelUrls',
            urls: cloudModelUrls,
            timestamp: Date.now()
        };

        uni.postMessage({
            data: message
        });
        console.log('已发送模型URL映射到H5页面');
    } catch (error) {
        console.error('发送模型URL失败:', error);
    }
};

const playBackgroundMusic = () => {
    console.log('playBackgroundMusic 调用');
    
    if (innerAudioContext.value) {
        try {
            innerAudioContext.value.destroy();
            console.log('已销毁旧音频上下文');
        } catch (e) {
            console.error('销毁旧音频上下文失败:', e);
        }
    }

    console.log('创建新音频上下文');
    innerAudioContext.value = uni.createInnerAudioContext();
    console.log('音频上下文创建成功:', !!innerAudioContext.value);
    
    innerAudioContext.value.src = cloudAudioUrls[0];
    console.log('音频URL:', cloudAudioUrls[0]);
    
    innerAudioContext.value.loop = true;
    innerAudioContext.value.volume = 0.5;
    console.log('音频参数设置完成: loop=true, volume=0.5');

    innerAudioContext.value.onCanplay(() => {
        console.log('音频准备就绪 - onCanplay 回调触发');
        innerAudioContext.value.play().then(() => {
            console.log('play() 调用成功');
        }).catch(err => {
            console.error('播放失败:', err);
            console.error('播放失败详情:', JSON.stringify(err));
        });
    });

    innerAudioContext.value.onPlay(() => {
        console.log('音频开始播放 - onPlay 回调触发');
        isPlaying.value = true;
        console.log('isPlaying 状态:', isPlaying.value);
    });

    innerAudioContext.value.onEnded(() => {
        console.log('音频播放结束');
    });

    innerAudioContext.value.onError((err) => {
        console.error('音频播放错误:', err);
        console.error('错误详情:', JSON.stringify(err));
        isPlaying.value = false;
    });

    innerAudioContext.value.onLoad(() => {
        console.log('音频加载完成 - onLoad 回调触发');
    });

    innerAudioContext.value.onWaiting(() => {
        console.log('音频等待中');
    });

    innerAudioContext.value.load();
    console.log('已调用 load()');
};

const playAudio = (src) => {
    console.log('playAudio 调用, src:', src);
    
    if (!src) {
        console.warn('playAudio: src为空');
        return;
    }

    let audioUrl = src;
    if (src.startsWith('/audio/')) {
        const filename = src.split('/').pop();
        console.log('playAudio: 相对路径转换, filename:', filename);
        if (filename === 'song01.mp3') {
            audioUrl = cloudAudioUrls[0];
        } else if (filename === 'song02.mp3') {
            audioUrl = cloudAudioUrls[1];
        } else {
            audioUrl = 'https://env-00jy622npuwq.normal.cloudstatic.cn/CubeCity/audio/' + filename;
        }
    }

    console.log('playAudio: 最终URL:', audioUrl);

    if (innerAudioContext.value) {
        try {
            innerAudioContext.value.destroy();
            console.log('playAudio: 已销毁旧音频上下文');
        } catch (e) {
            console.error('销毁旧音频上下文失败:', e);
        }
    }

    console.log('playAudio: 创建新音频上下文');
    innerAudioContext.value = uni.createInnerAudioContext();
    innerAudioContext.value.src = audioUrl;
    innerAudioContext.value.loop = true;
    innerAudioContext.value.volume = 0.5;

    innerAudioContext.value.onCanplay(() => {
        console.log('音频准备就绪:', audioUrl);
        innerAudioContext.value.play().catch(err => {
            console.error('播放失败:', err);
        });
    });

    innerAudioContext.value.onPlay(() => {
        console.log('音频开始播放');
        isPlaying.value = true;
    });

    innerAudioContext.value.onEnded(() => {
        console.log('音频播放结束，循环播放');
        if (innerAudioContext.value) {
            innerAudioContext.value.play().catch(err => {
                console.error('循环播放失败:', err);
            });
        }
    });

    innerAudioContext.value.onError((err) => {
        console.error('音频播放错误:', err);
        console.error('错误详情:', JSON.stringify(err));
        isPlaying.value = false;
    });

    innerAudioContext.value.onLoad(() => {
        console.log('音频加载完成');
    });

    innerAudioContext.value.load();
    console.log('playAudio: 已调用 load()');
};

const pauseMusic = () => {
    if (innerAudioContext.value && isPlaying.value) {
        innerAudioContext.value.pause();
        isPlaying.value = false;
    }
};

const resumeMusic = () => {
    if (innerAudioContext.value && !isPlaying.value) {
        innerAudioContext.value.play();
        isPlaying.value = true;
    }
};

const stopMusic = () => {
    if (innerAudioContext.value) {
        innerAudioContext.value.stop();
        isPlaying.value = false;
    }
};

onMounted(() => {
    console.log('cubeCity页面挂载');
    loadStatus.value = '正在初始化...';
});

onUnmounted(() => {
    console.log('cubeCity页面卸载');
    hideLoading();
    if (innerAudioContext.value) {
        try {
            innerAudioContext.value.destroy();
            innerAudioContext.value = null;
        } catch (e) {
            console.error('销毁音频上下文失败:', e);
        }
    }
});

defineExpose({
    pauseMusic,
    resumeMusic,
    stopMusic
});
</script>

<style>
.container {
    width: 100vw;
    height: 100vh;
    position: relative;
}

web-view {
    width: 100%;
    height: 100%;
}

.loading-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at center, #6990b8 0%, #3b5279 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.loading-box {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 40px 60px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
    max-width: 400px;
    width: 90%;
}

.loading-title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 30px;
}

.loading-progress {
    margin-bottom: 20px;
}

.progress-bar {
    width: 100%;
    height: 12px;
    background: #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 10px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #8BC34A);
    border-radius: 6px;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 18px;
    font-weight: bold;
    color: #4CAF50;
}

.loading-status {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
}

.loading-tips {
    font-size: 12px;
    color: #999;
    font-style: italic;
}
</style>