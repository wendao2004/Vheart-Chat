/**
 * @Description:
 * 聊天核心业务
 * @author liuzhiheng
 * @createTime 2026-03-06 09:57:38
 * @Copyright by 文刀
 */
// core/model/use-chat-model.ts
// 引入data层和bean层
import { ref, computed, type Ref } from 'vue';
import { MessageData } from '../data/message-data';
import { globalUser } from './use-user-model';
import { NetApi } from '../net/net-api';
import type { ChatMessage } from '../bean/index';

// 云数据库引用 - 仅在支持的环境中使用
let db: any = null;

// 初始化数据库
const initDatabase = (): void => {
	try {
		db = uniCloud.database();
		console.log('数据库初始化成功');
	} catch (error) {
		console.warn('当前环境不支持 uniCloud.database()');
		db = null;
	}
};

// 初始尝试初始化数据库
initDatabase();

/**
 * 聊天业务模型（组合式API风格）
 */
export const useChatModel = (targetUserId: Ref<string>) => {
	// ========== 响应式状态 ==========
	const messageList = ref<ChatMessage[]>([]);
	const inputContent = ref('');
	const loading = ref(false);
	const sending = ref(false); // 发送中状态

	// 内部状态（不需要响应式）
	let messageWatcher: any = null;
	let lastMessageId: string | null = null; // 记录最后一条消息ID，用于增量加载

	// 计算属性：当前用户ID
	const currentUserId = computed(() => {
		return globalUser.currentUser?.userId || '';
	});

	// 计算属性：会话ID
	const sessionId = computed(() => {
		if (!currentUserId.value || !targetUserId.value) return '';
		return [currentUserId.value, targetUserId.value].sort().join('_');
	});

	// ========== 核心业务方法 ==========
	/**
	 * 加载历史消息（微信式缓存策略：先显示缓存，后台静默更新）
	 */
	const loadHistoryMessage = async (forceRefresh: boolean = false): Promise<void> => {
		if (!currentUserId.value || !targetUserId.value) return;
		console.log('加载历史消息:', {
			currentUserId: currentUserId.value,
			targetUserId: targetUserId.value,
			forceRefresh
		});
		
		const cacheKey = `chat_message_cache_${sessionId.value}`;
		const cachedData = uni.getStorageSync(cacheKey);
		
		// 缓存有效期：5分钟
		const CACHE_EXPIRY = 5 * 60 * 1000;
		
		// 1. 如果有缓存且不是强制刷新，先显示缓存（立即响应）
		if (!forceRefresh && cachedData) {
			try {
				const { data, timestamp } = JSON.parse(cachedData);
				if (data && data.length > 0) {
					console.log('先显示缓存消息:', data.length);
					messageList.value = data;
					// 记录最后一条消息ID
					lastMessageId = data[data.length - 1]._id;
					// 自动滚动到底部
					scrollToBottom();
					
					// 检查缓存是否在有效期内
					if (Date.now() - timestamp < CACHE_EXPIRY) {
						console.log('缓存未过期，不调用云函数');
						loading.value = false;
						return; // 缓存未过期，直接返回
					}
				}
			} catch (error) {
				console.error('解析缓存失败', error);
			}
		}
		
		// 2. 如果没有缓存或是强制刷新，显示加载状态
		if (forceRefresh || !cachedData) {
			loading.value = true;
		}
		
		try {
			// 3. 从服务器获取最新数据（后台静默更新）
			console.log('从服务器获取最新消息...');
			const res = await NetApi.VheartChat.getHistoryMessage({
				fromUid: currentUserId.value,
				userId1: currentUserId.value,
				userId2: targetUserId.value
			});
			
			const serverMessages = res.data;
			console.log('服务器返回消息:', serverMessages.length);
			
			if (serverMessages.length > 0) {
				// 4. 增量更新：合并服务器消息和本地消息
				const mergedMessages = mergeMessages(messageList.value, serverMessages);
				messageList.value = mergedMessages;
				
				// 5. 记录最后一条消息ID
				lastMessageId = mergedMessages[mergedMessages.length - 1]?._id || null;
				
				// 6. 更新缓存
				const cachedMessages = mergedMessages.slice(-MessageData.MAX_CACHE_MESSAGES);
				uni.setStorageSync(cacheKey, JSON.stringify({
					data: cachedMessages,
					timestamp: Date.now()
				}));
				
				// 7. 如果有新消息，滚动到底部
				if (serverMessages.length > messageList.value.length) {
					scrollToBottom();
				}
			}
		} catch (error) {
			console.error('加载历史消息失败', error);
			// 如果缓存也没有，启动智能轮询（立即执行一次）
			if (!cachedData) {
				startPolling(true);
			}
		} finally {
			loading.value = false;
		}
	};
	
	/**
	 * 合并消息（增量更新）
	 */
	const mergeMessages = (localMessages: ChatMessage[], serverMessages: ChatMessage[]): ChatMessage[] => {
		// 创建消息映射，以 _id 为键
		const messageMap = new Map<string, ChatMessage>();
		
		// 先添加本地消息
		localMessages.forEach(msg => {
			if (msg._id) {
				messageMap.set(msg._id, msg);
			}
		});
		
		// 再添加/更新服务器消息（服务器消息优先级更高）
		serverMessages.forEach(msg => {
			if (msg._id) {
				messageMap.set(msg._id, msg);
			}
		});
		
		// 转换回数组并按时间排序
		const merged = Array.from(messageMap.values());
		merged.sort((a, b) => a.createTime - b.createTime);
		
		console.log('合并后消息数:', merged.length, '本地:', localMessages.length, '服务器:', serverMessages.length);
		return merged;
	};

	/**
	 * 发送消息
	 */
	const sendMessage = async (): Promise<void> => {
		if (!inputContent.value.trim() || !currentUserId.value || !targetUserId.value || sending.value) return;

		// 1. 乐观更新
		const tempMessage: any = {
			fromUid: currentUserId.value,
			fromUserId: currentUserId.value,
			toUserId: targetUserId.value,
			content: inputContent.value,
			type: 'text',
			createTime: Date.now(),
			isRead: false
		};
		// 添加发送中标记
		const tempMessageWithStatus = { ...tempMessage, sending: true };
		messageList.value.push(tempMessageWithStatus as any);
		const sendContent = inputContent.value;
		inputContent.value = '';

		// 2. 滚动到底部
		scrollToBottom();

		sending.value = true;
		try {
			// 检查是否是给自己发送消息
			if (targetUserId.value === currentUserId.value) {
				// 给自己发送消息，纯本地处理
				console.log('给自己发送消息，纯本地处理');
				// 创建本地消息对象
				const localMessage: any = {
					...tempMessage,
					_id: `local_${Date.now()}`,
					sending: false,
					sendFailed: false
				};
				// 更新本地消息状态
				const index = messageList.value.findIndex(msg => 
					(msg as any).fromUserId === currentUserId.value && 
					(msg as any).createTime === tempMessage.createTime
				);
				if (index !== -1) {
					messageList.value[index] = localMessage;
				}
				// 保存到本地缓存
				MessageData.addMessageToLocalCache(sessionId.value, localMessage);
				// 更新本地最近聊天列表
				try {
					updateLocalRecentChat(targetUserId.value, sendContent);
				} catch (error) {
					console.error('更新本地最近聊天失败', error);
					// 更新失败不影响消息发送
				}
			} else {
				// 给他人发送消息，调用data层发送
				console.log('发送消息:', tempMessage);
				const sentMessage = await MessageData.sendMessage(tempMessage);
				console.log('发送成功:', sentMessage);
				// 4. 更新本地消息状态
				const index = messageList.value.findIndex(msg => 
					(msg as any).fromUserId === currentUserId.value && 
					(msg as any).createTime === tempMessage.createTime
				);
				if (index !== -1) {
					messageList.value[index] = sentMessage;
				}
				// 5. 更新本地最近聊天列表（不再使用 chat-sessions 表）
				try {
					updateLocalRecentChat(targetUserId.value, sendContent);
				} catch (error) {
					console.error('更新本地最近聊天失败', error);
					// 更新失败不影响消息发送
				}
			}
		} catch (error) {
			console.error('发送消息失败', error);
			uni.showToast({ title: '发送失败', icon: 'none' });
			// 更新本地消息状态为发送失败
			const index = messageList.value.findIndex(msg => 
				(msg as any).fromUserId === currentUserId.value && 
				(msg as any).createTime === tempMessage.createTime
			);
			if (index !== -1) {
				(messageList.value[index] as any).sending = false;
				(messageList.value[index] as any).sendFailed = true;
			}
		} finally {
			sending.value = false;
		}
	};

	/**
	 * 监听实时新消息
	 */
	const watchNewMessage = (): void => {
		if (!currentUserId.value || !targetUserId.value) return;

		console.log('开始监听新消息:', {
			currentUserId: currentUserId.value,
			targetUserId: targetUserId.value
		});

		// 检查 db 是否可用
		if (!db) {
			console.warn('数据库不可用，尝试重新初始化');
			initDatabase();
			
			// 再次检查 db 是否可用
			if (!db) {
				console.warn('数据库仍然不可用，启动轮询作为备用');
				startPolling();
				return;
			}
		}

		// 使用 uniapp 的 chat-messages 方案
		try {
			messageWatcher = db.collection('chat-messages')
				.where({
					$or: [
						{ fromUserId: currentUserId.value, toUserId: targetUserId.value },
						{ fromUserId: targetUserId.value, toUserId: currentUserId.value }
					]
				})
				.watch({
					onChange: (snapshot) => {
						console.log('收到新消息:', snapshot);
						const newMessages = snapshot.docChanges
							.filter(change => change.queueType === 'insert')
							.map(change => change.doc as ChatMessage);

						if (newMessages.length > 0) {
							console.log('新消息数量:', newMessages.length);
							// 过滤掉已经存在的消息（避免重复）
							const filteredMessages = newMessages.filter(msg => 
								!messageList.value.some(existingMsg => existingMsg._id === msg._id)
							);
							if (filteredMessages.length > 0) {
								messageList.value.push(...filteredMessages);
								// 更新缓存
								filteredMessages.forEach(msg => {
									MessageData.addMessageToLocalCache(sessionId.value, msg);
								});
								MessageData.markMessageRead(sessionId.value, currentUserId.value, targetUserId.value);
								scrollToBottom();
							}
						}
					},
					onError: (error) => {
						console.error('消息监听失败', error);
						// 监听失败时启动智能轮询作为备用（立即执行一次）
						startPolling(true);
					}
				});
		} catch (error) {
			console.error('启动消息监听失败', error);
			// 监听失败时启动智能轮询作为备用（立即执行一次）
			startPolling(true);
		}
	};

	/**
	 * 关闭监听器
	 */
	const closeWatcher = (): void => {
		if (messageWatcher) {
			messageWatcher.close();
		}
		// 停止轮询
		stopPolling();
	};

	/**
	 * 滚动到底部
	 */
	const scrollToBottom = (): void => {
		// 兼容处理：使用requestAnimationFrame或直接执行
		if (typeof requestAnimationFrame === 'function') {
			requestAnimationFrame(() => {
				uni.pageScrollTo({
					scrollTop: 999999,
					duration: 100,
					success: () => {},
					fail: (err) => {
						console.error('滚动失败', err);
					}
				});
			});
		} else {
			// 直接执行滚动
			uni.pageScrollTo({
				scrollTop: 999999,
				duration: 100,
				success: () => {},
				fail: (err) => {
					console.error('滚动失败', err);
				}
			});
		}
	};

	// 智能轮询策略
let pollingInterval: number | null = null;
let lastPollTime = 0;
const MIN_POLL_INTERVAL = 5000; // 最短轮询间隔5秒
const NORMAL_POLL_INTERVAL = 15000; // 正常轮询间隔15秒

// 启动智能轮询
const startPolling = (immediate: boolean = false) => {
	if (pollingInterval) {
		// 如果轮询已存在，根据情况调整
		const now = Date.now();
		if (immediate && now - lastPollTime > MIN_POLL_INTERVAL) {
			// 立即执行一次轮询
			pollOnce();
		}
		return;
	}
	
	console.log('启动消息轮询');
	
	// 立即执行一次
	if (immediate) {
		pollOnce();
	}
	
	// 设置定时轮询
	pollingInterval = setInterval(() => {
		pollOnce();
	}, NORMAL_POLL_INTERVAL);
};

// 执行一次轮询
const pollOnce = async () => {
	if (!currentUserId.value || !targetUserId.value) return;
	
	lastPollTime = Date.now();
	
	try {
		// 直接调用 NetApi 获取最新消息，绕过缓存
		const res = await NetApi.VheartChat.getHistoryMessage({
			fromUid: currentUserId.value,
			userId1: currentUserId.value,
			userId2: targetUserId.value
		});
		
		const messages = res.data;
		if (messages.length > 0) {
			// 使用增量更新策略
			const mergedMessages = mergeMessages(messageList.value, messages);
			
			// 检查是否有新消息
			if (mergedMessages.length > messageList.value.length) {
				console.log('轮询发现新消息:', mergedMessages.length - messageList.value.length);
				messageList.value = mergedMessages;
				
				// 更新缓存
				const cacheKey = `chat_message_cache_${sessionId.value}`;
				const cachedMessages = mergedMessages.slice(-MessageData.MAX_CACHE_MESSAGES);
				uni.setStorageSync(cacheKey, JSON.stringify({
					data: cachedMessages,
					timestamp: Date.now()
				}));
				
				// 自动滚动到底部
				scrollToBottom();
			}
		}
	} catch (error) {
		console.error('轮询更新消息失败', error);
	}
};
	
	// 停止轮询
	const stopPolling = () => {
		if (pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
			console.log('停止消息轮询');
		}
	};
	
	// 更新本地最近聊天列表
	const updateLocalRecentChat = (targetUserId: string, lastMessage: string): void => {
		try {
			const currentUserId = globalUser.currentUser?.userId;
			if (!currentUserId) return;
			
			const key = `chat_recent_chats_${currentUserId}`;
			let chats = uni.getStorageSync(key);
			chats = chats ? JSON.parse(chats) : [];
			
			// 生成会话ID
			const sessionId = [currentUserId, targetUserId].sort().join('_');
			
			// 查找是否已存在
			const existingIndex = chats.findIndex((chat: any) => chat.targetUserId === targetUserId);
			const chatData = {
				sessionId,
				userId: currentUserId,
				targetUserId,
				lastMessage,
				updateTime: Date.now(),
				unreadCount: 0
			};
			
			if (existingIndex > -1) {
				// 更新已有记录
				chats[existingIndex] = { ...chats[existingIndex], ...chatData };
			} else {
				// 添加新记录
				chats.push(chatData);
			}
			
			// 按时间排序
			chats.sort((a: any, b: any) => b.updateTime - a.updateTime);
			
			// 最多保存20个
			if (chats.length > 20) {
				chats = chats.slice(0, 20);
			}
			
			uni.setStorageSync(key, JSON.stringify(chats));
			console.log('更新本地最近聊天成功');
		} catch (error) {
			console.error('更新本地最近聊天失败', error);
		}
	};
	
	// 清理函数
	const cleanup = (): void => {
		closeWatcher();
	};

	return {
		messageList,
		inputContent,
		loading,
		sending,
		sessionId,
		loadHistoryMessage,
		sendMessage,
		watchNewMessage,
		closeWatcher,
		cleanup
	};
};
