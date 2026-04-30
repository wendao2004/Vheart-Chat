<template>
	<view class="login-container" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="login-header">
			<image src="/static/logo.png" class="logo" mode="aspectFit"></image>
			<text class="app-name">Vheart-Chat</text>
		</view>
		<view class="login-form">
			<view class="form-item">
				<input v-model="formData.phoneNumber" type="text" placeholder="请输入手机号" class="form-input" />
			</view>
			<view class="form-item">
				<input v-model="formData.password" type="password" placeholder="请输入密码" class="form-input" />
			</view>
			<view class="form-button">
				<button @click="handleLogin" class="login-button" :disabled="loading">
					<text v-if="!loading">登录</text>
					<text v-else>登录中...</text>
				</button>
			</view>
		</view>
		<view class="login-footer">
			<text class="footer-text">还没有账号？</text>
			<text class="footer-link" @click="handleRegister">注册</text>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue';
	import {
		globalUser
	} from '../../core/model/use-user-model';
	import md5 from 'js-md5';
	const loading = ref(false);
	const formData = ref({
		phoneNumber: '',
		password: ''
	});

	// 状态栏高度
	const statusBarHeight = ref(20);

	// 页面加载时检查是否已登录
	onMounted(() => {
		initSystemInfo();
		checkAutoLogin();
	});

	// 初始化系统信息
	const initSystemInfo = () => {
		statusBarHeight.value = uni.getStorageSync('statusBarHeight') || 20;
	};

	// 检查自动登录
	const checkAutoLogin = () => {
		if (globalUser.isLogin) {
			console.log('检测到已登录，自动跳转');
			uni.switchTab({
				url: '/pages/chat/chat'
			});
		}
	};

	// 密码解密
	const encryptPassword = (password) => {
		return md5(password);
	};

	// 处理登录
const handleLogin = async () => {

	if (!formData.value.phoneNumber.trim()) {
		uni.showToast({
			title: '请输入手机号',
			icon: 'none'
		});
		return;
	}
	// 验证手机号格式
	if (!globalUser.validatePhoneNumber(formData.value.phoneNumber)) {
		uni.showToast({
			title: '手机号格式不正确',
			icon: 'none'
		});
		return;
	}
	if (!formData.value.password.trim()) {
		uni.showToast({
			title: '请输入密码',
			icon: 'none'
		});
		return;
	}

		loading.value = true;
		try {
			// const userId = formData.value.phoneNumber;
			const encryptedPwd = encryptPassword(formData.value.password);
			const user = await globalUser.login({
				account: formData.value.phoneNumber,
				password: encryptedPwd
			});
			console.log('登录成功，用户信息：', user);
			uni.showToast({
				title: '登录成功',
				icon: 'success'
			});
			setTimeout(() => {
				uni.switchTab({
					url: '/pages/chat/chat'
				});
			}, 1000);
		} catch (error) {
			console.error('登录失败', error);
			// 判断错误类型
			const errorMsg = error?.message || error?.errMsg || '';
			if (errorMsg.includes('用户不存在')) {
				// 用户不存在，提示是否注册
				uni.showModal({
					title: '提示',
					content: '该手机号未注册，是否前往注册？',
					confirmText: '去注册',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: `/pages/register/register?phoneNumber=${formData.value.phoneNumber}`
							});
						}
					}
				});
			} else if (errorMsg.includes('密码错误')) {
				uni.showToast({
					title: '密码错误',
					icon: 'none'
				});
			} else {
				uni.showToast({
					title: '登录失败，请重试',
					icon: 'none'
				});
			}
		} finally {
			loading.value = false;
		}
	};

	// 跳转到注册页面
	const handleRegister = () => {
		uni.navigateTo({
			url: '/pages/register/register'
		});
	};
</script>

<style scoped>
	.login-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: #FFFFFF;
		padding: 0 32px;
		height: 100%;
	}

	.login-header {
		margin-top: 80px;
		margin-bottom: 60px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.logo {
		width: 80px;
		height: 80px;
		margin-bottom: 16px;
	}

	.app-name {
		font-size: 24px;
		font-weight: 600;
		color: #07C160;
	}

	.login-form {
		width: 100%;
	}

	.form-item {
		margin-bottom: 16px;
	}

	.form-input {
		width: 100%;
		height: 48px;
		border-bottom: 1px solid #E5E5E5;
		font-size: 16px;
		padding: 0 8px;
		color: #000000;
	}

	.form-button {
		margin-top: 40px;
	}

	.login-button {
		width: 100%;
		height: 48px;
		background-color: #07C160;
		color: #FFFFFF;
		font-size: 18px;
		font-weight: 600;
		border-radius: 6px;
		border: none;
	}

	.login-button:disabled {
		background-color: #CCCCCC;
	}

	.login-footer {
		margin-top: 80px;
		display: flex;
		align-items: center;
		font-size: 14px;
		color: #999999;
	}

	.footer-text {
		margin: 0 4px;
	}

	.footer-link {
		color: #07C160;
	}
</style>