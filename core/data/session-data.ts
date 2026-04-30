/**
 * @Description:
 * 会话数据处理
 * 负责会话的创建、更新、列表获取等操作
 * @author liuzhiheng
 * @createTime 2026-03-06 09:55:28
 * @Copyright by 文刀
 */

// core/data/session-data.ts
import { NetApi } from '../net/net-api';
import type { ChatSession } from '../bean/index';

export const SessionData = {
	// 会话列表缓存有效期：30分钟
	SESSION_CACHE_PERIOD: 30 * 60 * 1000,

	/**
	 * 生成会话ID（规则：小的userId_大的userId，保证双方会话ID一致）
	 */
	generateSessionId: (userId1 : string, userId2 : string) : string => {
		try {
			return [userId1, userId2].sort().join('_');
		} catch (error) {
			console.error('生成会话ID失败', error);
			return `${userId1}_${userId2}`;
		}
	},

	/**
	 * 获取会话列表（优先缓存）
	 */
	getSessionList: async (userId : string) => {
		try {
			const cacheKey = `chat_session_list_cache_${userId}`;
			
			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				const { data, timestamp } = JSON.parse(cachedData);
				if (Date.now() - timestamp < SessionData.SESSION_CACHE_PERIOD) {
					console.log('从缓存获取会话列表');
					return data.sort((a: ChatSession, b: ChatSession) => b.updateTime - a.updateTime);
				}
			}
			
			const res = await NetApi.VheartChat.getSessionList(userId);
			const sortedData = res.data.sort((a: ChatSession, b: ChatSession) => b.updateTime - a.updateTime);
			
			uni.setStorageSync(cacheKey, JSON.stringify({
				data: sortedData,
				timestamp: Date.now()
			}));
			
			return sortedData;
		} catch (error) {
			console.error('获取会话列表失败', error);
			const cacheKey = `chat_session_list_cache_${userId}`;
			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				const { data } = JSON.parse(cachedData);
				console.log('网络失败，使用缓存的会话列表');
				return data.sort((a: ChatSession, b: ChatSession) => b.updateTime - a.updateTime);
			}
			throw error;
		}
	},

	/**
	 * 更新会话
	 */
	updateSession: async (session : Partial<ChatSession>) => {
		try {
			const res = await NetApi.VheartChat.updateSession(session);
			if (session.userId) {
				uni.removeStorageSync(`chat_session_list_cache_${session.userId}`);
			}
			return res.data;
		} catch (error) {
			console.error('更新会话失败', error);
			throw error;
		}
	},

	/**
	 * 更新本地会话缓存（发送消息后更新）
	 */
	updateLocalSessionCache: (userId : string, session : ChatSession) => {
		try {
			const cacheKey = `chat_session_list_cache_${userId}`;
			const cachedData = uni.getStorageSync(cacheKey);
			
			if (cachedData) {
				const { data, timestamp } = JSON.parse(cachedData);
				const index = data.findIndex((s: ChatSession) => s.sessionId === session.sessionId);
				
				if (index >= 0) {
					data[index] = { ...data[index], ...session };
				} else {
					data.push(session);
				}
				
				data.sort((a: ChatSession, b: ChatSession) => b.updateTime - a.updateTime);
				
				uni.setStorageSync(cacheKey, JSON.stringify({
					data,
					timestamp
				}));
			}
		} catch (error) {
			console.error('更新本地会话缓存失败', error);
		}
	},

	/**
	 * 清除会话列表缓存
	 */
	clearSessionCache: (userId : string) => {
		try {
			uni.removeStorageSync(`chat_session_list_cache_${userId}`);
		} catch (error) {
			console.error('清除会话缓存失败', error);
		}
	}
};
