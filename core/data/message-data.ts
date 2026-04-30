/**
 * @Description:
 * 消息数据处理
 * 负责消息的发送、接收、历史记录查询等操作
 * @author liuzhiheng
 * @createTime 2026-03-06 09:54:40
 * @Copyright by 文刀
 */

// core/data/message-data.ts
import { NetApi } from '../net/net-api';
import type { ChatMessage, SendMessageParams, GetHistoryMessageParams } from '../bean/index';

export const MessageData = {
	// 消息缓存有效期：30分钟（减少云函数调用）
	MESSAGE_CACHE_PERIOD: 30 * 60 * 1000,
	// 最大缓存消息数量：100条（避免缓存过大）
	MAX_CACHE_MESSAGES: 100,

	/**
	 * 格式化消息时间（时间戳 → 分:秒/昨天/日期）
	 */
	formatMessageTime: (timestamp : number) : string => {
		try {
			const now = Date.now();
			const diff = now - timestamp;
			const oneDay = 24 * 60 * 60 * 1000;

			if (diff < 60 * 1000) return '刚刚';
			if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`;
			if (diff < oneDay) {
				const date = new Date(timestamp);
				return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
			}
			if (diff < oneDay * 2) return '昨天';
			const date = new Date(timestamp);
			return `${date.getMonth() + 1}-${date.getDate()}`;
		} catch (error) {
			console.error('格式化消息时间失败', error);
			return '';
		}
	},

	/**
	 * 发送消息
	 */
	sendMessage: async (params : SendMessageParams) => {
		try {
			const fullParams : Required<SendMessageParams> = {
				type: 'text',
				...params
			};
			const res = await NetApi.VheartChat.sendMessage(fullParams);

			// 更新本地消息缓存
			const sessionId = [params.fromUserId, params.toUserId].sort().join('_');
			MessageData.addMessageToLocalCache(sessionId, res.data);

			return res.data;
		} catch (error) {
			console.error('发送消息失败', error);
			throw error;
		}
	},

	/**
	 * 添加消息到本地缓存
	 */
	addMessageToLocalCache: (sessionId : string, message : ChatMessage) => {
		try {
			const cacheKey = `chat_message_cache_${sessionId}`;
			const cachedData = uni.getStorageSync(cacheKey);

			if (cachedData) {
				const { data, timestamp } = JSON.parse(cachedData);
				// 检查是否已存在该消息
				const exists = data.some((m : ChatMessage) => m._id === message._id);
				if (!exists) {
					data.push(message);
					data.sort((a : ChatMessage, b : ChatMessage) => a.createTime - b.createTime);
					// 限制缓存大小
					if (data.length > MessageData.MAX_CACHE_MESSAGES) {
						data.splice(0, data.length - MessageData.MAX_CACHE_MESSAGES);
					}
					uni.setStorageSync(cacheKey, JSON.stringify({
						data,
						timestamp
					}));
				}
			} else {
				uni.setStorageSync(cacheKey, JSON.stringify({
					data: [message],
					timestamp: Date.now()
				}));
			}
		} catch (error) {
			console.error('添加本地消息缓存失败', error);
		}
	},

	/**
	 * 获取历史消息（优先使用缓存，缓存过期后从服务器获取）
	 */
	getHistoryMessage: async (params : GetHistoryMessageParams) => {
		try {
			const fullParams = {
				page: 1,
				pageSize: 50,
				...params
			};

			const sessionId = [params.userId1, params.userId2].sort().join('_');
			const cacheKey = `chat_message_cache_${sessionId}`;
			const cachedData = uni.getStorageSync(cacheKey);
			const cacheExpiry = 5 * 60 * 1000; // 5分钟缓存过期

			// 如果缓存存在且未过期，直接使用缓存
			if (cachedData) {
				const { data, timestamp } = JSON.parse(cachedData);
				if (Date.now() - timestamp < cacheExpiry) {
					console.log('使用缓存的历史消息');
					return data;
				}
			}

			// 缓存过期或不存在，从服务器获取最新数据
			const res = await NetApi.VheartChat.getHistoryMessage(fullParams);

			// 第一页保存到缓存
			if (fullParams.page === 1) {
				// 限制缓存大小
				const cachedMessages = res.data.slice(-MessageData.MAX_CACHE_MESSAGES);
				uni.setStorageSync(cacheKey, JSON.stringify({
					data: cachedMessages,
					timestamp: Date.now()
				}));
			}

			return res.data;
		} catch (error) {
			console.error('获取历史消息失败', error);
			const sessionId = [params.userId1, params.userId2].sort().join('_');
			const cacheKey = `chat_message_cache_${sessionId}`;
			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				const { data } = JSON.parse(cachedData);
				console.log('网络失败，使用缓存的历史消息');
				return data;
			}
			throw error;
		}
	},

	/**
	 * 后台更新缓存
	 */
	updateCacheInBackground: async (params : any, sessionId : string, cacheKey : string, currentData : ChatMessage[]) => {
		try {
			console.log('后台更新缓存...');
			const res = await NetApi.VheartChat.getHistoryMessage(params);
			// 合并新旧消息，去重
			const mergedMessages = [...currentData, ...res.data];
			const uniqueMessages = Array.from(new Map(mergedMessages.map(msg => [msg._id, msg])).values());
			uniqueMessages.sort((a, b) => a.createTime - b.createTime);
			// 限制缓存大小
			const cachedMessages = uniqueMessages.slice(-MessageData.MAX_CACHE_MESSAGES);
			uni.setStorageSync(cacheKey, JSON.stringify({
				data: cachedMessages,
				timestamp: Date.now()
			}));
			console.log('后台更新缓存完成');
		} catch (error) {
			console.error('后台更新缓存失败', error);
		}
	},

	/**
	 * 标记消息已读
	 */
	markMessageRead: async (sessionId : string, userId : string, targetUserId : string, uid : string) => {
		try {
			const res = await NetApi.VheartChat.markMessageRead({ sessionId, userId, targetUserId, uid });
			// 更新本地缓存中的已读状态
			const cacheKey = `chat_message_cache_${sessionId}`;
			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				const { data, timestamp } = JSON.parse(cachedData);
				data.forEach((msg : ChatMessage) => {
					if (msg.toUserId === userId) {
						msg.isRead = true;
					}
				});
				uni.setStorageSync(cacheKey, JSON.stringify({
					data,
					timestamp
				}));
			}
			return res.data;
		} catch (error) {
			console.error('标记消息已读失败', error);
			return null;
		}
	},

	/**
	 * 清除消息缓存
	 */
	clearMessageCache: (userId1 : string, userId2 : string) => {
		try {
			const sessionId = [userId1, userId2].sort().join('_');
			const cacheKey = `chat_message_cache_${sessionId}`;
			uni.removeStorageSync(cacheKey);
		} catch (error) {
			console.error('清除消息缓存失败', error);
		}
	}
};