/**
 * @Description:
 * 类型规范
 * @author liuzhiheng
 * @createTime 2026-03-06 09:33:17
 * @Copyright by 文刀
 */

// 用户实体
export interface ChatUser {
	token : any;
	// 用户唯一id
	userId : string;
	// 用户昵称
	nickname : string;
	// 用户头像地址
	avatarUrl : string;
	// 创建时间戳
	createTime : number;
	// 手机号（可选）
	phoneNumber ?: string;
	// 密码（可选，仅在登录时使用）
	password ?: string;
}

// 消息实体
export interface ChatMessage {
	/** 消息唯一ID（云数据库自动生成） */
	_id ?: string;
	/** 发送者用户ID */
	fromUserId : string;
	/** 接收者用户ID */
	toUserId : string;
	/** 消息内容 */
	content : string;
	/** 消息类型：text-文本、image-图片、voice-语音 */
	type : 'text' | 'image' | 'voice';
	/** 发送时间（时间戳） */
	createTime : number;
	/** 是否已读 */
	isRead : boolean;
}

/**
 * 会话实体（对应chat-sessions表）
 */
export interface ChatSession {
	/** 会话唯一ID */
	_id ?: string;
	/** 会话ID（规则：小的userId_大的userId，保证双方会话ID一致） */
	sessionId : string;
	/** 所属用户ID */
	userId : string;
	/** 聊天对象用户ID */
	targetUserId : string;
	/** 聊天对象信息 */
	targetUserInfo : ChatUser;
	/** 最新一条消息 */
	lastMessage : string;
	/** 未读消息数量 */
	unreadCount : number;
	/** 最后更新时间 */
	updateTime : number;
}


/**
 * 云函数通用返回结构（前后端统一）
 * T为泛型，指定data的具体类型
 */
export interface CloudResult<T> {
	/** 状态码：0-成功，非0-失败 */
	code : number;
	/** 提示信息 */
	msg : string;
	/** 核心数据 */
	data : T;
}

/**
 * 发送消息的入参
 */
export interface SendMessageParams {
	fromUid : any;
	fromUserId : string;
	toUserId : string;
	content : string;
	type ?: 'text' | 'image' | 'voice';
}

/**
 * 获取历史消息的入参
 */
export interface GetHistoryMessageParams {
	fromUid : any;
	userId1 : string;
	userId2 : string;
	page ?: number;
	pageSize ?: number;
}

/**
 * 标记消息已读的入参
 */
export interface MarkReadParams {
	uid : any;
	sessionId : string;
	userId : string;
	targetUserId : string;
}


// 音乐
export interface IMusic {
	title : string | null; // 歌曲名称
	singer : string; // 歌手
	n ?: number; // 歌曲索引（从1开始）
	apiSource ?: string; // API源（migu、apple、qq等）
	[key : string] : any; // 扩展字段，兼容其他参数
}

// 音乐列表
export interface IPageParams {
	page ?: number; // 页码（可选，默认1）
	pageSize ?: number; // 每页条数（可选，默认20）
	msg ?: string; // 搜索关键词（对应你API的msg参数）
	[key : string] : any; // 扩展字段，兼容其他参数
}