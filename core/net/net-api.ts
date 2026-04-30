/**
 * @Description:
 * 网络层
 * 封装云函数调用，统一处理网络请求和错误
 * 对应后端3大云函数：Api-Auth / Api-App / Api-Upload
 * @author liuzhiheng
 * @createTime 2026-03-06 09:38:43
 * @Copyright by 文刀
 */

// 【唯一允许引入的内容】：bean层的类型定义
import type {
	ChatMessage,
	ChatSession,
	ChatUser,
	CloudResult,
	SendMessageParams,
	GetHistoryMessageParams,
	MarkReadParams,
	IMusic
} from '../bean/index';

// ============== 基础封装：云函数统一调用（带错误处理）【原封不动】==============
/**
 * 云函数通用调用封装
 * @param name 云函数名称
 * @param data 传给云函数的参数
 * @returns Promise<CloudResult<T>> 统一返回结构,bean层中
 */
const callCloud = async <T>(name : string, data ?: any) : Promise<CloudResult<T>> => {
	try {
		console.log(`callCloud - calling ${name} with data:`, data);
		const res = await uniCloud.callFunction({ name, data });
		console.log(`callCloud - ${name} response:`, res);

		if (!res.result) {
			throw new Error('云函数调用失败');
		}

		const result = res.result as CloudResult<T>;
		console.log(`callCloud - ${name} result:`, result);

		// 适配你后端统一返回码：200=成功
		if (result.code !== 200) {
			throw new Error(result.msg || '业务处理失败');
		}

		return result;
	} catch (error) {
		console.error(`【云函数调用失败】[${name}]:`, error);
		throw error;
	}
};

// ============== 前端网络层 = 对应后端3大云函数（拆分版）==============
export const NetApi = {
	// ======================
	// 1. 认证云函数 Api-Auth
	// 登录、注册（独立高频）
	// ======================
	auth: {
		/**
		 * 用户登录
		 */
		login: async (userInfo : Omit<ChatUser, 'createTime'>) : Promise<CloudResult<ChatUser>> => {
			return callCloud<ChatUser>('Api-Auth', {
				action: 'auth/login',
				appId: 'vheart-chat',
				data: userInfo
			});
		},

		/**
		 * 用户注册
		 */
		register: async (userInfo : Omit<ChatUser, 'createTime'>) : Promise<CloudResult<ChatUser>> => {
			return callCloud<ChatUser>('Api-Auth', {
				action: 'auth/register',
				appId: 'vheart-chat',
				data: userInfo,
			});
		}
	},

	// ======================
	// 2. 主业务云函数 Api-Vheart-Chat
	// 用户、好友、聊天、会话（全部合并）
	// ======================
	VheartChat: {
		// ============== 用户模块 ==============
		/**
		 * 获取用户列表
		 */
		getUserList: async (excludeUserId ?: string) : Promise<CloudResult<ChatUser[]>> => {
			return callCloud<ChatUser[]>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'user/list',
				uid: excludeUserId
			});
		},

		// ============== 好友模块 ==============
		/**
		 * 搜索用户
		 */
		searchUser: async (keyword : string, uid ?: string) : Promise<CloudResult<ChatUser[]>> => {
			return callCloud<ChatUser[]>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'contact/search',
				uid: uid,
				data: { keyword }
			});
		},

		/**
		 * 发送好友请求
		 */
		sendFriendRequest: async (fromUserId : string, toUserId : string, message : string = '') : Promise<CloudResult<any>> => {
			return callCloud<any>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'contact/apply',
				uid: fromUserId,
				data: { uid: toUserId, msg: message }
			});
		},

		/**
		 * 获取好友请求列表
		 */
		getFriendRequests: async (userId : string) : Promise<CloudResult<any[]>> => {
			return callCloud<any[]>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'contact/applyList',
				uid: userId
			});
		},

		/**
		 * 处理好友请求
		 */
		handleFriendRequest: async (requestId : string, status : 'accepted' | 'rejected', userId ?: string) : Promise<CloudResult<null>> => {
			return callCloud<null>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: status === 'accepted' ? 'contact/agree' : 'contact/refuse',
				uid: userId,
				data: { id: requestId }
			});
		},

		/**
		 * 获取好友列表
		 */
		getFriendList: async (userId : string) : Promise<CloudResult<ChatUser[]>> => {
			return callCloud<ChatUser[]>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'contact/list',
				uid: userId
			});
		},

		// ============== 消息/会话模块 ==============
		/**
		 * 发送消息
		 */
		sendMessage: async (params : SendMessageParams) : Promise<CloudResult<ChatMessage>> => {
			return callCloud<ChatMessage>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'chat/send',
				uid: params.fromUserId,
				data: {
					to_uid: params.toUserId,
					content: params.content
				}
			});
		},

		/**
		 * 获取历史聊天消息
		 */
		getHistoryMessage: async (params : GetHistoryMessageParams) : Promise<CloudResult<ChatMessage[]>> => {
			return callCloud<ChatMessage[]>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'chat/history',
				uid: params.fromUid,
				data: {
					userId1: params.userId1,
					userId2: params.userId2
				}
			});
		},

		/**
		 * 标记消息已读
		 */
		markMessageRead: async (params : MarkReadParams) : Promise<CloudResult<null>> => {
			return callCloud<null>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'chat/read',
				uid: params.uid,
				data: params
			});
		},

		/**
		 * 获取会话列表
		 */
		getSessionList: async (userId : string) : Promise<CloudResult<ChatSession[]>> => {
			return callCloud<ChatSession[]>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'chat/sessionList',
				uid: userId
			});
		},

		/**
		 * 更新会话
		 */
		updateSession: async (session : Partial<ChatSession>) : Promise<CloudResult<ChatSession>> => {
			return callCloud<ChatSession>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'chat/updateSession',
				uid: session.userId,
				data: session
			});
		},

		/**
		 * 保存推送 token
		 */
		savePushToken: async (params : { userId : string, token : string }) : Promise<CloudResult<null>> => {
			return callCloud<null>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'chat/savePushToken',
				uid: params.userId,
				data: params
			});
		}
	},

	// ======================
	// 3. 上传云函数 Api-Upload
	// 头像/图片上传（独立刚需）
	// ======================
	upload: {
		/**
		 * 文件/图片上传
		 */
		image: async (filePath : string, userId : string) : Promise<CloudResult<string>> => {
			return callCloud<string>('Api-Upload', {
				appId: 'vheart-chat',
				uid: userId,
				filePath
			});
		}
	},

	VheartMusic: {
		getMiguMusicList: async (params : IMusic) : Promise<CloudResult<any[]>> => {
			return callCloud<string[]>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'music/getMiguMusicList',
				data: params
			});
		},
		getMiguMusic: async (params : IMusic) : Promise<CloudResult<string>> => {
			return callCloud<string>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'music/getMiguMusic',
				data: params
			});
		},
		getAppleMusicList: async (params : IMusic) : Promise<CloudResult<any[]>> => {
			return callCloud<string[]>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'music/getAppleMusicList',
				data: params
			});
		},
		getAppleMusic: async (params : IMusic) : Promise<CloudResult<string>> => {
			return callCloud<string>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'music/getAppleMusic',
				data: params
			});
		},
		getQQMusicList: async (params : IMusic) : Promise<CloudResult<any[]>> => {
			return callCloud<string[]>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'music/getQQMusicList',
				data: params
			});
		},
		getQQMusic: async (params : IMusic) : Promise<CloudResult<string>> => {
			return callCloud<string>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'music/getQQMusic',
				data: params
			});
		},
		getKuwoMusicList: async (params : IMusic) : Promise<CloudResult<any[]>> => {
			return callCloud<string[]>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'music/getKuwoMusicList',
				data: params
			});
		},
		getKuwoMusic: async (params : IMusic) : Promise<CloudResult<string>> => {
			return callCloud<string>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'music/getKuwoMusic',
				data: params
			});
		},
		getLyrics: async (params : { mid: string, type: string }) : Promise<CloudResult<any>> => {
			return callCloud<any>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'music/getLyrics',
				data: params
			});
		},
		searchAnime: async (params : { msg: string, page: number }) : Promise<CloudResult<any>> => {
			return callCloud<any>('Api-Vheart-Chat', {
				appId: 'vheart-chat',
				action: 'anime/search',
				data: params
			});
		}
	}
};