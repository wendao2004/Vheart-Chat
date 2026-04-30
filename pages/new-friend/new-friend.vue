<template>
	<view class="new-friend-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left" @click="handleBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="navbar-title">新的朋友</text>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<!-- 占位区域 -->
		<view class="navbar-placeholder" :style="{ height: (statusBarHeight + navBarHeight) + 'px' }"></view>
		
		<!-- 添加朋友入口 -->
		<view class="add-friend-entry" @click="navigateToAddFriend">
			<view class="entry-icon">
				<text>+</text>
			</view>
			<text class="entry-text">添加朋友</text>
		</view>
		
		<!-- 好友请求列表 -->
		<scroll-view class="new-friend-list" scroll-y :style="{ height: 'calc(100vh - ' + (statusBarHeight + navBarHeight + 70) + 'px)' }">
			<view v-if="loading" class="loading">
				<text>加载中...</text>
			</view>
			<view v-else-if="friendRequests.length === 0" class="empty">
				<text class="empty-text">暂无好友请求</text>
			</view>
			<view v-else v-for="request in friendRequests" :key="request._id" class="request-item">
				<view class="user-avatar">
					<image :src="request.fromUserAvatar || '/static/avatar-default.png'" mode="aspectFill"></image>
				</view>
				<view class="user-info">
					<text class="user-nickname">{{ request.fromUserNickname || request.fromUserId }}</text>
					<text class="request-message">{{ request.message || '请求添加你为好友' }}</text>
					<text class="request-time">{{ formatTime(request.createTime) }}</text>
				</view>
				<view class="action-buttons">
					<view v-if="request.status === 'pending'" class="button-group">
						<view class="accept-btn" @click="handleAccept(request._id)">
							<text>接受</text>
						</view>
						<view class="reject-btn" @click="handleReject(request._id)">
							<text>拒绝</text>
						</view>
					</view>
					<text v-else-if="request.status === 'accepted'" class="status-text accepted">已接受</text>
					<text v-else-if="request.status === 'rejected'" class="status-text rejected">已拒绝</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { globalUser } from '../../core/model/use-user-model';

const friendRequests = ref([]);
const loading = ref(false);

// 状态栏高度
const statusBarHeight = ref(20);
// 导航栏高度
const navBarHeight = ref(44);

// 加载好友请求列表
const loadFriendRequests = async () => {
	if (!globalUser.isLogin) return;
	loading.value = true;
	try {
		console.log('loadFriendRequests - calling getFriendRequests');
		friendRequests.value = await globalUser.getFriendRequests();
		console.log('loadFriendRequests - friendRequests loaded:', friendRequests.value);
	} catch (error) {
		console.error('加载好友请求失败', error);
		uni.showToast({ title: '加载失败', icon: 'none' });
	} finally {
		loading.value = false;
	}
};

// 接受好友请求
const handleAccept = async (requestId) => {
	console.log('handleAccept - requestId:', requestId);
	console.log('handleAccept - requestId type:', typeof requestId);
	console.log('handleAccept - globalUser.currentUser:', globalUser.currentUser);
	console.log('handleAccept - isLogin:', globalUser.isLogin);
	
	if (!globalUser.currentUser || !globalUser.currentUser.userId) {
		console.error('handleAccept - 用户未登录');
		uni.showToast({ title: '请先登录', icon: 'none' });
		return;
	}
	
	try {
		console.log('handleAccept - 调用globalUser.handleFriendRequest');
		console.log('handleAccept - globalUser:', globalUser);
		console.log('handleAccept - globalUser.handleFriendRequest:', globalUser.handleFriendRequest);
		await globalUser.handleFriendRequest(requestId, 'accepted');
		uni.showToast({ title: '已接受', icon: 'success' });
		// 刷新列表
		loadFriendRequests();
		// 设置需要刷新好友列表的标志
		uni.setStorageSync('chat_need_refresh_friend_list', true);
		console.log('new-friend.vue - 设置需要刷新好友列表标志');
		// 跳转到联系人页面
		setTimeout(() => {
			uni.switchTab({
				url: '/pages/contact/contact'
			});
		}, 1000);
	} catch (error) {
		console.error('接受好友请求失败', error);
		uni.showToast({ title: '操作失败', icon: 'none' });
	}
};

// 拒绝好友请求
const handleReject = async (requestId) => {
	console.log('handleReject - requestId:', requestId);
	console.log('handleReject - globalUser.currentUser:', globalUser.currentUser);
	console.log('handleReject - isLogin:', globalUser.isLogin);
	
	if (!globalUser.currentUser || !globalUser.currentUser.userId) {
		console.error('handleReject - 用户未登录');
		uni.showToast({ title: '请先登录', icon: 'none' });
		return;
	}
	
	try {
		await globalUser.handleFriendRequest(requestId, 'rejected');
		uni.showToast({ title: '已拒绝', icon: 'success' });
		// 刷新列表
		loadFriendRequests();
	} catch (error) {
		console.error('拒绝好友请求失败', error);
		uni.showToast({ title: '操作失败', icon: 'none' });
	}
};

// 格式化时间
const formatTime = (timestamp) => {
	if (!timestamp) return '';
	const date = new Date(timestamp);
	return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 跳转到添加朋友页面
const navigateToAddFriend = () => {
	uni.navigateTo({
		url: '/pages/add-friend/add-friend'
	});
};

// 处理返回
const handleBack = () => {
	uni.navigateBack();
};

// 初始化系统信息
const initSystemInfo = () => {
	statusBarHeight.value = uni.getStorageSync('statusBarHeight') || 20;
	navBarHeight.value = uni.getStorageSync('navBarHeight') || 44;
};

// 页面挂载时加载好友请求
onMounted(() => {
	// 初始化系统信息
	initSystemInfo();
	
	loadFriendRequests();
});
</script>

<style scoped>
.new-friend-container {
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

/* 添加朋友入口 */
.add-friend-entry {
	display: flex;
	align-items: center;
	padding: 12px 16px;
	background-color: #FFFFFF;
}

.entry-icon {
	width: 40px;
	height: 40px;
	background-color: #07C160;
	border-radius: 6px;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-right: 12px;
}

.entry-icon text {
	font-size: 24px;
	color: #FFFFFF;
	font-weight: 300;
}

.entry-text {
	font-size: 16px;
	color: #000000;
}

/* 好友请求列表 */
.new-friend-list {
	flex: 1;
	background-color: #FFFFFF;
}

.loading {
	padding: 40px;
	text-align: center;
	color: #999999;
}

.empty {
	padding: 40px;
	text-align: center;
}

.empty-text {
	font-size: 14px;
	color: #999999;
}

.request-item {
	min-height: 70px;
	padding: 12px 16px;
	display: flex;
	align-items: center;
	background-color: #FFFFFF;
}

.user-avatar {
	width: 44px;
	height: 44px;
	border-radius: 6px;
	overflow: hidden;
	margin-right: 12px;
	background-color: #E5E5E5;
	flex-shrink: 0;
}

.user-avatar image {
	width: 100%;
	height: 100%;
}

.user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.user-nickname {
	font-size: 16px;
	color: #000000;
	margin-bottom: 4px;
}

.request-message {
	font-size: 13px;
	color: #888888;
	margin-bottom: 2px;
}

.request-time {
	font-size: 12px;
	color: #CCCCCC;
}

.action-buttons {
	margin-left: 12px;
}

.button-group {
	display: flex;
	flex-direction: row;
	gap: 8px;
}

.accept-btn {
	padding: 6px 16px;
	background-color: #07C160;
	border-radius: 4px;
}

.accept-btn text {
	font-size: 14px;
	color: #FFFFFF;
}

.reject-btn {
	padding: 6px 16px;
	background-color: #F5F5F5;
	border-radius: 4px;
}

.reject-btn text {
	font-size: 14px;
	color: #888888;
}

.status-text {
	font-size: 14px;
}

.status-text.accepted {
	color: #07C160;
}

.status-text.rejected {
	color: #888888;
}
</style>
