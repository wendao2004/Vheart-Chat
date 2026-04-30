/**
 * @Description:
 * 云函数入口
 * 所有云函数业务入口
 * @author liuzhiheng
 * @createTime 2026-03-17 14:07:37
 * @Copyright by 文刀
 */

import { ChatService } from "./ChatService";
import { MusicService } from "./MusicService";
import { AnimeService } from "./AnimeService";

/**
 * @Description:
 * 类似JAVA主程序
 * 创建新实例对象
 * @author liuzhiheng
 * @createTime 2026-03-17 14:12:40
 * @Copyright by 文刀
 */

exports.main = async (event : any) => {
	const { action, data, appId, uid } = event;
	// 强制校验APPID
	if (!appId) return { code: 403, msg: "请传入appId", data: {} };

	const chatService = new ChatService(appId);
	const musicService = new MusicService();
	const animeService = new AnimeService();

	switch (action) {
		// 用户模块
		case 'user/list':
			return await chatService.getUserList(uid);
		// 好友模块
		case 'contact/search':
			return await chatService.searchUser(data.keyword);
		case 'contact/apply':
			if (!uid) return { code: 403, msg: '用户未登录', data: {} };
			if (!data.uid) return { code: 400, msg: '参数不完整：缺少目标用户ID', data: {} };
			return await chatService.sendFriendRequest(uid, data.uid, data.msg);
		case 'contact/applyList':
			return await chatService.getFriendRequests(uid);
		case 'contact/agree':
			if (!uid) return { code: 403, msg: '用户未登录', data: {} };
			return await chatService.handleFriendRequest(data.id, 'accepted', uid);
		case 'contact/refuse':
			if (!uid) return { code: 403, msg: '用户未登录', data: {} };
			return await chatService.handleFriendRequest(data.id, 'rejected', uid);
		case 'contact/list':
			return await chatService.getFriendList(uid);
		// 发送消息
		case 'chat/send':
			return await chatService.sendMsg(uid, data.to_uid, data.content);
		// 获取聊天记录
		case 'chat/history':
			return await chatService.getHistory(data.userId1, data.userId2);
		// 删除消息
		case 'chat/delete':
			return await chatService.deleteMsg(data.msg_id, uid);
		// 标记消息已读
		case 'chat/read':
			return await chatService.markRead(uid, data.sessionId, data.userId, data.targetUserId);
		// 获取会话列表
		case 'chat/sessionList':
			return await chatService.getSessionList(uid);
		// 更新会话
		case 'chat/updateSession':
			return await chatService.updateSession(uid, data);
		// 保存推送 token
		case 'chat/savePushToken':
			return await chatService.savePushToken(data.userId, data.token);
		case 'music/getMiguMusicList':
			return await musicService.getMiguMusicList(data);
		case 'music/getMiguMusic':
			return await musicService.getMiguMusic(data);
		case 'music/getAppleMusicList':
			return await musicService.getAppleMusicList(data);
		case 'music/getAppleMusic':
			return await musicService.getAppleMusic(data);
		case 'music/getQQMusicList':
			return await musicService.getQQMusicList(data);
		case 'music/getQQMusic':
			return await musicService.getQQMusic(data);
		case 'music/getKuwoMusicList':
			return await musicService.getKuwoMusicList(data);
		case 'music/getKuwoMusic':
			return await musicService.getKuwoMusic(data);
		case 'music/getLyrics':
			return await musicService.getLyrics(data);
		case 'anime/search':
			return await animeService.searchAnime(data);
		default:
			return { code: 404, msg: '接口不存在', data: {} };
	}
};
