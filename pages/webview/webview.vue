<template>
	<view class="main">
		<!-- 头部标题 -->
		<view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="back-btn" @click="back">
				<image src="/static/back.png" style="width: 36px;height: 36px;" mode="aspectFit"></image>
			</view>
			<h1 class="app-title">动漫播放</h1>
			<view class="header-right"></view>
		</view>

		<!-- WebView -->
		<web-view :src="url" @message="handleMessage"></web-view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 获取状态栏高度
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight;

// 状态管理
const url = ref('');

// 页面加载
onMounted(() => {
	// 获取页面参数
	try {
		const pages = getCurrentPages();
		if (pages && pages.length > 0) {
			const currentPage = pages[pages.length - 1];
			if (currentPage && currentPage.options) {
				const options = currentPage.options;
				if (options.url) {
					url.value = decodeURIComponent(options.url);
					console.log('加载URL:', url.value);
				}
			}
		}
	} catch (error) {
		console.error('获取页面参数失败:', error);
	}
});

// 处理WebView消息
const handleMessage = (event: any) => {
	console.log('WebView消息:', event.detail.data);
};

// 返回
const back = () => {
	uni.navigateBack({
		delta: 1
	});
};
</script>

<style lang="scss" scoped>
page {
	background: #000;
}

.main {
	min-height: 100vh;
}

/* 头部样式 */
.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 30rpx;
	height: 80rpx;
	background: rgba(0, 0, 0, 0.9);
	backdrop-filter: blur(10rpx);

	.app-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
	}

	.back-btn {
		padding: 10rpx;
	}

	.header-right {
		width: 40rpx;
	}
}

/* WebView样式 */
web-view {
	width: 100%;
	height: calc(100vh - 80rpx);
}
</style>