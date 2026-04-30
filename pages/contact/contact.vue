<template>
	<view class="contact-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left"></view>
				<text class="navbar-title">联系人</text>
				<view class="navbar-right">
					<view class="navbar-icon" @click="handleSearch">
						<text class="icon-text">. . .</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 占位区域 -->
		<view class="navbar-placeholder" :style="{ height: (statusBarHeight + navBarHeight) + 'px' }"></view>
		
		<!-- 联系人列表 -->
		<scroll-view class="contact-list" scroll-y :style="{ height: 'calc(100vh - ' + (statusBarHeight + navBarHeight) + 'px - 50px)' }" 
			:refresher-enabled="true" 
			:refresher-triggered="refreshing" 
			@refresherpulling="onRefresherPulling" 
			@refresherrefresh="onRefresherRefresh" 
			refresher-background="#EDEDED" 
			refresher-color="#07C160">
			<!-- 新的朋友入口 -->
			<view class="contact-section">
				<view class="contact-item" @click="navigateToNewFriend">
					<view class="contact-avatar add-friend-avatar">
						<text class="add-icon">+</text>
					</view>
					<text class="contact-name">新的朋友</text>
				</view>
			</view>

			<!-- 联系人列表 -->
			<view class="contact-section">
				<view class="section-header">
					<text class="section-title">联系人</text>
				</view>
				<view v-if="loading" class="loading">
					<text>加载中...</text>
				</view>
				<view v-else-if="userList.length === 0" class="empty">
					<text class="empty-text">暂无联系人</text>
					<text class="empty-tip">点击上方 + 添加好友</text>
				</view>
				<view v-for="user in userList" :key="user.userId" class="contact-item"
				@click="navigateToUserDetail(user)">
					<view class="contact-avatar">
						<image 
							:src="user.avatarUrl || defaultAvatar" 
							mode="aspectFill"
							lazy-load
							:fade-show="true"
						></image>
					</view>
					<text class="contact-name">{{ getUserName(user) }}</text>
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
		onShow
	} from '@dcloudio/uni-app';
	import {
		globalUser
	} from '../../core/model/use-user-model';
	
	const userList = ref([]);
const loading = ref(false);
const refreshing = ref(false);

// 默认头像
const defaultAvatar = 'https://img.icons8.com/ios-filled/50/000000/user.png';

// 状态栏高度
const statusBarHeight = ref(20);
// 导航栏高度
const navBarHeight = ref(44);

// 是否需要刷新好友列表的标志
const needRefreshFriendList = ref(false);

	// 加载用户列表（优先使用本地缓存，只有添加新朋友时才刷新）
const loadUserList = async (forceRefresh = false) => {
	if (!globalUser.isLogin) return;
	
	const cacheKey = `chat_friend_list_cache_${globalUser.currentUser?.userId}`;
	const cachedData = uni.getStorageSync(cacheKey);
	
	// 如果有缓存且不需要刷新，直接使用缓存
	if (!forceRefresh && !needRefreshFriendList.value && cachedData) {
		try {
			const { data } = JSON.parse(cachedData);
			if (data && data.length > 0) {
				console.log('contact.vue - 使用本地缓存，不请求云函数');
				userList.value = data;
				return;
			}
		} catch (e) {
			console.error('解析缓存失败', e);
		}
	}
	
	// 需要刷新：强制刷新、添加新朋友、或无缓存
	loading.value = true;
	try {
		console.log('contact.vue - 从服务器获取好友列表');
		
		// 清除缓存，确保从服务器获取最新数据
		if (forceRefresh || needRefreshFriendList.value) {
			uni.removeStorageSync(cacheKey);
			console.log('contact.vue - 已清除好友列表缓存');
		}
		
		// 获取好友列表
		const friends = await globalUser.getFriendList();
		console.log('contact.vue - 获取到好友列表:', friends);
		userList.value = friends;
		
		// 重置刷新标志
		needRefreshFriendList.value = false;
	} catch (error) {
		console.error('加载联系人失败', error);
		// 如果失败但有缓存，使用缓存
		if (cachedData) {
			try {
				const { data } = JSON.parse(cachedData);
				userList.value = data || [];
				console.log('contact.vue - 使用缓存数据');
			} catch (e) {
				userList.value = [];
			}
		} else {
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			});
		}
	} finally {
		loading.value = false;
	}
};
	
	// 设置需要刷新好友列表（供其他页面调用）
	const setNeedRefreshFriendList = () => {
		needRefreshFriendList.value = true;
		console.log('contact.vue - 设置需要刷新好友列表');
	};

	// 导航到新的朋友页面
	const navigateToNewFriend = () => {
		uni.navigateTo({
			url: '/pages/new-friend/new-friend'
		});
	};

	// 保存到本地最近聊天列表
	const saveLocalRecentChat = (targetUserId, targetUserInfo, lastMessage = '') => {
		try {
			const currentUserId = globalUser.currentUser?.userId;
			if (!currentUserId) return;

			const key = `chat_recent_chats_${currentUserId}`;
			let chats = uni.getStorageSync(key);
			chats = chats ? JSON.parse(chats) : [];

			// 生成会话ID
			const sessionId = [currentUserId, targetUserId].sort().join('_');

			// 查找是否已存在
			const existingIndex = chats.findIndex(chat => chat.targetUserId === targetUserId);
			const chatData = {
				sessionId,
				userId: currentUserId,
				targetUserId,
				targetUserInfo,
				lastMessage,
				updateTime: Date.now(),
				unreadCount: 0
			};

			if (existingIndex > -1) {
				// 更新已有记录
				chats[existingIndex] = { ...chats[existingIndex], ...chatData };
			} else {
				// 添加新记录
				chats.push(chatData);
			}

			// 按时间排序
			chats.sort((a, b) => b.updateTime - a.updateTime);

			// 最多保存20个
			if (chats.length > 20) {
				chats = chats.slice(0, 20);
			}

			uni.setStorageSync(key, JSON.stringify(chats));
		} catch (error) {
			console.error('保存本地最近聊天失败', error);
		}
	};

	// 导航到用户详情页
const navigateToUserDetail = (user) => {
	uni.navigateTo({
		url: `/pages/user-detail/user-detail?userId=${user.userId}&nickname=${encodeURIComponent(user.nickname)}&avatarUrl=${encodeURIComponent(user.avatarUrl || '')}`
	});
};

// 导航到聊天详情页
const navigateToChatDetail = (targetUserId, nickname, avatarUrl) => {
	// 保存到本地最近聊天
	saveLocalRecentChat(targetUserId, { nickname, avatarUrl, userId: targetUserId });

	uni.navigateTo({
		url: `/pages/chat-detail/chat-detail?targetUserId=${targetUserId}&nickname=${encodeURIComponent(nickname)}`
	});
};

	// 处理搜索按钮点击
const handleSearch = () => {
	uni.navigateTo({
		url: '/pages/add-friend/add-friend'
	});
};

// 获取用户显示名称（优先显示备注）
const getUserName = (user) => {
	try {
		const currentUserId = globalUser.currentUser?.userId;
		if (!currentUserId) return user.nickname;
		
		const key = `chat_user_remark_${currentUserId}_${user.userId}`;
		const remark = uni.getStorageSync(key);
		return remark || user.nickname;
	} catch (error) {
		console.error('获取用户备注失败', error);
		return user.nickname;
	}
};

// 下拉刷新 - 开始下拉
const onRefresherPulling = () => {
	console.log('contact.vue - 下拉刷新开始');
};

// 下拉刷新 - 刷新中
const onRefresherRefresh = async () => {
	console.log('contact.vue - 开始刷新好友列表');
	refreshing.value = true;
	try {
		// 强制刷新好友列表，清除缓存
		await loadUserList(true);
		console.log('contact.vue - 刷新完成');
	} catch (error) {
		console.error('刷新好友列表失败', error);
		uni.showToast({
			title: '刷新失败，请重试',
			icon: 'none'
		});
	} finally {
		// 结束刷新
		refreshing.value = false;
	}
};

	// 初始化系统信息
	const initSystemInfo = () => {
		statusBarHeight.value = uni.getStorageSync('statusBarHeight') || 20;
		navBarHeight.value = uni.getStorageSync('navBarHeight') || 44;
	};

	// 页面挂载时加载联系人列表
	onMounted(() => {
		// 初始化系统信息
		initSystemInfo();
		
		if (globalUser.isLogin) {
			// 首次加载，优先使用缓存
			loadUserList();
		} else {
			// 未登录时显示提示，不跳转
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
		}
	});

	// 监听用户备注更新事件
const listenUserRemarkUpdate = () => {
	uni.$on('userRemarkUpdated', (data) => {
		console.log('contact.vue - 收到用户备注更新事件:', data);
		// 遍历用户列表，更新对应用户的备注
		userList.value = userList.value.map(user => {
			if (user.userId === data.userId) {
				// 这里可以根据需要更新用户的显示名称
				// 实际应用中，可能需要在用户对象中添加remark字段
				return { ...user };
			}
			return user;
		});
		// 重新加载用户列表，确保显示最新的备注
		loadUserList();
	});
};

// 页面显示时重新加载（处理TabBar切换和返回）
onShow(() => {
	console.log('contact.vue - onShow, 当前用户:', globalUser.currentUser?.userId);
	if (globalUser.isLogin) {
		// 检查是否需要刷新好友列表（如添加新朋友后）
		const needRefresh = uni.getStorageSync('chat_need_refresh_friend_list');
		if (needRefresh) {
			console.log('contact.vue - 检测到需要刷新好友列表');
			needRefreshFriendList.value = true;
			// 清除标志
			uni.removeStorageSync('chat_need_refresh_friend_list');
			// 需要刷新，调用loadUserList
			loadUserList();
		} else if (userList.value.length === 0) {
			// 首次加载或数据为空，尝试从缓存加载
			const cacheKey = `chat_friend_list_cache_${globalUser.currentUser?.userId}`;
			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				try {
					const { data } = JSON.parse(cachedData);
					if (data && data.length > 0) {
						console.log('contact.vue - onShow使用本地缓存');
						userList.value = data;
						return;
					}
				} catch (e) {
					console.error('解析缓存失败', e);
				}
			}
			// 无缓存，必须请求云函数
			loadUserList();
		} else {
			console.log('contact.vue - onShow有数据，不请求云函数');
		}
	}
});

// 页面挂载时初始化
onMounted(() => {
	// 初始化系统信息
	initSystemInfo();
	
	// 监听用户备注更新事件
	listenUserRemarkUpdate();
	
	if (globalUser.isLogin) {
		// 首次加载，优先使用缓存
		loadUserList();
	} else {
		// 未登录时显示提示，不跳转
		uni.showToast({ title: '请先登录', icon: 'none' });
	}
});
</script>

<style scoped>
	.contact-container {
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
		display: flex;
		justify-content: flex-end;
	}

	.navbar-icon {
		width: 32px;
		height: 32px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.icon-text {
		font-size: 18px;
	}

	/* 导航栏占位 */
	.navbar-placeholder {
		background-color: #EDEDED;
	}

	/* 联系人列表 */
	.contact-list {
		flex: 1;
		background-color: #EDEDED;
	}

	.contact-section {
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

	.contact-item {
		height: 56px;
		padding: 0 16px;
		display: flex;
		align-items: center;
		background-color: #FFFFFF;
	}

	.contact-avatar {
		width: 40px;
		height: 40px;
		border-radius: 6px;
		overflow: hidden;
		margin-right: 12px;
		background-color: #E5E5E5;
	}

	.add-friend-avatar {
		background-color: #07C160;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.add-icon {
		font-size: 24px;
		color: #FFFFFF;
		font-weight: 300;
	}

	.contact-avatar image {
		width: 100%;
		height: 100%;
	}

	.contact-name {
		font-size: 16px;
		color: #000000;
		flex: 1;
	}

	.loading {
		padding: 20px;
		text-align: center;
		color: #999999;
		background-color: #FFFFFF;
	}

	.empty {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 40px 20px;
		background-color: #FFFFFF;
	}

	.empty-text {
		font-size: 16px;
		color: #999999;
	}

	.empty-tip {
		margin-top: 8px;
		font-size: 12px;
		color: #CCCCCC;
	}
</style>
