<template>
	<view class="favorites-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left" @click="handleBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="navbar-title">我的收藏</text>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<!-- 占位区域 -->
		<view class="navbar-placeholder" :style="{ height: (statusBarHeight + navBarHeight) + 'px' }"></view>
		
		<!-- 收藏列表 -->
		<scroll-view 
			class="favorites-list" 
			scroll-y 
			:style="{ height: 'calc(100vh - ' + (statusBarHeight + navBarHeight) + 'px)' }"
		>
			<view v-if="loading" class="loading">
				<text>加载中...</text>
			</view>
			<view v-else-if="favoriteList.length === 0" class="empty">
				<text class="empty-text">暂无收藏</text>
				<text class="empty-tip">长按消息可添加到收藏</text>
			</view>
			<view v-else class="favorites-content">
				<view 
					v-for="favorite in favoriteList" 
					:key="favorite.id"
					class="favorite-card"
				>
					<view class="card-header">
						<view class="user-info">
							<view class="user-avatar">
								<image 
									:src="favorite.targetUserInfo?.avatarUrl || '/static/logo.png'" 
									mode="aspectFill"
								></image>
							</view>
							<text class="user-name">{{ favorite.targetUserInfo?.nickname || '未知用户' }}</text>
						</view>
						<text class="favorite-time">{{ formatTime(favorite.favoriteTime) }}</text>
					</view>
					<view class="card-content">
						<text class="message-content">{{ favorite.message.content }}</text>
						<text class="message-time">{{ formatTime(favorite.message.createTime) }}</text>
					</view>
					<view class="card-footer">
						<view class="action-button" @click="handleDelete(favorite.id)">
							<text class="delete-text">删除</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { favoriteModel } from '../../core/model/use-favorite-model';
import { MessageData } from '../../core/data/message-data';

// 状态栏高度
const statusBarHeight = ref(20);
// 导航栏高度
const navBarHeight = ref(44);
// 加载状态
const loading = ref(false);
// 收藏列表
const favoriteList = ref([]);

// 格式化时间
const formatTime = (timestamp) => {
	if (!timestamp) return '';
	return MessageData.formatMessageTime(timestamp);
};

// 加载收藏列表
const loadFavorites = async () => {
	loading.value = true;
	try {
		favoriteModel.loadFavorites();
		favoriteList.value = favoriteModel.favoriteList.value;
		// 按收藏时间倒序排序
		favoriteList.value.sort((a, b) => b.favoriteTime - a.favoriteTime);
	} catch (error) {
		console.error('加载收藏列表失败', error);
	} finally {
		loading.value = false;
	}
};

// 处理删除收藏
const handleDelete = (favoriteId) => {
	uni.showModal({
		title: '确认删除',
		content: '确定要删除这条收藏吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					await favoriteModel.removeFavorite(favoriteId);
					// 重新加载收藏列表
					await loadFavorites();
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					});
				} catch (error) {
					console.error('删除收藏失败', error);
					uni.showToast({
						title: '删除失败',
						icon: 'none'
					});
				}
			}
		}
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

// 页面挂载时加载收藏列表
onMounted(() => {
	initSystemInfo();
	loadFavorites();
});
</script>

<style scoped>
.favorites-container {
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

.navbar-left,
.navbar-right {
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

/* 导航栏占位 */
.navbar-placeholder {
	background-color: #EDEDED;
}

/* 收藏列表 */
.favorites-list {
	flex: 1;
	background-color: #EDEDED;
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

.favorites-content {
	background-color: #EDEDED;
	padding: 12px;
}

.favorite-card {
	background-color: #FFFFFF;
	border-radius: 8px;
	padding: 16px;
	margin-bottom: 12px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.user-info {
	display: flex;
	align-items: center;
}

.user-avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	overflow: hidden;
	margin-right: 8px;
}

.user-avatar image {
	width: 100%;
	height: 100%;
}

.user-name {
	font-size: 14px;
	font-weight: 500;
	color: #333333;
}

.favorite-time {
	font-size: 12px;
	color: #999999;
}

.card-content {
	margin-bottom: 12px;
	padding: 12px;
	background-color: #F5F5F5;
	border-radius: 6px;
}

.message-content {
	font-size: 15px;
	color: #333333;
	line-height: 1.4;
	word-break: break-word;
	margin-bottom: 8px;
	display: block;
}

.message-time {
	font-size: 11px;
	color: #999999;
	display: block;
	text-align: right;
}

.card-footer {
	display: flex;
	justify-content: flex-end;
}

.action-button {
	padding: 6px 12px;
	background-color: #FF3B30;
	border-radius: 4px;
}

.delete-text {
	font-size: 14px;
	color: #FFFFFF;
}
</style>