<template>
	<view class="search-result-container">
		<view class="search-result-list">
			<view v-if="loading" class="loading">
				<text>搜索中...</text>
			</view>
			<view v-else-if="users.length === 0" class="empty">
				<text>未找到用户</text>
			</view>
			<view v-else v-for="user in users" :key="user.userId" class="user-item">
				<view class="user-avatar">
					<image :src="user.avatarUrl" mode="aspectFill"></image>
				</view>
				<view class="user-info">
					<text class="user-nickname">{{ user.nickname }}</text>
					<text class="user-id">微信号：{{ user.userId }}</text>
				</view>
				<view class="add-button" @click="handleAddFriend(user)">
					<text class="add-button-text">添加</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { globalUser } from '../../core/model/use-user-model';

const keyword = ref('');
const loading = ref(false);
const users = ref([]);

// 使用 onLoad 获取页面参数
onLoad((query) => {
	console.log('search-result onLoad query:', query);
	keyword.value = decodeURIComponent(query.keyword || '');
	if (keyword.value) {
		loadSearchResult();
	}
});

// 加载搜索结果
const loadSearchResult = async () => {
	if (!keyword.value) return;
	loading.value = true;
	try {
		const result = await globalUser.searchUser(keyword.value);
		console.log('搜索结果:', result);
		// 过滤掉当前用户自己
		users.value = result.filter(user => user.userId !== globalUser.currentUser?.userId);
	} catch (error) {
		console.error('搜索失败', error);
		uni.showToast({ title: '搜索失败，请重试', icon: 'none' });
	} finally {
		loading.value = false;
	}
};

// 处理返回
const handleBack = () => {
	uni.navigateBack();
};

// 处理添加好友
const handleAddFriend = async (user) => {
	try {
		// 发送好友请求
		await globalUser.sendFriendRequest(user.userId, '');
		uni.showToast({ title: '好友请求已发送', icon: 'success' });
		// 禁用添加按钮
		user.isAdding = true;
	} catch (error) {
		console.error('发送好友请求失败', error);
		uni.showToast({ title: '发送失败，请重试', icon: 'none' });
	}
};
</script>

<style scoped>
.search-result-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	background-color: #F2F2F2;
}

.search-result-header {
	height: 44px;
	background-color: #FFFFFF;
	border-bottom: 1px solid #E5E5E5;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 16px;
}

.header-left {
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

.header-center {
	flex: 1;
	display: flex;
	justify-content: center;
	align-items: center;
}

.header-title {
	font-size: 16px;
	font-weight: 600;
	color: #000000;
}

.search-result-list {
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
	color: #999999;
}

.user-item {
	height: 64px;
	padding: 0 16px;
	display: flex;
	align-items: center;
	border-bottom: 1px solid #F0F0F0;
}

.user-avatar {
	width: 48px;
	height: 48px;
	border-radius: 8px;
	overflow: hidden;
	margin-right: 12px;
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
	font-size: 12px;
	color: #999999;
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
