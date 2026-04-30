<template>
	<view class="main">
		<!-- 头部标题 -->
		<view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<h1 class="app-title">VHeart音乐盒</h1>
		</view>

		<!-- 搜索栏 -->
		<view class="search-container">
			<view class="search-bar">
				<input class="search-input" type="text" placeholder="请输入歌曲或歌手" v-model="inputValue"
					confirm-type="search" @confirm="search()" placeholder-class="search-placeholder">
				<button class="search-btn" @click="search" :disabled="!inputValue.trim()"><text
						style="color: white;">搜索</text></button>
			</view>
			<!-- 接口源选择器 -->
			<view class="api-source-selector">
				<view class="api-source-label">接口源：</view>
				<view class="api-source-options">
					<view v-for="source in apiSources" :key="source.value"
						:class="['api-source-option', { active: apiSource === source.value }]"
						@click="switchApiSource(source.value)">
						{{ source.label }}
					</view>
				</view>
			</view>
			<!-- 搜索历史 -->
			<view class="search-history" v-if="searchHistory.length > 0">
				<text class="search-history-label">搜索历史</text>
				<view class="search-history-tags">
					<view v-for="(word, i) in searchHistory" :key="i" class="search-history-tag"
						@click="useSearchHistory(word)">{{ word }}</view>
				</view>
			</view>
		</view>

		<!-- 本地歌单区域 -->
		<view class="local-playlist-container" v-show="localPlaylist.length > 0">
			<view class="section-header">
				<text class="section-title">本地歌单</text>
				<view class="header-actions">
					<text class="playlist-count">{{ localPlaylist.length }}首歌曲</text>
					<view class="scan-btn" @click="scanLocalMusicFiles">
						<text style="color: #FF6B6B;">扫描</text>
					</view>
				</view>
			</view>
			<view class="local-playlist">
				<view v-for="(song, index) in localPlaylist" v-bind:key="song.id || song.title + song.singer + index"
					class="local-song-card">
					<!-- 删除按钮 -->
					<view class="delete-btn" @click.stop="deleteLocalSong(index)">
						<image src="/static/del.png" style="width: 26px;height: 26px;" mode="aspectFit"></image>
					</view>
					<!-- 歌曲卡片内容 -->
					<view class="card-content" @click="playLocalSong(song)">
						<view class="card-cover">
							<image :src="song.coverUrl || '/static/images/api1.png'" mode="aspectFill"></image>
							<view class="play-overlay">
								<image src="/static/play.png" style="width: 26px;height: 26px;" mode="aspectFit">
								</image>
							</view>
						</view>
						<view class="card-info">
							<view class="song-title">{{ song.title }}</view>
							<view class="song-singer">{{ song.singer }}</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 歌曲列表 -->
		<view class="song-list-container">
			<!-- 列表 -->
			<view v-show="sw" class="song-list">
				<view v-for="(item, index) in menu" v-bind:key="item.n || item.id || index" class="song-item"
					@click="num(index, item.title, item)" :data-index="index" :data-song="JSON.stringify(item)">
					<view class="song-rank">
						{{ index + 1 }}
					</view>
					<view class="song-info">
						<view class="song-title">{{ item.title }}</view>
						<view class="song-singer">{{ item.singer }}</view>
					</view>
					<view class="song-play-icon">
						<image src="/static/images/play.png" mode="aspectFit"></image>
					</view>
				</view>
			</view>

			<!-- 默认页 -->
			<view class="default-page" v-show="!sw && localPlaylist.length === 0">
				<view class="app-logo">
					<image src="/static/images/api1.png" mode="aspectFit"></image>
				</view>
				<text class="welcome-text">搜索你喜欢的音乐</text>
				<text class="sub-text">文刀出品 @vvendae</text>
			</view>
		</view>

		<!-- 歌曲数量统计 -->
		<view class="song-stats" v-show="sw && menu.length > 0">
			<text class="stats-text">共 {{ menu.length }} 首歌曲</text>
		</view>

		<!-- 加载更多提示 -->
		<view class="loading-more" v-show="loadingMore">
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 没有更多数据提示 -->
		<view class="no-more" v-show="sw && !hasMore && menu.length > 0">
			<text class="no-more-text">没有更多歌曲了</text>
		</view>

		<tabbar :current="1" />
	</view>
</template>

<script lang="ts">
	import tabbar from '../../common/tabbar/tabbar.vue';
	import { MusicData } from '../../core/data/music-data';
	import { globalMusic } from '../../core/model/use-music-model';
	export default {
		components: {
			tabbar
		},
		data() {
			return {
				inputValue: '',
				sw: false,
				menu: [],
				localPlaylist: [],
				statusBarHeight: 0,
				// 懒加载相关状态
				currentPage: 1, // 当前页数
				pageSize: 20, // 每页加载数量
				hasMore: true, // 是否还有更多歌曲
				loadingMore: false, // 是否正在加载更多
				currentSearchText: '', // 当前搜索关键词
				// 接口源选择
				apiSource: 'migu', // 默认使用咪咕音乐接口，可选 'netease'(网易云音乐)
				apiSources: [{
					value: 'migu',
					label: '咪咕'
				},
				// {
				// 	value: 'apple',
				// 	label: '苹果'
				// },
				// {
				// 	value: 'qq',
				// 	label: 'QQ'
				// },
				{
					value: 'kuwo',
					label: '酷我'
				}
					// {
					// 	value: 'netease',
					// 	label: '网易'
					// }
				],
				searchHistory: [] // 最近 10 条搜索关键词
			}
		},
		// 页面滚动到底部时触发加载更多
		onReachBottom() {
			console.log('滚动到底部，准备加载更多');
			this.loadMoreSongs();
		},
		methods: {
			// 列表检索歌曲
			num(index : number, name : any, item : any) {
				// 直接使用传入的item对象，避免通过索引获取可能导致的数据不一致
				const songItem = item || this.menu[index];

				// 如果没有有效的歌曲对象，显示错误提示
				if (!songItem) {
					console.error('无法获取歌曲数据，索引:', index);
					uni.showToast({
						title: '无法获取歌曲数据',
						icon: 'none'
					});
					return;
				}

				// 获取歌曲的唯一标识，确保是数字类型
				const songN = parseInt(songItem.n || songItem.id || (index + 1));
				const songTitle = songItem.title || name || '未知歌曲';
				const songSinger = songItem.singer || songItem.artist || '未知歌手';

				console.log('选择的歌曲:', songItem);
				console.log('歌曲标识(原始):', songItem.n);
				console.log('歌曲标识(处理后):', songN, '类型:', typeof songN);
				console.log('歌曲名称:', songTitle);
				console.log('歌曲歌手:', songSinger);

				// 优先检查本地歌单中是否已经有这首歌
				const localSong = this.findLocalSong(songTitle, songSinger);

				if (localSong) {
					// 如果本地歌单中有这首歌，优先播放本地版本
					console.log('在本地歌单中找到歌曲，优先播放本地版本:', localSong);

					try {
						// 保存本地歌曲信息到本地存储
						uni.setStorageSync('localSong', localSong);
						uni.setStorageSync('isLocalSong', true);
						// 同时保存网络歌曲信息作为备用
						uni.setStorageSync('index', songN);
						uni.setStorageSync('name', this.currentSearchText || songTitle);
						uni.setStorageSync('apiSource', this.apiSource);
						uni.setStorageSync('backupNetworkSong', {
							title: songTitle,
							singer: songSinger,
							n: songN,
							searchText: this.currentSearchText || songTitle
						});

						console.log('优先播放本地歌曲，保存备用网络歌曲信息');
					} catch (e) {
						console.error('保存歌曲数据失败:', e);
					}
				} else {
					// 本地歌单中没有这首歌，按原逻辑调用云函数获取歌曲详情
					try {
						// 保存歌曲标识
						uni.setStorageSync('index', songN);
						// 使用当前搜索框的内容作为name，而不是歌曲标题
						uni.setStorageSync('name', this.currentSearchText || songTitle);
						// 保存当前选择的接口源
						uni.setStorageSync('apiSource', this.apiSource);
						uni.setStorageSync('isLocalSong', false); // 标记为非本地歌曲
						// 不保存完整歌曲对象，确保播放页面重新搜索获取最新数据
						console.log('保存搜索参数到本地存储:', {
							n: songN,
							searchText: this.currentSearchText || songTitle
						});
					} catch (e) {
						console.error('保存歌曲数据失败:', e);
					}
				}

				// 跳转到player页面
				uni.navigateTo({
					url: '/pages/player/player',
					success: () => {
						console.log('成功跳转到播放页面');
					}
				});
			},

			// 在本地歌单中查找歌曲
			findLocalSong(title : any, singer : any) {
				if (!this.localPlaylist || this.localPlaylist.length === 0) {
					return null;
				}

				// 通过歌曲标题和歌手匹配本地歌曲
				const foundSong = this.localPlaylist.find(song => {
					return song.title === title && song.singer === singer;
				});

				if (foundSong) {
					console.log('在本地歌单中找到匹配歌曲:', foundSong);
					return foundSong;
				}

				console.log('本地歌单中未找到匹配歌曲:', {
					title,
					singer
				});
				return null;
			},

			// 播放本地歌曲
			playLocalSong(song : any) {
				console.log('播放本地歌曲:', song);

				// 保存本地歌曲信息到本地存储
				uni.setStorageSync('localSong', song);
				uni.setStorageSync('isLocalSong', true);

				// 跳转到player页面
				uni.navigateTo({
					url: '/pages/player/player',
					success: () => {
						console.log('成功跳转到播放页面播放本地歌曲');
					}
				});
			},

			// 删除本地歌曲
			deleteLocalSong(index : number) {
				// 显示确认对话框
				uni.showModal({
					title: '删除确认',
					content: '确定要删除这首歌曲吗？',
					success: (res) => {
						if (res.confirm) {
							// 用户确认删除
							try {
								// 从数组中移除歌曲
								this.localPlaylist.splice(index, 1);
								// 更新本地存储
								uni.setStorageSync('localPlaylist', this.localPlaylist);
								console.log('删除本地歌曲成功');

								// 显示删除成功提示
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});
							} catch (e) {
								console.error('删除本地歌曲失败:', e);
								uni.showToast({
									title: '删除失败，请重试',
									icon: 'none'
								});
							}
						}
					}
				});
			},

			// 加载本地歌单
			loadLocalPlaylist() {
				try {
					const playlist = uni.getStorageSync('localPlaylist') || [];
					// 数据验证：过滤无效条目
					this.localPlaylist = playlist.filter((song : { filePath : any; title : any; }) : { filePath : any; title : any; } => song && song.filePath && song.title);
					console.log('加载本地歌单成功，共', this.localPlaylist.length, '首歌曲');
				} catch (e) {
					console.error('加载本地歌单失败:', e);
					this.localPlaylist = [];
				}
			},

			// 扫描本地音乐文件
			scanLocalMusicFiles() {
				uni.showLoading({
					title: '正在扫描本地音乐...'
				});

				// 模拟扫描过程（实际项目中应使用uni.getFileSystemManager()或原生API）
				setTimeout(() => {
					uni.hideLoading();
					uni.showToast({
						title: '扫描完成',
						icon: 'success'
					});
					// 重新加载本地歌单
					this.loadLocalPlaylist();
				}, 1500);
			},

			// 监听本地歌单变化（实现热加载）
			watchLocalPlaylistChange() {
				// 定时检查本地存储中的歌单变化
				this.localPlaylistWatcher = setInterval(() => {
					try {
						const storedPlaylist = uni.getStorageSync('localPlaylist') || [];
						// 检查歌单是否发生变化
						if (storedPlaylist.length !== this.localPlaylist.length) {
							console.log('检测到本地歌单变化，更新列表');
							this.localPlaylist = storedPlaylist;
						}
					} catch (e) {
						console.error('检查本地歌单变化失败:', e);
					}
				}, 3000); // 每3秒检查一次
			},
			// 搜索按钮
			async search() {
				const searchText = this.inputValue.trim();
				if (!searchText) {
					uni.showToast({
						title: '请输入搜索内容',
						icon: 'none'
					});
					return;
				}

				console.log('用户搜索内容:', searchText);

				// 重置分页状态
				this.currentPage = 1;
				this.hasMore = true;
				this.currentSearchText = searchText;

				// 显示加载状态
				uni.showLoading({
					title: '搜索中...',
					mask: true
				})

				try {
					const reMusic = await globalMusic.searchMusic({
						title: searchText,
						singer: '',
						apiSource: this.apiSource
					});
					console.log('音乐请求成功：', reMusic);

					// 处理返回的歌曲数据
					if (reMusic && Array.isArray(reMusic)) {
						// 数据清洗：确保每首歌曲都有必要的字段
						const cleanedSongData = reMusic.map((song, idx) => {
							// 确保歌曲对象结构完整
							const cleanedSong = {
								n: song.n || song.id || idx + 1, // 确保有唯一标识
								title: song.title || song.name || '未知歌曲',
								singer: song.singer || song.artist || '未知歌手',
								...song // 保留原始数据的其他字段
							};
							return cleanedSong;
						});

						// 更新歌曲列表
						this.menu = cleanedSongData;
						// 显示歌曲列表
						this.sw = true;
						// 保存搜索历史
						this.saveSearchHistory(searchText);

						// 显示搜索结果提示
						uni.showToast({
							title: `找到${cleanedSongData.length}首歌曲`,
							icon: 'success'
						});
					} else {
						// 没有找到歌曲或数据格式异常
						this.menu = [];
						this.sw = false;
						uni.showToast({
							title: '未找到相关歌曲',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('音乐请求失败', error);
					this.menu = [];
					this.sw = false;

					// 根据错误类型显示不同的提示
					let errorMsg = '搜索失败，请重试';
					if (error instanceof Error && error.message) {
						if (error.message.includes('VIP') || error.message.includes('版权')) {
							errorMsg = error.message;
						}
					}

					uni.showToast({
						title: errorMsg,
						icon: 'none',
						duration: 3000
					});
				} finally {
					// 隐藏加载状态
					uni.hideLoading();
				}
			},

			// 加载下一页歌曲
			// loadMoreSongs() {
			// 	if (!this.hasMore || this.loadingMore || !this.currentSearchText) {
			// 		return;
			// 	}

			// 	this.loadingMore = true;
			// 	this.currentPage++;

			// 	console.log('加载第', this.currentPage, '页歌曲');
			// 	this.fetchSongs(this.currentSearchText, this.currentPage, this.pageSize, false);
			// },

			// 切换接口源
			switchApiSource(source : string) {
				if (this.apiSource !== source) {
					this.apiSource = source;
					console.log('切换接口源至:', source);
					// 如果有搜索内容，自动重新搜索
					if (this.currentSearchText) {
						this.search();
					}
				}
			},
			// 保存搜索历史（最多 10 条，新的在前）
			saveSearchHistory(keyword : string) {
				if (!keyword || !keyword.trim()) return;
				const k = keyword.trim();
				let list = (uni.getStorageSync('searchHistory') || []).filter(w => w && w !== k);
				list.unshift(k);
				if (list.length > 10) list = list.slice(0, 10);
				uni.setStorageSync('searchHistory', list);
				this.searchHistory = list;
			},
			// 使用某条搜索历史
			useSearchHistory(word : string) {
				this.inputValue = word;
				this.search();
			},

			// 统一的歌曲获取方法
			// fetchSongs(keyword : string, page : number, pageSize : number, isNewSearch : any) {
			// 	// 确保传入的参数有效
			// 	if (!keyword) {
			// 		console.error('搜索关键词不能为空');
			// 		uni.hideLoading();
			// 		this.loadingMore = false;
			// 		if (isNewSearch) {
			// 			uni.stopPullDownRefresh();
			// 		}
			// 		return;
			// 	}

			// 	// 根据选择的接口源调用不同的云函数
			// 	// const cloudFunctionName = this.apiSource === 'netease' ? 'RequestMusic-NetEase' : 'ReqMusic';
			// 	// console.log('调用云函数:', cloudFunctionName, '接口源:', this.apiSource);

			// 	// uniCloud.callFunction({
			// 	// 	name: cloudFunctionName,
			// 	// 	data: {
			// 	// 		song: keyword,
			// 	// 		page: page,
			// 	// 		pageSize: pageSize
			// 	// 	},
			// 	// 	success: (res) => {
			// 	// 		console.log('云函数返回结果:', res);

			// 	// 		// 处理返回的歌曲列表数据
			// 	// 		if (res.result && res.result.data) {
			// 	// 			const resultData = res.result.data;
			// 	// 			console.log('云函数返回处理后的数据:', resultData);

			// 	// 			// 处理嵌套的数据结构
			// 	// 			let songData : any[];
			// 	// 			if (resultData.code === '200' || resultData.code === 200) {
			// 	// 				// 检查是否存在嵌套的data对象
			// 	// 				if (resultData.data && typeof resultData.data === 'object') {
			// 	// 					// 如果嵌套的data对象中还有code和data字段，说明是更深的嵌套
			// 	// 					if (resultData.data.code && resultData.data.data) {
			// 	// 						songData = resultData.data.data;
			// 	// 						console.log('深层嵌套歌曲数据:', songData);
			// 	// 					} else {
			// 	// 						songData = resultData.data;
			// 	// 						console.log('歌曲数据:', songData);
			// 	// 					}
			// 	// 				} else {
			// 	// 					songData = resultData.data;
			// 	// 					console.log('歌曲数据:', songData);
			// 	// 				}

			// 	// 				// 检查是否是歌曲列表数组
			// 	// 				if (songData && Array.isArray(songData)) {
			// 	// 					// 数据清洗：确保每首歌曲都有必要的字段
			// 	// 					const cleanedSongData = songData.map((song, idx) => {
			// 	// 						// 确保歌曲对象结构完整
			// 	// 						const cleanedSong = {
			// 	// 							n: song.n || song.id || (page - 1) * pageSize + idx +
			// 	// 								1, // 确保有唯一标识
			// 	// 							title: song.title || song.name || '未知歌曲',
			// 	// 							singer: song.singer || song.artist || '未知歌手',
			// 	// 							...song // 保留原始数据的其他字段
			// 	// 						};
			// 	// 						return cleanedSong;
			// 	// 					});

			// 	// 					if (isNewSearch) {
			// 	// 						// 新搜索，替换当前列表
			// 	// 						this.menu = cleanedSongData;
			// 	// 						// 写入搜索历史（有结果时记录）
			// 	// 						this.saveSearchHistory(keyword);
			// 	// 					} else {
			// 	// 						// 加载更多，追加到当前列表
			// 	// 						this.menu = [...this.menu, ...cleanedSongData];
			// 	// 					}

			// 	// 					// 显示歌曲列表
			// 	// 					this.sw = true;

			// 	// 					// 判断是否还有更多数据
			// 	// 					this.hasMore = cleanedSongData.length === pageSize;

			// 	// 					// 不同的提示信息
			// 	// 					if (isNewSearch) {
			// 	// 						// 新搜索的提示
			// 	// 						uni.showToast({
			// 	// 							title: `找到${cleanedSongData.length}首歌曲`,
			// 	// 							icon: 'success'
			// 	// 						});
			// 	// 					} else {
			// 	// 						// 加载更多的提示
			// 	// 						console.log(`已加载第${page}页，共${this.menu.length}首歌曲`);
			// 	// 					}
			// 	// 				} else {
			// 	// 					// 数据格式不符预期
			// 	// 					console.error('歌曲数据格式异常，不是数组:', songData);
			// 	// 					if (isNewSearch) {
			// 	// 						this.menu = [];
			// 	// 						this.sw = false;
			// 	// 					}
			// 	// 					uni.showToast({
			// 	// 						title: '歌曲数据格式异常',
			// 	// 						icon: 'none'
			// 	// 					});
			// 	// 				}
			// 	// 			} else {
			// 	// 				// 没有找到歌曲或请求失败
			// 	// 				if (isNewSearch) {
			// 	// 					this.menu = [];
			// 	// 					this.sw = false;
			// 	// 				}
			// 	// 				const errorMsg = resultData.message || '未找到相关歌曲';
			// 	// 				uni.showToast({
			// 	// 					title: errorMsg,
			// 	// 					icon: 'none'
			// 	// 				});
			// 	// 			}
			// 	// 		} else {
			// 	// 			console.error('云函数返回数据格式异常:', res);
			// 	// 			if (isNewSearch) {
			// 	// 				this.menu = [];
			// 	// 				this.sw = false;
			// 	// 			}
			// 	// 			uni.showToast({
			// 	// 				title: '数据获取失败',
			// 	// 				icon: 'none'
			// 	// 			});
			// 	// 		}

			// 	// 		// 隐藏加载状态
			// 	// 		uni.hideLoading();
			// 	// 		this.loadingMore = false;

			// 	// 		// 如果是下拉刷新状态，停止刷新
			// 	// 		if (isNewSearch) {
			// 	// 			uni.stopPullDownRefresh();
			// 	// 		}
			// 	// 	},
			// 	// 	fail: (err) => {
			// 	// 		console.error('调用云函数失败:', err);
			// 	// 		uni.hideLoading();
			// 	// 		this.loadingMore = false;

			// 	// 		// 如果是下拉刷新状态，停止刷新
			// 	// 		if (isNewSearch) {
			// 	// 			uni.stopPullDownRefresh();
			// 	// 		}

			// 	// 		// 简单的错误提示
			// 	// 		uni.showToast({
			// 	// 			title: '网络请求失败，请重试',
			// 	// 			icon: 'none'
			// 	// 		});
			// 	// 	}
			// 	// })
			// }
		},
		onLoad() {
			console.log('页面加载成功');
			// 获取系统信息，适配水滴屏
			const systemInfo = uni.getSystemInfoSync();
			this.statusBarHeight = systemInfo.statusBarHeight || 0;
			console.log('状态栏高度:', this.statusBarHeight);
			// 加载搜索历史
			this.searchHistory = uni.getStorageSync('searchHistory') || [];
			// 加载本地歌单
			this.loadLocalPlaylist();
			// 启动本地歌单变化监听（实现热加载）
			this.watchLocalPlaylistChange();
		},

		// 页面卸载时清理定时器
		onUnload() {
			if (this.localPlaylistWatcher) {
				clearInterval(this.localPlaylistWatcher);
				this.localPlaylistWatcher = null;
			}
		},
		onPullDownRefresh() {
			console.log('开始刷新...')
			// 如果有当前搜索关键词，则重新搜索
			if (this.currentSearchText) {
				this.search();
			} else {
				// 否则重新加载本地歌单
				this.loadLocalPlaylist();
				// 停止下拉刷新动画
				uni.stopPullDownRefresh();
			}
		}
	}
</script>

<style lang="scss">
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
		padding: 60rpx 0;
		background: linear-gradient(135deg, #FF6B6B, #556270);
		color: white;
	}

	.app-title {
		font-size: 44rpx;
		font-weight: bold;
		margin: 0;
	}

	/* 搜索栏 */
	.search-container {
		padding: 30rpx 40rpx;
		background: white;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	}

	.search-bar {
		display: flex;
		align-items: center;
		width: 100%;
		border-radius: 100rpx;
		background-color: #f5f5f5;
		overflow: hidden;
	}

	/* 接口源选择器样式 */
	.api-source-selector {
		margin-top: 20rpx;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
	}

	.api-source-label {
		font-size: 26rpx;
		color: #666;
		margin-right: 16rpx;
		white-space: nowrap;
	}

	.api-source-options {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		flex: 1;
	}

	.api-source-option {
		padding: 10rpx 24rpx;
		border-radius: 40rpx;
		background-color: #f5f5f5;
		font-size: 24rpx;
		color: #666;
		transition: all 0.3s ease;
		border: 2rpx solid transparent;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	}

	.api-source-option.active {
		background: linear-gradient(135deg, #FF6B6B, #556270);
		color: white;
		border-color: rgba(255, 255, 255, 0.3);
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
	}

	.api-source-option:active {
		transform: scale(0.95);
	}

	.search-history {
		margin-top: 20rpx;
	}

	.search-history-label {
		display: block;
		font-size: 24rpx;
		color: #999;
		margin-bottom: 12rpx;
	}

	.search-history-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.search-history-tag {
		padding: 10rpx 24rpx;
		border-radius: 40rpx;
		background-color: #f5f5f5;
		font-size: 26rpx;
		color: #666;

		&:active {
			opacity: 0.8;
		}
	}

	.search-input {
		flex: 1;
		height: 80rpx;
		padding: 0 30rpx;
		font-size: 28rpx;
		background: transparent;
	}

	.search-placeholder {
		color: #999;
	}

	.search-btn {
		height: 64rpx;
		padding: 0 36rpx;
		margin-right: 8rpx;
		background: linear-gradient(135deg, #FF6B6B, #556270);
		color: white;
		font-size: 28rpx;
		border-radius: 64rpx;
	}

	.search-btn:disabled {
		background: #ccc;
	}

	/* 歌曲列表 */
	.song-list-container {
		padding: 20rpx 40rpx;
	}

	.song-list {
		background: white;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.song-item {
		display: flex;
		align-items: center;
		padding: 30rpx 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
		transition: all 0.3s ease;
		box-sizing: border-box;
	}

	.song-item:last-child {
		border-bottom: none;
	}

	.song-item:active {
		background-color: #f9f9f9;
	}

	.song-rank {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 60rpx;
		font-size: 28rpx;
		color: #999;
		font-weight: 500;
		flex-shrink: 0;
	}

	.song-info {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
	}

	.song-title {
		font-size: 32rpx;
		font-weight: 500;
		color: #333;
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.song-singer {
		font-size: 24rpx;
		color: #999;
		margin-top: 8rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.song-play-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 60rpx;
	}

	.song-play-icon image {
		width: 40rpx;
		height: 40rpx;
	}

	/* 默认页面 */
	.default-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120rpx 40rpx;
	}

	.app-logo {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 200rpx;
		height: 200rpx;
		margin-bottom: 40rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #FF6B6B, #556270);
	}

	.app-logo image {
		width: 150rpx;
		height: 150rpx;
	}

	.welcome-text {
		font-size: 36rpx;
		color: #555;
		margin-bottom: 16rpx;
	}

	.sub-text {
		font-size: 24rpx;
		color: #999;
	}

	/* 歌曲统计 */
	.song-stats {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 20rpx 0;
		margin-top: 20rpx;
	}

	.stats-text {
		font-size: 24rpx;
		color: #999;
	}

	/* 加载更多样式 */
	.loading-more {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 30rpx 0;
	}

	.loading-text {
		font-size: 24rpx;
		color: #999;
	}

	/* 没有更多数据样式 */
	.no-more {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 30rpx 0;
	}

	.no-more-text {
		font-size: 24rpx;
		color: #ccc;
	}

	/* 本地歌单样式 */
	.local-playlist-container {
		padding: 30rpx 40rpx 10rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.scan-btn {
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		background-color: #FFF0F0;
		font-size: 24rpx;
		transition: all 0.3s;
	}

	.scan-btn:active {
		background-color: #FFE0E0;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.playlist-count {
		font-size: 24rpx;
		color: #999;
	}

	.local-playlist {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20rpx;
	}

	.local-song-card {
		position: relative;
		display: flex;
		flex-direction: column;
		background: white;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	/* 删除按钮样式 */
	.delete-btn {
		position: absolute;
		top: 10rpx;
		right: 10rpx;
		width: 60rpx;
		height: 60rpx;
		background-color: rgba(0, 0, 0, 0.5);
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10;
	}

	.delete-btn image {
		width: 30rpx;
		height: 30rpx;
		tint-color: white;
	}

	.delete-btn:active {
		background-color: rgba(255, 0, 0, 0.7);
	}

	/* 卡片内容样式 */
	.card-content {
		display: flex;
		flex-direction: column;
		touch-action: manipulation;
	}

	.card-content:active {
		background-color: rgba(0, 0, 0, 0.05);
	}

	.card-cover {
		position: relative;
		width: 100%;
		padding-bottom: 100%;
		/* 保持正方形 */
		overflow: hidden;
	}

	.card-cover image {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.play-overlay {
		position: absolute;
		bottom: 16rpx;
		right: 16rpx;
		width: 56rpx;
		height: 56rpx;
		background-color: rgba(0, 0, 0, 0.6);
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		opacity: 0.8;
	}

	.play-overlay image {
		width: 30rpx;
		height: 30rpx;
		transform: translateX(2rpx);
		/* 微调播放图标居中 */
	}

	.card-info {
		padding: 16rpx 20rpx;
	}
</style>