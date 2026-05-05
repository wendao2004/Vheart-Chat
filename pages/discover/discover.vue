<template>
	<view class="discover-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left"></view>
				<text class="navbar-title">发现</text>
				<view class="navbar-right"></view>
			</view>
		</view>

		<!-- 占位区域 -->
		<view class="navbar-placeholder" :style="{ height: (statusBarHeight + navBarHeight) + 'px' }"></view>

		<!-- 发现列表 -->
		<scroll-view class="discover-list" scroll-y
			:style="{ height: 'calc(100vh - ' + (statusBarHeight + navBarHeight) + 'px - 50px)' }">
			<!-- <view class="discover-section">
				<view class="discover-item" @click="handleMoments">
					<text class="item-name">朋友圈</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
			<view class="discover-section">
				<view class="discover-item" @click="handleScan">
					<text class="item-name">扫一扫</text>
					<text class="item-arrow">›</text>
				</view>
				<view class="discover-item" @click="handleShake">
					<text class="item-name">摇一摇</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
			<view class="discover-section">
				<view class="discover-item" @click="handleNearby">
					<text class="item-name">附近的人</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
			<view class="discover-section">
				<view class="discover-item" @click="handleMiniPrograms">
					<text class="item-name">小程序</text>
					<text class="item-arrow">›</text>
				</view>
			</view> -->
			<view class="discover-section">
				<view class="discover-item" @click="handleMusic">
					<text class="item-name">音乐</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
			<view class="discover-section">
				<view class="discover-item" @click="handleAnime">
					<text class="item-name">动漫</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
			<view class="discover-section">
				<view class="discover-item" @click="handleDoNotBuy_AnAssistant">
					<text class="item-name">不买助手</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
			<view class="discover-section">
				<view class="discover-item" @click="handleMBTI">
					<text class="item-name">MBTI测试</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
			<view class="discover-section">
				<view class="discover-item" @click="handleEmulatorJs">
					<text class="item-name">游戏机</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue';

	import {
		gotoPage
	} from '../../common/utils/utils.js';
	// 状态栏高度
	const statusBarHeight = ref(20);
	// 导航栏高度
	const navBarHeight = ref(44);

	// 处理朋友圈点击
	const handleMoments = () => {
		uni.showToast({
			title: '朋友圈功能开发中',
			icon: 'none'
		});
	};

	// 处理扫一扫点击
	const handleScan = () => {
		uni.showToast({
			title: '扫一扫功能开发中',
			icon: 'none'
		});
	};

	// 处理摇一摇点击
	const handleShake = () => {
		uni.showToast({
			title: '摇一摇功能开发中',
			icon: 'none'
		});
	};

	// 处理附近的人点击
	const handleNearby = () => {
		uni.showToast({
			title: '附近的人功能开发中',
			icon: 'none'
		});
	};

	// 处理小程序点击
	const handleMiniPrograms = () => {
		uni.showToast({
			title: '小程序功能开发中',
			icon: 'none'
		});
	};

	const handleMusic = () => {
		gotoPage("../../pages/music-index/music-index");
	}

	const handleAnime = () => {
		gotoPage("../../pages/anime-index/anime-index");
	}

	const handleDoNotBuy_AnAssistant = () => {
		gotoPage("../../pages/DoNotBuy-AnAssistant/DoNotBuy-AnAssistant");
	}

	const handleMBTI = () => {
		const url = "https://acgti.tianxingleo.top/";
		const cleanUrl = url.replace(/`/g, '').trim();

		try {
			// APP 打开外部浏览器
			if (typeof plus !== 'undefined') {
				plus.runtime.openURL(cleanUrl,
					(res) => console.log('打开成功'),
					(err) => {
						uni.navigateTo({
							url: `/pages/webview/webview?url=${encodeURIComponent(cleanUrl)}`
						});
					}
				);
			}
			// H5 打开新标签
			else if (typeof window !== 'undefined') {
				window.open(cleanUrl, '_blank');
			}
			// 兜底
			else {
				uni.navigateTo({
					url: `/pages/webview/webview?url=${encodeURIComponent(cleanUrl)}`
				});
			}
		} catch (error) {
			uni.navigateTo({
				url: `/pages/webview/webview?url=${encodeURIComponent(cleanUrl)}`
			});
		}
	};

	const handleEmulatorJs = () => {
		gotoPage("../../pages/emulatorJs/emulatorJs");
	}


	// 初始化系统信息
	const initSystemInfo = () => {
		statusBarHeight.value = uni.getStorageSync('statusBarHeight') || 20;
		navBarHeight.value = uni.getStorageSync('navBarHeight') || 44;
	};

	onMounted(() => {
		initSystemInfo();
	});
</script>

<style scoped>
	.discover-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		background-color: #EDEDED;
	}

	/* 自定义导航栏 */
	.custom-navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 999;
		background-color: #EDEDED;
	}

	.navbar-content {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		height: 44px;
		padding: 0 12px;
	}

	.navbar-left {
		width: 60px;
	}

	.navbar-title {
		font-size: 17px;
		font-weight: 600;
		color: #000000;
	}

	.navbar-right {
		width: 60px;
	}

	/* 导航栏占位 */
	.navbar-placeholder {
		background-color: #EDEDED;
	}

	/* 发现列表 */
	.discover-list {
		flex: 1;
		background-color: #EDEDED;
	}

	.discover-section {
		background-color: #FFFFFF;
		margin-bottom: 8px;
	}

	.discover-item {
		height: 56px;
		padding: 0 16px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #FFFFFF;
	}

	.item-name {
		font-size: 16px;
		color: #000000;
	}

	.item-arrow {
		font-size: 20px;
		color: #CCCCCC;
	}
</style>