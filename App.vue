<script>
	import {
		globalUser
	} from './core/model/use-user-model';
	import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update'
	import { MusicData } from './core/data/music-data';
	
	export default {
		onLaunch: function() {
			console.log('App Launch');

			// 获取系统信息并存储状态栏高度
			this.initSystemInfo();
			
			// 初始化QQ音乐配置
			MusicData.initQQMusicConfig();

			// 检查是否已登录，如果已登录则直接跳转到首页
			if (globalUser.isLogin) {
				console.log('检测到已登录，自动跳转');
				uni.switchTab({
					url: '/pages/chat/chat'
				});
			}
			// #ifdef APP-PLUS
			checkUpdate();
			// #endif
			// 初始化推送服务并获取 cid
			this.initPush();

			// 监听推送消息
			uni.onPushMessage((res) => {
				console.log('收到推送消息', res);

				if (res.type === 'receive') {
					// 收到服务器推送，创建本地通知
					const payload = res.data.payload || {};
					uni.createPushMessage({
						title: res.data.title,
						content: res.data.content,
						payload: payload,
						success: () => {
							console.log('创建本地通知成功');
						},
						fail: (err) => {
							console.error('创建本地通知失败', err);
						}
					});
				} else if (res.type === 'click') {
					// 用户点击通知栏消息
					const payload = res.data.payload || {};
					if (payload.type === 'new_message') {
						uni.navigateTo({
							url: `/pages/chat-detail/chat-detail?targetUserId=${payload.fromUserId}&nickname=用户${payload.fromUserId}`
						});
					}
				}
			});
		},
		onShow: function() {
			console.log('App Show')

		},
		onHide: function() {
			console.log('App Hide')
		},
		// 全局播放状态
		data() {
			return {
				globalPlayState: {
					isPlaying: false,
					songInfo: {
						title: '',
						singer: '',
						cover: '',
						music_url: ''
					},
					currentTime: 0,
					duration: 0,
					progress: 0
				},
				// 全局音频上下文（单例）
				globalAudioContext: null
			};
		},
		methods: {
			// 更新全局播放状态
			updateGlobalPlayState(state) {
				this.globalPlayState = {
					...this.globalPlayState,
					...state
				};
				console.log('更新全局播放状态:', this.globalPlayState);
			},
			// 获取或创建全局音频上下文（单例）
			getGlobalAudioContext() {
				if (!this.globalAudioContext) {
					this.globalAudioContext = uni.createInnerAudioContext();
					this.globalAudioContext.onError((error) => {
						console.error('全局音频错误:', error);
					});
				}
				return this.globalAudioContext;
			},
			// 停止全局音频播放
			stopGlobalAudio() {
				console.log('stopGlobalAudio 被调用, globalAudioContext:', this.globalAudioContext);
				if (this.globalAudioContext) {
					try {
						this.globalAudioContext.stop();
						console.log('全局音频已停止');
					} catch (error) {
						console.error('停止全局音频失败:', error);
					}
				} else {
					console.warn('globalAudioContext 为空，无法停止');
				}
			},
			// 销毁全局音频上下文
			destroyGlobalAudio() {
				if (this.globalAudioContext) {
					try {
						this.globalAudioContext.stop();
						this.globalAudioContext.destroy();
						this.globalAudioContext = null;
					} catch (error) {
						console.error('销毁全局音频失败:', error);
					}
				}
			},
			initSystemInfo() {
				// 获取系统信息
				const systemInfo = uni.getSystemInfoSync();
				console.log('系统信息:', systemInfo);

				// 存储状态栏高度
				uni.setStorageSync('statusBarHeight', systemInfo.statusBarHeight || 20);

				// 存储安全区域信息
				uni.setStorageSync('safeArea', systemInfo.safeArea || {});
				uni.setStorageSync('safeAreaInsets', systemInfo.safeAreaInsets || {});

				// 存储屏幕信息
				uni.setStorageSync('screenWidth', systemInfo.screenWidth);
				uni.setStorageSync('screenHeight', systemInfo.screenHeight);
				uni.setStorageSync('windowHeight', systemInfo.windowHeight);

				// 存储平台信息
				uni.setStorageSync('platform', systemInfo.platform);

				// 计算导航栏高度（状态栏 + 标题栏）
				// iOS: 44px, Android: 48px
				const navBarHeight = systemInfo.platform === 'ios' ? 44 : 48;
				uni.setStorageSync('navBarHeight', navBarHeight);

				// 总头部高度
				const totalHeaderHeight = (systemInfo.statusBarHeight || 20) + navBarHeight;
				uni.setStorageSync('totalHeaderHeight', totalHeaderHeight);
			},

			async initPush() {
				try {
					// 获取推送客户端ID (cid)
					uni.getPushClientId({
						success: (res) => {
							console.log('获取cid成功', res.cid);
							const cid = res.cid;

							// 如果用户已登录，上传 cid 到服务器
							if (globalUser.currentUser?.userId) {
								this.uploadCid(cid, globalUser.currentUser.userId);
							}

							// 监听登录状态变化，登录后上传 cid
							uni.$on('userLoginSuccess', (userInfo) => {
								if (userInfo?.userId && cid) {
									this.uploadCid(cid, userInfo.userId);
								}
							});
						},
						fail: (err) => {
							console.warn('获取cid失败，可能是基座不支持或配置问题', err);
							// 不阻断其他功能，继续运行
						}
					});
				} catch (error) {
					console.warn('推送初始化失败，应用继续运行', error);
				}
			},

			async uploadCid(cid, userId) {
				try {
					// 导入 NetApi
					const {
						NetApi
					} = require('./core/net/net-api');
					const res = await NetApi.VheartChat.savePushToken({
						userId: userId,
						token: cid
					});
					console.log('上传cid成功', res);
				} catch (error) {
					console.error('上传cid失败', error);
				}
			}
		}
	}
</script>

<style>
	/* 全局样式 */
	page {
		background-color: #EDEDED;
		font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
		font-size: 16px;
	}

	/* 状态栏占位 - 用于固定在顶部的导航栏 */
	.status-bar {
		width: 100%;
		height: var(--status-bar-height, 20px);
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

	/* 导航栏内容区域 */
	.navbar-content {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		height: var(--nav-bar-height, 44px);
		padding: 0 12px;
	}

	/* 导航栏标题 */
	.navbar-title {
		font-size: 17px;
		font-weight: 600;
		color: #000000;
	}

	/* 页面内容区域 - 用于有固定导航栏的页面 */
	.page-content {
		padding-top: var(--total-header-height, 64px);
	}

	/* 安全区域底部占位 */
	.safe-area-bottom {
		height: var(--safe-area-bottom, 0px);
	}

	/* 隐藏滚动条 */
	::-webkit-scrollbar {
		display: none;
		width: 0 !important;
		height: 0 !important;
		-webkit-appearance: none;
		background: transparent;
	}

	/* 全局文字样式 */
	text {
		font-size: 16px;
		color: #000000;
	}

	/* 小号文字 */
	.text-sm {
		font-size: 14px;
	}

	/* 更小号文字 */
	.text-xs {
		font-size: 12px;
	}

	/* 灰色文字 */
	.text-gray {
		color: #888888;
	}

	/* 浅灰色文字 */
	.text-light-gray {
		color: #B2B2B2;
	}

	/* 单行省略 */
	.ellipsis {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* 两行省略 */
	.ellipsis-2 {
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	/* flex 布局 */
	.flex {
		display: flex;
	}

	.flex-row {
		flex-direction: row;
	}

	.flex-col {
		flex-direction: column;
	}

	.flex-1 {
		flex: 1;
	}

	.items-center {
		align-items: center;
	}

	.justify-center {
		justify-content: center;
	}

	.justify-between {
		justify-content: space-between;
	}
</style>