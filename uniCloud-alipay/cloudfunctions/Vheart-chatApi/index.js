// uniCloud-aliyun/cloudfunctions/chatApi/index.js
'use strict';
const db = uniCloud.database();
const _ = db.command;

// 尝试加载 uni-push 模块，如果失败则使用空对象
let uniPush = null;
try {
	uniPush = require('uni-push');
} catch (e) {
	console.log('uni-push 模块未安装，推送功能将不可用');
	uniPush = null;
}

exports.main = async (event, context) => {
	console.log('Cloud function called with event:', event);
	
	const {
		action,
		...params
	} = event;

	console.log('Action:', action);
	console.log('Params:', params);

	try {
		switch (action) {
			// ============== 用户相关 ==============
			case 'userLogin': {
				const {
					phoneNumber,
					password,
					userId
				} = params;
				
				// 确定用户唯一标识
				const userIdentifier = phoneNumber || userId;
				if (!userIdentifier) {
					return {
						code: -1,
						msg: '请提供手机号或微信号',
						data: null
					};
				}
				
				// 构建查询条件
				const query = {};
				if (phoneNumber) {
					query.phoneNumber = phoneNumber;
				} else {
					query.userId = userId;
				}
				
				// 先查询用户是否存在
				const userRes = await db.collection('chat-users').where(query).get();
				
				if (userRes.data.length === 0) {
					return {
						code: -1,
						msg: '用户不存在',
						data: null
					};
				}
				
				// 用户存在，验证密码
				const user = userRes.data[0];
				if (user.password !== password) {
					return {
						code: -1,
						msg: '密码错误',
						data: null
					};
				}

				// 移除密码字段，不返回给前端
				delete user.password;

				return {
					code: 0,
					msg: '登录成功',
					data: user
				};
			}

			case 'userRegister': {
				const {
					phoneNumber,
					password,
					userId,
					nickname,
					avatarUrl
				} = params;
				
				// 确定用户唯一标识
				const userIdentifier = phoneNumber || userId;
				if (!userIdentifier) {
					return {
						code: -1,
						msg: '请提供手机号或微信号',
						data: null
					};
				}
				
				// 构建查询条件
				const query = {};
				if (phoneNumber) {
					query.phoneNumber = phoneNumber;
				} else {
					query.userId = userId;
				}
				
				// 先查询用户是否存在
				const userRes = await db.collection('chat-users').where(query).get();
				
				if (userRes.data.length > 0) {
					return {
						code: -1,
						msg: '用户已存在，请直接登录',
						data: null
					};
				}
				
				// 用户不存在，创建新用户
				const createData = {
					createTime: Date.now()
				};
				if (phoneNumber) createData.phoneNumber = phoneNumber;
				if (userId) createData.userId = userId;
				if (nickname) createData.nickname = nickname;
				if (avatarUrl) createData.avatarUrl = avatarUrl;
				if (password) createData.password = password;
				
				// 生成默认昵称和头像
				if (!createData.nickname) {
					createData.nickname = `用户${createData.phoneNumber || createData.userId}`;
				}
				if (!createData.avatarUrl) {
					createData.avatarUrl = 'https://img.icons8.com/ios-filled/50/000000/user.png';
				}
				
				const createRes = await db.collection('chat-users').add(createData);
				const user = {
					_id: createRes.id,
					...createData
				};

				// 移除密码字段，不返回给前端
				delete user.password;

				return {
					code: 0,
					msg: '注册成功',
					data: user
				};
			}

			case 'user/updatePushCid': {
				const { userId, pushCid } = params;
				if (!userId || !pushCid) {
					return {
						code: -1,
						msg: '缺少参数',
						data: null
					};
				}
				
				await db.collection('chat-users').where({
					userId: userId
				}).update({
					pushCid: pushCid,
					pushCidUpdateTime: Date.now()
				});
				
				return {
					code: 0,
					msg: '更新成功',
					data: null
				};
			}

			// ============== 好友相关 ==============
			case 'searchUser': {
				const { keyword } = params;
				if (!keyword) {
					return {
						code: -1,
						msg: '请输入搜索关键词',
						data: null
					};
				}
				
				// 搜索用户（支持手机号、微信号）
				const res = await db.collection('chat-users')
					.where({
						$or: [
							{ phoneNumber: keyword },
							{ userId: keyword }
						]
					})
					.get();
				
				// 移除密码字段
				const users = res.data.map(user => {
					delete user.password;
					return user;
				});
				
				return {
					code: 0,
					msg: '搜索成功',
					data: users
				};
			}

			case 'sendFriendRequest': {
				const { fromUserId, toUserId, message } = params;
				if (!fromUserId || !toUserId) {
					return {
						code: -1,
						msg: '请提供发送者和接收者ID',
						data: null
					};
				}
				
				// 检查是否已经是好友
				const friendRes = await db.collection('chat-friends')
					.where({
						$or: [
							{
								userId1: fromUserId,
								userId2: toUserId
							},
							{
								userId1: toUserId,
								userId2: fromUserId
							}
						]
					})
					.get();
				
				if (friendRes.data.length > 0) {
					return {
						code: -1,
						msg: '已经是好友了',
						data: null
					};
				}
				
				// 检查是否已经发送过请求
				const requestRes = await db.collection('chat-friend-requests')
					.where({
						fromUserId,
						toUserId,
						status: 'pending'
					})
					.get();
				
				if (requestRes.data.length > 0) {
					return {
						code: -1,
						msg: '已经发送过好友请求',
						data: null
					};
				}
				
				// 发送好友请求
				const createRes = await db.collection('chat-friend-requests').add({
					fromUserId,
					toUserId,
					message: message || '',
					status: 'pending',
					createTime: Date.now()
				});
				
				return {
					code: 0,
					msg: '好友请求已发送',
					data: {
						_id: createRes.id,
						fromUserId,
						toUserId,
						message: message || '',
						status: 'pending',
						createTime: Date.now()
					}
				};
			}

			case 'getFriendRequests': {
				const { userId } = params;
				console.log('getFriendRequests - userId:', userId);
				
				if (!userId) {
					return {
						code: -1,
						msg: '请提供用户ID',
						data: null
					};
				}
				
				// 获取好友请求列表
				const res = await db.collection('chat-friend-requests')
					.where({
						toUserId: userId,
						status: 'pending'
					})
					.orderBy('createTime', 'desc')
					.get();
				
				console.log('getFriendRequests - requests:', res.data);
				
				// 获取发送者信息
				const requests = [];
				for (const request of res.data) {
					console.log('getFriendRequests - processing request:', request);
					console.log('getFriendRequests - fromUserId:', request.fromUserId);
					
					// 检查fromUserId是否存在
					if (!request.fromUserId) {
						console.log('getFriendRequests - skipping request with missing fromUserId');
						continue;
					}
					
					const userRes = await db.collection('chat-users')
						.where({ userId: request.fromUserId })
						.get();
					if (userRes.data.length > 0) {
						const user = userRes.data[0];
						delete user.password;
						requests.push({
							...request,
							fromUserAvatar: user.avatarUrl,
							fromUserNickname: user.nickname
						});
					}
				}
				
				return {
					code: 0,
					msg: '获取好友请求成功',
					data: requests
				};
			}

			case 'handleFriendRequest': {
				const { requestId, status } = params;
				console.log('handleFriendRequest - params:', { requestId, status });
				
				if (!requestId || !status) {
					return {
						code: -1,
						msg: '请提供请求ID和状态',
						data: null
					};
				}
				
				// 获取请求信息
				const requestRes = await db.collection('chat-friend-requests').doc(requestId).get();
				console.log('handleFriendRequest - requestRes:', requestRes);
				
				if (!requestRes.data || requestRes.data.length === 0) {
					return {
						code: -1,
						msg: '请求不存在',
						data: null
					};
				}
				
				const request = requestRes.data[0];
				console.log('handleFriendRequest - request:', request);
				console.log('handleFriendRequest - request keys:', Object.keys(request));
				console.log('handleFriendRequest - fromUserId:', request.fromUserId);
				console.log('handleFriendRequest - toUserId:', request.toUserId);
				console.log('handleFriendRequest - fromUserId type:', typeof request.fromUserId);
				console.log('handleFriendRequest - toUserId type:', typeof request.toUserId);
				
				// 检查fromUserId和toUserId是否存在
				if (!request.fromUserId || !request.toUserId) {
					console.log('handleFriendRequest - missing fields:', {
						hasFromUserId: !!request.fromUserId,
						hasToUserId: !!request.toUserId
					});
					return {
						code: -1,
						msg: '好友请求数据不完整',
						data: null
					};
				}
				
				// 更新请求状态
				await db.collection('chat-friend-requests').doc(requestId).update({
					status
				});
				
				// 如果同意，创建好友关系
				if (status === 'accepted') {
					// 确保userId1 < userId2，保证好友关系的唯一性
					const userId1 = request.fromUserId < request.toUserId ? request.fromUserId : request.toUserId;
					const userId2 = request.fromUserId < request.toUserId ? request.toUserId : request.fromUserId;
					
					console.log('Creating friend relationship:', { userId1, userId2 });
					console.log('userId1 type:', typeof userId1);
					console.log('userId2 type:', typeof userId2);
					
					// 检查好友关系是否已存在
					const existingFriend = await db.collection('chat-friends')
						.where({
							userId1: userId1,
							userId2: userId2
						})
						.get();
					
					console.log('Existing friend relations:', existingFriend.data);
					
					if (existingFriend.data.length === 0) {
						// 不存在则创建
						await db.collection('chat-friends').add({
							userId1,
							userId2,
							createTime: Date.now()
						});
						console.log('Friend relationship created successfully');
					} else {
						console.log('Friend relationship already exists');
					}
					
					// 如果同意，为双方创建会话记录
					if (status === 'accepted') {
						// 为fromUserId创建会话
						await db.collection('chat-sessions').add({
							userId: request.fromUserId,
							targetUserId: request.toUserId,
							targetUserInfo: {
								userId: request.toUserId,
								nickname: `用户${request.toUserId}`,
								avatarUrl: 'https://img.icons8.com/ios-filled/50/000000/user.png'
							},
							lastMessage: '',
							unreadCount: 0,
							updateTime: Date.now()
						});
						
						// 为toUserId创建会话
						await db.collection('chat-sessions').add({
							userId: request.toUserId,
							targetUserId: request.fromUserId,
							targetUserInfo: {
								userId: request.fromUserId,
								nickname: `用户${request.fromUserId}`,
								avatarUrl: 'https://img.icons8.com/ios-filled/50/000000/user.png'
							},
							lastMessage: '',
							unreadCount: 0,
							updateTime: Date.now()
						});
						
						console.log('Sessions created for both users');
					}
				}
				
				return {
					code: 0,
					msg: '处理成功',
					data: null
				};
			}

			case 'getFriendList': {
				const { userId } = params;
				if (!userId) {
					return {
						code: -1,
						msg: '请提供用户ID',
						data: null
					};
				}
				
				// 获取好友关系列表
				const res = await db.collection('chat-friends')
					.where({
						$or: [
							{ userId1: userId },
							{ userId2: userId }
						]
					})
					.get();
				
				console.log('getFriendList - userId:', userId);
				console.log('getFriendList - friend relations:', res.data);
				
				// 获取好友信息
				const friends = [];
				for (const friend of res.data) {
					const friendUserId = friend.userId1 === userId ? friend.userId2 : friend.userId1;
					console.log('getFriendList - processing friendUserId:', friendUserId);
					const userRes = await db.collection('chat-users')
						.where({ userId: friendUserId })
						.get();
					if (userRes.data.length > 0) {
						const user = userRes.data[0];
						delete user.password;
						friends.push(user);
						console.log('getFriendList - added friend:', user.nickname);
					} else {
						console.log('getFriendList - user not found for userId:', friendUserId);
					}
				}
				
				console.log('getFriendList - final friends:', friends);
				
				return {
					code: 0,
					msg: '获取好友列表成功',
					data: friends
				};
			}

			case 'getUserList': {
				const { excludeUserId } = params;
				let query = db.collection('chat-users').orderBy('createTime', 'desc');
				
				// 如果提供了排除用户ID，则过滤掉该用户
				if (excludeUserId) {
					query = query.where({
						userId: db.command.neq(excludeUserId)
					});
				}
				
				const res = await query.get();
				return {
					code: 0,
					msg: '获取成功',
					data: res.data
				};
			}

			// ============== 消息相关 ==============
			case 'sendMessage': {
					const {
						fromUserId,
						toUserId,
						content,
						type
					} = params;
					// 保存消息到数据库
					const message = {
						fromUserId,
						toUserId,
						content,
						type: type || 'text',
						createTime: Date.now(),
						isRead: false
					};
					const res = await db.collection('chat-messages').add(message);
					
					// 获取双方用户信息
					const [fromUserRes, toUserRes] = await Promise.all([
						db.collection('chat-users').where({ userId: fromUserId }).field({ nickname: true, avatarUrl: true, userId: true }).get(),
						db.collection('chat-users').where({ userId: toUserId }).field({ nickname: true, avatarUrl: true, userId: true }).get()
					]);
					
					const fromUserInfo = fromUserRes.data.length > 0 ? fromUserRes.data[0] : { nickname: '未知用户', avatarUrl: '/static/logo.png', userId: fromUserId };
					const toUserInfo = toUserRes.data.length > 0 ? toUserRes.data[0] : { nickname: '未知用户', avatarUrl: '/static/logo.png', userId: toUserId };
					
					// 为发送方创建/更新会话
					const sessionId1 = `${fromUserId}_${toUserId}`;
					const updateRes1 = await db.collection('chat-sessions').where({
						sessionId: sessionId1,
						userId: fromUserId
					}).update({
						lastMessage: content,
						updateTime: Date.now()
					});
					if (updateRes1.updated === 0) {
						await db.collection('chat-sessions').add({
							sessionId: sessionId1,
							userId: fromUserId,
							targetUserId: toUserId,
							targetUserInfo: toUserInfo,
							lastMessage: content,
							unreadCount: 0,
							updateTime: Date.now()
						});
					}
					
					// 为接收方创建/更新会话
					const sessionId2 = `${toUserId}_${fromUserId}`;
					const updateRes2 = await db.collection('chat-sessions').where({
						sessionId: sessionId2,
						userId: toUserId
					}).update({
						lastMessage: content,
						updateTime: Date.now(),
						unreadCount: _.inc(1)
					});
					if (updateRes2.updated === 0) {
						await db.collection('chat-sessions').add({
							sessionId: sessionId2,
							userId: toUserId,
							targetUserId: fromUserId,
							targetUserInfo: fromUserInfo,
							lastMessage: content,
							unreadCount: 1,
							updateTime: Date.now()
						});
					}
					
					// 发送推送通知（使用 uni-push）
					if (uniPush) {
						try {
							// 查询接收者的 pushCid
							const toUserPushRes = await db.collection('chat-users').where({
								userId: toUserId
							}).field({ pushCid: true, nickname: true }).get();
							
							if (toUserPushRes.data.length > 0 && toUserPushRes.data[0].pushCid) {
								const toUserPush = toUserPushRes.data[0];
								
								// 获取发送者昵称
								const fromUserPushRes = await db.collection('chat-users').where({
									userId: fromUserId
								}).field({ nickname: true }).get();
								const fromNickname = fromUserPushRes.data.length > 0 ? fromUserPushRes.data[0].nickname : '用户';
								
								// 使用 uni-push 发送消息
								const pushRes = await uniPush.sendMessage({
									push_clientid: toUserPush.pushCid,
									title: fromNickname,
									content: content,
									payload: {
										type: 'new_message',
										fromUserId: fromUserId,
										messageId: res.id
									},
									options: {
										HW: {
											'/message/android/notification/default_sound': true,
											'/message/android/notification/importance': 'NORMAL'
										},
										XM: {
											'/extra/channel_id': 'high_system'
										}
									}
								});
								console.log('推送成功:', pushRes);
							} else {
								console.log('接收者没有 pushCid，跳过推送');
							}
						} catch (pushError) {
							console.error('推送失败', pushError);
						}
					} else {
						console.log('uni-push 模块未安装，跳过推送');
					}
					
					return {
						code: 0,
						msg: '发送成功',
						data: {
							_id: res.id,
							...message
						}
					};
				}

			case 'getHistoryMessage': {
					const {
						userId1,
						userId2,
						page,
						pageSize
					} = params;
					console.log('获取历史消息参数:', { userId1, userId2, page, pageSize });
					const skip = (page - 1) * pageSize;
					const res = await db.collection('chat-messages')
						.where({
							$or: [{
									fromUserId: userId1,
									toUserId: userId2
								},
								{
									fromUserId: userId2,
									toUserId: userId1
								}
							]
						})
						.orderBy('createTime', 'asc')
						.skip(skip)
						.limit(pageSize)
						.get();
					console.log('获取历史消息结果:', res.data);
					return {
						code: 0,
						msg: '获取成功',
						data: res.data
					};
				}

			case 'markMessageRead': {
				const {
					userId,
					targetUserId
				} = params;
				// 把对方发给我的未读消息，标记为已读
				await db.collection('chat-messages')
					.where({
						fromUserId: targetUserId,
						toUserId: userId,
						isRead: false
					})
					.update({
						isRead: true
					});
				// 更新会话的未读数
				const sessionId = [userId, targetUserId].sort().join('_');
				await db.collection('chat-sessions')
					.where({
						sessionId,
						userId
					})
					.update({
						unreadCount: 0
					});
				return {
					code: 0,
					msg: '标记成功',
					data: null
				};
			}

			// ============== 会话相关 ==============
			case 'getSessionList': {
				const {
					userId
				} = params;
				const res = await db.collection('chat-sessions')
					.where({
						userId
					})
					.orderBy('updateTime', 'desc')
					.get();
				
				// 补充对方用户信息
				const sessions = res.data;
				const enhancedSessions = await Promise.all(sessions.map(async (session) => {
					// 如果已经有targetUserInfo，直接返回
					if (session.targetUserInfo && session.targetUserInfo.nickname) {
						return session;
					}
					
					// 否则查询对方用户信息
					try {
						const targetUserRes = await db.collection('chat-users')
							.where({ userId: session.targetUserId })
							.field({ nickname: true, avatarUrl: true, userId: true })
							.get();
						
						if (targetUserRes.data.length > 0) {
							session.targetUserInfo = targetUserRes.data[0];
						} else {
							// 用户不存在，使用默认值
							session.targetUserInfo = {
								nickname: '未知用户',
								avatarUrl: '/static/logo.png',
								userId: session.targetUserId
							};
						}
					} catch (error) {
						console.error('获取对方用户信息失败', error);
						session.targetUserInfo = {
							nickname: '未知用户',
							avatarUrl: '/static/logo.png',
							userId: session.targetUserId
						};
					}
					return session;
				}));
				
				return {
					code: 0,
					msg: '获取成功',
					data: enhancedSessions
				};
			}

			case 'updateSession': {
				const {
					sessionId,
					userId,
					targetUserId,
					targetUserInfo,
					lastMessage,
					updateTime
				} = params;
				// 先查询会话是否存在
				const sessionRes = await db.collection('chat-sessions').where({
					sessionId,
					userId
				}).get();

				if (sessionRes.data.length > 0) {
					// 会话存在，更新
					const session = sessionRes.data[0];
					// 未读数+1（如果是对方发的消息）
					const updateData = {
						lastMessage,
						updateTime: updateTime || Date.now(),
						unreadCount: _.inc(1)
					};
					await db.collection('chat-sessions').doc(session._id).update(updateData);
				} else {
					// 会话不存在，创建
					await db.collection('chat-sessions').add({
						sessionId,
						userId,
						targetUserId,
						targetUserInfo: targetUserInfo || {},
						lastMessage: lastMessage || '',
						unreadCount: 0,
						updateTime: updateTime || Date.now()
					});
				}
				return {
					code: 0,
					msg: '更新成功',
					data: null
				};
			}

			case 'clearUnreadCount': {
				const {
					sessionId,
					userId
				} = params;
				
				// 查询会话
				const sessionRes = await db.collection('chat-sessions').where({
					sessionId,
					userId
				}).get();

				if (sessionRes.data.length > 0) {
					const session = sessionRes.data[0];
					// 清除未读数
					await db.collection('chat-sessions').doc(session._id).update({
						unreadCount: 0
					});
				}
				
				return {
					code: 0,
					msg: '清除未读数成功',
					data: null
				};
			}

			default:
				return {
					code: -1, msg: '未知的请求类型', data: null
				};
		}
	} catch (error) {
		console.error('云函数执行失败', error);
		return {
			code: -1,
			msg: error.message || '系统错误',
			data: null
		};
	}
};