<template>
	<view class="chat-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left"></view>
				<text class="navbar-title">微信</text>
				<view class="navbar-right">
					<view class="navbar-icon" @click="handleAdd">
						<text class="icon-text">+</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 占位区域 -->
		<view class="navbar-placeholder" :style="{ height: (statusBarHeight + navBarHeight) + 'px' }"></view>

		<!-- 会话列表 -->
		<scroll-view class="chat-list" scroll-y
			:style="{ height: 'calc(100vh - ' + (statusBarHeight + navBarHeight) + 'px - 50px)' }">
			<view v-if="loading" class="loading">
				<text>加载中...</text>
			</view>
			<view v-else-if="sessionList.length === 0" class="empty">
				<text class="empty-text">暂无会话</text>
				<text class="empty-tip">点击右上角 + 添加好友开始聊天</text>
			</view>
			<view v-else class="session-list-content">
				<view v-for="session in sessionList" :key="session.sessionId" class="session-item"
					@click="navigateToChatDetail(session)" @longpress="handleLongPress(session)">
					<view class="session-avatar">
						<image :src="getSessionAvatar(session)" mode="aspectFill" lazy-load :fade-show="true"></image>
						<view v-if="session.unreadCount > 0" class="avatar-badge">
							<text class="badge-text">{{ session.unreadCount > 99 ? '99+' : session.unreadCount }}</text>
						</view>
					</view>
					<view class="session-info">
						<view class="session-top">
							<text class="session-name">{{ getSessionName(session) }}</text>
							<text class="session-time">{{ formatTime(session.updateTime) }}</text>
						</view>
						<view class="session-bottom">
							<text class="session-message">{{ session.lastMessage || '暂无消息' }}</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	
	import {
		onMounted,
		computed,
		ref
	} from 'vue';
	import {
		onShow
	} from '@dcloudio/uni-app';
	import {
		globalUser
	} from '../../core/model/use-user-model';
	import {
		favoriteModel
	} from '../../core/model/use-favorite-model';
	import {
		MessageData
	} from '../../core/data/message-data';

	// 状态栏高度
	const statusBarHeight = ref(20);
	// 导航栏高度
	const navBarHeight = ref(44);
	// 加载状态
	const loading = ref(false);

	// 本地最近聊天列表
	const localRecentChats = ref([]);

	// 会话列表（从本地缓存获取）
	const sessionList = computed(() => {
		return localRecentChats.value;
	});

	// 获取本地存储的最近聊天列表
	const getLocalRecentChats = () => {
		try {
			const currentUserId = globalUser.currentUser?.userId;
			if (!currentUserId) return [];

			const key = `chat_recent_chats_${currentUserId}`;
			const data = uni.getStorageSync(key);
			if (data) {
				let parsed = JSON.parse(data);
				// 检查是否过期（7天）
				const now = Date.now();
				parsed = parsed.filter(chat => {
					return (now - chat.updateTime) < 7 * 24 * 60 * 60 * 1000;
				});

				// 从消息缓存中获取最后一条消息
				parsed = parsed.map(chat => {
					const lastMessage = getLastMessageFromCache(currentUserId, chat.targetUserId);
					return {
						...chat,
						lastMessage: lastMessage || chat.lastMessage || '暂无消息'
					};
				});

				// 按时间排序
				parsed.sort((a, b) => b.updateTime - a.updateTime);

				return parsed;
			}
		} catch (error) {
			console.error('获取本地最近聊天失败', error);
		}
		return [];
	};

	// 从消息缓存中获取最后一条消息
	const getLastMessageFromCache = (userId1, userId2) => {
		try {
			const sessionId = [userId1, userId2].sort().join('_');
			const cacheKey = `chat_message_cache_${sessionId}`;
			const cachedData = uni.getStorageSync(cacheKey);

			if (cachedData) {
				const {
					data
				} = JSON.parse(cachedData);
				if (data && data.length > 0) {
					// 获取最后一条消息
					const lastMsg = data[data.length - 1];
					return lastMsg.content || '暂无消息';
				}
			}
		} catch (error) {
			console.error('获取缓存消息失败', error);
		}
		return null;
	};

	// 保存到本地最近聊天列表
	const saveLocalRecentChat = (targetUserId, targetUserInfo, lastMessage = '') => {
		try {
			const currentUserId = globalUser.currentUser?.userId;
			if (!currentUserId) return;

			const key = `chat_recent_chats_${currentUserId}`;
			let chats = getLocalRecentChats();

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
				chats[existingIndex] = {
					...chats[existingIndex],
					...chatData
				};
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
			localRecentChats.value = chats;
		} catch (error) {
			console.error('保存本地最近聊天失败', error);
		}
	};

	// 删除本地最近聊天
	const deleteLocalRecentChat = (targetUserId) => {
		try {
			const currentUserId = globalUser.currentUser?.userId;
			if (!currentUserId) return;

			const key = `chat_recent_chats_${currentUserId}`;
			let chats = getLocalRecentChats();

			// 过滤掉要删除的会话
			chats = chats.filter(chat => chat.targetUserId !== targetUserId);

			uni.setStorageSync(key, JSON.stringify(chats));
			localRecentChats.value = chats;
		} catch (error) {
			console.error('删除本地最近聊天失败', error);
		}
	};

	// 格式化时间
	const formatTime = (timestamp) => {
		if (!timestamp) return '';
		return MessageData.formatMessageTime(timestamp);
	};

	// 获取会话显示名称（优先显示备注）
	const getSessionName = (session) => {
		try {
			const currentUserId = globalUser.currentUser?.userId;
			if (!currentUserId || !session.targetUserId) return session.targetUserInfo?.nickname || '未知用户';
			
			const key = `chat_user_remark_${currentUserId}_${session.targetUserId}`;
			const remark = uni.getStorageSync(key);
			return remark || session.targetUserInfo?.nickname || '未知用户';
		} catch (error) {
			console.error('获取会话名称失败', error);
			return session.targetUserInfo?.nickname || '未知用户';
		}
	};

	// 长按处理
	const handleLongPress = (session) => {
		const itemList = session.unreadCount > 0 ?
			['标记为已读', '收藏', '删除会话'] :
			['收藏', '删除会话'];

		uni.showActionSheet({
			itemList,
			success: async (res) => {
				if (session.unreadCount > 0) {
					// 有未读消息时
					if (res.tapIndex === 0) {
						// 标记为已读
						await markAsRead(session);
					} else if (res.tapIndex === 1) {
						// 收藏会话
						await saveFavorite(session);
					} else if (res.tapIndex === 2) {
						// 删除会话
						await deleteSession(session);
					}
				} else {
					// 无未读消息时
					if (res.tapIndex === 0) {
						// 收藏会话
						await saveFavorite(session);
					} else if (res.tapIndex === 1) {
						// 删除会话
						await deleteSession(session);
					}
				}
			}
		});
	};

	// 标记为已读
	const markAsRead = async (session) => {
		try {
			// 清除本地未读数
			const currentUserId = globalUser.currentUser?.userId;
			if (!currentUserId) return;

			const key = `chat_recent_chats_${currentUserId}`;
			let chats = getLocalRecentChats();
			const index = chats.findIndex(chat => chat.sessionId === session.sessionId);
			if (index > -1) {
				chats[index].unreadCount = 0;
				uni.setStorageSync(key, JSON.stringify(chats));
				localRecentChats.value = chats;
			}

			uni.showToast({
				title: '已标记为已读',
				icon: 'success'
			});
		} catch (error) {
			console.error('标记已读失败', error);
			uni.showToast({
				title: '操作失败',
				icon: 'none'
			});
		}
	};

	// 收藏会话
	const saveFavorite = async (session) => {
		await favoriteModel.saveFavorite(session);
	};

	// 删除会话
	const deleteSession = async (session) => {
		uni.showModal({
			title: '确认删除',
			content: `确定删除与 ${session.targetUserInfo?.nickname || '未知用户'} 的会话吗？`,
			success: async (res) => {
				if (res.confirm) {
					try {
						// 删除本地最近聊天
						deleteLocalRecentChat(session.targetUserId);

						uni.showToast({
							title: '删除成功',
							icon: 'success'
						});
					} catch (error) {
						console.error('删除会话失败', error);
						uni.showToast({
							title: '删除失败',
							icon: 'none'
						});
					}
				}
			}
		});
	};

	// 获取会话头像（优先使用缓存）
	const getSessionAvatar = (session) => {
		const targetUserId = session.targetUserId;
		if (targetUserId) {
			return globalUser.getUserAvatar(targetUserId);
		}
		return session.targetUserInfo?.avatarUrl || '/static/logo.png';
	};

	// 导航到聊天详情页
	const navigateToChatDetail = async (session) => {
		const {
			targetUserId,
			targetUserInfo,
			sessionId,
			unreadCount
		} = session;

		// 如果有未读消息，清除未读数
		if (unreadCount > 0) {
			try {
				// 清除本地未读数
				const currentUserId = globalUser.currentUser?.userId;
				if (currentUserId) {
					const key = `chat_recent_chats_${currentUserId}`;
					let chats = getLocalRecentChats();
					const index = chats.findIndex(chat => chat.sessionId === sessionId);
					if (index > -1) {
						chats[index].unreadCount = 0;
						uni.setStorageSync(key, JSON.stringify(chats));
						localRecentChats.value = chats;
					}
				}
			} catch (error) {
				console.error('清除未读数失败', error);
			}
		}

		// 保存到本地最近聊天
		saveLocalRecentChat(targetUserId, targetUserInfo, session.lastMessage);

		uni.navigateTo({
			url: `/pages/chat-detail/chat-detail?targetUserId=${targetUserId}&nickname=${encodeURIComponent(targetUserInfo?.nickname || '未知用户')}`
		});
	};

	// 处理添加按钮点击
	const handleAdd = () => {
		// 显示添加菜单
		uni.showActionSheet({
			title: '更多选项',
			itemList: ['发起群聊', '添加朋友', '扫一扫', '收付款'],
			success: (res) => {
				switch (res.tapIndex) {
					case 1:
						uni.navigateTo({
							url: '/pages/add-friend/add-friend'
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

	// 监听用户备注更新事件
const listenUserRemarkUpdate = () => {
	uni.$on('userRemarkUpdated', (data) => {
		console.log('chat.vue - 收到用户备注更新事件:', data);
		// 重新加载会话列表，确保显示最新的备注
		if (globalUser.isLogin) {
			localRecentChats.value = getLocalRecentChats();
		}
	});
};

// 页面挂载时加载会话列表
onMounted(() => {
	// 初始化系统信息
	initSystemInfo();

	// 监听用户备注更新事件
	listenUserRemarkUpdate();

	if (globalUser.isLogin) {
		// 加载本地最近聊天
		loading.value = true;
		localRecentChats.value = getLocalRecentChats();
		loading.value = false;
	} else {
		// 未登录时跳转到登录页面
		uni.showToast({
			title: '请先登录',
			icon: 'none'
		});
		setTimeout(() => {
			uni.navigateTo({
				url: '/pages/login/login'
			});
		}, 1000);
	}
});

	// 页面显示时重新加载（处理TabBar切换和返回）
	onShow(() => {
		console.log('chat.vue - onShow, 当前用户:', globalUser.currentUser?.userId);
		if (globalUser.isLogin) {
			// 刷新本地最近聊天（从缓存获取最新消息）
			localRecentChats.value = getLocalRecentChats();
		}
	});
</script>

<style scoped>
	.chat-container {
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
		font-size: 24px;
		color: #000000;
		font-weight: 300;
	}

	/* 导航栏占位 */
	.navbar-placeholder {
		background-color: #EDEDED;
	}

	/* 会话列表 */
	.chat-list {
		flex: 1;
		background-color: #FFFFFF;
	}

	.session-list-content {
		background-color: #FFFFFF;
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
		padding: 80px 20px;
		background-color: #FFFFFF;

	}

	.empty-text {
		font-size: 16px;
		color: #999999;
	}

	.empty-tip {
		margin-top: 10px;
		font-size: 12px;
		color: #CCCCCC;
	}

	.session-item {
		height: 64px;
		background-color: #FFFFFF;
		border-bottom: 0.5px solid #E5E5E5;
		display: flex;
		align-items: center;
		padding: 0 16px;
	}

	.session-avatar {
		width: 48px;
		height: 48px;
		border-radius: 6px;
		overflow: visible;
		margin-right: 12px;
		position: relative;
	}

	.session-avatar image {
		width: 48px;
		height: 48px;
		border-radius: 6px;
	}

	.avatar-badge {
		position: absolute;
		top: -5px;
		right: -5px;
		background-color: #FA5151;
		color: #FFFFFF;
		font-size: 11px;
		padding: 0 5px;
		border-radius: 9px;
		min-width: 16px;
		height: 16px;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 2px solid #FFFFFF;
	}

	.badge-text {
		font-weight: 500;
		font-size: 10px;
	}

	.session-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
	}

	.session-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}

	.session-name {
		font-size: 16px;
		color: #000000;
		font-weight: 400;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.session-time {
		font-size: 12px;
		color: #B2B2B2;
		margin-left: 8px;
		flex-shrink: 0;
	}

	.session-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.session-message {
		font-size: 14px;
		color: #888888;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>