<template>
	<view class="profile-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left"></view>
				<text class="navbar-title">我</text>
				<view class="navbar-right"></view>
			</view>
		</view>

		<!-- 占位区域 -->
		<view class="navbar-placeholder" :style="{ height: (statusBarHeight + navBarHeight) + 'px' }"></view>

		<!-- 用户信息 -->
		<view class="profile-header" @click="handleEditProfile">
			<view class="user-avatar">
				<image :src="userAvatar" mode="aspectFill"></image>
			</view>
			<view class="user-details">
				<text class="user-nickname">{{ userNickname }}</text>
				<text class="user-id">微信号：{{ userId }}</text>
			</view>
			<text class="arrow">›</text>
		</view>

		<!-- 功能列表 -->
		<scroll-view class="profile-list" scroll-y
			:style="{ height: 'calc(100vh - ' + (statusBarHeight + navBarHeight + 90) + 'px - 50px)' }">
			<view class="profile-section">
				<view class="profile-item" @click="handleWallet">
					<text class="item-name">支付</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
			<view class="profile-section">
				<view class="profile-item" @click="handleCollect">
					<text class="item-name">收藏</text>
					<text class="item-arrow">›</text>
				</view>
				<view class="profile-item" @click="handleCards">
					<text class="item-name">卡包</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
			<view class="profile-section">
				<view class="profile-item" @click="handleSettings">
					<text class="item-name">设置</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import {
		ref,
		computed,
		onMounted
	} from 'vue';
	import {
		globalUser
	} from '../../core/model/use-user-model';

	import {
		gotoPage
	} from '@/common/utils/utils.js'

	// 状态栏高度
	const statusBarHeight = ref(20);
	// 导航栏高度
	const navBarHeight = ref(44);

	// 计算用户信息
	const userAvatar = computed(() => {
		return globalUser.currentUser?.avatarUrl || 'https://img.icons8.com/ios-filled/50/000000/user.png';
	});

	const userNickname = computed(() => {
		return globalUser.currentUser?.nickname || '未登录';
	});

	const userId = computed(() => {
		return globalUser.currentUser?.userId || '';
	});

	// 处理编辑个人资料
const handleEditProfile = () => {
	if (globalUser.isLogin) {
		// 跳转到用户详情页，显示自己的详细资料
		uni.navigateTo({
			url: `/pages/user-detail/user-detail?userId=${globalUser.currentUser?.userId}&nickname=${encodeURIComponent(globalUser.currentUser?.nickname || '')}&avatarUrl=${encodeURIComponent(globalUser.currentUser?.avatarUrl || '')}`
		});
	} else {
		uni.showToast({
			title: '请先登录',
			icon: 'none'
		});
	}
};

	// 处理支付
	const handleWallet = () => {
		uni.showToast({
			title: '支付功能开发中',
			icon: 'none'
		});
	};

	// 处理收藏
	const handleCollect = () => {
		gotoPage('/pages/favorites/favorites')
		console.log("点击收藏")
	};

	// 处理卡包
	const handleCards = () => {
		uni.showToast({
			title: '卡包功能开发中',
			icon: 'none'
		});
	};

	// 处理设置
	const handleSettings = () => {
		uni.showActionSheet({
			title: '设置',
			itemList: ['账号与安全', '隐私', '通用', '关于微信', '退出登录'],
			success: (res) => {
				switch (res.tapIndex) {
					case 4:
						// 退出登录
						uni.showModal({
							title: '退出登录',
							content: '确定要退出登录吗？',
							success: (modalRes) => {
								if (modalRes.confirm) {
									globalUser.logout();
								}
							}
						});
						break;
					default:
						uni.showToast({
							title: '功能开发中',
							icon: 'none'
						});
				}
			}
		});
	};

	// 初始化系统信息
	const initSystemInfo = () => {
		statusBarHeight.value = uni.getStorageSync('statusBarHeight') || 20;
		navBarHeight.value = uni.getStorageSync('navBarHeight') || 44;
	};

	// 页面挂载时检查登录状态
	onMounted(() => {
		// 初始化系统信息
		initSystemInfo();

		if (!globalUser.isLogin) {
			// 模拟登录，实际项目中应该跳转到登录页面
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
		}
	});
</script>

<style scoped>
	.profile-container {
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

	/* 用户信息 */
	.profile-header {
		display: flex;
		align-items: center;
		padding: 16px;
		background-color: #FFFFFF;
		margin-bottom: 8px;
	}

	.user-avatar {
		width: 60px;
		height: 60px;
		border-radius: 8px;
		overflow: hidden;
		margin-right: 16px;
		background-color: #E5E5E5;
	}

	.user-avatar image {
		width: 100%;
		height: 100%;
	}

	.user-details {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.user-nickname {
		font-size: 18px;
		font-weight: 600;
		color: #000000;
		margin-bottom: 4px;
	}

	.user-id {
		font-size: 14px;
		color: #888888;
	}

	.arrow {
		font-size: 20px;
		color: #CCCCCC;
	}

	/* 功能列表 */
	.profile-list {
		flex: 1;
		background-color: #EDEDED;
	}

	.profile-section {
		background-color: #FFFFFF;
		margin-bottom: 8px;
	}

	.profile-item {
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