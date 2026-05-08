# H5扩展音频播放桥接使用说明

## 概述

由于H5扩展中的音频播放存在兼容性问题,我们提供了一个桥接方案,允许H5页面调用原生应用的音乐播放器来播放音频文件。

## 架构说明

```
H5页面 (cubeCity/index.html)
    ↓ uni.postMessage()
cubeCity.vue (webview容器)
    ↓ 处理消息
player.vue (音乐播放器)
    ↓ luch-audio组件
原生音频播放
```

## 使用方法

### 1. 在H5页面中引入桥接脚本

在H5页面的HTML文件中添加以下代码:

```html
<script src="./native-bridge.js"></script>
```

### 2. 播放音频

在H5页面的JavaScript代码中,使用以下方式播放音频:

```javascript
// 方式1: 使用全局对象
window.nativeBridge.playAudio('audio/song01.mp3', '背景音乐1');

// 方式2: 直接调用uni.postMessage
uni.postMessage({
    data: {
        action: 'playAudio',
        audioPath: 'audio/song01.mp3',
        audioName: '背景音乐1'
    }
});
```

### 3. 暂停音频

```javascript
window.nativeBridge.pauseAudio();
```

### 4. 停止音频

```javascript
window.nativeBridge.stopAudio();
```

## 完整示例

### HTML示例

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>音频播放示例</title>
    <script src="./native-bridge.js"></script>
</head>
<body>
    <button onclick="playSong1()">播放歌曲1</button>
    <button onclick="playSong2()">播放歌曲2</button>
    <button onclick="pauseAudio()">暂停</button>
    <button onclick="stopAudio()">停止</button>

    <script>
        function playSong1() {
            // 播放audio文件夹下的song01.mp3
            window.nativeBridge.playAudio('audio/song01.mp3', '背景音乐1');
        }

        function playSong2() {
            // 播放audio文件夹下的song02.mp3
            window.nativeBridge.playAudio('audio/song02.mp3', '背景音乐2');
        }

        function pauseAudio() {
            window.nativeBridge.pauseAudio();
        }

        function stopAudio() {
            window.nativeBridge.stopAudio();
        }
    </script>
</body>
</html>
```

### Vue3示例

```vue
<template>
  <div>
    <button @click="playAudio">播放音频</button>
    <button @click="pauseAudio">暂停</button>
    <button @click="stopAudio">停止</button>
  </div>
</template>

<script setup>
const playAudio = () => {
  if (window.nativeBridge) {
    window.nativeBridge.playAudio('audio/song01.mp3', '背景音乐');
  } else {
    console.error('nativeBridge 未初始化');
  }
};

const pauseAudio = () => {
  if (window.nativeBridge) {
    window.nativeBridge.pauseAudio();
  }
};

const stopAudio = () => {
  if (window.nativeBridge) {
    window.nativeBridge.stopAudio();
  }
};
</script>
```

## 音频文件路径说明

- 音频文件应放置在 `static/hybrid/cubeCity/audio/` 目录下
- 在调用 `playAudio` 时,只需传递相对于 `cubeCity` 目录的路径,例如: `audio/song01.mp3`
- 系统会自动拼接完整路径: `/static/hybrid/cubeCity/audio/song01.mp3`

## API文档

### nativeBridge.playAudio(audioPath, audioName)

播放指定的音频文件

**参数:**
- `audioPath` (String): 音频文件路径,相对于cubeCity目录
- `audioName` (String, 可选): 音频名称,默认为"未知歌曲"

**返回值:**
- `Boolean`: true表示成功发送消息,false表示失败

**示例:**
```javascript
window.nativeBridge.playAudio('audio/song01.mp3', '背景音乐1');
```

### nativeBridge.pauseAudio()

暂停当前播放的音频

**参数:** 无

**返回值:**
- `Boolean`: true表示成功发送消息,false表示失败

**示例:**
```javascript
window.nativeBridge.pauseAudio();
```

### nativeBridge.stopAudio()

停止当前播放的音频

**参数:** 无

**返回值:**
- `Boolean`: true表示成功发送消息,false表示失败

**示例:**
```javascript
window.nativeBridge.stopAudio();
```

## 注意事项

1. **路径问题**: 确保音频文件路径正确,文件必须存在于 `static/hybrid/cubeCity/audio/` 目录下
2. **跨域问题**: 由于使用了webview,需要确保音频文件路径是相对路径
3. **兼容性**: 此方案仅适用于uni-app打包的应用,在纯H5环境下不可用
4. **错误处理**: 建议在使用前检查 `window.nativeBridge` 是否存在

## 调试方法

1. 在H5页面中打开浏览器控制台,查看日志输出
2. 在原生应用中查看控制台日志,确认消息是否正确接收
3. 检查音频文件路径是否正确

## 常见问题

### Q: 音频播放失败怎么办?
A: 检查以下几点:
1. 音频文件是否存在
2. 音频文件路径是否正确
3. 音频文件格式是否支持(推荐使用mp3格式)
4. 查看控制台日志,确认错误信息

### Q: 如何知道音频播放状态?
A: 目前此方案会跳转到播放器页面,你可以在播放器页面查看播放状态。如果需要在H5页面中获取播放状态,需要扩展消息通信机制。

### Q: 可以在后台播放音频吗?
A: 可以!原生播放器支持后台播放,即使应用切换到后台,音频也会继续播放。

## 扩展功能

如果需要更多功能,可以在 `cubeCity.vue` 中扩展消息处理逻辑:

```javascript
const handleMessage = (e) => {
    const data = e.detail.data[0];
    
    switch(data.action) {
        case 'playAudio':
            playAudio(data);
            break;
        case 'pauseAudio':
            pauseAudio();
            break;
        case 'stopAudio':
            stopAudio();
            break;
        case 'setVolume':
            setVolume(data.volume);
            break;
        case 'seekTo':
            seekTo(data.position);
            break;
        // 添加更多功能...
    }
};
```

## 技术支持

如有问题,请查看以下文件:
- [cubeCity.vue](../../pages/cubeCity/cubeCity.vue) - webview容器和消息处理
- [player.vue](../../pages/player/player.vue) - 音乐播放器实现
- [native-bridge.js](./native-bridge.js) - H5桥接脚本
