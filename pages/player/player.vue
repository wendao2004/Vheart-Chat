<template>
	<view class="main">
		<!-- 头部标题 -->
		<view class="header">
			<text style="color: white; font-size: 28rpx;" @click="backToHome">← 返回</text>
			<h1 class="app-title">VHeart音乐盒</h1>
			<view class="header-right"></view>
		</view>

		<!-- 歌曲标题 -->
		<view class="song-title-section">
			<h3 class="T">{{ songInfo.title }}</h3>
			<p class="singer">{{ songInfo.singer }}</p>
		</view>

		<!-- 封面 -->
		<view class="pic">
			<img class="p" :src="coverUrl" alt="专辑封面" />
		</view>

		<!-- 歌曲信息 -->
		<view class="song-info">
			<view class="info-item">
				<text class="info-label">音质：</text>
				<text class="info-value">{{ songInfo.quality }}</text>
			</view>
		</view>

		<!-- 查看下载路径按钮 -->
		<view class="view-path-section" v-if="hasDownloaded">
			<button class="view-path-btn" @click.stop="openDownloadPath">
				查看下载路径
			</button>
		</view>

		<!-- 歌词显示区域 -->
		<view class="lyrics-container">
			<scroll-view scroll-y class="lyrics-scroll" :scroll-top="lyricsScrollTop" ref="lyricsScroll">
				<view v-for="(line, index) in lyricsList" :key="index"
					:class="['lyrics-line', { active: currentLine === index }]">
					{{ line.text }}
				</view>
			</scroll-view>
		</view>

		<!-- 底部播放卡片（合并进度条和控制按钮） -->
		<view class="play_stations">
			<!-- 进度条 - 即使没有时长也显示 -->
			<view class="progress-container">
				<slider class="progress-slider" activeColor="#FF6B6B" backgroundColor="#ddd" block-size="10"
					block-color="#FF6B6B" :value="progress" @change="handleProgressChange" />
			</view>
			<!-- 底部播放卡片 - 重新设计布局 -->
			<view class="player-card">
				<!-- 左侧：缩略图 -->
				<view class="thumbnail-container">
					<image class="song-thumbnail" :src="coverUrl" mode="aspectFit"></image>
				</view>
				<!-- 中间：歌曲信息（优先展示） -->
				<view class="song-info-container">
					<view class="song-basic-info">
						<text class="song-name">{{ songInfo.title }}</text>
						<text class="song-artist">{{ songInfo.singer }}</text>
					</view>
					<!-- 时间信息 - 清晰可见 -->
					<view class="time-info">
						<text class="current-time">{{ audioTimeUpdate }}</text>
						<text class="divider">/</text>
						<text class="duration-time">{{ duration > 0 ? formatTime(duration) : '--:--' }}</text>
					</view>
				</view>
				<!-- 右侧：播放控制按钮（精简布局） -->
				<view class="card-right">
					<view class="control-buttons">
						<!-- 上一首按钮 -->
						<view class="prev-btn-mini" @click="playPrevSong">
							<image src="/static/images/last.png" style="width: 36px;height: 36px;" mode="aspectFit">
							</image>
						</view>
						<!-- 播放/暂停按钮（核心交互） -->
						<view class="play-pause-btn" @click="togglePlayPause">
							<image :src="isPlaying ? '/static/images/pause.png' : '/static/images/play.png'"
								mode="aspectFit"></image>
						</view>
						<!-- 下一首按钮 -->
						<view class="next-btn-mini" @click="playNextSong">
							<image src="/static/images/next.png" style="width: 36px;height: 36px;" mode="aspectFit">
							</image>
						</view>
						<!-- 更多功能按钮（面包屑折叠按钮） -->
						<view class="more-btn" @click="toggleMoreMenu">
							<text class="more-icon">•••</text>
						</view>
					</view>
				</view>
			</view>
			<!-- 更多功能折叠菜单 -->
			<view class="more-menu" v-if="showMoreMenu" @click="closeMoreMenu">
				<view class="more-menu-content" @click.stop>
					<!-- 下载按钮 -->
					<view class="more-menu-item" @click="downloadMusic">
						<image src="/static/download.png" style="width: 40rpx;height: 40rpx;" mode="aspectFit"></image>
						<text class="more-menu-text">下载歌曲</text>
					</view>
					<!-- 添加到歌单按钮 -->
					<view class="more-menu-item" @click="showAddToPlaylist">
						<text class="more-menu-icon">+</text>
						<text class="more-menu-text">添加到歌单</text>
					</view>
					<!-- 播放模式切换按钮 -->
					<view class="more-menu-item" @click="togglePlayMode">
						<text class="more-menu-mode-text">{{ getPlayModeShortText() }}</text>
						<text class="more-menu-text">切换播放模式</text>
					</view>
				</view>
			</view>
			<!-- 使用luch-audio组件实现后台播放功能 -->
			<luch-audio :src="songInfo && songInfo.music_url ? songInfo.music_url : ''"
				:name="songInfo && songInfo.title ? songInfo.title : '未知歌曲'"
				:author="songInfo && songInfo.singer ? songInfo.singer : '未知歌手'" :poster="coverUrl" :autoplay="autoPlay"
				:play.sync="isPlaying" ref="luchAudio" :initAudio="initAudioContext" @onPlay="onAudioPlay"
				@onPause="onAudioPause" @onTimeUpdate="onTimeUpdate" @onError="onAudioError" @onEnded="onAudioEnded"
				style="position: fixed; z-index: 1000; width: 100%; height: 100%; pointer-events: none; opacity: 0;" />
		</view>

		<!-- 歌单选择模态框 -->
		<view class="modal" v-if="showPlaylistModal" @click="closePlaylistModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">添加到歌单</text>
					<view class="close-btn" @click="closePlaylistModal">
						<image src="/static/images/close.png" style="width: 32rpx; height: 32rpx;" mode="aspectFit">
						</image>
					</view>
				</view>
				<view class="modal-body">
					<view v-if="userPlaylists.length > 0" class="playlist-list">
						<view v-for="playlist in userPlaylists" :key="playlist.id" class="playlist-item">
							<view class="playlist-main" @click="addToPlaylist(playlist)">
								<image :src="playlist.cover || '/static/images/api1.png'"
									style="width: 80rpx; height: 80rpx;" mode="aspectFit"></image>
								<view class="playlist-info">
									<text class="playlist-name">{{ playlist.name }}</text>
									<text
										class="playlist-count">{{ (playlist.songs && playlist.songs.length) ? playlist.songs.length : 0 }}
										首歌曲</text>
								</view>
							</view>
							<view class="playlist-action-btn" @click="viewPlaylistDetail(playlist)">
								<text class="action-text">查看</text>
							</view>
						</view>
					</view>
					<view v-else class="empty-playlist">
						<text class="empty-text">暂无歌单</text>
						<button class="create-playlist-btn" @click="showCreatePlaylist">创建歌单</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 创建歌单模态框 -->
		<view class="modal" v-if="showCreatePlaylistModal" @click="closeCreatePlaylistModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">创建歌单</text>
					<view class="close-btn" @click="closeCreatePlaylistModal">
						<image src="/static/images/close.png" style="width: 32rpx; height: 32rpx;" mode="aspectFit">
						</image>
					</view>
				</view>
				<view class="modal-body">
					<textarea class="playlist-name-input" v-model="newPlaylistName" placeholder="请输入歌单名称" maxlength="30"
						auto-height />
					<textarea class="playlist-description-input" v-model="newPlaylistDescription"
						placeholder="请输入歌单描述（可选）" maxlength="100" auto-height />
				</view>
				<view class="modal-footer">
					<button class="btn-cancel" @click="closeCreatePlaylistModal">取消</button>
					<button class="btn-confirm" @click="createPlaylist">创建</button>
				</view>
			</view>
		</view>

		<!-- 歌单详情模态框 -->
		<!-- 歌单详情悬浮弹窗 -->
		<view class="modal" v-if="showPlaylistDetailModal" @click="closePlaylistDetailModal">
			<view class="modal-content playlist-detail-content" @click.stop>
				<view class="modal-header">
					<view class="playlist-header-info">
						<image
							:src="currentViewingPlaylist ? (currentViewingPlaylist.cover || '/static/images/api1.png') : '/static/images/api1.png'"
							class="playlist-cover" mode="aspectFill"></image>
						<view class="playlist-header-text">
							<text
								class="modal-title">{{ currentViewingPlaylist ? currentViewingPlaylist.name : '歌单详情' }}</text>
							<text
								class="playlist-subtitle">{{ currentViewingPlaylist && currentViewingPlaylist.songs ? currentViewingPlaylist.songs.length : 0 }}
								首歌曲</text>
						</view>
					</view>
					<view class="close-btn" @click="closePlaylistDetailModal">
						<image src="/static/images/close.png" style="width: 32rpx; height: 32rpx;" mode="aspectFit">
						</image>
					</view>
				</view>
				<view class="modal-body playlist-detail-body">
					<view
						v-if="currentViewingPlaylist && currentViewingPlaylist.songs && currentViewingPlaylist.songs.length > 0"
						class="playlist-songs-list">
						<view v-for="(song, index) in currentViewingPlaylist.songs"
							:key="getPlaylistSongKey(song, index)"
							:class="['playlist-song-item', { playing: isCurrentSongInPlaylist(song) }]"
							@click="playSongFromPlaylistDetail(song)">
							<view class="song-index">
								<text v-if="!isCurrentSongInPlaylist(song)">{{ index + 1 }}</text>
								<image v-else src="/static/images/play.png" style="width: 24rpx; height: 24rpx;"
									mode="aspectFit"></image>
							</view>
							<view class="song-info">
								<text class="song-title">{{ song.title }}</text>
								<text class="song-singer">{{ song.singer }}</text>
							</view>
							<view class="song-duration">
								<text>{{ song.duration || '--:--' }}</text>
							</view>
						</view>
					</view>
					<view v-else class="empty-playlist-songs">
						<image src="/static/images/empty.png" style="width: 120rpx; height: 120rpx; opacity: 0.5;"
							mode="aspectFit"></image>
						<text class="empty-text">歌单暂无歌曲</text>
						<button class="add-songs-btn" @click="closePlaylistDetailModal">去添加歌曲</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 歌曲列表页面 -->
		<view class="playlist-page" v-if="showPlaylistPage">
			<view class="playlist-page-header">
				<view class="back-btn" @click="closePlaylistPage">
					<image src="/static/images/back.png" style="width: 40rpx; height: 40rpx;" mode="aspectFit"></image>
				</view>
				<view class="playlist-page-title">
					<text>{{ currentViewingPlaylist ? currentViewingPlaylist.name : '歌曲列表' }}</text>
				</view>
				<view class="playlist-page-actions">
					<view class="sort-btn" @click="showSortMenu = !showSortMenu">
						<text>排序</text>
						<image src="/static/images/right.png"
							style="width: 24rpx; height: 24rpx; transform: rotate(90deg);" mode="aspectFit"></image>
					</view>
				</view>
			</view>

			<!-- 搜索框 -->
			<view class="search-bar">
				<input class="search-input" v-model="playlistSearchKeyword" placeholder="搜索歌曲"
					@input="searchPlaylistSongs" />
				<image src="/static/images/search.png" style="width: 32rpx; height: 32rpx;" mode="aspectFit"></image>
			</view>

			<!-- 排序菜单 -->
			<view class="sort-menu" v-if="showSortMenu" @click="showSortMenu = false">
				<view class="sort-menu-content" @click.stop>
					<view class="sort-menu-item" @click="sortPlaylistSongs('title')">
						<text>按歌名排序</text>
						<text v-if="playlistSortType === 'title'">{{ playlistSortOrder === 'asc' ? '↑' : '↓' }}</text>
					</view>
					<view class="sort-menu-item" @click="sortPlaylistSongs('singer')">
						<text>按歌手排序</text>
						<text v-if="playlistSortType === 'singer'">{{ playlistSortOrder === 'asc' ? '↑' : '↓' }}</text>
					</view>
					<view class="sort-menu-item" @click="sortPlaylistSongs('date')">
						<text>按下载时间排序</text>
						<text v-if="playlistSortType === 'date'">{{ playlistSortOrder === 'asc' ? '↑' : '↓' }}</text>
					</view>
					<view class="sort-menu-item" @click="sortPlaylistSongs('default')">
						<text>默认排序</text>
					</view>
				</view>
			</view>

			<!-- 歌曲列表 -->
			<view class="playlist-songs-page-list">
				<view v-for="(song, index) in getSortedPlaylistSongs()" :key="getPlaylistSongKey(song, index)"
					:class="['playlist-song-page-item', { playing: isCurrentSongInPlaylist(song) }]"
					@click="playSongFromPlaylist(song)">
					<view class="song-page-index">
						<text v-if="!isCurrentSongInPlaylist(song)">{{ index + 1 }}</text>
						<image v-else src="/static/images/play.png" style="width: 24rpx; height: 24rpx;"
							mode="aspectFit"></image>
					</view>
					<view class="song-page-info">
						<text class="song-page-title">{{ song.title }}</text>
						<text class="song-page-singer">{{ song.singer }}</text>
					</view>
					<view class="song-page-actions">
						<image v-if="song.isLocal" src="/static/images/download.png"
							style="width: 32rpx; height: 32rpx;" mode="aspectFit"></image>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view v-if="getSortedPlaylistSongs().length === 0" class="empty-playlist-page">
				<text class="empty-text">{{ playlistSearchKeyword ? '未找到相关歌曲' : '歌单暂无歌曲' }}</text>
			</view>
		</view>

	</view>
</template>

<script lang="ts">
	import luchAudio from '@/uni_modules/luch-audio/components/luch-audio/luch-audio.vue'
	import { MusicData } from '@/core/data/music-data';

	export default {
		components: {
			'luch-audio': luchAudio
		},
		data() {
			return {
				name: '',
				index: '',
				// 完整的歌曲信息
				songInfo: {
					title: '加载中...',
					singer: '',
					quality: '',
					cover: '',
					lrc: '',
					music_url: '',
					link: '',
					tips: ''
				},
				coverUrl: 'static/images/api1.png',
				// 播放状态
				isPlaying: false,
				// 是否为本地歌曲
				isLocalSong: false,
				// 自动播放设置
				autoPlay: false,
				// 歌词相关数据
				lyricsList: [], // 解析后的歌词数组
				currentLine: -1, // 当前播放的歌词行
				lyricsScrollTop: 0, // 歌词滚动位置
				audioContext: null, // 音频上下文
				audioStatusTimer: null, // 音频状态检查定时器
				// 下载相关状态
				savedFilePath: '', // 保存的文件路径
				hasDownloaded: false, // 是否已下载
				// 进度条相关
				progress: 0,
				currentTime: 0,
				duration: 0,
				innerAudioContext: null,
				// 本地歌曲相关
				localSong: null,
				backupNetworkSong: null,
				// API源信息，用于处理不同平台的差异
				apiSource: 'migu',
				// 格式化时间字符串
				audioTimeUpdate: '00:00',
				// 播放列表相关
				currentPlaylist: null,
				currentSongIndex: -1,
				// 歌单选择相关
				showPlaylistModal: false,
				userPlaylists: [],
				// 创建歌单相关
				showCreatePlaylistModal: false,
				newPlaylistName: '',
				newPlaylistDescription: '',
				playMode: 'order',
				// 更多功能菜单
				showMoreMenu: false,
				// 歌单详情相关
				showPlaylistDetailModal: false,
				currentViewingPlaylist: null,
				// 加载状态标志
				isLoadingSong: false,
				// 歌曲列表管理相关
				showPlaylistPage: false,
				currentPlaylistSongs: [],
				playlistSearchKeyword: '',
				playlistSortType: 'default',
				playlistSortOrder: 'asc',
				showSortMenu: false
			}
		},

		watch: {
			// 监听songInfo变化，确保luch-audio组件正确响应歌曲切换
			'songInfo.music_url': function (newUrl, oldUrl) {
				if (newUrl && newUrl !== oldUrl) {
					console.log('歌曲URL变化:', oldUrl, '->', newUrl);
					// 歌曲URL变化时，不需要手动播放，isPlaying状态的变化会自动触发luch-audio播放
				}
			}
		},

		methods: {
			loadPlaylistState() {
				try {
					const savedCurrentPlaylist = uni.getStorageSync('currentPlaylist');
					if (savedCurrentPlaylist) {
						this.currentPlaylist = savedCurrentPlaylist;
					}

					const savedCurrentSongIndex = uni.getStorageSync('currentSongIndex');
					if (savedCurrentSongIndex !== null && savedCurrentSongIndex !== undefined) {
						this.currentSongIndex = savedCurrentSongIndex;
					}

					const savedPlayMode = uni.getStorageSync('playMode');
					if (savedPlayMode) {
						this.playMode = savedPlayMode;
					}
				} catch (e) {
					console.error('加载播放列表状态失败:', e);
				}
			},

			savePlaylistState() {
				try {
					uni.setStorageSync('currentPlaylist', this.currentPlaylist);
					uni.setStorageSync('currentSongIndex', this.currentSongIndex);
					uni.setStorageSync('playMode', this.playMode);
				} catch (e) {
					console.error('保存播放列表状态失败:', e);
				}
			},

			onPlayModeChanged(mode : string) {
				this.playMode = mode;
				this.savePlaylistState();
			},

			playNextSong() {
				if (!this.currentPlaylist || this.currentPlaylist.songs.length === 0) {
					uni.showToast({
						title: '播放列表为空',
						icon: 'none'
					});
					return;
				}

				let nextIndex = this.currentSongIndex;

				switch (this.playMode) {
					case 'single':
						// 单曲循环：保持当前索引，重新播放
						break;
					case 'random':
						// 随机播放：生成随机索引
						nextIndex = Math.floor(Math.random() * this.currentPlaylist.songs.length);
						break;
					case 'order':
					default:
						// 顺序播放：索引+1
						nextIndex = (this.currentSongIndex + 1) % this.currentPlaylist.songs.length;
						break;
				}

				this.currentSongIndex = nextIndex;
				this.savePlaylistState();

				const nextSong = this.currentPlaylist.songs[nextIndex];
				if (nextSong) {
					this.playSongFromPlaylist(nextSong);
				}
			},

			playPrevSong() {
				if (!this.currentPlaylist || this.currentPlaylist.songs.length === 0) {
					uni.showToast({
						title: '播放列表为空',
						icon: 'none'
					});
					return;
				}

				let prevIndex = this.currentSongIndex;

				switch (this.playMode) {
					case 'single':
						uni.showToast({
							title: '单曲循环',
							icon: 'none'
						});
						return;
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
				this.savePlaylistState();

				const prevSong = this.currentPlaylist.songs[prevIndex];
				if (prevSong) {
					this.playSongFromPlaylist(prevSong);
				}
			},

			playSongFromPlaylist(song : { filePath : any; url : any; music_url : any; title : any; apiSource : any; isLocal : boolean; singer : any; quality : any; coverUrl : any; cover : any; lyrics : any; lrc : any; link : any; tips : any; }) {
				if (!song) return;

				const musicUrl = song.filePath || song.url || song.music_url || '';

				if (!musicUrl) {
					// 防止重复调用
					if (this.isLoadingSong) {
						console.log('正在加载歌曲，请稍候...');
						return;
					}

					this.isLoadingSong = true;
					uni.showLoading({
						title: '加载歌曲中...'
					});

					// 如果没有音乐URL，尝试重新获取歌曲详情
					this.name = song.title;
					this.index = 0;
					this.apiSource = song.apiSource || uni.getStorageSync('apiSource') || 'migu';

					// 调用MusicData获取音乐详情
				MusicData.getMusicDetail({
					title: this.name,
					singer: song.singer || '',
					n: song.n || 0,
					apiSource: this.apiSource
				}).then((resultData) => {
					uni.hideLoading();
					this.isLoadingSong = false;

					console.log('MusicData返回结果:', resultData);
					let songData = this.extractSongData(resultData);
					console.log('处理后的songData:', songData);

					if (songData && typeof songData === 'object' && songData.music_url) {
						this.setSongDetails(songData);
						this.isPlaying = true;
					} else {
						uni.showToast({
							title: '无法获取歌曲链接',
							icon: 'none'
						});
					}
				}).catch((error) => {
					uni.hideLoading();
					this.isLoadingSong = false;
					console.error('获取歌曲详情失败:', error);
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'none'
					});
				});

					return;
				}

				// 检查是否为本地歌曲
				const isLocal = song.isLocal || false;
				this.isLocalSong = isLocal;

				// 先停止全局音频，避免叠加播放
				const app = getApp();
				if (app && app.stopGlobalAudio) {
					app.stopGlobalAudio();
				}

				this.songInfo = {
					title: song.title || '未知歌曲',
					singer: song.singer || '未知歌手',
					quality: song.quality || '未知',
					cover: song.coverUrl || song.cover || '/static/images/api1.png',
					lrc: song.lyrics || song.lrc || '',
					music_url: musicUrl,
					link: song.link || '',
					tips: song.tips || ''
				};

				this.coverUrl = this.songInfo.cover;
				this.isPlaying = true;

				// 更新全局播放状态
				try {
					const app = getApp();
					if (app && app.updateGlobalPlayState) {
						app.updateGlobalPlayState({
							songInfo: {
								title: this.songInfo.title,
								singer: this.songInfo.singer,
								cover: this.coverUrl,
								music_url: this.songInfo.music_url
							},
							isPlaying: true
						});
					}
				} catch (e) {
					console.error('更新全局播放状态失败:', e);
				}

				if (this.songInfo.lrc) {
					this.lyricsList = this.parseLyrics(this.songInfo.lrc);
				} else {
					this.lyricsList = [];
				}

				this.progress = 0;
				this.currentTime = 0;
				this.duration = 0;
				this.audioTimeUpdate = '00:00';
			},

			addSongToPlaylist(song : { title : any; singer : any; coverUrl : any; cover : any; filePath : any; url : any; music_url : any; quality : any; lyrics : any; lrc : any; isLocal : any; }) {
				try {
					let currentPlaylist = uni.getStorageSync('currentPlaylist');
					if (!currentPlaylist) {
						currentPlaylist = {
							id: 'current',
							name: '当前播放',
							songs: [],
							cover: '/static/images/api1.png'
						};
					}

					if (!currentPlaylist.songs) {
						currentPlaylist.songs = [];
					}

					const songData = {
						title: song.title || '未知歌曲',
						singer: song.singer || '未知歌手',
						coverUrl: song.coverUrl || song.cover || '/static/images/api1.png',
						filePath: song.filePath || song.url || song.music_url || '',
						quality: song.quality || '未知',
						lyrics: song.lyrics || song.lrc || '',
						isLocal: song.isLocal || false
					};

					const isExists = currentPlaylist.songs.some(s =>
						s.title === songData.title && s.singer === songData.singer
					);

					if (!isExists) {
						currentPlaylist.songs.push(songData);
						uni.setStorageSync('currentPlaylist', currentPlaylist);
						this.currentPlaylist = currentPlaylist;
						this.currentSongIndex = currentPlaylist.songs.length - 1;
						this.savePlaylistState();
					}
				} catch (e) {
					console.error('添加歌曲到播放列表失败:', e);
				}
			},

			// 将秒转换为分:秒格式
			formatTime(seconds : number) {
				if (!seconds || seconds < 0) return '00:00';
				const mins = Math.floor(seconds / 60);
				const secs = Math.floor(seconds % 60);
				return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
			},
			// 返回首页
			backToHome() {
				console.log('backToHome 被调用');
				const pages = getCurrentPages();
				if (pages.length > 1) {
					uni.navigateBack({
						fail: () => {
							console.log('navigateBack 失败，尝试跳转音乐首页');
							uni.redirectTo({
								url: '/pages/music-index/music-index'
							});
						}
					});
				} else {
					uni.redirectTo({
						url: '/pages/music-index/music-index'
					});
				}
			},
			// 提取歌曲数据，根据新的JSON结构解析
			extractSongData(resultData : { code ?: any; title ?: any; mp3 ?: any; data ?: any; split ?: any; trackName ?: any; artistName ?: any; url ?: any; collectionName ?: any; trackViewUrl ?: any; }) {
				// 处理嵌套的数据结构
				let songData = {};
				console.log('extractSongData输入:', resultData);

				// 首先检查是否是数组格式（MusicService返回的格式）
				if (Array.isArray(resultData) && resultData.length > 0) {
					console.log('处理数组格式数据');
					songData = resultData[0];
					// 确保字段名称一致
					if (!songData.music_url && songData.mp3) {
						songData.music_url = songData.mp3;
					}
					// 处理各种可能的封面字段名称
					if (!songData.cover) {
						if (songData.img) songData.cover = songData.img;
						else if (songData.picture) songData.cover = songData.picture;
						else if (songData.coverUrl) songData.cover = songData.coverUrl;
					}
					// 清理封面字段的特殊字符
					if (songData.cover) {
						songData.cover = songData.cover.trim().replace(/`/g, '');
					}
				}
				// 检查是否是网易云音乐返回的标准格式（通过云函数处理后的）
				else if (resultData && (resultData.code == 200 || resultData.code === '200') && (resultData.title || resultData.mp3)) {
					songData = resultData;
					// 确保字段名称一致
					if (!songData.music_url && songData.mp3) {
						songData.music_url = songData.mp3;
					}
					// 处理各种可能的封面字段名称
					if (!songData.cover) {
						if (songData.img) songData.cover = songData.img;
						else if (songData.picture) songData.cover = songData.picture;
						else if (songData.coverUrl) songData.cover = songData.coverUrl;
					}
					// 清理封面字段的特殊字符
					if (songData.cover) {
						songData.cover = songData.cover.trim().replace(/`/g, '');
					}
					// 处理 lrc_url 字段，并清理特殊字符
					if (!songData.lrc && songData.lrc_url) {
						songData.lrc = songData.lrc_url.trim().replace(/`/g, '');
					}
				}
				// 检查是否是直接的歌曲列表数据，包含data数组
				else if (resultData && (resultData.code == 200 || resultData.code === '200') && Array.isArray(resultData.data) && resultData.data.length > 0) {
					songData = resultData.data[0];
					// 确保字段名称一致
					if (!songData.music_url && songData.mp3) {
						songData.music_url = songData.mp3;
					}
					// 处理各种可能的封面字段名称
					if (!songData.cover) {
						if (songData.img) songData.cover = songData.img;
						else if (songData.picture) songData.cover = songData.picture;
						else if (songData.coverUrl) songData.cover = songData.coverUrl;
					}
					// 清理封面字段的特殊字符
					if (songData.cover) {
						songData.cover = songData.cover.trim().replace(/`/g, '');
					}
				}
				// 检查是否存在嵌套的data对象（针对云函数返回的标准结构）
				else if (resultData && resultData.data && typeof resultData.data === 'object') {
					// 如果嵌套的data对象中包含歌曲信息
					if ((resultData.data.code === '200' || resultData.data.code === 200) && (resultData.data.title || resultData.data.mp3)) {
						songData = resultData.data;
						// 确保字段名称一致
						if (!songData.music_url && songData.mp3) {
							songData.music_url = songData.mp3;
						}
						// 处理各种可能的封面字段名称
						if (!songData.cover) {
							if (songData.img) songData.cover = songData.img;
							else if (songData.picture) songData.cover = songData.picture;
							else if (songData.coverUrl) songData.cover = songData.coverUrl;
						}
						// 清理封面字段的特殊字符
						if (songData.cover) {
							songData.cover = songData.cover.trim().replace(/`/g, '');
						}
					}
					// 检查data.data格式
					else if (resultData.data.data && typeof resultData.data.data === 'object') {
						songData = resultData.data.data;
						// 确保字段名称一致
						if (!songData.music_url && songData.mp3) {
							songData.music_url = songData.mp3;
						}
						// 处理各种可能的封面字段名称
						if (!songData.cover) {
							if (songData.img) songData.cover = songData.img;
							else if (songData.picture) songData.cover = songData.picture;
							else if (songData.coverUrl) songData.cover = songData.coverUrl;
						}
						// 清理封面字段的特殊字符
						if (songData.cover) {
							songData.cover = songData.cover.trim().replace(/`/g, '');
						}
						// 处理苹果音乐API返回的格式
						if (songData.trackName && songData.artistName) {
							songData = {
								title: songData.trackName,
								singer: songData.artistName,
								music_url: songData.url,
								cover: songData.cover,
								album: songData.collectionName,
								link: songData.trackViewUrl
							};
						}
					}
					// 处理数组格式的数据（可能是多个歌曲的情况）
					else if (Array.isArray(resultData.data) && resultData.data.length > 0) {
						songData = resultData.data[0];
					}
				}
				// 检查是否是字符串格式（保留兼容性）
				else if (typeof resultData === 'string') {
					const lines = resultData.split('\n');

					// 解析每行数据
					lines.forEach((line : string) : string => {
						line = line.trim();
						// 移除可能的特殊字符前缀
						if (line.startsWith('±')) {
							line = line.substring(1);
						}
						if (line.endsWith('±')) {
							line = line.substring(0, line.length - 1);
						}

						if (line.startsWith('img=')) {
							songData.cover = line.substring(4);
							songData.img = line.substring(4); // 兼容云函数返回的img字段
						} else if (line.startsWith('歌名：')) {
							songData.title = line.substring(3);
						} else if (line.startsWith('歌手：')) {
							songData.singer = line.substring(3);
						} else if (line.startsWith('播放链接：')) {
							songData.music_url = line.substring(5);
							songData.mp3 = line.substring(5); // 兼容云函数返回的mp3字段
						} else if (line.startsWith('歌曲详情页：')) {
							songData.link = line.substring(6);
						} else if (line.startsWith('歌曲详情：')) {
							songData.link = line.substring(5);
						}
					});

					// 确保必要的字段存在
					if (songData.title && songData.singer && songData.music_url) {
						songData.code = '200';
					}
				}
				// 其他情况，尝试直接赋值
				else {
					songData = resultData;
				}

				console.log('extractSongData输出:', songData);
				return songData;
			},

			// 解析歌词
			parseLyrics(lyricsText : string) {
				const lyricsList = [];
				if (!lyricsText) return lyricsList;

				// 正则表达式匹配歌词行，格式：[00:00.00]歌词内容
				const lyricRegex = /\[(\d{2}):(\d{2})\.(\d{2})\](.*)/g;
				let match : string[];

				while ((match = lyricRegex.exec(lyricsText)) !== null) {
					const minutes = parseInt(match[1]);
					const seconds = parseInt(match[2]);
					const milliseconds = parseInt(match[3]);
					const text = match[4].trim();

					// 计算总毫秒数作为时间戳
					const timestamp = minutes * 60 * 1000 + seconds * 1000 + milliseconds * 10;

					lyricsList.push({
						timestamp: timestamp,
						text: text
					});
				}

				// 按时间戳排序
				lyricsList.sort((a, b) => a.timestamp - b.timestamp);
				return lyricsList;
			},

			// 切换播放/暂停状态
			togglePlayPause() {
				// 如果正在加载歌曲，不允许切换播放状态
				if (this.isLoadingSong) {
					uni.showToast({
						title: '正在加载歌曲，请稍候...',
						icon: 'none'
					});
					return;
				}

				// 检查是否有有效的音频URL
				if (!this.songInfo || !this.songInfo.music_url) {
					// 如果没有歌曲信息，不显示错误提示，直接返回
					if (!this.songInfo) {
						console.log('歌曲信息未加载');
						return;
					}
					// 如果有歌曲信息但没有URL，显示错误提示
					console.error('没有有效的音频URL');
					uni.showToast({
						title: '没有有效的音频文件',
						icon: 'none'
					});
					return;
				}

				// 切换播放状态标志
				const newPlayState = !this.isPlaying;
				this.isPlaying = newPlayState;

				// 由于已经配置了:play.sync="isPlaying"，luch-audio组件会自动响应isPlaying的变化
				// 不需要手动调用audioPlay或audioPause

				// 更新全局播放状态
				try {
					const app = getApp();
					if (app && app.updateGlobalPlayState) {
						app.updateGlobalPlayState({
							isPlaying: newPlayState,
							songInfo: this.songInfo,
							currentTime: this.currentTime,
							duration: this.duration,
							progress: this.progress
						});
					}
				} catch (error) {
					console.error('更新全局播放状态失败:', error);
				}

				// 更新格式化时间显示
				this.audioTimeUpdate = this.formatTime(this.currentTime);
			},
			// 音频播放事件处理 - 当luch-audio组件播放时触发
			onAudioPlay() {
				// 记录播放历史（用于「我的」页统计与最近播放）
				this.addToPlayHistory();

				// 确保isPlaying状态与实际播放状态一致
				if (!this.isPlaying) {
					this.isPlaying = true;

					// 更新全局播放状态
					try {
						const app = getApp();
						if (app && app.updateGlobalPlayState) {
							app.updateGlobalPlayState({
								isPlaying: true
							});
						}
					} catch (error) {
						console.error('更新全局播放状态失败:', error);
					}
				}
			},
			// 音频暂停事件处理 - 当luch-audio组件暂停时触发
			onAudioPause() {

				// 确保isPlaying状态与实际播放状态一致
				if (this.isPlaying) {
					this.isPlaying = false;

					// 更新全局播放状态
					try {
						const app = getApp();
						if (app && app.updateGlobalPlayState) {
							app.updateGlobalPlayState({
								isPlaying: false
							});
						}
					} catch (error) {
						console.error('更新全局播放状态失败:', error);
					}
				}
			},
			// 音频播放结束事件处理
			onAudioEnded() {
				this.isPlaying = false;

				// 根据播放模式处理播放结束逻辑
				if (this.currentPlaylist && this.currentPlaylist.songs.length > 0) {
					switch (this.playMode) {
						case 'single':
							// 单曲循环：重新播放当前歌曲
							if (this.currentSongIndex >= 0 && this.currentSongIndex < this.currentPlaylist.songs.length) {
								const currentSong = this.currentPlaylist.songs[this.currentSongIndex];
								if (currentSong) {
									this.playSongFromPlaylist(currentSong);
								}
							}
							break;
						case 'order':
						case 'random':
							// 顺序或随机播放：播放下一首
							this.playNextSong();
							break;
					}
				}
			},
			// 音频播放错误事件处理
			onAudioError(e : any) {
				console.error('音频播放错误:', e);

				// 如果是本地歌曲播放失败，尝试切换到网络歌曲
				if (this.isLocalSong && this.backupNetworkSong) {

					uni.showToast({
						title: '本地歌曲播放失败，切换到网络歌曲',
						icon: 'none',
						duration: 2000
					});

					// 延迟切换，给用户时间看到提示
					setTimeout(() => {
						this.switchToNetworkSong();
					}, 1000);
				} else {
					// 网络歌曲播放失败或其他错误
					uni.showToast({
						title: '音频播放错误',
						icon: 'none'
					});
				}
			},

			// 切换到网络歌曲播放
			switchToNetworkSong() {
				if (!this.backupNetworkSong) {
					console.error('没有备用的网络歌曲信息');
					uni.showToast({
						title: '没有备用的网络歌曲信息',
						icon: 'none'
					});
					return;
				}



				// 显示加载提示
				uni.showLoading({
					title: '切换到网络歌曲...'
				});

				// 设置为网络歌曲模式
				this.isLocalSong = false;
				this.index = this.backupNetworkSong.n;
				this.name = this.backupNetworkSong.searchText;

				// 获取音乐详情
				this.getMusicDetail();

				// 延迟隐藏加载提示
				setTimeout(() => {
					uni.hideLoading();
				}, 2000);
			},
			// 音频时间更新事件处理 - 用于歌词同步和进度更新
			onTimeUpdate(e : { detail : { currentTime : number; duration : any; }; }) {


				// 处理luch-audio组件传递的事件参数格式
				let currentTime : number, duration : number;
				if (e && e.detail) {
					currentTime = e.detail.currentTime || 0;
					duration = e.detail.duration;
				} else {
					// luch-audio组件可能直接传递innerAudioContext对象
					currentTime = 0;
					duration = undefined;
				}

				// 尝试从luch-audio组件获取实时数据
				if (this.$refs.luchAudio && this.$refs.luchAudio.innerAudioContext) {
					const audioCtx = this.$refs.luchAudio.innerAudioContext;
					currentTime = audioCtx.currentTime || 0;
					duration = audioCtx.duration;
				}

				// 更新进度条相关数据
				this.currentTime = currentTime;
				// 更新audioTimeUpdate变量，确保时间显示实时更新
				this.audioTimeUpdate = this.formatTime(this.currentTime);

				// 检查是否有有效时长数据
				if (duration && duration > 0) {
					this.duration = duration;
					this.progress = (this.currentTime / this.duration) * 100;

				} else if (this.apiSource === 'netease') {
					// 网易云API特殊处理 - 尽管没有时长，也要更新当前进度
					// 使用一个合理的估计值让进度条有移动效果，同时确保不会达到100%
					const estimatedDuration = Math.max(180, this.currentTime + 60); // 假设至少3分钟，或当前时间+1分钟
					this.progress = (this.currentTime / estimatedDuration) * 100;
					this.progress = Math.min(this.progress, 98); // 确保进度不会达到100%

				}
				// 始终确保progress在有效范围内
				this.progress = Math.max(0, Math.min(100, this.progress));

				// 更新全局播放状态
				try {
					const app = getApp();
					if (app && app.updateGlobalPlayState) {
						app.updateGlobalPlayState({
							currentTime: this.currentTime,
							duration: this.duration,
							progress: this.progress
						});
					}
				} catch (e) {
					console.error('更新全局播放状态失败:', e);
				}

				// 本地歌曲特殊处理
				if (this.isLocalSong) {
					if (!this.lyricsList || this.lyricsList.length === 0) return;

					// 获取当前播放时间（单位：毫秒）
					const currentTimeMs = currentTime * 1000;

					// 查找当前应该显示的歌词行
					let newCurrentLine = -1;
					for (let i = 0; i < this.lyricsList.length; i++) {
						if (this.lyricsList[i].timestamp <= currentTimeMs) {
							newCurrentLine = i;
						} else {
							break;
						}
					}

					// 如果当前行发生变化，更新并滚动到对应行
					if (newCurrentLine !== this.currentLine) {
						this.currentLine = newCurrentLine;

						// 滚动到当前歌词行
						setTimeout(() => {
							this.scrollToCurrentLyric();
						}, 100);
					}
				} else {
					// 网络歌曲原有逻辑
					if (!this.lyricsList || this.lyricsList.length === 0) return;

					// 获取当前播放时间（单位：毫秒）
					const currentTimeMs = currentTime * 1000;

					// 查找当前应该显示的歌词行
					let newCurrentLine = -1;
					for (let i = 0; i < this.lyricsList.length; i++) {
						if (this.lyricsList[i].timestamp <= currentTimeMs) {
							newCurrentLine = i;
						} else {
							break;
						}
					}

					// 如果当前行发生变化，更新并滚动到对应行
					if (newCurrentLine !== this.currentLine) {
						this.currentLine = newCurrentLine;
					}
				}
			},

			// 下载音乐文件
			downloadMusic() {
				// 关闭更多菜单
				this.closeMoreMenu();

				if (this.isLocalSong && this.localSong && this.localSong.music_url) {
					uni.showToast({
						title: '歌曲已在本地',
						icon: 'none'
					});
					return;
				}

				if (!this.songInfo.music_url) {
					uni.showToast({
						title: '没有有效的音乐链接',
						icon: 'none'
					});
					return;
				}

				// 获取当前平台
				const platform = uni.getSystemInfoSync().platform;

				// 显示下载中提示
				uni.showLoading({
					title: '下载中...'
				});

				// 使用uni.downloadFile下载文件
				uni.downloadFile({
					url: this.songInfo.music_url, // 最高音质的音乐URL
					success: (res) => {
						if (res.statusCode === 200) {
							// 获取文件后缀名
							const fileExtension = this.getFileExtension(this.songInfo.music_url);
							const fileName =
								`${this.songInfo.title} - ${this.songInfo.singer}.${fileExtension}`;

							// 根据平台进行不同的处理
							if (platform === 'h5') {
								// H5平台处理方式：创建一个a标签进行下载
								uni.hideLoading();

								try {
									// 创建一个临时的a标签
									const link = document.createElement('a');
									link.href = this.songInfo.music_url;
									link.download = fileName;
									link.style.display = 'none';
									document.body.appendChild(link);
									link.click();
									document.body.removeChild(link);

									uni.showToast({
										title: '开始下载',
										icon: 'success'
									});
								} catch (e) {
									console.error('H5下载失败:', e);
									uni.showToast({
										title: 'H5平台下载受限，请在App中使用',
										icon: 'none'
									});
								}
							} else {
								// 非H5平台使用uni.saveFile保存文件
								uni.saveFile({
									tempFilePath: res.tempFilePath,
									success: (saveRes) => {
										// 隐藏加载提示
										uni.hideLoading();

										// 存储文件路径
										this.savedFilePath = saveRes.savedFilePath;
										this.hasDownloaded = true;

										// 获取文件大小
										uni.getFileInfo({
											filePath: saveRes.savedFilePath,
											success: (fileInfo) => {
												// 准备歌曲数据，包含实际文件大小
												const songData = {
													title: this.songInfo.title,
													singer: this.songInfo.singer,
													filePath: saveRes.savedFilePath,
													coverUrl: this.coverUrl,
													extension: fileExtension,
													downloadTime: new Date().getTime(),
													lyrics: this.songInfo.lyrics || '',
													apiSource: this.apiSource,
													fileSize: fileInfo.size
												};

												// 如果是migu音乐源，尝试下载歌词和封面
												if (this.apiSource === 'migu') {
													this.downloadMiguResources(songData, (updatedSongData : any) => {
														this.saveToLocalPlaylist(updatedSongData);
													});
												} else {
													this.saveToLocalPlaylist(songData);
												}

												// 显示下载成功提示
												uni.showToast({
													title: '下载成功，已添加到本地歌单',
													icon: 'success'
												});
											},
											fail: (err) => {
												console.error('获取文件大小失败:', err);
												// 即使获取文件大小失败，也保存歌曲数据
												const songData = {
													title: this.songInfo.title,
													singer: this.songInfo.singer,
													filePath: saveRes.savedFilePath,
													coverUrl: this.coverUrl,
													extension: fileExtension,
													downloadTime: new Date().getTime(),
													lyrics: this.songInfo.lyrics || '',
													apiSource: this.apiSource
												};

												// 如果是migu音乐源，尝试下载歌词和封面
												if (this.apiSource === 'migu') {
													this.downloadMiguResources(songData, (updatedSongData : any) => {
														this.saveToLocalPlaylist(updatedSongData);
													});
												} else {
													this.saveToLocalPlaylist(songData);
												}

												// 显示下载成功提示
												uni.showToast({
													title: '下载成功，已添加到本地歌单',
													icon: 'success'
												});
											}
										});
									},
									fail: (saveErr) => {
										console.error('保存文件失败:', saveErr);
										uni.hideLoading();
										uni.showToast({
											title: '保存文件失败',
											icon: 'none'
										});
									}
								});
							}
						} else {
							console.error('下载文件失败，状态码:', res.statusCode);
							uni.hideLoading();
							uni.showToast({
								title: '下载文件失败',
								icon: 'none'
							});
						}
					},
					fail: (err) => {
						console.error('下载请求失败:', err);
						uni.hideLoading();
						uni.showToast({
							title: '下载请求失败',
							icon: 'none'
						});
					}
				});
			},

			// 获取文件后缀名
			getFileExtension(url : string) {
				// 默认使用mp3格式
				let extension = 'mp3';

				// 从URL中提取文件后缀名
				if (url && typeof url === 'string') {
					const match = url.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
					if (match && match[1]) {
						extension = match[1].toLowerCase();
					}
				}

				return extension;
			},

			// 打开下载路径
			openDownloadPath() {
				if (!this.savedFilePath) {
					uni.showToast({
						title: '没有找到下载路径',
						icon: 'none'
					});
					return;
				}

				// 获取当前平台
				const platform = uni.getSystemInfoSync().platform;

				// 根据不同平台使用不同的API打开文件路径
				if (platform === 'ios') {
					// iOS平台显示路径并提供复制功能
					uni.showModal({
						title: 'iOS下载路径',
						content: '文件已保存至应用沙盒目录\n' + this.savedFilePath +
							'\n\n提示：iOS系统由于沙盒限制，无法直接打开文件管理器查看，您可以复制路径用于其他用途',
						showCancel: true,
						confirmText: '复制路径',
						success: (res) => {
							if (res.confirm) {
								// 复制路径到剪贴板
								uni.setClipboardData({
									data: this.savedFilePath,
									success: () => {
										uni.showToast({
											title: '路径已复制',
											icon: 'success'
										});
									}
								});
							}
						}
					});
				} else if (platform === 'android') {
					// Android平台尝试打开文件管理器
					try {
						// 尝试打开文件
						plus.runtime.openFile(this.savedFilePath);
					} catch (e) {
						console.error('打开文件失败:', e);
						// 失败时显示路径信息
						uni.showModal({
							title: 'Android下载路径',
							content: '文件已保存至\n' + this.savedFilePath + '\n\n提示：您可以使用文件管理器手动导航到此路径',
							showCancel: true,
							confirmText: '复制路径',
							success: (res) => {
								if (res.confirm) {
									uni.setClipboardData({
										data: this.savedFilePath,
										success: () => {
											uni.showToast({
												title: '路径已复制',
												icon: 'success'
											});
										}
									});
								}
							}
						});
					}
				} else {
					// H5或其他平台显示路径信息
					uni.showModal({
						title: 'H5下载提示',
						content: '在网页版中，文件已通过浏览器默认下载功能保存\n请在浏览器的下载历史中查看或检查您的默认下载文件夹',
						showCancel: false,
						confirmText: '我知道了',
						success: (_res) => {
							// 不执行任何操作
						}
					});
				}

				// 如果需要在下载后清除状态，可以在适当的时机调用
				// this.hasDownloaded = false;
				// this.savedFilePath = '';
			},

			// 下载migu音乐源的歌词和封面
			downloadMiguResources(songData : any, callback : (arg0 : any) => void) {
				const updatedSongData = { ...songData };

				// 模拟下载歌词和封面
				// 在实际应用中，这里应该根据migu API获取歌词和封面的URL并下载
				if (this.songInfo.lyrics) {
					updatedSongData.lyrics = this.songInfo.lyrics;
				}

				if (this.coverUrl) {
					updatedSongData.coverUrl = this.coverUrl;
				}

				// 延迟一下模拟下载过程
				setTimeout(() => {
					callback(updatedSongData);
				}, 500);
			},

			// 保存歌曲到本地歌单
			saveToLocalPlaylist(songData : { filePath : any; }) {
				try {
					// 从本地存储获取现有歌单
					let localPlaylist = uni.getStorageSync('localPlaylist') || [];

					// 检查是否已存在相同的歌曲（通过文件路径判断）
					const isExists = localPlaylist.some(item => item.filePath === songData.filePath);

					if (!isExists) {
						// 添加新歌到歌单开头
						localPlaylist.unshift(songData);

						// 保存更新后的歌单到本地存储
						uni.setStorageSync('localPlaylist', localPlaylist);

					} else {

					}
				} catch (e) {
					console.error('保存本地歌单失败:', e);
				}
			},

			// 设置歌曲详情
			setSongDetails(songData : { title : any; singer : any; quality : any; cover : string; lrc : string; music_url : any; mp3 : any; link : any; tips : any; lrc_url ?: string; }) {
				// 确保songData有效
				if (!songData) {
					console.error('歌曲数据无效');
					return;
				}
				
				// 先停止全局音频，避免叠加播放
				const app = getApp();
				if (app && app.stopGlobalAudio) {
					app.stopGlobalAudio();
				}
				
				// 处理lrc_url字段（咪咕音乐返回的是lrc_url而不是lrc）
				if (!songData.lrc && songData.lrc_url) {
					songData.lrc = songData.lrc_url.trim().replace(/`/g, '');
					console.log('从lrc_url获取歌词:', songData.lrc);
				}
				
				// 设置isLocalSong为false，因为这是网络歌曲
				this.isLocalSong = false;

				// 根据新的JSON结构设置歌曲信息
				this.songInfo = {
					title: songData.title || '未知歌曲',
					singer: songData.singer || '未知歌手',
					quality: songData.quality || '',
					cover: songData.cover || '',
					lrc: songData.lrc || '',
					music_url: songData.music_url || songData.mp3 || '',
					link: songData.link || '',
					tips: songData.tips || ''
				};

				// 解析歌词 - 如果没有歌词，使用默认歌词
				try {
					if (!songData.lrc || songData.lrc.trim() === '') {
						// 创建默认歌词
						this.lyricsList = [{
							timestamp: 0,
							text: `${songData.title || '未知歌曲'} - ${songData.singer || '未知歌手'}`
						},
						{
							timestamp: 1000,
							text: '音乐正在播放中...'
						},
						{
							timestamp: 3000,
							text: '感谢使用VHeart音乐盒'
						},
						{
							timestamp: 6000,
							text: '这里是默认歌词显示'
						},
						{
							timestamp: 9000,
							text: 'Enjoy your music time'
						}
						];
					} else {
						this.lyricsList = this.parseLyrics(songData.lrc);
					}
				} catch (error) {
					console.error('处理歌词时出错:', error);
					this.lyricsList = [{
						timestamp: 0,
						text: `${songData.title || '未知歌曲'} - ${songData.singer || '未知歌手'}`
					}];
				}


				// 处理封面URL，去除可能的空格和引号
				this.coverUrl = songData.cover ? songData.cover.trim().replace(/`/g, '') : 'static/images/api1.png';


				// 处理音频URL，去除可能的空格和引号
				const audioUrl = this.songInfo.music_url ? this.songInfo.music_url.trim().replace(/`/g, '') : '';


				// 更新songInfo中的music_url
				this.songInfo.music_url = audioUrl;

				// 更新全局播放状态
				try {
					const app = getApp();
					if (app && app.updateGlobalPlayState) {
						app.updateGlobalPlayState({
							songInfo: this.songInfo,
							isPlaying: false // 初始设置为未播放，等待用户点击播放或自动播放触发
						});
					}
				} catch (error) {
					console.error('更新全局播放状态失败:', error);
				}

				// 设置播放列表
				if (audioUrl) {


					// 重置时间相关变量
					this.currentTime = 0;
					this.duration = 0;
					this.progress = 0;
					this.audioTimeUpdate = '00:00';

					// 根据API源做特殊处理
					if (this.apiSource === 'netease') {

					}

					// 音频链接设置完成后，延迟一小段时间确保组件已更新
					setTimeout(() => {

						// 强制刷新组件以确保音频加载
						this.$forceUpdate();
					}, 800); // 增加延迟时间，确保组件完全加载
				} else {

					uni.showToast({
						title: '未获取到有效音频链接',
						icon: 'none'
					});
				}
			},

			setLocalSongDetails(song : { filePath : string; title : any; singer : any; coverUrl : string; }) {
				if (!song || !song.filePath) {
					uni.showToast({
						title: '本地歌曲文件不存在',
						icon: 'none'
					});
					// 如果有备用网络歌曲信息，自动切换
					if (this.backupNetworkSong) {
						setTimeout(() => {
							this.switchToNetworkSong();
						}, 1000);
					}
					return;
				}

				// 设置本地歌曲信息
				this.songInfo = {
					title: song.title || '未知歌曲',
					singer: song.singer || '未知歌手',
					quality: '本地文件',
					cover: song.coverUrl || 'static/images/api1.png',
					lrc: '',
					music_url: song.filePath,
					link: '',
					tips: '本地播放中'
				};
				this.isLocalSong = true;
				this.coverUrl = song.coverUrl || 'static/images/api1.png';
				// 设置保存的文件路径，避免重复下载
				this.savedFilePath = song.filePath;
				this.hasDownloaded = true;

				// 重置歌词相关状态
				this.currentLine = -1;
				this.currentTime = 0;
				this.progress = 0;

				// 处理歌词 - 为本地歌曲创建简单的歌词条目
				this.lyricsList = [{
					timestamp: 0,
					text: `${song.title} - ${song.singer}`
				},
				{
					timestamp: 1000,
					text: '本地歌曲播放中...'
				},
				{
					timestamp: 3000,
					text: '感谢使用VHeart音乐盒'
				},
				{
					timestamp: 6000,
					text: '下载的歌曲会自动保存到本地歌单'
				},
				{
					timestamp: 9000,
					text: '无网络时也能享受音乐'
				}
				];

				// 添加到播放列表
				this.addSongToPlaylist(song);

				// 更新全局播放状态
				try {
					const app = getApp();
					if (app && app.updateGlobalPlayState) {
						app.updateGlobalPlayState({
							songInfo: this.songInfo,
							isPlaying: true
						});
					}
				} catch (error) {
					console.error('更新全局播放状态失败:', error);
				}

				// 延迟触发播放，确保音频元素已经初始化
				setTimeout(() => {

					this.isPlaying = true;
					this.$forceUpdate(); // 强制更新视图

					// 直接使用luch-audio组件控制自动播放（支持后台播放）

					try {
						// 先检查luch-audio组件是否可用
						if (this.$refs.luchAudio) {
							// 直接调用组件的播放方法确保播放
							if (typeof this.$refs.luchAudio.audioPlay === 'function') {
								this.$refs.luchAudio.audioPlay();

							}
						}
					} catch (error) {
						console.error('自动播放过程中出错:', error);
						// 如果自动播放失败，且有备用网络歌曲，尝试切换
						if (this.backupNetworkSong) {

							setTimeout(() => {
								this.switchToNetworkSong();
							}, 1000);
						}
					}
				}, 500);
			},

			// 初始化音频上下文 - luch-audio组件的回调
			initAudioContext(innerAudioContext : { onCanplay : (arg0 : () => void) => void; duration : number; play : () => void; onError : (arg0 : (res : any) => void) => void; }, _options : any) {
				console.log('initAudioContext 被调用, src:', this.songInfo?.music_url);

				// 保存音频上下文引用到页面
				this.innerAudioContext = innerAudioContext;

				// 同时保存到全局App实例，以便统一管理
				const app = getApp();
				if (app) {
					app.globalAudioContext = innerAudioContext;
					console.log('globalAudioContext 已保存到 App');
				}

				// 监听音频加载完成事件
				innerAudioContext.onCanplay(() => {

					// 检查是否有有效时长数据
					if (innerAudioContext.duration && innerAudioContext.duration > 0) {
						this.duration = innerAudioContext.duration;

					}

					// 如果isPlaying为true，尝试播放
					if (this.isPlaying) {

						try {
							innerAudioContext.play();
						} catch (error) {
							console.error('播放失败:', error);
							// 播放失败时，如果是本地歌曲且有备用网络歌曲，尝试切换
							if (this.isLocalSong && this.backupNetworkSong) {

								setTimeout(() => {
									this.switchToNetworkSong();
								}, 1000);
							}
						}
					}
				});

				// 监听错误事件
				innerAudioContext.onError((res) => {
					console.error('音频播放错误:', res);
					uni.showToast({
						title: '音频播放失败',
						icon: 'none'
					});
					// 播放错误时，如果是本地歌曲且有备用网络歌曲，尝试切换
					if (this.isLocalSong && this.backupNetworkSong) {

						setTimeout(() => {
							this.switchToNetworkSong();
						}, 1000);
					}
				});
			},



			// 滚动到当前歌词行
			scrollToCurrentLyric() {
				if (this.currentLine >= 0) {
					// 计算滚动位置（当前歌词行的位置 - 2行的高度，使当前歌词位于可视区域中间）
					const lineHeight = 60; // 每行歌词的高度（px）
					this.lyricsScrollTop = this.currentLine * lineHeight - lineHeight * 2;
				}
			},

			// 处理进度条拖动事件
			handleProgressChange(e : { detail : { value : any; }; }) {
				const value = e.detail.value;

				this.progress = value;

				// 计算对应的播放时间
				let seekTime : number;
				if (this.duration > 0) {
					seekTime = (value / 100) * this.duration;
				} else {
					// 对于网易云API，使用一个估计的时长进行跳转
					const estimatedDuration = 300; // 假设5分钟
					seekTime = (value / 100) * estimatedDuration;
				}

				this.currentTime = seekTime;
				this.audioTimeUpdate = this.formatTime(seekTime);

				// 通过luch-audio组件的innerAudioContext进行seek操作
				if (this.$refs.luchAudio && this.$refs.luchAudio.innerAudioContext && typeof this.$refs.luchAudio.innerAudioContext.seek === 'function') {
					try {
						this.$refs.luchAudio.innerAudioContext.seek(seekTime);
					} catch (error) {
						console.error('seek操作失败:', error);
					}
				}
				// 同时支持innerAudioContext（本地歌曲使用）
				else if (this.innerAudioContext && typeof this.innerAudioContext.seek === 'function') {
					try {
						this.innerAudioContext.seek(seekTime);
					} catch (error) {
						console.error('seek操作失败:', error);
					}
				}
			},



			// 获取音乐详情
			getMusicDetail() {
				// 确保有name参数才调用云函数
				if (this.name) {
					// 从本地存储获取接口源信息
					const apiSource = uni.getStorageSync('apiSource') || 'migu';
					// 保存到实例变量中
					this.apiSource = apiSource;

					console.log('准备调用MusicData获取音乐详情:', {
						name: this.name,
						index: this.index,
						apiSource: apiSource
					});

					// 调用MusicData获取音乐详情
					MusicData.getMusicDetail({
						title: this.name,
						singer: '',
						n: this.index,
						apiSource: apiSource
					}).then((resultData) => {
						console.log('MusicData返回结果:', resultData);
						
						// 处理返回的歌曲详情数据
						let songData = this.extractSongData(resultData);
						console.log('处理后的songData:', songData);

						// 设置歌曲详情数据
						if (songData && typeof songData === 'object') {
							this.setSongDetails(songData);
						} else {
							// 没有找到歌曲或请求失败
							this.coverUrl = 'static/images/api1.png';
							const errorMsg = '歌曲数据格式异常';

							uni.showToast({
								title: errorMsg,
								icon: 'none'
							});
						}
					}).catch((error) => {
						console.error('获取音乐详情失败:', error);
						this.coverUrl = 'static/images/api1.png';
						
						// 根据错误类型显示不同的提示
						let errorMsg = '网络错误，请重试';
						if (error.message) {
							if (error.message.includes('VIP') || error.message.includes('版权')) {
								errorMsg = error.message;
							}
						}
						
						uni.showToast({
							title: errorMsg,
							icon: 'none',
							duration: 3000
						});
					});
				}
			},

			// 显示歌单选择模态框
			showAddToPlaylist() {
				this.closeMoreMenu();
				this.loadUserPlaylists();
				this.showPlaylistModal = true;
			},

			// 关闭歌单选择模态框
			closePlaylistModal() {
				this.showPlaylistModal = false;
			},

			// 加载用户歌单
			loadUserPlaylists() {
				try {
					const userPlaylists = uni.getStorageSync('userPlaylists') || [];
					// 确保每个歌单都有id字段（兼容旧数据）
					const validatedPlaylists = userPlaylists.map((playlist : { id : any; songs : any; createdAt : any; }) : { id : string; songs : any[]; createdAt : string; } => {
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

					// 保存修复后的数据
					if (userPlaylists.length !== validatedPlaylists.length ||
						userPlaylists.some((p : { id : any; }, i : string | number) => p.id !== validatedPlaylists[i].id)) {
						uni.setStorageSync('userPlaylists', validatedPlaylists);
					}
				} catch (e) {
					console.error('加载用户歌单失败:', e);
					this.userPlaylists = [];
					uni.showToast({ title: '加载歌单失败', icon: 'none' });
				}
			},

			// 显示创建歌单模态框
			showCreatePlaylist() {
				this.showPlaylistModal = false;
				this.showCreatePlaylistModal = true;
				this.newPlaylistName = '';
				this.newPlaylistDescription = '';
			},

			// 关闭创建歌单模态框
			closeCreatePlaylistModal() {
				this.showCreatePlaylistModal = false;
				this.newPlaylistName = '';
				this.newPlaylistDescription = '';
			},

			// 创建歌单
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
					description: this.newPlaylistDescription.trim(),
					songs: [],
					cover: '/static/images/api1.png',
					createdAt: new Date().toISOString()
				};

				// 添加当前歌曲到新歌单
				const currentSong = this.getSongDataForPlaylist();
				if (currentSong) {
					newPlaylist.songs.push(currentSong);
				}

				// 保存新歌单
				this.userPlaylists.push(newPlaylist);
				this.saveUserPlaylists();

				// 关闭模态框并显示成功提示
				this.closeCreatePlaylistModal();
				uni.showToast({
					title: '歌单创建成功',
					icon: 'success'
				});
			},

			// 将歌曲添加到歌单
			addToPlaylist(playlist : { id : any; }) {
				if (!playlist || !playlist.id) {
					uni.showToast({
						title: '歌单信息无效',
						icon: 'none'
					});
					return;
				}

				const songData = this.getSongDataForPlaylist();
				if (!songData) {
					uni.showToast({
						title: '当前歌曲信息无效',
						icon: 'none'
					});
					return;
				}

				const target = this.userPlaylists.find(p => p.id === playlist.id);
				if (!target) {
					uni.showToast({
						title: '歌单不存在',
						icon: 'none'
					});
					return;
				}
				if (!Array.isArray(target.songs)) {
					target.songs = [];
				}
				const exists = target.songs.some(s => s.title === songData.title && (s.singer || '') === (songData.singer || ''));
				if (exists) {
					uni.showToast({
						title: '该歌曲已在歌单中',
						icon: 'none'
					});
					return;
				}
				target.songs.push(songData);
				this.saveUserPlaylists();

				uni.showToast({
					title: '已添加到歌单',
					icon: 'success'
				});
				this.closePlaylistModal();
				// 若需要查看刚加入的歌单，可再打开详情
				this.currentViewingPlaylist = target;
				this.showPlaylistDetailModal = true;
			},

			// 获取当前歌曲数据用于添加到歌单
			getSongDataForPlaylist() {
				if (!this.songInfo || !this.songInfo.title) {
					return null;
				}

				return {
					title: this.songInfo.title,
					singer: this.songInfo.singer || '未知歌手',
					coverUrl: this.coverUrl,
					filePath: this.isLocalSong ? this.songInfo.music_url : '',
					url: !this.isLocalSong ? this.songInfo.music_url : '',
					music_url: this.songInfo.music_url || '',
					quality: this.songInfo.quality || '未知',
					lyrics: this.songInfo.lyrics || '',
					isLocal: this.isLocalSong
				};
			},

			// 保存用户歌单
			saveUserPlaylists() {
				try {
					uni.setStorageSync('userPlaylists', this.userPlaylists);

				} catch (e) {
					console.error('保存用户歌单失败:', e);
					uni.showToast({
						title: '保存歌单失败',
						icon: 'none'
					});
				}
			},

			// 写入播放历史（供「我的」页统计与最近播放）
			addToPlayHistory() {
				if (!this.songInfo || !this.songInfo.title) return;
				try {
					const list = uni.getStorageSync('playHistory') || [];
					const last = list[list.length - 1];
					const now = Date.now();
					// 同一首歌 30 秒内不重复记录（避免暂停/播放重复计数）
					if (last && last.title === this.songInfo.title && (last.singer || '') === (this.songInfo.singer || '') && (now - (last.playedAt || 0)) < 30000) {
						return;
					}
					list.push({
						title: this.songInfo.title,
						singer: this.songInfo.singer || '未知歌手',
						music_url: this.songInfo.music_url || '',
						cover: this.songInfo.cover || this.coverUrl || '',
						playedAt: now,
						filePath: this.isLocalSong && this.songInfo.filePath ? this.songInfo.filePath : '',
						isLocal: !!this.isLocalSong
					});
					const max = 300;
					if (list.length > max) {
						list.splice(0, list.length - max);
					}
					uni.setStorageSync('playHistory', list);
				} catch (e) {
					console.error('写入播放历史失败:', e);
				}
			},

			// 切换播放模式
			togglePlayMode() {
				this.closeMoreMenu();
				const modes = ['order', 'random', 'single'];
				const currentIndex = modes.indexOf(this.playMode);
				const nextIndex = (currentIndex + 1) % modes.length;
				this.playMode = modes[nextIndex];

				// 保存到本地存储
				uni.setStorageSync('playMode', this.playMode);

				// 显示切换提示
				uni.showToast({
					title: this.getPlayModeText(),
					icon: 'none'
				});

				// 通知全局播放模式变化
				uni.$emit('playModeChanged', this.playMode);
			},

			// 获取播放模式文本
			getPlayModeText() {
				switch (this.playMode) {
					case 'order':
						return '顺序播放';
					case 'random':
						return '随机播放';
					case 'single':
						return '单曲循环';
					default:
						return '顺序播放';
				}
			},

			// 获取播放模式图标
			getPlayModeIcon() {
				switch (this.playMode) {
					case 'order':
						return '/static/images/order.png';
					case 'random':
						return '/static/images/random.png';
					case 'single':
						return '/static/images/single.png';
					default:
						return '/static/images/order.png';
				}
			},

			// 获取播放模式简短文本
			getPlayModeShortText() {
				switch (this.playMode) {
					case 'order':
						return '顺序';
					case 'random':
						return '随机';
					case 'single':
						return '单曲';
					default:
						return '顺序';
				}
			},

			// 切换更多功能菜单
			toggleMoreMenu() {
				this.showMoreMenu = !this.showMoreMenu;
			},

			// 关闭更多功能菜单
			closeMoreMenu() {
				this.showMoreMenu = false;
			},

			// 查看歌单详情
			viewPlaylistDetail(playlist : { songs : any[]; }) {
				this.closeMoreMenu();
				this.currentViewingPlaylist = playlist;
				this.currentPlaylistSongs = playlist.songs || [];
				this.playlistSearchKeyword = '';
				this.playlistSortType = 'default';
				this.playlistSortOrder = 'asc';
				this.showPlaylistPage = true;
			},

			// 关闭歌单详情模态框
			closePlaylistDetailModal() {
				this.showPlaylistDetailModal = false;
				this.currentViewingPlaylist = null;
			},

			// 关闭歌曲列表页面
			closePlaylistPage() {
				this.showPlaylistPage = false;
				this.currentViewingPlaylist = null;
				this.currentPlaylistSongs = [];
			},

			// 搜索歌曲
			searchPlaylistSongs(keyword : string) {
				this.playlistSearchKeyword = keyword;
			},

			// 排序歌曲
			sortPlaylistSongs(type : string) {
				this.playlistSortType = type;
				if (type === this.playlistSortType) {
					this.playlistSortOrder = this.playlistSortOrder === 'asc' ? 'desc' : 'asc';
				} else {
					this.playlistSortOrder = 'asc';
				}
			},

			// 获取排序后的歌曲列表
			getSortedPlaylistSongs() {
				let songs = [...this.currentPlaylistSongs];

				// 搜索过滤
				if (this.playlistSearchKeyword) {
					const keyword = this.playlistSearchKeyword.toLowerCase();
					songs = songs.filter(song =>
						(song.title && song.title.toLowerCase().includes(keyword)) ||
						(song.singer && song.singer.toLowerCase().includes(keyword))
					);
				}

				// 排序
				switch (this.playlistSortType) {
					case 'title':
						songs.sort((a, b) => {
							const titleA = a.title || '';
							const titleB = b.title || '';
							return this.playlistSortOrder === 'asc'
								? titleA.localeCompare(titleB, 'zh-CN')
								: titleB.localeCompare(titleA, 'zh-CN');
						});
						break;
					case 'singer':
						songs.sort((a, b) => {
							const singerA = a.singer || '';
							const singerB = b.singer || '';
							return this.playlistSortOrder === 'asc'
								? singerA.localeCompare(singerB, 'zh-CN')
								: singerB.localeCompare(singerA, 'zh-CN');
						});
						break;
					case 'date':
						songs.sort((a, b) => {
							const dateA = a.downloadTime || 0;
							const dateB = b.downloadTime || 0;
							return this.playlistSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
						});
						break;
					default:
						break;
				}

				return songs;
			},

			// 判断是否是当前播放的歌曲
			isCurrentSongInPlaylist(song : { title : string; singer : string; }) {
				if (!this.songInfo || !song) {
					return false;
				}
				return this.songInfo.title === song.title && this.songInfo.singer === song.singer;
			},

			getPlaylistSongKey(song : { title : any; singer : any; }, index : string | number) {
				if (!song) return 'pl-song-' + index;
				const t = (song.title || '').toString();
				const s = (song.singer || '').toString();
				return (t && s) ? (t + '_' + s + '_' + index) : ('pl-song-' + index);
			},

			// 从歌单详情播放歌曲
			playSongFromPlaylistDetail(song : { filePath : any; url : any; music_url : any; title : any; apiSource : any; singer : any; quality : any; coverUrl : any; cover : any; lyrics : any; lrc : any; link : any; tips : any; isLocal : boolean; }) {
				if (!song) return;

				this.closePlaylistDetailModal();

				const musicUrl = song.filePath || song.url || song.music_url || '';

				if (!musicUrl) {
					// 防止重复调用
					if (this.isLoadingSong) {
						console.log('正在加载歌曲，请稍候...');
						return;
					}

					this.isLoadingSong = true;
					uni.showLoading({
						title: '加载歌曲中...'
					});

					// 如果没有音乐URL，尝试重新获取歌曲详情
					this.name = song.title;
					this.index = 0;
					this.apiSource = song.apiSource || uni.getStorageSync('apiSource') || 'migu';

					// 调用MusicData获取音乐详情
					MusicData.getMusicDetail({
						title: this.name,
						singer: song.singer || '',
						n: song.n || 0,
						apiSource: this.apiSource
					}).then((resultData) => {
						uni.hideLoading();
						this.isLoadingSong = false;

						console.log('MusicData返回结果:', resultData);
						let songData = this.extractSongData(resultData);
						console.log('处理后的songData:', songData);

						if (songData && typeof songData === 'object' && songData.music_url) {
							this.setSongDetails(songData);
							this.isPlaying = true;
						} else {
							uni.showToast({
								title: '无法获取歌曲链接',
								icon: 'none'
							});
						}
					}).catch((error) => {
						uni.hideLoading();
						this.isLoadingSong = false;
						console.error('获取歌曲详情失败:', error);
						uni.showToast({
							title: '网络错误，请重试',
							icon: 'none'
						});
					});

					return;
				}

				this.songInfo = {
					title: song.title || '未知歌曲',
					singer: song.singer || '未知歌手',
					quality: song.quality || '未知',
					cover: song.coverUrl || song.cover || '/static/images/api1.png',
					lrc: song.lyrics || song.lrc || '',
					music_url: musicUrl,
					link: song.link || '',
					tips: song.tips || ''
				};

				this.coverUrl = this.songInfo.cover;
				this.isLocalSong = song.isLocal || false;
				this.isPlaying = true;

				// 更新全局播放状态
				try {
					const app = getApp();
					if (app && app.updateGlobalPlayState) {
						app.updateGlobalPlayState({
							songInfo: {
								title: this.songInfo.title,
								singer: this.songInfo.singer,
								cover: this.coverUrl,
								music_url: this.songInfo.music_url
							},
							isPlaying: true
						});
					}
				} catch (e) {
					console.error('更新全局播放状态失败:', e);
				}

				if (this.songInfo.lrc) {
					this.lyricsList = this.parseLyrics(this.songInfo.lrc);
				} else {
					this.lyricsList = [];
				}

				this.progress = 0;
				this.currentTime = 0;
				this.duration = 0;
				this.audioTimeUpdate = '00:00';

				// 延迟触发播放，确保音频元素已经初始化
				setTimeout(() => {
					if (this.$refs.luchAudio && typeof this.$refs.luchAudio.audioPlay === 'function') {
						this.$refs.luchAudio.audioPlay();
					}
				}, 100);
			}
		},

		// 生命周期函数
		onLoad() {
			// 加载自动播放设置
			this.autoPlay = uni.getStorageSync('autoPlay') || false;
			
			// 加载播放列表状态
			this.loadPlaylistState();

			// 检查是否是本地歌曲
			this.isLocalSong = uni.getStorageSync('isLocalSong') || false;
			this.localSong = uni.getStorageSync('localSong') || null;
			// 获取备用的网络歌曲信息
			this.backupNetworkSong = uni.getStorageSync('backupNetworkSong') || null;

			if (this.isLocalSong && this.localSong) {


				// 直接播放本地歌曲，不发起网络请求
				this.setLocalSongDetails(this.localSong);
				// 清除标记，避免影响下次播放
				uni.removeStorageSync('isLocalSong');
				uni.removeStorageSync('localSong');
				uni.removeStorageSync('backupNetworkSong');
			} else {
				// 优先使用「最近播放」等传入的完整歌曲数据，避免重复请求
				const songData = uni.getStorageSync('currentSongData');
				if (songData && songData.title && (songData.music_url || (songData.filePath && songData.isLocal))) {
					uni.removeStorageSync('currentSongData');
					if (songData.isLocal && songData.filePath) {
						this.setLocalSongDetails(songData);
					} else if (songData.music_url) {
						this.setSongDetails({
							title: songData.title,
							singer: songData.singer || '未知歌手',
							cover: songData.cover || songData.coverUrl || '',
							music_url: songData.music_url,
							lrc: songData.lrc || songData.lyrics || '',
							quality: undefined,
							mp3: undefined,
							link: undefined,
							tips: undefined
						});
						setTimeout(() => {
							if (this.$refs.luchAudio && typeof this.$refs.luchAudio.audioPlay === 'function') {
								this.$refs.luchAudio.audioPlay();
							}
						}, 300);
					}
					uni.$on('togglePlayPause', this.togglePlayPause);
					uni.$on('playModeChanged', this.onPlayModeChanged);
					return;
				}
				// 显示加载提示
				uni.showLoading({
					title: '加载中...'
				})
				setTimeout(() => {
					uni.hideLoading()
				}, 3000)

				// 数据读取
				setTimeout(() => {
					// 读取存储的歌曲索引和名称
					uni.getStorage({
						key: 'index',
						success: (res) => {
							this.index = res.data; // 不进行+1操作，直接使用原始的n参数


							// 读取完index后再读取name
							uni.getStorage({
								key: 'name',
								success: (res) => {

									this.name = res.data;
									// 获取音乐详情
									this.getMusicDetail();
								}
							})
						}
					})
				}, 100)
			}
			// 监听全局播放控制条的播放/暂停命令
			uni.$on('togglePlayPause', this.togglePlayPause);
			// 监听播放模式变化
			uni.$on('playModeChanged', this.onPlayModeChanged);
		},
		onUnload() {
			// 保存当前播放状态到全局存储（异步）
			const playState = {
				isPlaying: this.isPlaying,
				songInfo: {
					title: this.songInfo.title,
					singer: this.songInfo.singer,
					cover: this.coverUrl,
					music_url: this.songInfo.music_url
				},
				currentTime: this.currentTime,
				duration: this.duration,
				progress: this.progress
			};
			uni.setStorage({
				key: 'globalPlayState',
				data: playState
			});

			// 清理音频状态检查定时器
			if (this.audioStatusTimer) {
				clearInterval(this.audioStatusTimer);
				this.audioStatusTimer = null;
			}

			// 移除全局事件监听
			uni.$off('togglePlayPause', this.togglePlayPause);
			uni.$off('playModeChanged', this.onPlayModeChanged);
		},
		
		// 获取歌词
		fetchLyrics(songData) {
			// 确定音乐平台类型
			let type = '';
			switch (this.apiSource) {
				case 'qq':
					type = 'qq';
					break;
				case 'netease':
					type = 'wy';
					break;
				case 'kuwo':
					type = 'kw';
					break;
				case 'migu':
					type = 'mg';
					break;
				default:
					type = 'qq';
			}
			
			// 检查是否有mid
			if (songData.mid) {
				console.log('尝试获取歌词:', { mid: songData.mid, type: type });
				MusicData.getLyrics({ mid: songData.mid, type: type })
					.then(lyrics => {
						if (lyrics) {
							console.log('获取到歌词:', lyrics);
							this.songInfo.lrc = lyrics;
							this.lyricsList = this.parseLyrics(lyrics);
						} else {
							// 创建默认歌词
							this.createDefaultLyrics();
						}
					})
					.catch(error => {
						console.error('获取歌词失败:', error);
						// 创建默认歌词
						this.createDefaultLyrics();
					});
			} else {
				// 没有mid，创建默认歌词
				this.createDefaultLyrics();
			}
		},
		
		// 创建默认歌词
		createDefaultLyrics() {
			this.lyricsList = [{
				timestamp: 0,
				text: `${this.songInfo.title} - ${this.songInfo.singer}`
			},
			{
				timestamp: 1000,
				text: '音乐正在播放中...'
			},
			{
				timestamp: 3000,
				text: '感谢使用VHeart音乐盒'
			},
			{
				timestamp: 6000,
				text: '这里是默认歌词显示'
			},
			{
				timestamp: 9000,
				text: 'Enjoy your music time'
			}
			];
		},
		onShow() {
			// 刷新自动播放设置
			this.autoPlay = uni.getStorageSync('autoPlay') || false;
			
			// 当页面显示时，只恢复播放状态，不覆盖当前的歌曲信息
			// 歌曲信息已经在 playSongFromPlaylist 或 getMusicDetail 中正确设置
			try {
				const currentPlayState = uni.getStorageSync('globalPlayState');
				if (currentPlayState && typeof currentPlayState === 'object') {
					// 只恢复播放状态，不恢复歌曲信息（避免覆盖当前歌曲）
					if (currentPlayState.isPlaying !== undefined) {
						// 延迟一小段时间确保组件已更新
						setTimeout(() => {
							this.isPlaying = currentPlayState.isPlaying;
							console.log('恢复播放状态:', this.isPlaying);
						}, 300);
					}
					// 同步播放进度（如果当前没有进度的话）
					if (this.currentTime === 0 && currentPlayState.currentTime !== undefined) {
						this.currentTime = currentPlayState.currentTime;
					}
					if (this.duration === 0 && currentPlayState.duration !== undefined) {
						this.duration = currentPlayState.duration;
					}
					if (this.progress === 0 && currentPlayState.progress !== undefined) {
						this.progress = currentPlayState.progress;
					}
				}
			} catch (e) {
				console.error('恢复播放状态失败:', e);
			}
		},
		onReady() {
			// 组件加载完成后，如果有音频链接，尝试初始化播放



			if (this.songInfo && this.songInfo.music_url) {

			}
		},
		onPullDownRefresh() {

			setTimeout(() => {
				uni.stopPullDownRefresh()
			}, 1000)
		}
	}
</script>

<style lang="scss" scoped>
	page {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		color: #333;
		padding-bottom: 30rpx;
	}

	.main {
		min-height: 100vh;
		padding-bottom: 160rpx;
		position: relative;
		overflow-x: hidden;
	}

	/* 响应式适配 - 小屏幕设备 */
	@media screen and (max-width: 375px) {
		.song-title-section .T {
			font-size: 42rpx;
		}

		.pic {
			width: 70%;
		}

		.lyrics-container {
			height: 380rpx;
		}

		.play_stations {
			padding-bottom: 20rpx;
		}

		.player-card {
			height: 100rpx;
			padding: 15rpx 30rpx 20rpx;
		}

		.song-thumbnail {
			width: 80rpx;
			height: 80rpx;
		}

		.song-name {
			font-size: 28rpx;
		}

		.song-artist {
			font-size: 22rpx;
		}

		.current-time,
		.duration-time {
			font-size: 20rpx;
		}

		.play-pause-btn {
			width: 60rpx;
			height: 60rpx;
		}

		.play-pause-btn image {
			width: 48rpx;
			height: 48rpx;
		}

		.prev-btn-mini,
		.next-btn-mini,
		.play-mode-btn {
			width: 50rpx;
			height: 50rpx;
		}

		.download-btn-mini,
		.add-to-playlist-btn {
			width: 45rpx;
			height: 45rpx;
		}
	}

	/* 响应式适配 - 大屏幕设备 */
	@media screen and (min-width: 768px) {
		.song-title-section .T {
			font-size: 52rpx;
		}

		.pic {
			width: 60%;
			max-width: 500rpx;
		}

		.lyrics-container {
			height: 480rpx;
		}

		.play_stations {
			max-width: 750px;
			left: 50%;
			transform: translateX(-50%);
		}

		.player-card {
			height: 140rpx;
		}

		.song-thumbnail {
			width: 110rpx;
			height: 110rpx;
		}

		.song-name {
			font-size: 36rpx;
		}

		.song-artist {
			font-size: 28rpx;
		}

		.current-time,
		.duration-time {
			font-size: 26rpx;
		}
	}

	/* 头部标题样式与主页保持一致 */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 50rpx 30rpx;
		background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFA726 100%);
		color: white;
		box-shadow: 0 4rpx 20rpx rgba(255, 107, 107, 0.3);
		position: relative;
		overflow: hidden;
	}

	/* 头部装饰元素 */
	.header::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -10%;
		width: 200rpx;
		height: 200rpx;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
	}

	.header::after {
		content: '';
		position: absolute;
		bottom: -30%;
		left: -5%;
		width: 150rpx;
		height: 150rpx;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 50%;
	}

	/* 返回按钮样式 */
	.back-btn {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 70rpx;
		height: 70rpx;
		tap-highlight-color: rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		transition: all 0.3s ease;
		backdrop-filter: blur(10rpx);
	}

	.back-btn:active {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(0.95);
	}

	.back-btn image {
		width: 36rpx;
		height: 36rpx;
		filter: brightness(0) invert(1);
	}

	/* 头部右侧占位 */
	.header-right {
		width: 70rpx;
	}

	.app-title {
		font-size: 48rpx;
		font-weight: 700;
		margin: 0;
		letter-spacing: 2rpx;
		text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.2);
		position: relative;
		z-index: 1;
	}

	/* 歌曲标题样式 */
	.song-title-section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin-top: 8%;
		padding: 0 40rpx;

		.T {
			color: #333;
			font-size: 48rpx;
			font-weight: 700;
			margin-bottom: 16rpx;
			text-align: center;
			letter-spacing: 1rpx;
			line-height: 1.4;
			text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		}

		.singer {
			color: #666;
			font-size: 30rpx;
			margin: 0;
			font-weight: 500;
			letter-spacing: 1rpx;
			background: linear-gradient(135deg, #FF6B6B, #FFA726);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
	}

	/* 封面样式 */
	.pic {
		width: 75%;
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 60rpx auto;
		background: linear-gradient(135deg, #FF6B6B 0%, #FFA726 100%);
		border-radius: 30rpx;
		padding: 20rpx;
		box-shadow: 0 8rpx 30rpx rgba(255, 107, 107, 0.3);
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.pic::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
		border-radius: 30rpx;
	}

	.p {
		width: 100%;
		height: 100%;
		border-radius: 25rpx;
		box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.2);
		transition: all 0.3s ease;
		position: relative;
		z-index: 1;
	}

	.pic:active .p {
		transform: scale(0.98);
	}

	/* 歌曲信息样式 */
	.song-info {
		width: 80%;
		margin: 20rpx auto;
		padding: 20rpx;
		background-color: white;
		border-radius: 15rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);

		.info-item {
			display: flex;
			align-items: center;
			margin-bottom: 10rpx;
		}

		.info-item:last-child {
			margin-bottom: 0;
		}

		.info-label {
			color: #999;
			font-size: 28rpx;
			width: 120rpx;
		}

		.info-value {
			color: #333;
			font-size: 28rpx;
			flex: 1;
		}
	}

	/* 下载按钮样式 */
	.download-section {
		display: flex;
		justify-content: center;
		margin: 30rpx 0;
	}

	.download-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 60%;
		height: 100rpx;
		background: linear-gradient(135deg, #4CAF50, #45a049);
		color: white;
		font-size: 28rpx;
		border-radius: 50rpx;
		box-shadow: 0 4rpx 10rpx rgba(76, 175, 80, 0.3);
		border: none;
	}

	.download-btn:active {
		background: linear-gradient(135deg, #45a049, #3d8b40);
		box-shadow: 0 2rpx 5rpx rgba(76, 175, 80, 0.3);
	}

	.download-btn[disabled] {
		background: #cccccc;
		box-shadow: none;
	}

	/* 查看路径按钮样式 */
	.view-path-section {
		display: flex;
		justify-content: center;
		margin: 20rpx 0 60rpx 0;
	}

	.view-path-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 60%;
		height: 90rpx;
		background: linear-gradient(135deg, #2196F3, #0b7dda);
		color: white;
		font-size: 28rpx;
		border-radius: 50rpx;
		box-shadow: 0 4rpx 10rpx rgba(33, 150, 243, 0.3);
		border: none;
	}

	.view-path-btn:active {
		background: linear-gradient(135deg, #0b7dda, #005a9e);
	}

	.download-icon {
		width: 40rpx;
		height: 40rpx;
		margin-bottom: 8rpx;
	}

	/* 适配不同尺寸的设备 */
	@media screen and (max-width: 375px) {
		.download-btn {
			width: 70%;
			font-size: 26rpx;
		}
	}

	/* 歌词区域样式 */
	.lyrics-container {
		width: 90%;
		height: 420rpx;
		margin: 40rpx auto;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
		border-radius: 25rpx;
		padding: 30rpx;
		box-shadow: 0 8rpx 30rpx rgba(255, 107, 107, 0.15);
		backdrop-filter: blur(10rpx);
		border: 1rpx solid rgba(255, 107, 107, 0.1);
	}

	.lyrics-scroll {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.lyrics-line {
		color: #999;
		font-size: 28rpx;
		text-align: center;
		padding: 12rpx 20rpx;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
		line-height: 1.6;
		opacity: 0.6;
	}

	.lyrics-line.active {
		color: #FF6B6B;
		font-size: 34rpx;
		font-weight: 700;
		transform: scale(1.08);
		opacity: 1;
		text-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.3);
		background: linear-gradient(135deg, #FF6B6B, #FFA726);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* 底部播放卡片样式 - 进度条和图片同一行布局 */
	.play_stations {
		width: 100%;
		height: auto;
		position: fixed;
		bottom: 0rpx;
		left: 0;
		right: 0;
		z-index: 999;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
		box-shadow: 0 -8rpx 30rpx rgba(255, 107, 107, 0.15);
		backdrop-filter: blur(20rpx);
		border-top: 1rpx solid rgba(255, 107, 107, 0.1);
	}

	/* 进度条样式 */
	.progress-container {
		width: 100%;
		max-width: 750rpx;
		margin: 0 auto;
		padding: 15rpx 30rpx 30rpx;
		box-sizing: border-box;
	}

	.progress-slider {
		width: 100%;
		height: 8rpx;
		border-radius: 4rpx;
		transform: translateY(-2rpx);
		padding: 0;
		margin: 0;
	}

	/* 播放器卡片样式 - 水平布局 */
	.player-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 30rpx 30rpx;
		height: 120rpx;
		max-width: 750rpx;
		margin: 0 auto;
	}

	/* 左侧：缩略图 */
	.thumbnail-container {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 25rpx;
		flex-shrink: 0;
	}

	.song-thumbnail {
		width: 100rpx;
		height: 100rpx;
		border-radius: 15rpx;
		overflow: hidden;
		box-shadow: 0 6rpx 20rpx rgba(255, 107, 107, 0.3);
		transition: all 0.3s ease;
	}

	/* 中间：歌曲信息和时间 */
	.song-info-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
		min-width: 0;
		margin-right: 20rpx;
	}

	.song-basic-info {
		flex: 1;
		overflow: hidden;
		margin-bottom: 10rpx;
	}

	.song-name {
		font-size: 34rpx;
		color: #333;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
		margin-bottom: 8rpx;
		font-weight: 700;
		letter-spacing: 0.5rpx;
		line-height: 1.3;
	}

	.song-artist {
		font-size: 28rpx;
		color: #666;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
		font-weight: 500;
	}

	/* 时间信息样式 */
	.time-info {
		display: flex;
		align-items: center;
		margin-top: 8rpx;
	}

	.current-time,
	.duration-time {
		font-size: 26rpx;
		color: #FF6B6B;
		font-weight: 600;
		letter-spacing: 0.5rpx;
	}

	.duration-placeholder {
		font-size: 26rpx;
		color: #ccc;
	}

	.divider {
		font-size: 26rpx;
		color: #ddd;
		margin: 0 12rpx;
		font-weight: 500;
	}

	/* 右侧：播放控制按钮 */
	.card-right {
		display: flex;
		align-items: center;
		gap: 15rpx;
	}

	.control-buttons {
		display: flex;
		align-items: center;
		gap: 12rpx;
		flex-shrink: 0;
	}

	.play-pause-btn {
		width: 75rpx;
		height: 75rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		tap-highlight-color: rgba(0, 0, 0, 0.1);
		background: linear-gradient(135deg, #FF6B6B, #FFA726);
		border-radius: 50%;
		box-shadow: 0 6rpx 20rpx rgba(255, 107, 107, 0.5);
		transition: all 0.3s ease;
	}

	.play-pause-btn:active {
		transform: scale(0.92);
		box-shadow: 0 3rpx 10rpx rgba(255, 107, 107, 0.4);
	}

	.play-pause-btn image {
		width: 55rpx;
		height: 55rpx;
		filter: brightness(0) invert(1);
	}

	/* 更多功能按钮样式 */
	.more-btn {
		width: 70rpx;
		height: 70rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		tap-highlight-color: rgba(0, 0, 0, 0.1);
		background: linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 167, 38, 0.15));
		border-radius: 50%;
		transition: all 0.3s ease;
		border: 1.5rpx solid rgba(255, 107, 107, 0.25);
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.15);
	}

	.more-btn:active {
		background: linear-gradient(135deg, rgba(255, 107, 107, 0.25), rgba(255, 167, 38, 0.25));
		transform: scale(0.92);
		box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.2);
	}

	.more-icon {
		font-size: 24rpx;
		color: #FF6B6B;
		font-weight: 700;
		letter-spacing: 1.5rpx;
		line-height: 1;
	}

	/* 播放模式按钮样式 */
	.play-mode-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		tap-highlight-color: rgba(0, 0, 0, 0.1);
		background: linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 167, 38, 0.15));
		border-radius: 50%;
		transition: all 0.3s ease;
		border: 1rpx solid rgba(255, 107, 107, 0.2);
	}

	.play-mode-btn:active {
		background: linear-gradient(135deg, rgba(255, 107, 107, 0.25), rgba(255, 167, 38, 0.25));
		transform: scale(0.95);
	}

	.play-mode-text {
		font-size: 24rpx;
		color: #FF6B6B;
		font-weight: 700;
	}

	/* 底部卡片上一首按钮样式 */
	.prev-btn-mini {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 0;
		tap-highlight-color: rgba(76, 175, 80, 0.2);
		transition: all 0.3s ease;
	}

	.prev-btn-mini:active {
		transform: scale(0.92);
	}

	.prev-btn-mini image {
		width: 50rpx;
		height: 50rpx;
		filter: brightness(0.5);
	}

	/* 底部卡片下一首按钮样式 */
	.next-btn-mini {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 0;
		tap-highlight-color: rgba(76, 175, 80, 0.2);
		transition: all 0.3s ease;
	}

	.next-btn-mini:active {
		transform: scale(0.92);
	}

	.next-btn-mini image {
		width: 50rpx;
		height: 50rpx;
		filter: brightness(0.5);
	}

	/* 次要功能按钮容器 */
	.secondary-buttons {
		display: flex;
		align-items: center;
		gap: 12rpx;
		flex-shrink: 0;
	}

	/* 底部卡片下载按钮样式 */
	.download-btn-mini {
		width: 55rpx;
		height: 55rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 0;
		tap-highlight-color: rgba(76, 175, 80, 0.2);
		transition: all 0.3s ease;
	}

	.download-btn-mini:active {
		transform: scale(0.92);
	}

	.download-btn-mini image {
		width: 45rpx;
		height: 45rpx;
		filter: brightness(0.5);
	}

	.download-btn-mini.disabled image {
		filter: grayscale(100%) brightness(0.6);
	}

	/* 添加到歌单按钮样式 */
	.add-to-playlist-btn {
		width: 55rpx;
		height: 55rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 0;
		tap-highlight-color: rgba(255, 107, 107, 0.2);
		transition: all 0.3s ease;
	}

	.add-to-playlist-btn:active {
		transform: scale(0.92);
	}

	.add-icon {
		font-size: 44rpx;
		font-weight: 700;
		color: #FF6B6B;
		line-height: 1;
	}

	/* 更多功能折叠菜单样式 */
	.more-menu {
		position: fixed;
		bottom: 160rpx;
		right: 40rpx;
		z-index: 1000;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 20rpx;
		box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(20rpx);
		border: 1rpx solid rgba(255, 107, 107, 0.2);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.more-menu-content {
		padding: 10rpx 0;
		min-width: 200rpx;
	}

	.more-menu-item {
		display: flex;
		align-items: center;
		padding: 20rpx 30rpx;
		transition: all 0.3s ease;
		gap: 20rpx;
	}

	.more-menu-item:active {
		background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 167, 38, 0.1));
	}

	.more-menu-item image {
		width: 40rpx;
		height: 40rpx;
		filter: brightness(0.5);
	}

	.more-menu-icon {
		font-size: 40rpx;
		font-weight: 700;
		color: #FF6B6B;
		line-height: 1;
	}

	.more-menu-mode-text {
		font-size: 28rpx;
		font-weight: 700;
		color: #FF6B6B;
		min-width: 60rpx;
		text-align: center;
	}

	.more-menu-text {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
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
		pointer-events: auto;
	}

	.modal-content {
		width: 80%;
		max-width: 600rpx;
		background: white;
		border-radius: 16rpx;
		overflow: hidden;
		z-index: 10000;
		position: relative;
		pointer-events: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.playlist-header-info {
		display: flex;
		align-items: center;
		gap: 20rpx;
		flex: 1;
	}

	.playlist-cover {
		width: 100rpx;
		height: 100rpx;
		border-radius: 16rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.playlist-header-text {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.playlist-subtitle {
		font-size: 26rpx;
		color: #666;
	}

	.modal-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.close-btn {
		width: 48rpx;
		height: 48rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.modal-body {
		padding: 30rpx;
		max-height: 60vh;
		overflow-y: auto;
		pointer-events: auto;
	}

	/* 歌单列表样式 */
	.playlist-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.playlist-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background: #f9f9f9;
		border-radius: 12rpx;
		transition: background-color 0.3s;
	}

	.playlist-item:hover {
		background: #f0f0f0;
	}

	.playlist-info {
		flex: 1;
		margin-left: 20rpx;
	}

	.playlist-name {
		font-size: 28rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 8rpx;
	}

	.playlist-count {
		font-size: 24rpx;
		color: #999;
	}

	/* 空歌单状态样式 */
	.empty-playlist {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60rpx 20rpx;
	}

	.empty-text {
		font-size: 28rpx;
		color: #999;
		margin-bottom: 30rpx;
	}

	.create-playlist-btn {
		padding: 20rpx 40rpx;
		background-color: #FF6B6B;
		color: white;
		border: none;
		border-radius: 8rpx;
		font-size: 28rpx;
	}

	/* 输入框样式 */
	.playlist-name-input {
		width: 100%;
		padding: 24rpx;
		font-size: 28rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 8rpx;
		margin-bottom: 20rpx;
		background: #fff;
		z-index: 10001;
		position: relative;
		pointer-events: auto;
		-webkit-user-select: text;
		user-select: text;
	}

	.playlist-description-input {
		width: 100%;
		padding: 24rpx;
		font-size: 28rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 8rpx;
		margin-bottom: 20rpx;
		min-height: 120rpx;
		background: #fff;
		z-index: 10001;
		position: relative;
		pointer-events: auto;
		-webkit-user-select: text;
		user-select: text;
	}

	/* 模态框底部按钮样式 */
	.modal-footer {
		display: flex;
		border-top: 1rpx solid #f0f0f0;
	}

	.btn-cancel,
	.btn-confirm {
		flex: 1;
		padding: 30rpx;
		font-size: 30rpx;
		border: none;
		background: white;
	}

	.btn-cancel {
		color: #666;
		border-right: 1rpx solid #f0f0f0;
	}

	.btn-confirm {
		color: #FF6B6B;
		font-weight: bold;
	}

	.btn-cancel:active,
	.btn-confirm:active {
		background-color: #f9f9f9;
	}

	/* 歌单详情样式 */
	.playlist-detail-content {
		max-width: 700rpx;
		max-height: 85vh;
		border-radius: 30rpx;
		overflow: hidden;
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
	}

	.playlist-detail-body {
		max-height: 65vh;
		overflow-y: auto;
		padding: 0 30rpx 30rpx;
	}

	.playlist-songs-list {
		display: flex;
		flex-direction: column;
	}

	.playlist-song-item {
		display: flex;
		align-items: center;
		padding: 28rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
		transition: all 0.3s ease;
		border-radius: 16rpx;
		margin-bottom: 8rpx;
	}

	.playlist-song-item:active {
		background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 167, 38, 0.05));
		transform: scale(0.98);
	}

	.playlist-song-item:last-child {
		border-bottom: none;
	}

	.playlist-song-item.playing {
		background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 167, 38, 0.1));
		border: 2rpx solid rgba(255, 107, 107, 0.2);
	}

	.playlist-song-item.playing .song-title {
		color: #FF6B6B;
		font-weight: 600;
	}

	.playlist-song-item .song-index {
		width: 70rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 28rpx;
		color: #999;
	}

	.playlist-song-item .song-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.playlist-song-item .song-title {
		font-size: 32rpx;
		color: #333;
		margin-bottom: 6rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 500;
	}

	.playlist-song-item .song-singer {
		font-size: 26rpx;
		color: #666;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.playlist-song-item .song-duration {
		font-size: 26rpx;
		color: #999;
		min-width: 100rpx;
		text-align: right;
	}

	.empty-playlist-songs {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 100rpx 0;
		gap: 20rpx;
	}

	.empty-playlist-songs .empty-text {
		font-size: 30rpx;
		color: #999;
	}

	.add-songs-btn {
		margin-top: 20rpx;
		padding: 20rpx 40rpx;
		background: linear-gradient(135deg, #FF6B6B, #FFA726);
		color: white;
		border: none;
		border-radius: 30rpx;
		font-size: 28rpx;
		box-shadow: 0 8rpx 20rpx rgba(255, 107, 107, 0.3);
	}

	/* 歌单项布局优化 */
	.playlist-main {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.playlist-action-btn {
		padding: 12rpx 24rpx;
		background: linear-gradient(135deg, #FF6B6B, #FFA726);
		color: white;
		border-radius: 20rpx;
		font-size: 24rpx;
		margin-left: 20rpx;
	}

	.action-text {
		font-size: 24rpx;
		color: white;
		font-weight: 500;
	}

	/* 歌曲列表页面样式 */
	.playlist-page {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		z-index: 2000;
		display: flex;
		flex-direction: column;
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	.playlist-page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 30rpx;
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.back-btn {
		width: 40rpx;
		height: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.playlist-page-title {
		flex: 1;
		text-align: center;
		font-size: 36rpx;
		font-weight: 600;
		color: #333;
	}

	.playlist-page-actions {
		display: flex;
		align-items: center;
	}

	.sort-btn {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 10rpx 20rpx;
		background: rgba(255, 107, 107, 0.1);
		border-radius: 20rpx;
		font-size: 28rpx;
		color: #FF6B6B;
	}

	.search-bar {
		display: flex;
		align-items: center;
		padding: 20rpx 30rpx;
		background: white;
		margin: 20rpx 30rpx;
		border-radius: 30rpx;
		box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.08);
	}

	.search-input {
		flex: 1;
		font-size: 30rpx;
		color: #333;
		border: none;
		outline: none;
	}

	.sort-menu {
		position: fixed;
		top: 120rpx;
		right: 30rpx;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 20rpx;
		box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(20rpx);
		border: 1rpx solid rgba(255, 107, 107, 0.2);
		z-index: 2100;
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-20rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.sort-menu-content {
		padding: 10rpx 0;
		min-width: 200rpx;
	}

	.sort-menu-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 25rpx 30rpx;
		font-size: 30rpx;
		color: #333;
		transition: all 0.3s ease;
	}

	.sort-menu-item:active {
		background: rgba(255, 107, 107, 0.1);
	}

	.playlist-songs-page-list {
		flex: 1;
		overflow-y: auto;
		padding: 20rpx 30rpx;
	}

	.playlist-song-page-item {
		display: flex;
		align-items: center;
		padding: 25rpx 20rpx;
		background: white;
		border-radius: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
	}

	.playlist-song-page-item:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
	}

	.playlist-song-page-item.playing {
		background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 167, 38, 0.1));
		border: 2rpx solid rgba(255, 107, 107, 0.3);
	}

	.song-page-index {
		width: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		color: #999;
		margin-right: 20rpx;
	}

	.song-page-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.song-page-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
	}

	.song-page-singer {
		font-size: 26rpx;
		color: #666;
	}

	.song-page-actions {
		display: flex;
		align-items: center;
		gap: 15rpx;
	}

	.empty-playlist-page {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 100rpx 30rpx;
		font-size: 30rpx;
		color: #999;
	}
</style>