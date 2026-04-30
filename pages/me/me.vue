<template>
	<view class="main">
		<!-- 头部标题 -->
		<view class="header">
			<h1 class="app-title">个人中心</h1>
		</view>

		<!-- 用户信息卡片 -->
		<view class="user-info-card">
			<view class="user-avatar">
				<image src="/static/images/api1.png" mode="aspectFill"></image>
			</view>
			<view class="user-details">
				<view class="user-name">音乐爱好者</view>
				<view class="user-stats">
					<text class="stat-item">{{ localSongCount }}首本地歌曲</text>
					<text class="stat-divider">|</text>
					<text class="stat-item">{{ playHistoryCount }}次播放</text>
				</view>
			</view>
		</view>

		<!-- 最近播放 -->
		<view class="settings-section" v-if="recentPlayList.length > 0">
			<view class="section-title">最近播放</view>
			<view class="recent-play-list">
				<view v-for="(item, index) in recentPlayList" :key="(item.playedAt || index) + ''"
					class="recent-play-item" @click="playFromHistory(item, index)">
					<view class="recent-play-cover">
						<image :src="item.cover || '/static/images/api1.png'" mode="aspectFill"></image>
					</view>
					<view class="recent-play-info">
						<text class="recent-play-title">{{ item.title }}</text>
						<text class="recent-play-singer">{{ item.singer || '未知歌手' }}</text>
					</view>
					<view class="recent-play-arrow">
						<image src="/static/images/play.png" style="width: 32rpx; height: 32rpx;" mode="aspectFit">
						</image>
					</view>
				</view>
			</view>
		</view>

		<!-- 播放设置 -->
		<view class="settings-section">
			<view class="section-title">播放设置</view>
			<view class="setting-item" @click="togglePlayMode">
				<view class="setting-left">
					<view class="setting-icon">
						<image src="/static/images/play_mode.png" style="width: 42rpx; height: 42rpx;" mode="aspectFit">
						</image>
					</view>
					<text class="setting-label">播放模式</text>
				</view>
				<view class="setting-right">
					<text class="setting-value">{{ playModeText }}</text>
					<image src="/static/images/right.png" style="width: 24rpx; height: 24rpx;" mode="aspectFit"></image>
				</view>
			</view>
			<view class="setting-item" @click="toggleAutoPlay">
				<view class="setting-left">
					<view class="setting-icon">
						<image src="/static/images/play.png" style="width: 42rpx; height: 42rpx;" mode="aspectFit">
						</image>
					</view>
					<text class="setting-label">自动播放</text>
				</view>
				<view class="setting-right">
					<switch :checked="autoPlay" @change="onAutoPlayChange" color="#FF6B6B" />
				</view>
			</view>
		</view>

		<!-- 存储管理 -->
		<view class="settings-section">
			<view class="section-title">存储管理</view>
			<view class="setting-item" @click="showStorageInfo">
				<view class="setting-left">
					<view class="setting-icon">
						<image src="/static/download.png" style="width: 42rpx; height: 42rpx;" mode="aspectFit"></image>
					</view>
					<text class="setting-label">存储空间</text>
				</view>
				<view class="setting-right">
					<text class="setting-value">{{ storageSummary }}</text>
					<image src="/static/images/right.png" style="width: 24rpx; height: 24rpx;" mode="aspectFit"></image>
				</view>
			</view>
			<view class="setting-item" @click="showLocalSongs">
				<view class="setting-left">
					<view class="setting-icon">
						<image src="/static/music.png" style="width: 42rpx; height: 42rpx;" mode="aspectFit"></image>
					</view>
					<text class="setting-label">本地歌曲</text>
				</view>
				<view class="setting-right">
					<text class="setting-value">{{ localSongCount }}首</text>
					<image src="/static/images/right.png" style="width: 24rpx; height: 24rpx;" mode="aspectFit"></image>
				</view>
			</view>
			<view class="setting-item" @click="clearCache">
				<view class="setting-left">
					<view class="setting-icon">
						<image src="/static/images/Clear_cache.png" style="width: 42rpx; height: 42rpx;"
							mode="aspectFit"></image>
					</view>
					<text class="setting-label">清理缓存</text>
				</view>
				<view class="setting-right">
					<text class="setting-value">{{ cacheSize }}</text>
					<image src="/static/images/right.png" style="width: 24rpx; height: 24rpx;" mode="aspectFit"></image>
				</view>
			</view>
		</view>

		<!-- 关于 -->
		<view class="settings-section">
			<view class="section-title">关于</view>
			<view class="setting-item" @click="showAbout">
				<view class="setting-left">
					<view class="setting-icon">
						<image src="/static/images/api1.png" style="width: 42rpx; height: 42rpx;" mode="aspectFit">
						</image>
					</view>
					<text class="setting-label">关于我们</text>
				</view>
				<view class="setting-right">
					<text class="setting-value">v3.0.0</text>
					<image src="/static/images/right.png" style="width: 42rpx; height: 42rpx;" mode="aspectFit"></image>
				</view>
			</view>
			<view class="setting-item" @click="showFeedback">
				<view class="setting-left">
					<view class="setting-icon">
						<image src="/static/images/FeedBack.png" style="width: 42rpx; height: 42rpx;" mode="aspectFit">
						</image>
					</view>
					<text class="setting-label">意见反馈</text>
				</view>
				<view class="setting-right">
					<image src="/static/images/right.png" style="width: 24rpx; height: 24rpx;" mode="aspectFit"></image>
				</view>
			</view>
		</view>

		<!-- 版本信息 -->
		<view class="version-info">
			<text class="version-text">VHeart音乐盒 v3.0</text>
			<text class="copyright-text">文刀出品 @vvendae</text>
		</view>

		<!-- 本地歌曲列表模态框 -->
		<view class="modal" v-if="showLocalSongsModal" @click="closeLocalSongsModal">
			<view class="modal-content local-songs-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">本地歌曲</text>
					<view class="header-actions">
						<text class="select-all-text"
							@click="toggleSelectAll">{{ isAllSelected ? '取消全选' : '全选' }}</text>
						<view class="delete-selected-btn" v-if="selectedSongs.length > 0" @click="deleteSelectedSongs">
							<text class="delete-text">删除({{ selectedSongs.length }})</text>
						</view>
					</view>
					<view class="close-btn" @click="closeLocalSongsModal">
						<image src="/static/images/close.png" style="width: 32rpx; height: 32rpx;" mode="aspectFit">
						</image>
					</view>
				</view>
				<view class="modal-body local-songs-body">
					<view v-if="localSongsList.length > 0" class="local-songs-list">
						<view v-for="(song, index) in localSongsList" :key="index"
							:class="['local-song-item', { selected: selectedSongs.includes(index) }]"
							@click="toggleSongSelection(index)">
							<view class="song-checkbox">
								<view v-if="selectedSongs.includes(index)" class="checkbox-checked"></view>
								<view v-else class="checkbox-unchecked"></view>
							</view>
							<view class="song-cover">
								<image :src="song.coverUrl || song.cover || '/static/images/api1.png'"
									mode="aspectFill"></image>
							</view>
							<view class="song-info">
								<text class="song-title">{{ song.title }}</text>
								<text class="song-singer">{{ song.singer }}</text>
								<text class="song-size" v-if="song.fileSize">{{ formatFileSize(song.fileSize) }}</text>
							</view>
							<view class="song-play-btn" @click.stop="playSong(song)">
								<image src="/static/images/play.png" style="width: 32rpx; height: 32rpx;"
									mode="aspectFit"></image>
							</view>
						</view>
					</view>
					<view v-else class="empty-local-songs">
						<text class="empty-text">暂无本地歌曲</text>
					</view>
				</view>
			</view>
		</view>

		<tabbar :current="1" />
	</view>
</template>

<script lang="ts">
	import tabbar from '../../common/tabbar/tabbar.vue';
	export default {
		components: {
			tabbar
		},
		data() {
			return {
				localSongCount: 0,
				playHistoryCount: 0,
				playMode: 'order',
				autoPlay: true,
				storageUsed: '0 MB',
				storageTotal: '--',
				cacheSize: '0 MB',
				// 最近播放（取播放历史最后 N 条，展示时倒序）
				recentPlayList: [],
				// 本地歌曲列表相关
				showLocalSongsModal: false,
				localSongsList: [],
				selectedSongs: []
			}
		},
		computed: {
			playModeText() {
				const modeMap = {
					'order': '顺序播放',
					'random': '随机播放',
					'single': '单曲循环'
				};
				return modeMap[this.playMode] || '顺序播放';
			},
			storageSummary() {
				if (this.storageTotal && this.storageTotal !== '--') {
					return this.storageUsed + ' / ' + this.storageTotal;
				}
				return '已用 ' + this.storageUsed;
			},
			isAllSelected() {
				return this.localSongsList.length > 0 && this.selectedSongs.length === this.localSongsList.length;
			}
		},
		onLoad() {
			this.loadUserData();
			this.loadSettings();
			this.calculateStorage();
		},
		onShow() {
			this.loadUserData();
			this.calculateStorage();
		},
		methods: {
			loadUserData() {
				try {
					const localPlaylist = uni.getStorageSync('localPlaylist') || [];
					// 过滤有效的歌曲数据
					const validSongs = localPlaylist.filter((song : { filePath : any; title : any; }) : { filePath : any; title : any; } => song && (song.filePath || song.title));
					this.localSongCount = validSongs.length;

					const playHistory = uni.getStorageSync('playHistory') || [];
					this.playHistoryCount = playHistory.length;
					// 最近播放：取最后 20 条，倒序（新的在前）
					const recent = playHistory.slice(-20).reverse();
					this.recentPlayList = recent;
				} catch (e) {
					console.error('加载用户数据失败:', e);
				}
			},

			loadSettings() {
				try {
					const savedPlayMode = uni.getStorageSync('playMode');
					if (savedPlayMode) {
						this.playMode = savedPlayMode;
					}

					const savedAutoPlay = uni.getStorageSync('autoPlay');
					if (savedAutoPlay !== undefined) {
						this.autoPlay = savedAutoPlay;
					}
				} catch (e) {
					console.error('加载设置失败:', e);
				}
			},

			calculateStorage() {
				try {
					const localPlaylist = uni.getStorageSync('localPlaylist') || [];
					let totalSize = 0;

					localPlaylist.forEach(song => {
						if (song && (song.fileSize || song.size)) {
							totalSize += parseInt(song.fileSize || song.size) || 0;
						}
					});

					// 如果没有歌曲，设置一个默认值用于测试
					if (totalSize === 0 && localPlaylist.length > 0) {
						// 假设每首歌平均3MB
						totalSize = localPlaylist.length * 3 * 1024 * 1024;
					}

					this.storageUsed = this.formatFileSize(totalSize);

					// 获取存储信息来计算缓存
					uni.getStorageInfo({
						success: (res) => {
							// 计算缓存大小：总存储使用量减去本地歌曲文件大小
							// res.currentSize 是当前存储使用量（KB），res.limitSize 为容量上限（KB）
							const totalStorageUsed = (res.currentSize || 0) * 1024;
							const limitBytes = (res.limitSize || 0) * 1024;
							this.cacheSize = this.formatFileSize(Math.max(0, totalStorageUsed - totalSize));
							this.storageTotal = limitBytes > 0 ? this.formatFileSize(limitBytes) : '--';
						},
						fail: () => {
							// 获取失败时，缓存设为0
							this.cacheSize = '0 B';
							this.storageTotal = '--';
						}
					});
				} catch (e) {
					console.error('计算存储空间失败:', e);
					this.storageUsed = '0 B';
					this.cacheSize = '0 B';
				}
			},

			formatFileSize(bytes : any) {
				// 确保bytes是数字类型
				const numBytes = Number(bytes);
				if (isNaN(numBytes) || numBytes === 0) return '0 B';
				const k = 1024;
				const sizes = ['B', 'KB', 'MB', 'GB'];
				const i = Math.min(Math.floor(Math.log(numBytes) / Math.log(k)), sizes.length - 1);
				if (i < 0) return '0 B';
				return Math.round(numBytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
			},

			togglePlayMode() {
				const modes = ['order', 'random', 'single'];
				const currentIndex = modes.indexOf(this.playMode);
				const nextIndex = (currentIndex + 1) % modes.length;
				this.playMode = modes[nextIndex];

				uni.setStorageSync('playMode', this.playMode);

				uni.showToast({
					title: this.playModeText,
					icon: 'none'
				});
			},

			toggleAutoPlay() {
				this.autoPlay = !this.autoPlay;
				uni.setStorageSync('autoPlay', this.autoPlay);

				uni.showToast({
					title: this.autoPlay ? '自动播放已开启' : '自动播放已关闭',
					icon: 'none'
				});
			},

			onAutoPlayChange(e : any) {
				this.autoPlay = e.detail.value;
				uni.setStorageSync('autoPlay', this.autoPlay);
			},

			showStorageInfo() {
				const totalText = this.storageTotal && this.storageTotal !== '--' ? `总容量: ${this.storageTotal}\n\n` : '';
				uni.showModal({
					title: '存储空间',
					content: `已使用: ${this.storageUsed}\n${totalText}本地歌曲: ${this.localSongCount}首`,
					showCancel: false
				});
			},

			clearCache() {
				uni.showModal({
					title: '清理缓存',
					content: '确定要清理缓存吗？这不会删除您的本地歌曲。',
					success: (res) => {
						if (res.confirm) {
							try {
								const localPlaylist = uni.getStorageSync('localPlaylist') || [];
								const playHistory = uni.getStorageSync('playHistory') || [];
								const playMode = uni.getStorageSync('playMode') || 'order';
								const autoPlay = uni.getStorageSync('autoPlay') !== undefined ? uni
									.getStorageSync('autoPlay') : true;

								uni.clearStorageSync();

								uni.setStorageSync('localPlaylist', localPlaylist);
								uni.setStorageSync('playHistory', playHistory);
								uni.setStorageSync('playMode', playMode);
								uni.setStorageSync('autoPlay', autoPlay);

								uni.showToast({
									title: '缓存已清理',
									icon: 'success'
								});

								setTimeout(() => {
									this.loadUserData();
									this.calculateStorage();
								}, 500);
							} catch (e) {
								console.error('清理缓存失败:', e);
								uni.showToast({
									title: '清理失败',
									icon: 'none'
								});
							}
						}
					}
				});
			},

			showAbout() {
				uni.showModal({
					title: '关于我们',
					content: 'VHeart音乐盒是一款简洁好用的音乐播放器，支持在线搜索和本地播放。\n\n版本: v3.0\n开发者: 文刀\n联系: @vvendae',
					showCancel: false
				});
			},

			showFeedback() {
				uni.showModal({
					title: '意见反馈',
					content: '如有任何问题或建议，欢迎通过以下方式联系我们：\n\n邮箱: 1601261772@qq.com\n微信: vvendae',
					showCancel: false
				});
			},

			// 显示本地歌曲列表
			showLocalSongs() {
				try {
					const localPlaylist = uni.getStorageSync('localPlaylist') || [];
					// 过滤有效的歌曲数据
					this.localSongsList = localPlaylist.filter((song : { filePath : any; title : any; }) : { filePath : any; title : any; } => song && (song.filePath || song.title));
					this.selectedSongs = [];
					this.showLocalSongsModal = true;
				} catch (e) {
					console.error('加载本地歌曲列表失败:', e);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				}
			},

			// 关闭本地歌曲列表
			closeLocalSongsModal() {
				this.showLocalSongsModal = false;
				this.selectedSongs = [];
			},

			// 切换歌曲选择状态
			toggleSongSelection(index : number) {
				const selectedIndex = this.selectedSongs.indexOf(index);
				if (selectedIndex > -1) {
					this.selectedSongs.splice(selectedIndex, 1);
				} else {
					this.selectedSongs.push(index);
				}
			},

			// 全选/取消全选
			toggleSelectAll() {
				if (this.isAllSelected) {
					this.selectedSongs = [];
				} else {
					this.selectedSongs = this.localSongsList.map((_, index) => index);
				}
			},

			// 播放歌曲
			playSong(song : any) {
				// 保存本地歌曲信息
				uni.setStorageSync('localSong', song);
				uni.setStorageSync('isLocalSong', true);

				// 跳转到播放页面
				uni.navigateTo({
					url: '/pages/player/player'
				});
			},

			// 从最近播放点击进入播放
			playFromHistory(item : { isLocal : any; filePath : any; }, index : number) {
				const list = uni.getStorageSync('playHistory') || [];
				const recent = list.slice(-20).reverse();
				uni.setStorageSync('currentPlaylist', {
					id: 'recent',
					name: '最近播放',
					songs: recent,
					cover: '/static/images/api1.png'
				});
				uni.setStorageSync('currentSongIndex', index);
				if (item.isLocal && item.filePath) {
					uni.setStorageSync('localSong', item);
					uni.setStorageSync('isLocalSong', true);
				} else {
					uni.setStorageSync('currentSongData', item);
				}
				uni.navigateTo({
					url: '/pages/player/player'
				});
			},

			// 删除选中的歌曲
			deleteSelectedSongs() {
				if (this.selectedSongs.length === 0) {
					return;
				}

				uni.showModal({
					title: '删除确认',
					content: `确定要删除选中的${this.selectedSongs.length}首歌曲吗？`,
					success: (res) => {
						if (res.confirm) {
							try {
								// 按索引从大到小排序，避免删除时索引错位
								const sortedIndices = [...this.selectedSongs].sort((a, b) => b - a);

								// 获取本地歌单
								let localPlaylist = uni.getStorageSync('localPlaylist') || [];

								// 要删除的歌曲列表
								const songsToDelete = [];

								// 收集要删除的歌曲
								sortedIndices.forEach(index => {
									if (this.localSongsList[index]) {
										songsToDelete.push(this.localSongsList[index]);
									}
								});

								// 批量删除本地文件
								let deleteCount = 0;
								songsToDelete.forEach(song => {
									if (song.filePath) {
										try {
											// 删除本地文件
											uni.removeSavedFile({
												filePath: song.filePath,
												success: () => {
													deleteCount++;
													console.log('删除文件成功:', song.filePath);
												},
												fail: (err) => {
													console.warn('删除文件失败:', err, song.filePath);
													// 继续执行，不影响其他文件删除
												}
											});
										} catch (err) {
											console.warn('删除文件时出错:', err);
										}
									}
								});

								// 从本地歌单中移除歌曲
								localPlaylist = localPlaylist.filter(song => {
									return !songsToDelete.some(deletedSong =>
										(song.title === deletedSong.title && song.singer === deletedSong.singer)
									);
								});

								// 保存更新后的本地歌单
								uni.setStorageSync('localPlaylist', localPlaylist);

								// 更新本地歌曲列表
								this.localSongsList = localPlaylist.filter((song : { filePath : any; title : any; }) : { filePath : any; title : any; } => song && (song.filePath || song.title));

								// 清空选择
								this.selectedSongs = [];

								// 更新统计信息
								this.localSongCount = this.localSongsList.length;
								this.calculateStorage();

								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});

								// 如果没有歌曲了，关闭模态框
								if (this.localSongsList.length === 0) {
									this.closeLocalSongsModal();
								}
							} catch (e) {
								console.error('删除歌曲失败:', e);
								uni.showToast({
									title: '删除失败',
									icon: 'none'
								});
							}
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	page {
		background-color: #f5f5f5;
		color: #333;
	}

	.main {
		min-height: 100vh;
		padding-bottom: 30rpx;
	}

	/* 头部标题 */
	.header {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 40rpx 0;
		background: linear-gradient(135deg, #FF6B6B, #556270);
		color: white;
	}

	.app-title {
		font-size: 44rpx;
		font-weight: bold;
		margin: 0;
	}

	/* 用户信息卡片 */
	.user-info-card {
		display: flex;
		align-items: center;
		margin: 30rpx;
		padding: 30rpx;
		background: white;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.user-avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 24rpx;
		background: linear-gradient(135deg, #FF6B6B, #556270);
		display: flex;
		justify-content: center;
		align-items: center;

		image {
			width: 100%;
			height: 100%;
		}
	}

	.user-details {
		flex: 1;
	}

	.user-name {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 12rpx;
	}

	.user-stats {
		display: flex;
		align-items: center;
		font-size: 24rpx;
		color: #999;
	}

	.stat-item {
		margin-right: 8rpx;
	}

	.stat-divider {
		margin: 0 8rpx;
	}

	/* 设置区块 */
	.settings-section {
		margin: 0 30rpx 30rpx;
		background: white;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.section-title {
		padding: 24rpx 30rpx 16rpx;
		font-size: 28rpx;
		font-weight: bold;
		color: #666;
		background-color: #fafafa;
	}

	.recent-play-list {
		padding: 0 30rpx 20rpx;
	}

	.recent-play-item {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;

		&:last-child {
			border-bottom: none;
		}

		&:active {
			background-color: #f9f9f9;
		}
	}

	.recent-play-cover {
		width: 88rpx;
		height: 88rpx;
		border-radius: 12rpx;
		overflow: hidden;
		margin-right: 24rpx;
		background: #f0f0f0;
	}

	.recent-play-cover image {
		width: 100%;
		height: 100%;
	}

	.recent-play-info {
		flex: 1;
		min-width: 0;
	}

	.recent-play-title {
		display: block;
		font-size: 28rpx;
		color: #333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.recent-play-singer {
		display: block;
		font-size: 24rpx;
		color: #999;
		margin-top: 6rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.recent-play-arrow {
		padding: 10rpx;
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		transition: background-color 0.3s;

		&:last-child {
			border-bottom: none;
		}

		&:active {
			background-color: #f9f9f9;
		}
	}

	.setting-left {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.setting-icon {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #f5f5f5;
		border-radius: 12rpx;
		margin-right: 20rpx;
	}

	.setting-label {
		font-size: 30rpx;
		color: #333;
	}

	.setting-right {
		display: flex;
		align-items: center;
	}

	.setting-value {
		font-size: 26rpx;
		color: #999;
		margin-right: 12rpx;
	}

	/* 版本信息 */
	.version-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40rpx 0;
	}

	.version-text {
		font-size: 24rpx;
		color: #999;
		margin-bottom: 8rpx;
	}

	.copyright-text {
		font-size: 22rpx;
		color: #ccc;
	}

	/* 模态框样式 */
	.modal {
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
		background: white;
		border-radius: 16rpx;
		width: 90%;
		max-width: 700rpx;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		background-color: #fafafa;
	}

	.modal-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		flex: 1;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.select-all-text {
		font-size: 26rpx;
		color: #FF6B6B;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		background-color: #FFF0F0;
	}

	.delete-selected-btn {
		padding: 8rpx 20rpx;
		background: linear-gradient(135deg, #FF6B6B, #556270);
		border-radius: 20rpx;
	}

	.delete-text {
		font-size: 24rpx;
		color: white;
		font-weight: 500;
	}

	.close-btn {
		width: 48rpx;
		height: 48rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 20rpx 30rpx;
	}

	.local-songs-content {
		max-height: 70vh;
	}

	.local-songs-body {
		max-height: 60vh;
	}

	.local-songs-list {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.local-song-item {
		display: flex;
		align-items: center;
		padding: 24rpx;
		background: #f9f9f9;
		border-radius: 12rpx;
		transition: all 0.3s;
	}

	.local-song-item.selected {
		background: #FFF0F0;
	}

	.local-song-item:active {
		background: #f0f0f0;
	}

	.song-checkbox {
		width: 40rpx;
		height: 40rpx;
		margin-right: 20rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.checkbox-checked {
		width: 32rpx;
		height: 32rpx;
		background: linear-gradient(135deg, #FF6B6B, #556270);
		border-radius: 6rpx;
		position: relative;
	}

	.checkbox-checked::after {
		content: '✓';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 20rpx;
		font-weight: bold;
	}

	.checkbox-unchecked {
		width: 32rpx;
		height: 32rpx;
		border: 2rpx solid #ddd;
		border-radius: 6rpx;
		background: white;
	}

	.song-cover {
		width: 80rpx;
		height: 80rpx;
		border-radius: 8rpx;
		overflow: hidden;
		margin-right: 20rpx;
		background: #f0f0f0;
	}

	.song-cover image {
		width: 100%;
		height: 100%;
	}

	.song-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.song-title {
		font-size: 30rpx;
		color: #333;
		font-weight: 500;
		margin-bottom: 8rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.song-singer {
		font-size: 24rpx;
		color: #999;
		margin-bottom: 6rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.song-size {
		font-size: 22rpx;
		color: #ccc;
	}

	.song-play-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(135deg, #FF6B6B, #556270);
		border-radius: 50%;
		margin-left: 20rpx;
	}

	.song-play-btn image {
		width: 32rpx;
		height: 32rpx;
	}

	.empty-local-songs {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 100rpx 0;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
</style>