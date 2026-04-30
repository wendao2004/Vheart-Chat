<template>
	<view class="add-friend-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left" @click="handleBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="navbar-title">添加朋友</text>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<!-- 占位区域 -->
		<view class="navbar-placeholder" :style="{ height: (statusBarHeight + navBarHeight) + 'px' }"></view>
		
		<!-- 搜索框 -->
		<view class="search-container">
			<view class="search-box">
				<text class="search-icon">🔍</text>
				<input v-model="searchKeyword" type="text" placeholder="搜索微信号、手机号或QQ号" class="search-input"
					@keyup.enter="handleSearch" />
				<text class="search-text" @click="handleSearch">搜索</text>
			</view>
		</view>
		
		<!-- 内容列表 -->
		<scroll-view class="add-friend-list" scroll-y :style="{ height: 'calc(100vh - ' + (statusBarHeight + navBarHeight + 70) + 'px)' }">
			<view class="add-friend-section">
				<view class="section-header">
					<text class="section-title">添加方式</text>
				</view>
				<view class="add-friend-item" @click="handleScan">
					<view class="item-icon scan-icon">
						<text>📷</text>
					</view>
					<text class="item-name">扫一扫</text>
				</view>
				<view class="add-friend-item" @click="handlePhone">
					<view class="item-icon phone-icon">
						<text>📱</text>
					</view>
					<text class="item-name">手机联系人</text>
				</view>
				<view class="add-friend-item" @click="handleWeChatId">
					<view class="item-icon id-icon">
						<text>🔤</text>
					</view>
					<text class="item-name">微信号</text>
				</view>
			</view>
			<view class="add-friend-section">
				<view class="section-header">
					<text class="section-title">推荐好友</text>
				</view>
				<view v-if="recommendedUsers.length === 0" class="empty">
					<text class="empty-text">暂无推荐好友</text>
				</view>
				<view v-for="user in recommendedUsers" :key="user.userId" class="recommended-user-item"
					@click="handleAddFriend(user)">
					<view class="user-avatar">
						<image :src="user.avatarUrl" mode="aspectFill"></image>
					</view>
					<view class="user-info">
						<text class="user-nickname">{{ user.nickname }}</text>
						<text class="user-id">微信号：{{ user.userId }}</text>
					</view>
					<view class="add-button">
						<text class="add-button-text">添加</text>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { globalUser } from '../../core/model/use-user-model';

const searchKeyword = ref('');
const recommendedUsers = ref([]);

// 状态栏高度
const statusBarHeight = ref(20);
// 导航栏高度
const navBarHeight = ref(44);

// 加载推荐用户（优先使用缓存）
	const loadRecommendedUsers = async (forceRefresh = false) => {
		if (!globalUser.isLogin) return;
		try {
			console.log('add-friend.vue - 当前用户:', globalUser.currentUser);
			console.log('add-friend.vue - 当前用户ID:', globalUser.currentUser?.userId);
			
			// 强制刷新时清除缓存
			if (forceRefresh) {
				const cacheKey = `chat_user_list_cache_${globalUser.currentUser?.userId || 'all'}`;
				uni.removeStorageSync(cacheKey);
				console.log('add-friend.vue - 已清除用户列表缓存');
			}
			
			// 加载用户列表（优先使用缓存）
			await globalUser.loadUserList();
			console.log('add-friend.vue - 用户列表:', globalUser.userList);
			// 过滤掉当前用户自己
			recommendedUsers.value = globalUser.userList.filter(user => {
				console.log('add-friend.vue - 比较:', user.userId, '!==', globalUser.currentUser?.userId, '=', user.userId !== globalUser.currentUser?.userId);
				return user.userId !== globalUser.currentUser?.userId;
			});
			console.log('add-friend.vue - 推荐用户:', recommendedUsers.value);
		} catch (error) {
			console.error('加载推荐用户失败', error);
		}
	};

// 处理返回
const handleBack = () => {
	uni.navigateBack({
		delta: 1
	});
};

// 处理搜索
const handleSearch = async () => {
	if (!searchKeyword.value.trim()) {
		uni.showToast({
			title: '请输入搜索关键词',
			icon: 'none'
		});
		return;
	}
	
	console.log('add-friend.vue - 搜索关键词:', searchKeyword.value);
	console.log('add-friend.vue - 当前用户ID:', globalUser.currentUser?.userId);
	
	try {
		// 调用搜索接口
		const users = await globalUser.searchUser(searchKeyword.value);
		console.log('add-friend.vue - 搜索结果:', users);
		if (users.length === 0) {
			uni.showToast({
				title: '未找到用户',
				icon: 'none'
			});
			return;
		}
		
		// 跳转到搜索结果页面
		uni.navigateTo({
			url: `/pages/add-friend/search-result?keyword=${encodeURIComponent(searchKeyword.value)}`
		});
	} catch (error) {
		console.error('搜索失败', error);
		uni.showToast({
			title: '搜索失败，请重试',
			icon: 'none'
		});
	}
};

// 处理扫一扫
const handleScan = () => {
	uni.showToast({
		title: '扫一扫功能开发中',
		icon: 'none'
	});
};

// 处理手机联系人
const handlePhone = () => {
	uni.showToast({
		title: '手机联系人功能开发中',
		icon: 'none'
	});
};

// 处理微信号
const handleWeChatId = () => {
	uni.showToast({
		title: '微信号搜索功能开发中',
		icon: 'none'
	});
};

// 处理添加好友
const handleAddFriend = async (user) => {
	uni.showModal({
		title: '添加好友',
		content: `确定要添加 ${user.nickname} 为好友吗？`,
		success: async (res) => {
			if (res.confirm) {
				try {
					// 发送好友请求
					await globalUser.sendFriendRequest(user.userId, '');
					uni.showToast({
						title: '好友请求已发送',
						icon: 'success'
					});
					setTimeout(() => {
						uni.navigateBack({
							delta: 1
						});
					}, 1000);
				} catch (error) {
					console.error('发送好友请求失败', error);
					// 根据错误消息显示不同的提示
					let errorMsg = '发送失败，请重试';
					if (error.message && error.message.includes('已经发送过')) {
						errorMsg = '已经发送过好友请求，请勿重复发送';
					}
					uni.showToast({
						title: errorMsg,
						icon: 'none'
					});
				}
			}
		}
	});
};

// 初始化系统信息
const initSystemInfo = () => {
	statusBarHeight.value = uni.getStorageSync('statusBarHeight') || 20;
	navBarHeight.value = uni.getStorageSync('navBarHeight') || 44;
};

// 页面挂载时加载推荐用户
	onMounted(() => {
		// 初始化系统信息
		initSystemInfo();
		
		if (globalUser.isLogin) {
			// 优先使用缓存（30分钟内不会重新请求）
			loadRecommendedUsers(false);
		} else {
			// 未登录时显示提示，不跳转
			uni.showToast({ title: '请先登录', icon: 'none' });
		}
	});
</script>

<style scoped>
	.add-friend-container {
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
		width: 40px;
		height: 44px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.back-icon {
		font-size: 24px;
		color: #000000;
	}

	.navbar-title {
		font-size: 17px;
		font-weight: 600;
		color: #000000;
		flex: 1;
		text-align: center;
	}

	.navbar-right {
		width: 40px;
	}

	/* 导航栏占位 */
	.navbar-placeholder {
		background-color: #EDEDED;
	}

	/* 搜索框 */
	.search-container {
		display: flex;
		flex-direction: row;
		padding: 8px 12px;
		background-color: #FFFFFF;
	}

	.search-box {
		display: flex;
		align-items: center;
		background-color: #EDEDED;
		border-radius: 6px;
		padding: 0 12px;
		height: 36px;
		flex: 1;
	}

	.search-icon {
		font-size: 14px;
		margin-right: 8px;
	}

	.search-input {
		flex: 1;
		font-size: 15px;
		color: #000000;
	}

	.search-text {
		font-size: 15px;
		color: #07C160;
		margin-left: 8px;
	}

	/* 内容列表 */
	.add-friend-list {
		flex: 1;
		background-color: #EDEDED;
	}

	.add-friend-section {
		background-color: #FFFFFF;
		margin-bottom: 8px;
	}

	.section-header {
		height: 28px;
		background-color: #EDEDED;
		padding: 0 16px;
		display: flex;
		align-items: center;
	}

	.section-title {
		font-size: 13px;
		color: #888888;
	}

	.add-friend-item {
		height: 56px;
		padding: 0 16px;
		display: flex;
		align-items: center;
		background-color: #FFFFFF;
	}

	.item-icon {
		width: 40px;
		height: 40px;
		border-radius: 6px;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-right: 12px;
		background-color: #E5E5E5;
	}

	.scan-icon {
		background-color: #07C160;
	}

	.phone-icon {
		background-color: #1890FF;
	}

	.id-icon {
		background-color: #FA9D3B;
	}

	.item-name {
		font-size: 16px;
		color: #000000;
	}

	.empty {
		padding: 40px;
		text-align: center;
		background-color: #FFFFFF;
	}

	.empty-text {
		font-size: 14px;
		color: #999999;
	}

	.recommended-user-item {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		background-color: #FFFFFF;
	}

	.user-avatar {
		width: 44px;
		height: 44px;
		border-radius: 6px;
		overflow: hidden;
		margin-right: 12px;
		background-color: #E5E5E5;
	}

	.user-avatar image {
		width: 100%;
		height: 100%;
	}

	.user-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.user-nickname {
		font-size: 16px;
		color: #000000;
		margin-bottom: 4px;
	}

	.user-id {
		font-size: 13px;
		color: #888888;
	}

	.add-button {
		padding: 6px 16px;
		background-color: #07C160;
		border-radius: 4px;
	}

	.add-button-text {
		font-size: 14px;
		color: #FFFFFF;
	}
</style>
