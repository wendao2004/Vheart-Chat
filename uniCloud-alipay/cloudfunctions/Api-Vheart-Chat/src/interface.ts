/**
 * @Description:
 * 后端项目分层
 * Ts接口
 * @author liuzhiheng
 * @createTime 2026-03-17 13:31:47
 * @Copyright by 文刀
 */

// 统一返回接口
export interface IApiResult<T> {
	code : number
	msg : string
	data : T
}

// 消息接口【修复：驼峰命名，和代码保持一致】
export interface IMessage {
	_id?: string
	fromUserId: string  // 原from_uid → 修复
	toUserId: string    // 原to_uid → 修复
	content: string
	createTime?: number | Date // 兼容时间戳
	isRead?: boolean
	type?: string
}

// 会话接口
export interface ISession {
	_id?: string
	sessionId: string
	userId: string
	targetUserId: string
	lastMsg?: string
	unread_count: number
	updateTime?: number | Date
}

// 用户类型接口
export interface IUser {
	userId: string
	nickname: string
	avatarUrl: string
	createTime: number
	phoneNumber: string
}

/**
 * 分页参数接口
 * 用于音乐列表、搜索等分页请求
 */
export interface IPageParams {
  page?: number; // 页码（可选，默认1）
  pageSize?: number; // 每页条数（可选，默认20）
  msg?: string; // 搜索关键词（对应你API的msg参数）
  [key: string]: any; // 扩展字段，兼容其他参数
}



/**
 * 音乐实体接口
 * 定义单首歌曲的所有字段
 */
export interface IMusic {
  id: string | number; // 歌曲ID
  title: string; // 歌曲名称
  singer: string; // 歌手
  img: string; // 歌曲封面图片
  mp3: string; // 音频播放地址
  album?: string; // 专辑名称（可选）
  duration?: string | number; // 时长（可选）
  [key: string]: any; // 扩展字段
}

/**
 * 音乐数据源接口（核心！遵循开闭原则）
 * 定义音乐服务的标准规范
 * 后续新增音乐源（本地/其他第三方）只需实现此接口
 */
export interface IMusicSource {
  /**
   * 获取音乐列表
   * @param params 分页/搜索参数
   */
  getMusicList(params: IPageParams): Promise<IApiResult<IMusic[]>>;

  /**
   * 获取单首/指定音乐详情
   * @param params 参数
   */
  getMusic(params: IPageParams): Promise<IApiResult<IMusic[]>>;
}

// 聊天服务接口
export interface IChat {
	sendMsg(fromUid: string, toUid: string, content: string): Promise<IApiResult<IMessage>>
	getHistory(fromUid: string, toUid: string): Promise<IApiResult<IMessage[]>>
	deleteMsg(msgId: string, uid: string): Promise<IApiResult<boolean>>
	markRead(uid: string, sessionId: string, userId: string, targetUserId: string): Promise<IApiResult<boolean>>
	getSessionList(uid: string): Promise<IApiResult<ISession[]>>
	updateSession(uid: string, session: ISession): Promise<IApiResult<ISession>>
}