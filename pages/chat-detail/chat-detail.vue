<template>
	<view class="chat-detail-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left" @click="handleBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="navbar-title">{{ displayName }}</text>
				<view class="navbar-right" @click="handleMore">
					<text class="more-icon">⋯</text>
				</view>
			</view>
		</view>
		
		<!-- 占位区域 -->
		<view class="navbar-placeholder" :style="{ height: (statusBarHeight + navBarHeight) + 'px' }"></view>
		
		<!-- 聊天内容 -->
		<scroll-view 
			class="chat-content" 
			scroll-y 
			:scroll-top="scrollTop"
			:style="{ height: 'calc(100vh - ' + (statusBarHeight + navBarHeight) + 'px - 50px)' }"
			@scrolltoupper="loadMoreMessages"
			refresher-enabled
			:refresher-triggered="refreshing"
			@refresherrefresh="onRefresh"
		>
			<view v-if="loading" class="loading">
				<text>加载中...</text>
			</view>
			<view v-else class="message-list">
				<view 
					v-for="(message, index) in messageList" 
					:key="message._id || index"
					:class="['message-item', message.fromUserId === currentUserId ? 'sent' : 'received', { 'selected': isMessageSelected(message._id || message.id) }]"
					@touchstart="(e) => handleTouchStart(e, () => handleMessageLongPress(message))"
					@touchend="handleTouchEnd()"
					@touchcancel="handleTouchEnd()"
					@touchmove="handleTouchMove"
					:data-message="message"
					@click="selectionMode ? toggleMessageSelection(message._id || message.id) : null"
				>
					<!-- 复选框 -->
					<view v-if="selectionMode" class="message-checkbox">
						<view :class="['checkbox', isMessageSelected(message._id || message.id) ? 'checked' : '']" @click.stop="toggleMessageSelection(message._id || message.id)">
							<text v-if="isMessageSelected(message._id || message.id)" class="checkbox-icon">✓</text>
						</view>
					</view>
					<view class="message-avatar" @click="navigateToUserDetail(message.fromUserId, message.fromUserId === currentUserId ? globalUser.currentUser?.nickname : nickname)">
						<image 
							:src="message.fromUserId === currentUserId ? userAvatar : targetAvatar" 
							mode="aspectFill"
							lazy-load
							:fade-show="true"
						></image>
					</view>
					<view class="message-bubble">
						<text class="message-content">{{ message.content }}</text>
						<text class="message-time">{{ formatTime(message.createTime) }}</text>
						<view v-if="message.sending" class="message-status">
							<text>发送中...</text>
						</view>
						<view v-else-if="message.sendFailed" class="message-status error">
							<text>发送失败</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
		
		<!-- 输入框或功能栏 -->
		<view v-if="!selectionMode" class="chat-input">
			<view class="input-container">
				<textarea 
					v-model="inputContent" 
					type="text" 
					placeholder="输入消息..."
					class="input"
					:style="{ height: inputHeight + 'px' }"
					@input="handleInput"
					@keyup.enter.exact="sendMessage"
					:maxlength="1000"
					:auto-height="true"
				></textarea>
				<view 
					class="send-button" 
					@click="sendMessage" 
					v-show="inputContent.trim()"
				>
					<text class="send-text">发送</text>
				</view>
			</view>
		</view>
		
		<!-- 选择模式功能栏 -->
		<view v-else class="selection-toolbar">
			<view class="toolbar-item" @click="handleCancelSelection">
				<text class="toolbar-text">取消</text>
			</view>
			<view class="toolbar-item" @click="handleBatchFavorite">
				<text class="toolbar-text">收藏</text>
			</view>
			<view class="toolbar-item" @click="handleForward">
				<text class="toolbar-text">转发</text>
			</view>
			<view class="toolbar-item" @click="handleDelete">
				<text class="toolbar-text">删除</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { onLoad, onShow, onHide, onBackPress } from '@dcloudio/uni-app';
import { useChatModel } from '../../core/model/use-chat-model';
import { globalUser } from '../../core/model/use-user-model';
import { favoriteModel } from '../../core/model/use-favorite-model';
import { useSelectionModel } from '../../core/model/use-selection-model';
import { useTouchHandler } from '../../core/model/use-touch-handler';
import { MessageData } from '../../core/data/message-data';
import { UserData } from '../../core/data/user-data';

// 页面参数
const targetUserId = ref('');
const nickname = ref('');

// 状态栏高度
const statusBarHeight = ref(20);
// 导航栏高度
const navBarHeight = ref(44);
// 输入框高度
const inputHeight = ref(36);
// 滚动位置
const scrollTop = ref(0);
// 下拉刷新状态
const refreshing = ref(false);

// 使用选择模式模型
const {
	selectionMode,
	selectedMessages,
	selectedCount,
	enterSelectionMode,
	exitSelectionMode,
	toggleMessageSelection,
	isMessageSelected,
	clearSelection
} = useSelectionModel();

// 使用触摸事件处理器
const {
	handleTouchStart,
	handleTouchMove,
	handleTouchEnd
} = useTouchHandler();

// 使用聊天模型
const {
	messageList,
	inputContent,
	loading,
	sending,
	sessionId,
	loadHistoryMessage,
	sendMessage,
	watchNewMessage,
	closeWatcher
} = useChatModel(targetUserId);

// 使用 onLoad 钩子获取页面参数
onLoad((query) => {
	console.log('页面参数:', query);
	targetUserId.value = String(query.targetUserId || '');
	nickname.value = String(decodeURIComponent(query.nickname || ''));
	console.log('targetUserId:', targetUserId.value);
	console.log('nickname:', nickname.value);
	
	// 加载历史消息并开始监听新消息
loadHistoryMessage().then(() => {
	// 缓存对方的头像
	if (targetUserId.value) {
		// 尝试从消息中获取对方的头像信息
		const targetMessage = messageList.value.find(msg => msg.fromUserId === targetUserId.value);
		if (targetMessage?.avatarUrl) {
			// 缓存对方的头像
			UserData.cacheUserAvatar(targetUserId.value, targetMessage.avatarUrl);
		}
	}
	// 滚动到最新消息
	setTimeout(scrollToBottom, 100);
});
watchNewMessage();
});

// 页面显示时自动刷新消息（处理返回和切换）
onShow(() => {
	console.log('chat-detail onShow - 自动刷新消息');
	if (targetUserId.value) {
		// 自动拉取最新消息（后台静默更新）
		loadHistoryMessage(false);
	}
});

// 页面隐藏时停止监听
onHide(() => {
	console.log('chat-detail onHide - 停止监听');
	closeWatcher();
});

// 计算用户头像（优先使用缓存）
const currentUserId = computed(() => {
	return globalUser.currentUser?.userId || '';
});

const userAvatar = computed(() => {
	return globalUser.getUserAvatar(currentUserId.value);
});

const targetAvatar = computed(() => {
	return globalUser.getUserAvatar(targetUserId.value);
});

// 获取用户显示名称（优先显示备注）
const getUserName = (userId, defaultName) => {
	try {
		const currentUserId = globalUser.currentUser?.userId;
		if (!currentUserId) return defaultName;
		
		const key = `chat_user_remark_${currentUserId}_${userId}`;
		const remark = uni.getStorageSync(key);
		return remark || defaultName;
	} catch (error) {
		console.error('获取用户备注失败', error);
		return defaultName;
	}
};

// 计算显示的昵称（优先使用备注）
const displayName = computed(() => {
	return getUserName(targetUserId.value, nickname.value);
});

// 格式化时间
const formatTime = (timestamp) => {
	return MessageData.formatMessageTime(timestamp);
};

// 处理输入
const handleInput = (e) => {
	const value = e.detail.value;
	const lines = value.split('\n').length;
	inputHeight.value = Math.min(36 + (lines - 1) * 18, 100);
};

// 加载更多消息
const loadMoreMessages = () => {
	// 可以在这里实现加载更多历史消息的逻辑
};

// 下拉刷新（强制刷新）
const onRefresh = async () => {
	console.log('下拉刷新 - 强制刷新');
	refreshing.value = true;
	try {
		// 强制刷新，清除缓存并重新加载
		await loadHistoryMessage(true);
		
		uni.showToast({ title: '刷新成功', icon: 'success', duration: 1000 });
	} catch (error) {
		console.error('刷新失败', error);
		uni.showToast({ title: '刷新失败', icon: 'none' });
	} finally {
		refreshing.value = false;
	}
};

// 滚动到底部
const scrollToBottom = () => {
	nextTick(() => {
		const query = uni.createSelectorQuery();
		query.select('.message-list').boundingClientRect();
		query.exec((res) => {
			if (res[0]) {
				scrollTop.value = res[0].height;
			}
		});
	});
};

// 处理返回
const handleBack = () => {
	uni.navigateBack();
};

// 导航到用户详情页
const navigateToUserDetail = (userId, userName) => {
	// 如果点击的是自己的头像，跳转到自己的详情页
	if (userId === currentUserId.value) {
		uni.navigateTo({
			url: `/pages/user-detail/user-detail?userId=${userId}&nickname=${encodeURIComponent(userName || '')}&avatarUrl=${encodeURIComponent(userAvatar.value || '')}`
		});
	} else {
		// 否则跳转到对方的详情页
		uni.navigateTo({
			url: `/pages/user-detail/user-detail?userId=${userId}&nickname=${encodeURIComponent(userName || '')}&avatarUrl=${encodeURIComponent(targetAvatar.value || '')}`
		});
	}
};

// 处理更多
const handleMore = () => {
	uni.showActionSheet({
		title: '更多选项',
		itemList: ['查看资料', '清空聊天记录', '删除聊天'],
		success: (res) => {
			switch (res.tapIndex) {
				case 0:
					navigateToUserDetail(targetUserId.value, nickname.value);
					break;
				case 1:
					uni.showModal({
						title: '清空聊天记录',
						content: '确定要清空聊天记录吗？',
						success: (modalRes) => {
							if (modalRes.confirm) {
								// 清空聊天记录
								messageList.value = [];
								uni.showToast({ title: '聊天记录已清空', icon: 'success' });
							}
						}
					});
					break;
				case 2:
					uni.showModal({
						title: '删除聊天',
						content: '确定要删除聊天吗？',
						success: (modalRes) => {
							if (modalRes.confirm) {
								// 删除聊天
								uni.navigateBack();
								uni.showToast({ title: '聊天已删除', icon: 'success' });
							}
						}
					});
					break;
			}
		}
	});
};



// 取消选择模式
const handleCancelSelection = () => {
	exitSelectionMode();
};

// 处理转发
const handleForward = () => {
	uni.showToast({ title: '转发功能开发中', icon: 'none' });
};

// 处理删除
const handleDelete = () => {
	uni.showModal({
		title: '确认删除',
		content: `确定要删除选中的 ${selectedMessages.value.length} 条消息吗？`,
		success: async (res) => {
			if (res.confirm) {
				// 这里可以添加删除消息的逻辑
				uni.showToast({ title: '删除功能开发中', icon: 'none' });
				// 退出选择模式
				selectionMode.value = false;
				selectedMessages.value = [];
			}
		}
	});
};

// 批量收藏
const handleBatchFavorite = async () => {
	if (selectedMessages.value.length === 0) {
		uni.showToast({ title: '请先选择消息', icon: 'none' });
		return;
	}
	
	const targetUserInfo = {
		nickname: nickname.value,
		avatarUrl: targetAvatar.value
	};

	let successCount = 0;
	for (const messageId of selectedMessages.value) {
		const message = messageList.value.find(msg => msg._id === messageId || msg.id === messageId);
		if (message) {
			const result = await favoriteModel.saveFavorite(message, targetUserInfo);
			if (result) {
				successCount++;
			}
		}
	}

	uni.showToast({
		title: `收藏成功`,
		icon: 'success'
	});

	// 退出选择模式
	exitSelectionMode();
};



// 处理消息长按（兼容非触摸设备）
const handleMessageLongPress = (message) => {
	if (selectionMode.value) {
		// 已经在选择模式，直接切换选择状态
		toggleMessageSelection(message._id || message.id);
	} else {
		// 进入选择模式
		enterSelectionMode(message._id || message.id);
	}
};

// 初始化系统信息
const initSystemInfo = () => {
	statusBarHeight.value = uni.getStorageSync('statusBarHeight') || 20;
	navBarHeight.value = uni.getStorageSync('navBarHeight') || 44;
};

// 监听用户备注更新事件
const listenUserRemarkUpdate = () => {
	uni.$on('userRemarkUpdated', (data) => {
		console.log('chat-detail.vue - 收到用户备注更新事件:', data);
		// 如果更新的是当前聊天对象的备注，刷新显示
		if (data.userId === targetUserId.value) {
			// 备注已经通过computed属性自动更新
			console.log('chat-detail.vue - 备注已更新:', data.remark);
		}
	});
};

// 页面挂载时初始化
onMounted(() => {
	initSystemInfo();
	// 监听用户备注更新事件
	listenUserRemarkUpdate();
	// 滚动到最新消息
	setTimeout(scrollToBottom, 100);
});

// 监听系统返回操作
onBackPress(() => {
	if (selectionMode.value) {
		// 取消选择模式
		exitSelectionMode();
		// 阻止默认返回行为
		return true;
	}
	// 非选择模式，执行默认返回行为
	return false;
});

// 页面卸载时关闭监听器
onUnmounted(() => {
	closeWatcher();
});
</script>

<style scoped>
.chat-detail-container {
	width: 100%;
	height: 100vh;
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

.navbar-left,
.navbar-right {
	width: 40px;
	height: 44px;
	display: flex;
	justify-content: center;
	align-items: center;
}

.back-icon,
.more-icon {
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

/* 导航栏占位 */
.navbar-placeholder {
	background-color: #EDEDED;
}

/* 聊天内容 */
.chat-content {
	flex: 1;
	background-color: #EDEDED;
	padding: 12px 12px;
	box-sizing: border-box;
}

.loading {
	padding: 20px;
	text-align: center;
	color: #999999;
}

.message-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding-top: 8px;
	padding-bottom: 8px;
}

.message-item {
			display: flex;
			align-items: flex-start;
			gap: 8px;
			max-width: 100%;
			transition: background-color 0.2s;
		}

		.message-item.selected {
			background-color: rgba(0, 193, 96, 0.1);
			border-radius: 8px;
		}

		.message-checkbox {
			margin-top: 6px;
		}

		.checkbox {
			width: 20px;
			height: 20px;
			border: 2px solid #CCCCCC;
			border-radius: 50%;
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: #FFFFFF;
			transition: all 0.2s;
		}

		.checkbox.checked {
			background-color: #07C160;
			border-color: #07C160;
		}

		.checkbox-icon {
			color: #FFFFFF;
			font-size: 12px;
			font-weight: bold;
		}

.message-item.sent {
	flex-direction: row-reverse;
}

.message-item.sent .message-avatar {
	margin-left: 8px;
	margin-right: 0;
}

.message-item.received .message-avatar {
	margin-right: 8px;
	margin-left: 0;
}

.message-avatar {
	width: 36px;
	height: 36px;
	border-radius: 4px;
	overflow: hidden;
	flex-shrink: 0;
}

.message-avatar image {
	width: 100%;
	height: 100%;
}

.message-bubble {
	max-width: calc(100% - 80px);
	background-color: #FFFFFF;
	border-radius: 8px;
	padding: 10px 12px;
	position: relative;
	word-wrap: break-word;
}

.message-item.sent .message-bubble {
	background-color: #07C160;
	color: #FFFFFF;
}

.message-content {
	font-size: 16px;
	line-height: 1.4;
	word-break: break-word;
}

.message-time {
	font-size: 11px;
	color: #999999;
	margin-top: 4px;
	display: block;
	text-align: right;
}

.message-item.sent .message-time {
	color: rgba(255, 255, 255, 0.7);
}

.message-status {
	font-size: 11px;
	color: #999999;
	margin-top: 4px;
	display: block;
	text-align: right;
}

.message-status.error {
	color: #FF3B30;
}

/* 输入框 */
.chat-input {
	background-color: #F7F7F7;
	border-top: 0.5px solid #DEDEDE;
	padding: 10px 12px;
	padding-bottom: calc(10px + env(safe-area-inset-bottom));
}

.input-container {
	display: flex;
	flex-direction: row;
	align-items: flex-end;
	gap: 8px;
}

.input {
	flex: 1;
	min-height: 40px;
	max-height: 100px;
	background-color: #FFFFFF;
	border-radius: 4px;
	padding: 8px 12px;
	font-size: 16px;
	line-height: 1.4;
}

.send-button {
	width: 48px;
	height: 32px;
	background-color: #07C160;
	border-radius: 4px;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 4px;
}

.send-text {
	font-size: 14px;
	color: #FFFFFF;
	font-weight: 500;
}

/* 选择模式功能栏 */
.selection-toolbar {
	display: flex;
	flex-direction: row;
	justify-content: space-around;
	align-items: center;
	background-color: #F7F7F7;
	border-top: 0.5px solid #DEDEDE;
	padding: 12px;
	padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.toolbar-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 8px;
}

.toolbar-text {
	font-size: 14px;
	color: #333333;
	margin-top: 4px;
}
</style>
