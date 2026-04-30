<template>
	<view class="main">
		<!-- 头部标题 -->
		<view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="back-btn" @click="backToHome">
				<image src="/static/back.png" style="width: 36px;height: 36px;" mode="aspectFit"></image>
			</view>
			<h1 class="app-title">VHeart动漫</h1>
			<view class="header-right"></view>
		</view>

		<!-- 搜索栏 -->
		<view class="search-container">
			<view class="search-bar">
				<input class="search-input" type="text" placeholder="请输入动漫名称" v-model="inputValue"
					confirm-type="search" @confirm="search()" placeholder-class="search-placeholder">
				<button class="search-btn" @click="search" :disabled="!inputValue || !inputValue.trim()"><text
						style="color: white;">搜索</text></button>
			</view>
			
			<!-- 搜索历史 -->
		<view class="search-history" v-if="searchHistory.length > 0">
			<view class="search-history-label">
				<text>搜索历史</text>
				<text class="clear-history" @click="clearSearchHistory">清除</text>
			</view>
			<view class="search-history-tags">
				<view v-for="(word, i) in searchHistory" :key="i" class="search-history-tag"
					@click="useSearchHistory(word)">{{ word }}</view>
			</view>
		</view>
		</view>

		<!-- 搜索结果区域 -->
		<view class="search-results" v-if="isSearching">
			<view class="loading">
				<view class="loading-spinner"></view>
				<text class="loading-text">搜索中...</text>
			</view>
		</view>
		
		<view class="anime-list" v-else-if="animeList.length > 0">
			<view v-for="(anime, index) in animeList" :key="index" class="anime-card"
				@click="openAnime(anime.play_url)">
				<image class="anime-cover" :src="anime.cover" mode="aspectFit"></image>
				<view class="anime-info">
					<text class="anime-title">{{ anime.title }}</text>
					<text class="anime-episode">{{ anime.episode }}</text>
					<text class="anime-info-text">{{ anime.info }}</text>
					<text class="anime-class">{{ anime.class_ }}</text>
				</view>
			</view>
		</view>
		
		<view class="no-results" v-else-if="hasSearched && animeList.length === 0">
			<image src="/static/images/api1.png" class="no-results-icon" mode="aspectFit"></image>
			<text class="no-results-text">未找到相关动漫</text>
		</view>
		
		<view class="welcome" v-else>
			<image src="/static/images/api1.png" class="welcome-icon" mode="aspectFit"></image>
			<text class="welcome-text">搜索你喜欢的动漫</text>
			<text class="welcome-subtext">输入动漫名称，开始探索精彩内容</text>
		</view>

		<!-- 分页加载 -->
		<view class="load-more" v-if="animeList.length > 0 && hasMore">
			<text class="load-more-text" @click="loadMore">加载更多</text>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAnimeModel } from '../../core/model/use-anime-model';

// 获取状态栏高度
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight;

// 状态管理
const inputValue = ref('');
const animeList = ref<any[]>([]);
const isSearching = ref(false);
const hasSearched = ref(false);
const currentPage = ref(1);
const hasMore = ref(true);
const searchHistory = ref<string[]>([]);

// 加载搜索历史
const loadSearchHistory = () => {
	try {
		const history = uni.getStorageSync('animeSearchHistory') || [];
		searchHistory.value = history;
	} catch (error) {
		console.error('加载搜索历史失败:', error);
	}
};

// 保存搜索历史
const saveSearchHistory = (keyword: string) => {
	if (!keyword.trim()) return;
	
	// 移除重复项
	const history = searchHistory.value.filter(item => item !== keyword);
	// 添加到开头
	history.unshift(keyword);
	// 只保留最近10条
	const newHistory = history.slice(0, 10);
	searchHistory.value = newHistory;
	
	try {
		uni.setStorageSync('animeSearchHistory', newHistory);
	} catch (error) {
		console.error('保存搜索历史失败:', error);
	}
};

// 清除搜索历史
const clearSearchHistory = () => {
	searchHistory.value = [];
	try {
		uni.removeStorageSync('animeSearchHistory');
		uni.showToast({
			title: '搜索历史已清除',
			icon: 'success'
		});
	} catch (error) {
		console.error('清除搜索历史失败:', error);
	}
};

// 使用搜索历史
const useSearchHistory = (keyword: string) => {
	inputValue.value = keyword;
	search();
};

// 搜索动漫
const search = async () => {
	if (!inputValue.value) return;
	const keyword = inputValue.value.trim();
	if (!keyword) return;
	
	saveSearchHistory(keyword);
	animeList.value = [];
	currentPage.value = 1;
	hasMore.value = true;
	hasSearched.value = true;
	isSearching.value = true;
	
	try {
		const result = await useAnimeModel.searchAnime({
			msg: keyword,
			page: currentPage.value
		});
		
		if (result && result.list) {
			animeList.value = result.list;
			hasMore.value = result.pagination?.total_page > currentPage.value;
		}
	} catch (error) {
		console.error('搜索动漫失败:', error);
		uni.showToast({
			title: '搜索失败，请重试',
			icon: 'none'
		});
	} finally {
		isSearching.value = false;
	}
};

// 加载更多
const loadMore = async () => {
	if (isSearching.value || !hasMore.value) return;
	
	currentPage.value++;
	isSearching.value = true;
	
	try {
		const result = await useAnimeModel.searchAnime({
			msg: inputValue.value.trim(),
			page: currentPage.value
		});
		
		if (result && result.list) {
			animeList.value = [...animeList.value, ...result.list];
			hasMore.value = result.pagination?.total_page > currentPage.value;
		} else {
			hasMore.value = false;
		}
	} catch (error) {
		console.error('加载更多失败:', error);
		currentPage.value--;
	} finally {
		isSearching.value = false;
	}
};

// 打开动漫
const openAnime = (url: string) => {
	if (url) {
		// 清理URL中的反引号
		const cleanUrl = url.replace(/`/g, '').trim();
		
		try {
			// 尝试使用plus.runtime.openURL（App端）
			if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.openURL) {
				plus.runtime.openURL(cleanUrl, (res) => {
					console.log('打开URL成功:', res);
				}, (err) => {
					console.error('打开URL失败:', err);
					// 如果打开失败，尝试使用navigateTo
					uni.navigateTo({
						url: `/pages/webview/webview?url=${encodeURIComponent(cleanUrl)}`
					});
				});
			} else if (typeof window !== 'undefined' && window.open) {
				// H5端使用window.open
				window.open(cleanUrl, '_blank');
			} else {
				// 其他情况使用navigateTo
				uni.navigateTo({
					url: `/pages/webview/webview?url=${encodeURIComponent(cleanUrl)}`
				});
			}
		} catch (error) {
			console.error('打开URL失败:', error);
			// 出错时使用navigateTo
			uni.navigateTo({
				url: `/pages/webview/webview?url=${encodeURIComponent(cleanUrl)}`
			});
		}
	}
};

// 返回首页
const backToHome = () => {
	uni.navigateBack({
		delta: 1
	});
};

// 页面加载
onMounted(() => {
	loadSearchHistory();
});
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
	align-items: center;
	justify-content: space-between;
	padding: 60rpx 30rpx 30rpx;
	background: linear-gradient(135deg, #FF6B6B, #556270);
	color: white;

	.app-title {
		font-size: 44rpx;
		font-weight: bold;
		margin: 0;
		flex: 1;
		text-align: center;
	}

	.back-btn {
		padding: 10rpx;
		border-radius: 50%;
		transition: all 0.3s ease;

		&:active {
			background: rgba(255, 255, 255, 0.2);
			transform: scale(0.95);
		}

		image {
			width: 36rpx;
			height: 36rpx;
		}
	}

	.header-right {
		width: 40rpx;
	}
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

/* 搜索历史 */
.search-history {
	margin-top: 20rpx;

	.search-history-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 24rpx;
		color: #999;
		margin-bottom: 12rpx;

		.clear-history {
			font-size: 20rpx;
			color: #999;
			transition: color 0.3s ease;

			&:active {
				color: #FF6B6B;
			}
		}
	}

	.search-history-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;

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
	}
}

/* 加载状态 */
.loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 150rpx 0;

	.loading-spinner {
		width: 60rpx;
		height: 60rpx;
		border: 4rpx solid #f3f4f6;
		border-top: 4rpx solid #FF6B6B;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 20rpx;
	}

	.loading-text {
		font-size: 28rpx;
		color: #666;
	}
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

/* 动漫列表 */
.anime-list {
	padding: 20rpx 40rpx;
}

.anime-card {
	display: flex;
	align-items: center;
	padding: 30rpx 20rpx;
	background: white;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
	transition: all 0.3s ease;
	box-sizing: border-box;

	&:active {
		background-color: #f9f9f9;
	}

	.anime-cover {
		width: 120rpx;
		height: 160rpx;
		border-radius: 12rpx;
		object-fit: cover;
		background: #f5f5f5;
		flex-shrink: 0;
	}

	.anime-info {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;

		.anime-title {
			display: block;
			font-size: 32rpx;
			font-weight: 500;
			color: #333;
			line-height: 1.4;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			max-width: 100%;
		}

		.anime-episode {
			display: block;
			font-size: 24rpx;
			color: #999;
			margin-top: 8rpx;
			line-height: 1.2;
		}

		.anime-info-text {
			display: block;
			font-size: 22rpx;
			color: #999;
			margin-top: 4rpx;
			line-height: 1.2;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			max-width: 100%;
		}

		.anime-class {
			display: inline-block;
			font-size: 20rpx;
			color: white;
			background: linear-gradient(135deg, #FF6B6B, #556270);
			padding: 4rpx 16rpx;
			border-radius: 16rpx;
			line-height: 1.4;
			margin-top: 8rpx;
		}
	}
}

/* 无结果状态 */
.no-results {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 150rpx 0;

	.no-results-icon {
		width: 120rpx;
		height: 120rpx;
		margin-bottom: 30rpx;
		opacity: 0.6;
	}

	.no-results-text {
		font-size: 28rpx;
		color: #999;
		text-align: center;
		padding: 0 40rpx;
	}
}

/* 欢迎状态 */
.welcome {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 200rpx 0;

	.welcome-icon {
		width: 160rpx;
		height: 160rpx;
	}

	.welcome-text {
		margin-top: 40rpx;
		font-size: 32rpx;
		color: #666;
		text-align: center;
		padding: 0 40rpx;
	}

	.welcome-subtext {
		margin-top: 16rpx;
		font-size: 24rpx;
		color: #999;
		text-align: center;
		padding: 0 60rpx;
	}
}

/* 加载更多 */
.load-more {
	text-align: center;
	padding: 40rpx 0;

	.load-more-text {
		font-size: 26rpx;
		color: #666;
		padding: 12rpx 36rpx;
		border: 1rpx solid #e5e7eb;
		border-radius: 24rpx;
		display: inline-block;
		transition: all 0.3s ease;
		background: white;

		&:active {
			background: #f5f5f5;
			transform: scale(0.95);
		}
	}
}
</style>