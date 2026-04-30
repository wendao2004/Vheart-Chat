/**
 * @Description:
 * 聊天服务
 * @author liuzhiheng
 * @createTime 2026-03-17 14:12:40
 * @Copyright by 文刀
 */

import BaseService from "./BaseService";
import { IApiResult, IMessage, ISession, IUser } from './interface';

export class ChatService extends BaseService {
	private tableName: string;
	private userTableName: string;
	private friendTableName: string;
	private friendRequestTableName: string;
	private pushTableName: string;

	constructor(appId: string) {
		super();
		this.tableName = 'chat-messages';
		this.userTableName = `user_${appId}`;
		this.friendTableName = `app_${appId}_friends`;
		this.friendRequestTableName = `app_${appId}_friend_request`;
		this.pushTableName = `app_${appId}_push_tokens`;
	}

	/**
	 * @description 发送单聊消息
	 */
	async sendMsg(fromUid: string, toUid: string, content: string): Promise<IApiResult<IMessage>> {
		try {
			console.log('sendMsg - 开始发送消息:', { fromUid, toUid, content, tableName: this.tableName });
			if (!fromUid || !toUid || !content) {
				console.log('sendMsg - 参数不完整');
				return this.fail("参数不完整");
			}
			if (fromUid === toUid) {
				console.log('sendMsg - 不能向自己发送消息');
				return this.fail("不能向自己发送消息");
			}
			console.log('sendMsg - 准备添加消息');
			const result = await this.getDb().collection(this.tableName).add({
				fromUserId: fromUid,
				toUserId: toUid,
				content,
				createTime: new Date(),
				isRead: false
			});
			console.log('sendMsg - 发送消息成功', result);

			try {
				await this.sendPushMessage(fromUid, toUid, content);
			} catch (error) {
				console.error('sendMsg - 发送推送失败:', error);
			}

			return this.success({
				_id: result.id,
				fromUserId: fromUid,
				toUserId: toUid,
				content,
				type: 'text',
				createTime: Date.now(),
				isRead: false
			}, "发送成功");
		} catch (error) {
			console.error('sendMsg - 错误:', error);
			return this.fail("消息发送失败");
		}
	}

	/**
	 * @description 发送推送消息
	 */
	async sendPushMessage(fromUid: string, toUid: string, content: string): Promise<void> {
		try {
			const pushTokenResult = await this.getDb().collection(this.pushTableName).where({ userId: toUid }).get();
			console.log('sendPushMessage - 查询推送 token 结果:', pushTokenResult);

			if (pushTokenResult.data.length > 0) {
				const deviceToken = pushTokenResult.data[0].token;
				console.log('sendPushMessage - 推送 token:', deviceToken);

				const pushMessage = {
					title: '新消息',
					content: content,
					payload: {
						type: 'chat',
						fromUserId: fromUid,
						targetUserId: toUid
					}
				};

				console.log('sendPushMessage - 发送推送消息:', pushMessage);
			}
		} catch (error) {
			console.error('sendPushMessage - 错误:', error);
			throw error;
		}
	}

	/**
	 * @description 保存推送 token
	 */
	async savePushToken(userId: string, token: string): Promise<IApiResult<boolean>> {
		try {
			console.log('savePushToken - 保存推送 token:', { userId, token });
			if (!userId || !token) {
				return this.fail("参数不完整");
			}

			const existingToken = await this.getDb().collection(this.pushTableName).where({ userId }).get();

			if (existingToken.data.length > 0) {
				await this.getDb().collection(this.pushTableName).where({ userId }).update({ token });
			} else {
				await this.getDb().collection(this.pushTableName).add({ userId, token, createTime: new Date() });
			}

			return this.success(true, "保存成功");
		} catch (error) {
			console.error('savePushToken - 错误:', error);
			return this.fail("保存失败");
		}
	}

	/**
	 * @description 获取双人聊天记录
	 */
	async getHistory(fromUid: string, toUid: string): Promise<IApiResult<IMessage[]>> {
		try {
			console.log('getHistory - 开始获取聊天记录:', { fromUid, toUid, tableName: this.tableName });
			if (!fromUid || !toUid) {
				console.log('getHistory - 参数不完整');
				return this.fail("参数不完整");
			}
			const db2 = this.getDb();
			console.log('getHistory - 准备查询聊天记录');
			const { data } = await db2.collection(this.tableName).where({
				$or: [
					{ fromUserId: fromUid, toUserId: toUid },
					{ fromUserId: toUid, toUserId: fromUid }
				]
			}).orderBy("createTime", "asc").get();
			console.log('getHistory - 获取聊天记录成功:', data);
			const formattedMessages: IMessage[] = data.map(msg => ({
				_id: msg._id,
				fromUserId: msg.fromUserId,
				toUserId: msg.toUserId,
				content: msg.content,
				type: 'text',
				createTime: new Date(msg.createTime).getTime(),
				isRead: msg.isRead || false
			}));
			return this.success(formattedMessages);
		} catch (error) {
			console.error('getHistory - 错误:', error);
			return this.fail("获取聊天记录失败");
		}
	}

	/**
	 * @description 删除单条消息
	 */
	async deleteMsg(msgId: string, uid: string): Promise<IApiResult<boolean>> {
		try {
			if (!msgId) {
				return this.fail("消息ID不能为空");
			}
			await this.getDb().collection(this.tableName).where({ _id: msgId, fromUserId: uid }).update({ isRead: true });
			return this.success(true, "删除成功");
		} catch (error) {
			return this.fail("删除消息失败");
		}
	}

	/**
	 * @description 标记消息已读
	 */
	async markRead(uid: string, sessionId: string, userId: string, targetUserId: string): Promise<IApiResult<boolean>> {
		try {
			if (!uid || !sessionId || !userId || !targetUserId) {
				return this.fail("参数不完整");
			}
			await this.getDb().collection(this.tableName).where({
				toUserId: userId,
				fromUserId: targetUserId
			}).update({ isRead: true });
			return this.success(true, "标记已读成功");
		} catch (error) {
			return this.fail("标记已读失败");
		}
	}

	/**
	 * @description 获取会话列表
	 */
	async getSessionList(uid: string): Promise<IApiResult<ISession[]>> {
		try {
			if (!uid) {
				return this.fail("用户ID不能为空");
			}
			const sessionTable = 'chat-sessions';
			const { data } = await this.getDb().collection(sessionTable).where({
				userId: uid
			}).orderBy("updateTime", "desc").get();
			return this.success(data as ISession[]);
		} catch (error) {
			return this.fail("获取会话列表失败");
		}
	}

	/**
	 * @description 更新会话
	 */
	async updateSession(uid: string, session: ISession): Promise<IApiResult<ISession>> {
		try {
			console.log('updateSession - 开始更新会话:', { uid, session });
			if (!uid || !session || !session.sessionId || !session.userId) {
				console.log('updateSession - 参数不完整');
				return this.fail("参数不完整");
			}
			const sessionTable = 'chat-sessions';
			console.log('updateSession - 会话表名:', sessionTable);

			try {
				const updateResult = await this.getDb().collection(sessionTable).where({
					sessionId: session.sessionId,
					userId: session.userId
				}).update(session);
				console.log('updateSession - 更新会话结果:', updateResult);

				if (updateResult.updated === 0) {
					console.log('updateSession - 会话不存在，添加新会话');
					await this.getDb().collection(sessionTable).add(session);
				}

				console.log('updateSession - 更新会话成功');
				return this.success(session, "更新会话成功");
			} catch (error) {
				console.error('updateSession - 操作数据库失败:', error);
				return this.success(session, "更新会话成功");
			}
		} catch (error) {
			console.error('updateSession - 错误:', error);
			return this.success(session, "更新会话成功");
		}
	}

	/**
	 * @description 获取用户列表
	 */
	async getUserList(uid: string): Promise<IApiResult<IUser[]>> {
		try {
			const { data } = await this.getDb().collection(this.userTableName).where({
				account: { $ne: uid }
			}).get();
			const userList: IUser[] = data.map((user: any) => ({
				userId: user._id,
				nickname: user.nickname || `用户${user.account}`,
				avatarUrl: user.avatarUrl || 'https://img.icons8.com/ios-filled/50/000000/user.png',
				createTime: new Date(user.createTime).getTime() || Date.now(),
				phoneNumber: user.account
			}));
			return this.success(userList);
		} catch (error) {
			return this.fail("获取用户列表失败");
		}
	}

	/**
	 * @description 搜索用户
	 */
	async searchUser(keyword: string): Promise<IApiResult<IUser[]>> {
		try {
			const { data } = await this.getDb().collection(this.userTableName).where({
				account: { $regex: keyword }
			}).get();
			const userList: IUser[] = data.map((user: any) => ({
				userId: user._id,
				nickname: user.nickname || `用户${user.account}`,
				avatarUrl: user.avatarUrl || 'https://img.icons8.com/ios-filled/50/000000/user.png',
				createTime: new Date(user.createTime).getTime() || Date.now(),
				phoneNumber: user.account
			}));
			return this.success(userList);
		} catch (error) {
			return this.fail("搜索用户失败");
		}
	}

	/**
	 * @description 发送好友请求
	 */
	async sendFriendRequest(fromUid: string, toUid: string, message: string = ''): Promise<IApiResult<boolean>> {
		try {
			console.log('sendFriendRequest - 开始发送好友请求:', { fromUid, toUid, message });
			if (!fromUid || !toUid) {
				console.log('sendFriendRequest - 参数不完整');
				return this.fail("参数不完整");
			}
			if (fromUid === toUid) {
				console.log('sendFriendRequest - 不能向自己发送好友请求');
				return this.fail("不能向自己发送好友请求");
			}
			const friendCheck = await this.getDb().collection(this.friendTableName).where({
				$or: [
					{ userId: fromUid, friendId: toUid },
					{ userId: toUid, friendId: fromUid }
				]
			}).get();
			console.log('sendFriendRequest - 好友检查结果:', friendCheck.data);
			if (friendCheck.data.length > 0) {
				console.log('sendFriendRequest - 已经是好友');
				return this.fail("已经是好友");
			}
			const requestCheck = await this.getDb().collection(this.friendRequestTableName).where({
				fromUid: fromUid,
				toUid: toUid,
				status: 'pending'
			}).get();
			console.log('sendFriendRequest - 请求检查结果:', requestCheck.data);
			if (requestCheck.data.length > 0) {
				console.log('sendFriendRequest - 已经发送过好友请求');
				return this.fail("已经发送过好友请求");
			}
			console.log('sendFriendRequest - 准备添加好友请求');
			await this.getDb().collection(this.friendRequestTableName).add({
				fromUid,
				toUid,
				message,
				status: 'pending',
				createTime: new Date()
			});
			console.log('sendFriendRequest - 发送好友请求成功');
			return this.success(true, "发送好友请求成功");
		} catch (error) {
			console.error('sendFriendRequest - 错误:', error);
			return this.fail("发送好友请求失败");
		}
	}

	/**
	 * @description 获取好友请求列表
	 */
	async getFriendRequests(uid: string): Promise<IApiResult<any[]>> {
		try {
			const { data } = await this.getDb().collection(this.friendRequestTableName).where({
				toUid: uid,
				status: 'pending'
			}).get();
			for (const request of data) {
				const { data: userData } = await this.getDb().collection(this.userTableName).where({
					account: request.fromUid
				}).get();
				if (userData.length > 0) {
					const user = userData[0];
					request.fromUser = {
						userId: user._id,
						nickname: user.nickname || `用户${user.account}`,
						avatarUrl: user.avatarUrl || 'https://img.icons8.com/ios-filled/50/000000/user.png',
						createTime: new Date(user.createTime).getTime() || Date.now(),
						phoneNumber: user.account
					};
				}
			}
			return this.success(data);
		} catch (error) {
			return this.fail("获取好友请求列表失败");
		}
	}

	/**
	 * @description 处理好友请求
	 */
	async handleFriendRequest(requestId: string, status: 'accepted' | 'rejected', uid?: string): Promise<IApiResult<boolean>> {
		try {
			if (!requestId) {
				return this.fail("请求ID不能为空");
			}
			const { data: requestData } = await this.getDb().collection(this.friendRequestTableName).where({
				_id: requestId
			}).get();
			if (requestData.length === 0) {
				return this.fail("好友请求不存在");
			}
			const request = requestData[0];
			if (uid && request.toUid !== uid) {
				return this.fail("无权处理此请求");
			}
			await this.getDb().collection(this.friendRequestTableName).where({
				_id: requestId
			}).update({ status });
			if (status === 'accepted') {
				await this.getDb().collection(this.friendTableName).add({
					userId: request.fromUid,
					friendId: request.toUid,
					createTime: new Date()
				});
				await this.getDb().collection(this.friendTableName).add({
					userId: request.toUid,
					friendId: request.fromUid,
					createTime: new Date()
				});
			}
			return this.success(true, status === 'accepted' ? "添加好友成功" : "拒绝好友请求成功");
		} catch (error) {
			return this.fail("处理好友请求失败");
		}
	}

	/**
	 * @description 获取好友列表
	 */
	async getFriendList(uid: string): Promise<IApiResult<IUser[]>> {
		try {
			console.log('getFriendList - 开始查询，uid:', uid);
			console.log('getFriendList - 表名:', this.friendTableName);
			const { data: friendData } = await this.getDb().collection(this.friendTableName).where({
				userId: uid
			}).get();
			console.log('getFriendList - 查询结果:', friendData);
			const friendList: IUser[] = [];
			for (const friend of friendData) {
				console.log('getFriendList - 处理好友:', friend);
				const { data: userData } = await this.getDb().collection(this.userTableName).where({
					_id: friend.friendId
				}).get();
				console.log('getFriendList - 好友详情:', userData);
				if (userData.length > 0) {
					const user = userData[0];
					friendList.push({
						userId: user._id,
						nickname: user.nickname || `用户${user.account}`,
						avatarUrl: user.avatarUrl || 'https://img.icons8.com/ios-filled/50/000000/user.png',
						createTime: new Date(user.createTime).getTime() || Date.now(),
						phoneNumber: user.account
					});
				}
			}
			console.log('getFriendList - 返回好友列表:', friendList);
			return this.success(friendList);
		} catch (error) {
			console.error('getFriendList - 错误:', error);
			return this.fail("获取好友列表失败");
		}
	}
}