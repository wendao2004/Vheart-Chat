<template>
	<view class="user-detail-container">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left" @click="handleBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="navbar-title">详细资料</text>
				<view class="navbar-right">
					<view class="navbar-icon" @click="handleMore">
						<text class="icon-text">...</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 占位区域 -->
		<view class="navbar-placeholder" :style="{ height: (statusBarHeight + navBarHeight) + 'px' }"></view>
		
		<!-- 用户信息区域 -->
		<view class="user-info-section">
			<view class="avatar-container">
				<image :src="userInfo.avatarUrl || defaultAvatar" mode="aspectFill" class="user-avatar"></image>
			</view>
			<text class="user-nickname">{{ userInfo.nickname }}</text>
			<text class="user-id">微信号：{{ userInfo.userId }}</text>
		</view>
		
		<!-- 备注和标签区域 -->
		<view class="section" v-if="!isSelf">
			<view class="section-item" @click="handleEditRemark">
				<text class="item-label">备注</text>
				<view class="item-value">
					<text class="value-text">{{ userRemark || '未设置' }}</text>
					<text class="arrow-icon">›</text>
				</view>
			</view>
			<view class="section-item">
				<text class="item-label">标签</text>
				<view class="item-value">
					<text class="value-text">未设置</text>
					<text class="arrow-icon">›</text>
				</view>
			</view>
		</view>
		
		<!-- 更多信息区域 -->
		<view class="section">
			<view class="section-item">
				<text class="item-label">地区</text>
				<text class="item-value-text">{{ userInfo.region || '未设置' }}</text>
			</view>
			<view class="section-item">
				<text class="item-label">个性签名</text>
				<text class="item-value-text">{{ userInfo.signature || '未设置' }}</text>
			</view>
		</view>
		
		<!-- 操作按钮区域 -->
		<view class="action-section">
			<view class="action-button" @click="handleSendMessage">
				<text class="button-text">发消息</text>
			</view>
			<view class="action-button" @click="handleMakePhoneCall">
				<text class="button-text">音视频通话</text>
			</view>
		</view>
		
		<!-- 备注编辑弹窗 -->
		<view class="remark-edit-modal" v-if="showRemarkModal">
			<view class="modal-content">
				<view class="modal-header">
					<text class="modal-title">设置备注</text>
					<text class="modal-close" @click="closeRemarkModal">✕</text>
				</view>
				<view class="modal-body">
					<input v-model="remarkInput" type="text" placeholder="请输入备注" class="remark-input" />
				</view>
				<view class="modal-footer">
					<view class="footer-button cancel" @click="closeRemarkModal">取消</view>
					<view class="footer-button confirm" @click="saveRemark">确定</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { globalUser } from '../../core/model/use-user-model';

const userInfo = ref({
	nickname: '',
	userId: '',
	avatarUrl: '',
	region: '',
	signature: ''
});

const userRemark = ref('');
const remarkInput = ref('');
const showRemarkModal = ref(false);

// 状态栏高度
const statusBarHeight = ref(20);
// 导航栏高度
const navBarHeight = ref(44);

// 默认头像
const defaultAvatar = 'https://img.icons8.com/ios-filled/50/000000/user.png';

// 页面加载时获取用户信息
onLoad((query) => {
	const { userId, nickname, avatarUrl } = query;
	if (userId) {
		userInfo.value.userId = userId;
		userInfo.value.nickname = decodeURIComponent(nickname || '');
		userInfo.value.avatarUrl = avatarUrl || '';
		// 加载用户备注
		loadUserRemark(userId);
	}
});

onMounted(() => {
	initSystemInfo();
});

// 初始化系统信息
const initSystemInfo = () => {
	statusBarHeight.value = uni.getStorageSync('statusBarHeight') || 20;
	navBarHeight.value = uni.getStorageSync('navBarHeight') || 44;
};

// 加载用户备注
const loadUserRemark = (userId) => {
	try {
		const currentUserId = globalUser.currentUser?.userId;
		if (!currentUserId) return;
		
		const key = `chat_user_remark_${currentUserId}_${userId}`;
		const remark = uni.getStorageSync(key);
		userRemark.value = remark || '';
	} catch (error) {
		console.error('加载用户备注失败', error);
	}
};

// 计算是否是查看自己的详情页
const isSelf = computed(() => {
	return userInfo.value.userId === globalUser.currentUser?.userId;
});

// 保存用户备注
const saveUserRemark = (userId, remark) => {
	try {
		const currentUserId = globalUser.currentUser?.userId;
		if (!currentUserId) return;
		
		const key = `chat_user_remark_${currentUserId}_${userId}`;
		uni.setStorageSync(key, remark);
		userRemark.value = remark;
		return true;
	} catch (error) {
		console.error('保存用户备注失败', error);
		return false;
	}
};

// 处理返回
const handleBack = () => {
	uni.navigateBack();
};

// 处理更多
const handleMore = () => {
	// 根据是否是自己的详情页，显示不同的选项
	const itemList = isSelf.value ? 
		['把我推荐给朋友'] : 
		['设置备注和标签', '把他推荐给朋友', '删除', '举报'];
	
	uni.showActionSheet({
		itemList,
		success: (res) => {
			if (isSelf.value) {
				// 自己的详情页，只有一个选项
				if (res.tapIndex === 0) {
					// 把我推荐给朋友
					uni.showToast({ title: '推荐功能开发中', icon: 'none' });
				}
			} else {
				// 对方的详情页
				switch (res.tapIndex) {
					case 0:
						handleEditRemark();
						break;
					case 2:
						// 处理删除好友
						uni.showModal({
							title: '删除好友',
							content: '确定要删除好友吗？',
							success: (res) => {
								if (res.confirm) {
									// 这里可以添加删除好友的逻辑
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									});
									setTimeout(() => {
										uni.navigateBack();
									}, 1000);
								}
							}
						});
						break;
				}
			}
		}
	});
};

// 处理编辑备注
const handleEditRemark = () => {
	remarkInput.value = userRemark.value;
	showRemarkModal.value = true;
};

// 关闭备注编辑弹窗
const closeRemarkModal = () => {
	showRemarkModal.value = false;
};

// 保存备注
const saveRemark = () => {
	const success = saveUserRemark(userInfo.value.userId, remarkInput.value);
	if (success) {
		uni.showToast({
			title: '保存成功',
			icon: 'success'
		});
		closeRemarkModal();
		// 触发全局事件，通知其他页面更新用户备注
		uni.$emit('userRemarkUpdated', {
			userId: userInfo.value.userId,
			remark: remarkInput.value
		});
	} else {
		uni.showToast({
			title: '保存失败，请重试',
			icon: 'none'
		});
	}
};

// 处理发送消息
const handleSendMessage = () => {
	// 跳转到聊天详情页，支持给自己发送消息
	uni.navigateTo({
		url: `/pages/chat-detail/chat-detail?targetUserId=${userInfo.value.userId}&nickname=${encodeURIComponent(userInfo.value.nickname)}`
	});
};

// 处理音视频通话
const handleMakePhoneCall = () => {
	uni.showToast({
		title: '音视频通话功能开发中',
		icon: 'none'
	});
};
</script>

<style scoped>
.user-detail-container {
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
	background-color: #FFFFFF;
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
	height: 44px;
	display: flex;
	justify-content: flex-end;
	align-items: center;
}

.icon-text {
	font-size: 18px;
	color: #000000;
}

/* 导航栏占位 */
.navbar-placeholder {
	background-color: #FFFFFF;
}

/* 用户信息区域 */
.user-info-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 32px 0;
	background-color: #FFFFFF;
	margin-bottom: 8px;
}

.avatar-container {
	width: 80px;
	height: 80px;
	border-radius: 50%;
	overflow: hidden;
	margin-bottom: 16px;
	background-color: #E5E5E5;
}

.user-avatar {
	width: 100%;
	height: 100%;
}

.user-nickname {
	font-size: 20px;
	font-weight: 600;
	color: #000000;
	margin-bottom: 8px;
}

.user-id {
	font-size: 14px;
	color: #888888;
}

/* 通用区域样式 */
.section {
	background-color: #FFFFFF;
	margin-bottom: 8px;
}

.section-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	height: 56px;
	padding: 0 16px;
	border-bottom: 1px solid #F0F0F0;
}

.section-item:last-child {
	border-bottom: none;
}

.item-label {
	font-size: 16px;
	color: #000000;
}

.item-value {
	display: flex;
	align-items: center;
}

.value-text {
	font-size: 14px;
	color: #888888;
	margin-right: 8px;
}

.arrow-icon {
	font-size: 16px;
	color: #CCCCCC;
}

.item-value-text {
	font-size: 14px;
	color: #888888;
}

/* 操作按钮区域 */
.action-section {
	padding: 32px 16px;
}

.action-button {
	height: 48px;
	background-color: #07C160;
	border-radius: 6px;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 16px;
}

.action-button:last-child {
	margin-bottom: 0;
	background-color: #FFFFFF;
	border: 1px solid #07C160;
}

.action-button:last-child .button-text {
	color: #07C160;
}

.button-text {
	font-size: 18px;
	font-weight: 600;
	color: #FFFFFF;
}

/* 备注编辑弹窗 */
.remark-edit-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 9999;
}

.modal-content {
	width: 80%;
	background-color: #FFFFFF;
	border-radius: 12px;
	overflow: hidden;
}

.modal-header {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	height: 56px;
	padding: 0 16px;
	border-bottom: 1px solid #F0F0F0;
}

.modal-title {
	font-size: 17px;
	font-weight: 600;
	color: #000000;
}

.modal-close {
	font-size: 20px;
	color: #888888;
}

.modal-body {
	padding: 24px 16px;
}

.remark-input {
	width: 100%;
	height: 48px;
	border: 1px solid #E5E5E5;
	border-radius: 6px;
	padding: 0 12px;
	font-size: 16px;
}

.modal-footer {
	display: flex;
	flex-direction: row;
	height: 56px;
	border-top: 1px solid #F0F0F0;
}

.footer-button {
	flex: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 16px;
}

.footer-button.cancel {
	color: #888888;
	border-right: 1px solid #F0F0F0;
}

.footer-button.confirm {
	color: #07C160;
}
</style>