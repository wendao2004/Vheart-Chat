/**
 * @Description:
 * 用户数据处理
 * 负责用户的登录、注册、信息管理等操作
 * @author liuzhiheng
 * @createTime 2026-03-06 09:53:44
 * @Copyright by 文刀
 */

// core/data/user-data.ts
// 只能引入net层和bean层
import { NetApi } from '../net/net-api';
import type { ChatUser } from '../bean/index';

export const UserData = {
	// 登录有效期：7天（单位：毫秒）
	LOGIN_VALIDITY_PERIOD: 7 * 24 * 60 * 60 * 1000,
	// 用户列表缓存有效期：30分钟
	USER_LIST_CACHE_PERIOD: 30 * 60 * 1000,
	// 好友列表缓存有效期：30分钟
	FRIEND_LIST_CACHE_PERIOD: 30 * 60 * 1000,
	// 好友请求缓存有效期：10分钟
	FRIEND_REQUEST_CACHE_PERIOD: 10 * 60 * 1000,

	/**
	 * 保存当前登录用户信息到本地
	 */
	saveLocalUser: (user : ChatUser) => {
		try {
			const userData = {
				...user,
				loginTime: Date.now()
			};
			uni.setStorageSync('chat_current_user', JSON.stringify(userData));
		} catch (error) {
			console.error('保存用户信息失败', error);
		}
	},

	/**
	 * 获取本地登录的用户信息（检查有效期）
	 */
	getLocalUser: () : ChatUser | null => {
		try {
			const userStr = uni.getStorageSync('chat_current_user');
			if (!userStr) return null;

			const userData = JSON.parse(userStr);
			const now = Date.now();

			if (userData.loginTime && (now - userData.loginTime) > UserData.LOGIN_VALIDITY_PERIOD) {
				console.log('登录已过期，需要重新登录');
				UserData.clearLocalUser();
				return null;
			}

			// 处理旧的用户对象结构，确保userId存在
			if (!userData.userId && userData.userInfo) {
				const processedUserData = {
					userId: userData.userInfo._id || userData.userInfo.account,
					nickname: userData.userInfo.nickname || `用户${userData.userInfo.account}`,
					avatarUrl: userData.userInfo.avatarUrl || 'https://img.icons8.com/ios-filled/50/000000/user.png',
					createTime: new Date(userData.userInfo.createTime).getTime() || Date.now(),
					phoneNumber: userData.userInfo.account,
					token: userData.token,
					loginTime: userData.loginTime
				};
				// 保存处理后的用户信息
				UserData.saveLocalUser(processedUserData);
				return processedUserData;
			}

			return userData;
		} catch (error) {
			console.error('获取用户信息失败', error);
			return null;
		}
	},

	/**
	 * 退出登录，清空本地数据
	 */
	clearLocalUser: () => {
		try {
			uni.removeStorageSync('chat_current_user');
			uni.removeStorageSync('chat_user_list_cache');
			uni.removeStorageSync('chat_friend_list_cache');
			uni.removeStorageSync('chat_friend_request_cache');
			uni.removeStorageSync('chat_session_list_cache');
		} catch (error) {
			console.error('清空用户信息失败', error);
		}
	},

	/**
	 * 用户登录（调用net层+本地存储）
	 */
	userLogin: async (userInfo : Omit<ChatUser, 'createTime','userInfo'>) => {
		try {
			const res = await NetApi.auth.login(userInfo);
			// 处理后端返回的用户对象结构
			const userData = {
				userId: res.data.userInfo?._id || res.data.userInfo?.account,
				nickname: res.data.userInfo?.nickname || `用户${res.data.userInfo?.account}`,
				avatarUrl: res.data.userInfo?.avatarUrl || 'https://img.icons8.com/ios-filled/50/000000/user.png',
				createTime: new Date(res.data.userInfo?.createTime).getTime() || Date.now(),
				phoneNumber: res.data.userInfo?.account,
				token: res.data.token
			};
			UserData.saveLocalUser(userData);
			return userData;
		} catch (error) {
			console.error('登录失败', error);
			throw error;
		}
	},

	/**
	 * 用户注册（调用net层）
	 */
	userRegister: async (userInfo : Omit<ChatUser, 'createTime'>) => {
		try {
			const res = await NetApi.auth.register(userInfo);
			return res.data;
		} catch (error) {
			console.error('注册失败', error);
			throw error;
		}
	},

	/**
	 * 获取用户列表（优先缓存）
	 */
	getUserList: async (excludeUserId ?: string) => {
		try {
			const cacheKey = `chat_user_list_cache_${excludeUserId || 'all'}`;

			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				const { data, timestamp } = JSON.parse(cachedData);
				if (Date.now() - timestamp < UserData.USER_LIST_CACHE_PERIOD) {
					console.log('从缓存获取用户列表');
					return data;
				}
			}

			const res = await NetApi.VheartChat.getUserList(excludeUserId);

			uni.setStorageSync(cacheKey, JSON.stringify({
				data: res.data,
				timestamp: Date.now()
			}));

			return res.data;
		} catch (error) {
			console.error('获取用户列表失败', error);
			const cacheKey = `chat_user_list_cache_${excludeUserId || 'all'}`;
			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				const { data } = JSON.parse(cachedData);
				console.log('网络失败，使用缓存的用户列表');
				return data;
			}
			throw error;
		}
	},

	/**
	 * 搜索用户（本地优先）
	 */
	searchUser: async (keyword : string, excludeUserId ?: string) => {
		try {
			// 先尝试本地搜索
			const cacheKey = `chat_user_list_cache_${excludeUserId || 'all'}`;
			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				const { data } = JSON.parse(cachedData);
				const localResults = data.filter((user : ChatUser) =>
					user.phoneNumber?.includes(keyword) ||
					user.nickname?.includes(keyword) ||
					user.userId?.includes(keyword)
				);
				if (localResults.length > 0) {
					console.log('从本地缓存搜索用户');
					return localResults;
				}
			}

			// 本地没有结果，调用云函数
			const res = await NetApi.VheartChat.searchUser(keyword, excludeUserId);
			return res.data;
		} catch (error) {
			console.error('搜索用户失败', error);
			throw error;
		}
	},

	/**
	 * 发送好友请求
	 */
	sendFriendRequest: async (fromUserId : string, toUserId : string, message : string = '') => {
		try {
			const res = await NetApi.VheartChat.sendFriendRequest(fromUserId, toUserId, message);
			// 清除好友请求缓存
			uni.removeStorageSync(`chat_friend_request_cache_${fromUserId}`);
			return res.data;
		} catch (error) {
			console.error('发送好友请求失败', error);
			throw error;
		}
	},

	/**
	 * 获取好友请求列表（优先缓存）
	 */
	getFriendRequests: async (userId : string) => {
		try {
			const cacheKey = `chat_friend_request_cache_${userId}`;

			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				const { data, timestamp } = JSON.parse(cachedData);
				if (Date.now() - timestamp < UserData.FRIEND_REQUEST_CACHE_PERIOD) {
					console.log('从缓存获取好友请求');
					return data;
				}
			}

			const res = await NetApi.VheartChat.getFriendRequests(userId);

			uni.setStorageSync(cacheKey, JSON.stringify({
				data: res.data,
				timestamp: Date.now()
			}));

			return res.data;
		} catch (error) {
			console.error('获取好友请求列表失败', error);
			const cacheKey = `chat_friend_request_cache_${userId}`;
			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				const { data } = JSON.parse(cachedData);
				console.log('网络失败，使用缓存的好友请求');
				return data;
			}
			throw error;
		}
	},

	/**
	 * 处理好友请求
	 */
	handleFriendRequest: async (requestId : string, userId : string, status : 'accepted' | 'rejected') => {
		try {
			const res = await NetApi.VheartChat.handleFriendRequest(requestId, status, userId);
			// 清除相关缓存
			uni.removeStorageSync(`chat_friend_request_cache_${userId}`);
			uni.removeStorageSync(`chat_friend_list_cache_${userId}`);
			
			// 如果是接受请求，清除添加方的好友列表缓存（如果能获取到添加方的userId）
			if (status === 'accepted' && res.data && res.data.fromUserId) {
				uni.removeStorageSync(`chat_friend_list_cache_${res.data.fromUserId}`);
			}
			
			return res.data;
		} catch (error) {
			console.error('处理好友请求失败', error);
			throw error;
		}
	},

	/**
	 * 获取好友列表（优先缓存）
	 */
	getFriendList: async (userId : string) => {
		try {
			console.log('getFriendList - 开始获取好友列表，userId:', userId);
			const cacheKey = `chat_friend_list_cache_${userId}`;

			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				const { data, timestamp } = JSON.parse(cachedData);
				if (Date.now() - timestamp < UserData.FRIEND_LIST_CACHE_PERIOD) {
					console.log('getFriendList - 从缓存获取好友列表:', data);
					return data;
				}
			}

			console.log('getFriendList - 调用NetApi.VheartChat.getFriendList');
			const res = await NetApi.VheartChat.getFriendList(userId);
			console.log('getFriendList - 云函数返回结果:', res);

			// 保存到缓存
			uni.setStorageSync(cacheKey, JSON.stringify({
				data: res.data,
				timestamp: Date.now()
			}));

			return res.data;
		} catch (error) {
			console.error('getFriendList - 获取好友列表失败', error);
			const cacheKey = `chat_friend_list_cache_${userId}`;
			const cachedData = uni.getStorageSync(cacheKey);
			if (cachedData) {
				const { data } = JSON.parse(cachedData);
				console.log('getFriendList - 网络失败，使用缓存的好友列表:', data);
				return data;
			}
			throw error;
		}
	},

	/**
	 * 清除用户相关缓存
	 */
	clearUserCache: (userId : string) => {
		try {
			uni.removeStorageSync(`chat_user_list_cache_${userId}`);
			uni.removeStorageSync(`chat_friend_list_cache_${userId}`);
			uni.removeStorageSync(`chat_friend_request_cache_${userId}`);
		} catch (error) {
			console.error('清除用户缓存失败', error);
		}
	},

	/**
	 * 缓存用户头像
	 */
	cacheUserAvatar: (userId : string, avatarUrl : string) => {
		try {
			uni.setStorageSync(`chat_avatar_cache_${userId}`, avatarUrl);
		} catch (error) {
			console.error('缓存用户头像失败', error);
		}
	},

	/**
	 * 获取缓存的用户头像
	 */
	getCachedAvatar: (userId : string) : string | null => {
		try {
			return uni.getStorageSync(`chat_avatar_cache_${userId}`) || null;
		} catch (error) {
			console.error('获取缓存头像失败', error);
			return null;
		}
	},

	/**
	 * 批量缓存用户头像（从用户列表中提取）
	 */
	cacheAvatarsFromUserList: (users : ChatUser[]) => {
		try {
			users.forEach(user => {
				if (user.userId && user.avatarUrl) {
					uni.setStorageSync(`chat_avatar_cache_${user.userId}`, user.avatarUrl);
				}
			});
		} catch (error) {
			console.error('批量缓存头像失败', error);
		}
	},

	/**
	 * 获取用户头像（优先缓存）
	 */
	getUserAvatar: (userId : string, defaultAvatar ?: string) : string => {
		// 先尝试从缓存获取
		const cachedAvatar = UserData.getCachedAvatar(userId);
		if (cachedAvatar) {
			return cachedAvatar;
		}
		// 返回默认头像
		return defaultAvatar || 'https://img.icons8.com/ios-filled/50/000000/user.png';
	},

	/**
	 * 验证手机号格式
	 */
	validatePhoneNumber: (phoneNumber : string) : boolean => {
		// 中国大陆手机号格式验证
		const phoneRegex = /^1[3-9]\d{9}$/;
		return phoneRegex.test(phoneNumber);
	}
};