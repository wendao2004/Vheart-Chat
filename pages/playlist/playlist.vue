<template>
	<view class="main">
		<!-- 头部标题 -->
		<view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="back-btn" @click="goBack">
				<image src="/static/images/back.png" style="width: 32rpx; height: 32rpx;" mode="aspectFit"></image>
			</view>
			<h1 class="app-title">播放列表</h1>
			<view class="header-right">
				<view class="add-btn" @click="showCreatePlaylistDialog">
					<image src="/static/images/plus.png" style="width: 32rpx; height: 32rpx;" mode="aspectFit"></image>
				</view>
			</view>
		</view>

		<!-- 播放模式选择器 -->
		<view class="play-mode-selector">
			<view v-for="mode in playModes" :key="mode.value"
				:class="['mode-item', { active: currentPlayMode === mode.value }]" @click="switchPlayMode(mode.value)">
				<view class="mode-icon">
					<image :src="mode.icon" style="width: 32rpx; height: 32rpx;" mode="aspectFit"></image>
				</view>
				<text class="mode-text">{{ mode.label }}</text>
			</view>
		</view>

		<!-- 当前播放列表 -->
		<view class="current-playlist" v-if="currentPlaylist && safeSongsList.length > 0">
			<view class="playlist-header">
				<text class="playlist-title">当前播放</text>
				<text class="playlist-count">{{ safeSongsList.length }}首</text>
			</view>
			<view class="song-list">
				<view v-for="(song, index) in safeSongsList" :key="getSongKey(song, index)"
					:class="['song-item', { playing: isCurrentPlayingSong(song) }]" @click="playSong(index)">
					<view class="song-index">
						<text v-if="!isCurrentPlayingSong(song)">{{ index + 1 }}</text>
						<image v-else src="/static/images/play.png" style="width: 24rpx; height: 24rpx;"
							mode="aspectFit"></image>
					</view>
					<view class="song-info">
						<view class="song-title">{{ song.title }}</view>
						<view class="song-singer">{{ song.singer }}</view>
					</view>
					<view class="song-actions">
						<view class="action-btn" @click.stop="removeSongFromPlaylist(index)">
							<image src="/static/del.png" style="width: 28rpx; height: 28rpx;" mode="aspectFit"></image>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<image src="/static/images/api1.png" style="width: 200rpx; height: 200rpx;" mode="aspectFit"></image>
			<text class="empty-text">播放列表为空</text>
			<text class="empty-hint">去搜索添加喜欢的歌曲吧</text>
		</view>

		<!-- 用户歌单列表 -->
		<view class="user-playlists" v-if="userPlaylists.length > 0">
			<view class="section-title">我的歌单</view>
			<view class="playlist-list">
				<view v-for="playlist in userPlaylists" :key="playlist.id" class="playlist-item"
					@click="selectPlaylist(playlist)">
					<view class="playlist-cover">
						<image :src="playlist.cover || '/static/images/api1.png'" mode="aspectFill"></image>
					</view>
					<view class="playlist-info">
						<view class="playlist-name">{{ playlist.name }}</view>
						<view class="playlist-meta">{{ (playlist.songs && playlist.songs.length) || 0 }}首歌曲</view>
					</view>
					<view class="playlist-actions">
						<view class="action-btn" @click.stop="editPlaylist(playlist)">
							<image src="/static/images/edit.png" style="width: 28rpx; height: 28rpx;" mode="aspectFit">
							</image>
						</view>
						<view class="action-btn" @click.stop="deletePlaylist(playlist.id)">
							<image src="/static/del.png" style="width: 28rpx; height: 28rpx;" mode="aspectFit"></image>
						</view>
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
				currentPlayMode: 'order',
				currentPlaylist: null,
				currentSongIndex: -1,
				userPlaylists: [],
				newPlaylistName: '',
				editingPlaylistId: '',
				editPlaylistName: '',
				statusBarHeight: 0,
				playModes: [{
					value: 'order',
					label: '顺序播放',
					icon: '/static/images/Play_in_order.png'
				},
				{
					value: 'random',
					label: '随机播放',
					icon: '/static/images/Random_ Song.png'
				},
				{
					value: 'single',
					label: '单曲循环',
					icon: '/static/images/repeat.png'
				}
				]
			}
		},
		computed: {
			safeSongsList() {
				if (!this.currentPlaylist || !Array.isArray(this.currentPlaylist.songs)) {
					return [];
				}
				return this.currentPlaylist.songs;
			}
		},
		onLoad() {
			// 获取系统信息，适配水滴屏
			const systemInfo = uni.getSystemInfoSync();
			this.statusBarHeight = systemInfo.statusBarHeight || 0;
			console.log('状态栏高度:', this.statusBarHeight);

			this.loadPlayState();
			this.loadUserPlaylists();
			this.initCurrentPlaylist();
		},
		onShow() {
			this.loadPlayState();
			this.loadUserPlaylists();
		},
		onPullDownRefresh() {
			this.loadPlayState();
			this.loadUserPlaylists();
			uni.stopPullDownRefresh();
		},
		methods: {
			getSongKey(song : { title : any; singer : any; }, index : string | number) {
				if (!song) return 'song-' + index;
				const t = (song.title || '').toString();
				const s = (song.singer || '').toString();
				return (t && s) ? (t + '_' + s + '_' + index) : ('song-' + index);
			},

			goBack() {
				const pages = getCurrentPages();
				if (pages.length <= 1) {
					uni.switchTab({ url: '/pages/index/index' });
				} else {
					uni.navigateBack({ delta: 1 });
				}
			},

			loadPlayState() {
				try {
					const savedPlayMode = uni.getStorageSync('playMode');
					if (savedPlayMode) {
						this.currentPlayMode = savedPlayMode;
					}

					const savedCurrentPlaylist = uni.getStorageSync('currentPlaylist');
					if (savedCurrentPlaylist) {
						if (!Array.isArray(savedCurrentPlaylist.songs)) {
							savedCurrentPlaylist.songs = [];
						}
						this.currentPlaylist = savedCurrentPlaylist;
					}

					const savedCurrentSongIndex = uni.getStorageSync('currentSongIndex');
					if (savedCurrentSongIndex !== null && savedCurrentSongIndex !== undefined) {
						this.currentSongIndex = savedCurrentSongIndex;
					}
				} catch (e) {
					console.error('加载播放状态失败:', e);
					uni.showToast({ title: '加载播放状态失败', icon: 'none' });
				}
			},

			savePlayState() {
				try {
					uni.setStorageSync('playMode', this.currentPlayMode);
					uni.setStorageSync('currentPlaylist', this.currentPlaylist);
					uni.setStorageSync('currentSongIndex', this.currentSongIndex);
				} catch (e) {
					console.error('保存播放状态失败:', e);
				}
			},

			loadUserPlaylists() {
				try {
					const playlists = uni.getStorageSync('userPlaylists') || [];
					const validatedPlaylists = playlists.map((playlist : { id : any; songs : any; createdAt : any; }) : { id : string; songs : any[]; createdAt : string; } => {
						if (!playlist.id) {
							playlist.id = 'playlist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
						}
						if (!playlist.songs) {
							playlist.songs = [];
						}
						if (!playlist.createdAt) {
							playlist.createdAt = new Date().toISOString();
						}
						return playlist;
					});
					this.userPlaylists = validatedPlaylists;
					if (playlists.length !== validatedPlaylists.length ||
						playlists.some((p : { id : any; }, i : string | number) => p.id !== validatedPlaylists[i].id)) {
						uni.setStorageSync('userPlaylists', validatedPlaylists);
					}
				} catch (e) {
					console.error('加载用户歌单失败:', e);
					this.userPlaylists = [];
					uni.showToast({ title: '加载歌单失败', icon: 'none' });
				}
			},

			saveUserPlaylists() {
				try {
					uni.setStorageSync('userPlaylists', this.userPlaylists);
				} catch (e) {
					console.error('保存用户歌单失败:', e);
				}
			},

			initCurrentPlaylist() {
				if (!this.currentPlaylist) {
					this.currentPlaylist = {
						id: 'current',
						name: '当前播放',
						songs: [],
						cover: '/static/images/api1.png'
					};
					this.savePlayState();
				} else if (!Array.isArray(this.currentPlaylist.songs)) {
					this.currentPlaylist.songs = [];
					this.savePlayState();
				}
			},

			switchPlayMode(mode : string) {
				this.currentPlayMode = mode;
				this.savePlayState();

				const modeText = this.playModes.find(m => m.value === mode)?.label || mode;
				uni.showToast({
					title: modeText,
					icon: 'none'
				});

				uni.$emit('playModeChanged', mode);
			},

			isCurrentPlayingSong(song : { title : any; singer : any; }) {
				if (!this.currentPlaylist || this.currentSongIndex < 0) {
					return false;
				}
				const currentSong = this.currentPlaylist.songs[this.currentSongIndex];
				if (!currentSong) {
					return false;
				}

				return song.title === currentSong.title && song.singer === currentSong.singer;
			},

			playSong(index : number) {
				if (!this.currentPlaylist || !this.currentPlaylist.songs[index]) {
					return;
				}

				this.currentSongIndex = index;
				this.savePlayState();

				const song = this.currentPlaylist.songs[index];

				// 保存当前歌曲数据
				uni.setStorageSync('currentSongData', song);
				uni.setStorageSync('name', song.title);
				uni.setStorageSync('index', 0);

				// 检查是否为本地歌曲
				if (song.isLocal || song.filePath) {
					// 设置为本地歌曲模式
					uni.setStorageSync('isLocalSong', true);
					uni.setStorageSync('localSong', song);
					// 创建备用网络歌曲信息
					uni.setStorageSync('backupNetworkSong', {
						searchText: song.title,
						n: 0
					});
				} else {
					// 设置为网络歌曲模式
					uni.setStorageSync('isLocalSong', false);
					uni.setStorageSync('localSong', null);
					uni.setStorageSync('backupNetworkSong', null);
				}

				uni.navigateTo({
					url: '/pages/player/player'
				});
			},

			removeSongFromPlaylist(index : number) {
				uni.showModal({
					title: '删除确认',
					content: '确定要从播放列表中移除这首歌曲吗？',
					success: (res) => {
						if (res.confirm) {
							if (this.currentPlaylist && Array.isArray(this.currentPlaylist.songs) && this.currentPlaylist.songs[index]) {
								this.currentPlaylist.songs.splice(index, 1);

								if (this.currentSongIndex >= this.currentPlaylist.songs.length) {
									this.currentSongIndex = Math.max(-1, this.currentPlaylist.songs.length - 1);
								}

								this.savePlayState();

								if (this.currentPlaylist.id !== 'current') {
									const playlistIndex = this.userPlaylists.findIndex(p => p.id === this
										.currentPlaylist.id);
									if (playlistIndex !== -1) {
										this.userPlaylists[playlistIndex] = this.currentPlaylist;
										this.saveUserPlaylists();
									}
								}

								uni.showToast({
									title: '已移除',
									icon: 'success'
								});
							}
						}
					}
				});
			},

			createPlaylist() {
				if (!this.newPlaylistName.trim()) {
					uni.showToast({
						title: '请输入歌单名称',
						icon: 'none'
					});
					return;
				}

				const newPlaylist = {
					id: 'playlist_' + Date.now(),
					name: this.newPlaylistName.trim(),
					songs: [],
					cover: '/static/images/api1.png',
					createdAt: new Date().toISOString()
				};

				this.userPlaylists.push(newPlaylist);
				this.saveUserPlaylists();

				uni.showToast({
					title: '创建成功',
					icon: 'success'
				});
			},

			showCreatePlaylistDialog() {
				uni.showModal({
					title: '创建歌单',
					editable: true,
					placeholderText: '请输入歌单名称',
					success: (res) => {
						if (res.confirm && res.content) {
							this.newPlaylistName = res.content.trim();
							this.createPlaylist();
						}
					}
				});
			},

			selectPlaylist(playlist : any) {
				this.currentPlaylist = JSON.parse(JSON.stringify(playlist));
				this.currentSongIndex = -1;
				this.savePlayState();

				uni.showToast({
					title: '已选择歌单',
					icon: 'none'
				});
			},

			editPlaylist(playlist : { name : any; id : string; }) {
				uni.showModal({
					title: '编辑歌单',
					editable: true,
					content: playlist.name,
					placeholderText: '请输入歌单名称',
					success: (res) => {
						if (res.confirm && res.content) {
							this.editingPlaylistId = playlist.id;
							this.editPlaylistName = res.content.trim();
							this.saveEditPlaylist();
						}
					}
				});
			},

			saveEditPlaylist() {
				if (!this.editPlaylistName.trim()) {
					uni.showToast({
						title: '请输入歌单名称',
						icon: 'none'
					});
					return;
				}

				const playlist = this.userPlaylists.find(p => p.id === this.editingPlaylistId);
				if (playlist) {
					playlist.name = this.editPlaylistName.trim();
					this.saveUserPlaylists();
					this.editingPlaylistId = '';
					this.editPlaylistName = '';
					uni.showToast({
						title: '保存成功',
						icon: 'success'
					});
				}
			},

			deletePlaylist(playlistId : any) {
				uni.showModal({
					title: '删除确认',
					content: '确定要删除这个歌单吗？',
					success: (res) => {
						if (res.confirm) {
							const index = this.userPlaylists.findIndex(p => p.id === playlistId);
							if (index !== -1) {
								const wasCurrentPlaylist = this.currentPlaylist && this.currentPlaylist.id === playlistId;
								this.userPlaylists.splice(index, 1);
								this.saveUserPlaylists();

								if (wasCurrentPlaylist) {
									this.currentPlaylist = this.userPlaylists.length > 0
										? JSON.parse(JSON.stringify(this.userPlaylists[0]))
										: { id: 'current', name: '当前播放', songs: [], cover: '/static/images/api1.png' };
									this.currentSongIndex = -1;
									this.savePlayState();
								}

								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});
							}
						}
					}
				});
			},

			getNextSong() {
				if (!this.currentPlaylist || this.currentPlaylist.songs.length === 0) {
					return null;
				}

				let nextIndex = this.currentSongIndex;

				switch (this.currentPlayMode) {
					case 'single':
						return this.currentPlaylist.songs[nextIndex];
					case 'random':
						nextIndex = Math.floor(Math.random() * this.currentPlaylist.songs.length);
						break;
					case 'order':
					default:
						nextIndex = (this.currentSongIndex + 1) % this.currentPlaylist.songs.length;
						break;
				}

				this.currentSongIndex = nextIndex;
				this.savePlayState();
				return this.currentPlaylist.songs[nextIndex];
			},

			getPrevSong() {
				if (!this.currentPlaylist || this.currentPlaylist.songs.length === 0) {
					return null;
				}

				let prevIndex = this.currentSongIndex;

				switch (this.currentPlayMode) {
					case 'single':
						return this.currentPlaylist.songs[prevIndex];
					case 'random':
						prevIndex = Math.floor(Math.random() * this.currentPlaylist.songs.length);
						break;
					case 'order':
					default:
						prevIndex = this.currentSongIndex - 1;
						if (prevIndex < 0) {
							prevIndex = this.currentPlaylist.songs.length - 1;
						}
						break;
				}

				this.currentSongIndex = prevIndex;
				this.savePlayState();
				return this.currentPlaylist.songs[prevIndex];
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
		justify-content: space-between;
		align-items: center;
		padding: 40rpx 30rpx;
		background: linear-gradient(135deg, #FF6B6B, #556270);
		color: white;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.app-title {
		font-size: 44rpx;
		font-weight: bold;
		margin: 0;
		flex: 1;
		text-align: center;
	}

	.header-right {
		width: 60rpx;
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}

	.add-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
	}

	/* 播放模式选择器 */
	.play-mode-selector {
		display: flex;
		justify-content: space-around;
		padding: 30rpx;
		background: white;
		margin: 30rpx;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.mode-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx;
		border-radius: 12rpx;
		transition: all 0.3s;
	}

	.mode-item.active {
		background-color: #FFF0F0;
	}

	.mode-item.active .mode-text {
		color: #FF6B6B;
	}

	.mode-icon {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #f5f5f5;
		border-radius: 50%;
		margin-bottom: 12rpx;
	}

	.mode-item.active .mode-icon {
		background-color: #FF6B6B;
	}

	.mode-text {
		font-size: 24rpx;
		color: #666;
	}

	/* 当前播放列表 */
	.current-playlist {
		margin: 0 30rpx 30rpx;
		background: white;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.playlist-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx 30rpx;
		background-color: #fafafa;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.playlist-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.playlist-count {
		font-size: 24rpx;
		color: #999;
	}

	.song-list {
		padding: 0 30rpx;
	}

	.song-item {
		display: flex;
		align-items: center;
		padding: 24rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
		transition: background-color 0.3s;
	}

	.song-item:last-child {
		border-bottom: none;
	}

	.song-item.playing {
		background-color: #FFF0F0;
	}

	.song-item.playing .song-title {
		color: #FF6B6B;
	}

	.song-index {
		width: 60rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 28rpx;
		color: #999;
	}

	.song-info {
		flex: 1;
		margin: 0 20rpx;
	}

	.song-title {
		font-size: 30rpx;
		color: #333;
		margin-bottom: 8rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.song-singer {
		font-size: 24rpx;
		color: #999;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.song-actions {
		display: flex;
		align-items: center;
	}

	.action-btn {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		background-color: #f5f5f5;
		margin-left: 12rpx;
	}

	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120rpx 40rpx;
		margin: 30rpx;
		background: white;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.empty-text {
		font-size: 32rpx;
		color: #666;
		margin: 30rpx 0 16rpx;
	}

	.empty-hint {
		font-size: 24rpx;
		color: #999;
	}

	/* 用户歌单列表 */
	.user-playlists {
		margin: 0 30rpx 30rpx;
	}

	.section-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #666;
		margin-bottom: 20rpx;
		padding: 0 10rpx;
	}

	.playlist-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.playlist-item {
		display: flex;
		align-items: center;
		padding: 24rpx;
		background: white;
		border-radius: 16rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		transition: all 0.3s;
	}

	.playlist-item:active {
		background-color: #f9f9f9;
	}

	.playlist-cover {
		width: 120rpx;
		height: 120rpx;
		border-radius: 12rpx;
		overflow: hidden;
		margin-right: 20rpx;
		background-color: #f5f5f5;
	}

	.playlist-cover image {
		width: 100%;
		height: 100%;
	}

	.playlist-info {
		flex: 1;
	}

	.playlist-name {
		font-size: 32rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 8rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.playlist-meta {
		font-size: 24rpx;
		color: #999;
	}

	.playlist-actions {
		display: flex;
		align-items: center;
	}
</style>