<template>
	<view class="tabbar">
		<view class="tab-item" :class="{ active: currentPath === '/pages/music-index/music-index' }"
			@click="tabSwitch('/pages/music-index/music-index')">
			首页
		</view>
		<view class="tab-item" :class="{ active: currentPath === '/pages/playlist/playlist' }"
			@click="tabSwitch('/pages/playlist/playlist')">
			歌单
		</view>
		<view class="tab-item" :class="{ active: currentPath === '/pages/me/me' }" @click="tabSwitch('/pages/me/me')">
			我的
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue';

	// 存储当前页面路径，用于高亮
	const currentPath = ref('');

	// 获取当前页面路由
	onMounted(() => {
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		if (currentPage) {
			currentPath.value = `/${currentPage.route}`;
		}
	});

	// tab 切换（确保函数能被模板调用）
	const tabSwitch = (url) => {
		currentPath.value = url;
		uni.redirectTo({
			url
		});
	};
</script>

<style scoped>
	.tabbar {
		position: fixed;
		left: 0;
		bottom: 0;
		width: 100%;
		height: 50px;
		background: #fff;
		display: flex;
		justify-content: space-around;
		align-items: center;
		border-top: 1px solid #eee;
		z-index: 999;
	}

	.tab-item {
		font-size: 14px;
		color: #333;
	}

	.tab-item.active {
		color: #42b983;
		/* 高亮颜色 */
		font-weight: bold;
	}
</style>