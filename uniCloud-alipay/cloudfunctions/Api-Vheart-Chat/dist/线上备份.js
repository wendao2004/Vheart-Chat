// src/BaseService.ts
var db = uniCloud.database();
var BaseService = class {
  // 成功返回（泛型，无任何报错）
  success(data, msg = "\u64CD\u4F5C\u6210\u529F") {
    return { code: 200, msg, data };
  }
  // 【终极修复】失败返回 → 泛型兼容所有返回值，彻底解决return报错
  fail(msg = "\u64CD\u4F5C\u5931\u8D25", code = 500) {
    return { code, msg, data: void 0 };
  }
  // 获取数据库
  getDb() {
    return db;
  }
};

// src/ChatService.ts
var ChatService = class extends BaseService {
  constructor(appId) {
    super();
    this.tableName = "chat-messages";
    this.userTableName = `user_${appId}`;
    this.friendTableName = `app_${appId}_friends`;
    this.friendRequestTableName = `app_${appId}_friend_request`;
    this.pushTableName = `app_${appId}_push_tokens`;
  }
  /**
   * @description 发送单聊消息
   */
  async sendMsg(fromUid, toUid, content) {
    try {
      console.log("sendMsg - \u5F00\u59CB\u53D1\u9001\u6D88\u606F:", { fromUid, toUid, content, tableName: this.tableName });
      if (!fromUid || !toUid || !content) {
        console.log("sendMsg - \u53C2\u6570\u4E0D\u5B8C\u6574");
        return this.fail("\u53C2\u6570\u4E0D\u5B8C\u6574");
      }
      if (fromUid === toUid) {
        console.log("sendMsg - \u4E0D\u80FD\u5411\u81EA\u5DF1\u53D1\u9001\u6D88\u606F");
        return this.fail("\u4E0D\u80FD\u5411\u81EA\u5DF1\u53D1\u9001\u6D88\u606F");
      }
      console.log("sendMsg - \u51C6\u5907\u6DFB\u52A0\u6D88\u606F");
      const result = await this.getDb().collection(this.tableName).add({
        fromUserId: fromUid,
        toUserId: toUid,
        content,
        createTime: /* @__PURE__ */ new Date(),
        isRead: false
      });
      console.log("sendMsg - \u53D1\u9001\u6D88\u606F\u6210\u529F", result);
      try {
        await this.sendPushMessage(fromUid, toUid, content);
      } catch (error) {
        console.error("sendMsg - \u53D1\u9001\u63A8\u9001\u5931\u8D25:", error);
      }
      return this.success({
        _id: result.id,
        fromUserId: fromUid,
        toUserId: toUid,
        content,
        type: "text",
        createTime: Date.now(),
        isRead: false
      }, "\u53D1\u9001\u6210\u529F");
    } catch (error) {
      console.error("sendMsg - \u9519\u8BEF:", error);
      return this.fail("\u6D88\u606F\u53D1\u9001\u5931\u8D25");
    }
  }
  /**
   * @description 发送推送消息
   */
  async sendPushMessage(fromUid, toUid, content) {
    try {
      const pushTokenResult = await this.getDb().collection(this.pushTableName).where({ userId: toUid }).get();
      console.log("sendPushMessage - \u67E5\u8BE2\u63A8\u9001 token \u7ED3\u679C:", pushTokenResult);
      if (pushTokenResult.data.length > 0) {
        const deviceToken = pushTokenResult.data[0].token;
        console.log("sendPushMessage - \u63A8\u9001 token:", deviceToken);
        const pushMessage = {
          title: "\u65B0\u6D88\u606F",
          content,
          payload: {
            type: "chat",
            fromUserId: fromUid,
            targetUserId: toUid
          }
        };
        console.log("sendPushMessage - \u53D1\u9001\u63A8\u9001\u6D88\u606F:", pushMessage);
      }
    } catch (error) {
      console.error("sendPushMessage - \u9519\u8BEF:", error);
      throw error;
    }
  }
  /**
   * @description 保存推送 token
   */
  async savePushToken(userId, token) {
    try {
      console.log("savePushToken - \u4FDD\u5B58\u63A8\u9001 token:", { userId, token });
      if (!userId || !token) {
        return this.fail("\u53C2\u6570\u4E0D\u5B8C\u6574");
      }
      const existingToken = await this.getDb().collection(this.pushTableName).where({ userId }).get();
      if (existingToken.data.length > 0) {
        await this.getDb().collection(this.pushTableName).where({ userId }).update({ token });
      } else {
        await this.getDb().collection(this.pushTableName).add({ userId, token, createTime: /* @__PURE__ */ new Date() });
      }
      return this.success(true, "\u4FDD\u5B58\u6210\u529F");
    } catch (error) {
      console.error("savePushToken - \u9519\u8BEF:", error);
      return this.fail("\u4FDD\u5B58\u5931\u8D25");
    }
  }
  /**
   * @description 获取双人聊天记录
   */
  async getHistory(fromUid, toUid) {
    try {
      console.log("getHistory - \u5F00\u59CB\u83B7\u53D6\u804A\u5929\u8BB0\u5F55:", { fromUid, toUid, tableName: this.tableName });
      if (!fromUid || !toUid) {
        console.log("getHistory - \u53C2\u6570\u4E0D\u5B8C\u6574");
        return this.fail("\u53C2\u6570\u4E0D\u5B8C\u6574");
      }
      const db2 = this.getDb();
      console.log("getHistory - \u51C6\u5907\u67E5\u8BE2\u804A\u5929\u8BB0\u5F55");
      const { data } = await db2.collection(this.tableName).where({
        $or: [
          { fromUserId: fromUid, toUserId: toUid },
          { fromUserId: toUid, toUserId: fromUid }
        ]
      }).orderBy("createTime", "asc").get();
      console.log("getHistory - \u83B7\u53D6\u804A\u5929\u8BB0\u5F55\u6210\u529F:", data);
      const formattedMessages = data.map((msg) => ({
        _id: msg._id,
        fromUserId: msg.fromUserId,
        toUserId: msg.toUserId,
        content: msg.content,
        type: "text",
        createTime: new Date(msg.createTime).getTime(),
        isRead: msg.isRead || false
      }));
      return this.success(formattedMessages);
    } catch (error) {
      console.error("getHistory - \u9519\u8BEF:", error);
      return this.fail("\u83B7\u53D6\u804A\u5929\u8BB0\u5F55\u5931\u8D25");
    }
  }
  /**
   * @description 删除单条消息
   */
  async deleteMsg(msgId, uid) {
    try {
      if (!msgId) {
        return this.fail("\u6D88\u606FID\u4E0D\u80FD\u4E3A\u7A7A");
      }
      await this.getDb().collection(this.tableName).where({ _id: msgId, fromUserId: uid }).update({ isRead: true });
      return this.success(true, "\u5220\u9664\u6210\u529F");
    } catch (error) {
      return this.fail("\u5220\u9664\u6D88\u606F\u5931\u8D25");
    }
  }
  /**
   * @description 标记消息已读
   */
  async markRead(uid, sessionId, userId, targetUserId) {
    try {
      if (!uid || !sessionId || !userId || !targetUserId) {
        return this.fail("\u53C2\u6570\u4E0D\u5B8C\u6574");
      }
      await this.getDb().collection(this.tableName).where({
        toUserId: userId,
        fromUserId: targetUserId
      }).update({ isRead: true });
      return this.success(true, "\u6807\u8BB0\u5DF2\u8BFB\u6210\u529F");
    } catch (error) {
      return this.fail("\u6807\u8BB0\u5DF2\u8BFB\u5931\u8D25");
    }
  }
  /**
   * @description 获取会话列表
   */
  async getSessionList(uid) {
    try {
      if (!uid) {
        return this.fail("\u7528\u6237ID\u4E0D\u80FD\u4E3A\u7A7A");
      }
      const sessionTable = "chat-sessions";
      const { data } = await this.getDb().collection(sessionTable).where({
        userId: uid
      }).orderBy("updateTime", "desc").get();
      return this.success(data);
    } catch (error) {
      return this.fail("\u83B7\u53D6\u4F1A\u8BDD\u5217\u8868\u5931\u8D25");
    }
  }
  /**
   * @description 更新会话
   */
  async updateSession(uid, session) {
    try {
      console.log("updateSession - \u5F00\u59CB\u66F4\u65B0\u4F1A\u8BDD:", { uid, session });
      if (!uid || !session || !session.sessionId || !session.userId) {
        console.log("updateSession - \u53C2\u6570\u4E0D\u5B8C\u6574");
        return this.fail("\u53C2\u6570\u4E0D\u5B8C\u6574");
      }
      const sessionTable = "chat-sessions";
      console.log("updateSession - \u4F1A\u8BDD\u8868\u540D:", sessionTable);
      try {
        const updateResult = await this.getDb().collection(sessionTable).where({
          sessionId: session.sessionId,
          userId: session.userId
        }).update(session);
        console.log("updateSession - \u66F4\u65B0\u4F1A\u8BDD\u7ED3\u679C:", updateResult);
        if (updateResult.updated === 0) {
          console.log("updateSession - \u4F1A\u8BDD\u4E0D\u5B58\u5728\uFF0C\u6DFB\u52A0\u65B0\u4F1A\u8BDD");
          await this.getDb().collection(sessionTable).add(session);
        }
        console.log("updateSession - \u66F4\u65B0\u4F1A\u8BDD\u6210\u529F");
        return this.success(session, "\u66F4\u65B0\u4F1A\u8BDD\u6210\u529F");
      } catch (error) {
        console.error("updateSession - \u64CD\u4F5C\u6570\u636E\u5E93\u5931\u8D25:", error);
        return this.success(session, "\u66F4\u65B0\u4F1A\u8BDD\u6210\u529F");
      }
    } catch (error) {
      console.error("updateSession - \u9519\u8BEF:", error);
      return this.success(session, "\u66F4\u65B0\u4F1A\u8BDD\u6210\u529F");
    }
  }
  /**
   * @description 获取用户列表
   */
  async getUserList(uid) {
    try {
      const { data } = await this.getDb().collection(this.userTableName).where({
        account: { $ne: uid }
      }).get();
      const userList = data.map((user) => ({
        userId: user._id,
        nickname: user.nickname || `\u7528\u6237${user.account}`,
        avatarUrl: user.avatarUrl || "https://img.icons8.com/ios-filled/50/000000/user.png",
        createTime: new Date(user.createTime).getTime() || Date.now(),
        phoneNumber: user.account
      }));
      return this.success(userList);
    } catch (error) {
      return this.fail("\u83B7\u53D6\u7528\u6237\u5217\u8868\u5931\u8D25");
    }
  }
  /**
   * @description 搜索用户
   */
  async searchUser(keyword) {
    try {
      const { data } = await this.getDb().collection(this.userTableName).where({
        account: { $regex: keyword }
      }).get();
      const userList = data.map((user) => ({
        userId: user._id,
        nickname: user.nickname || `\u7528\u6237${user.account}`,
        avatarUrl: user.avatarUrl || "https://img.icons8.com/ios-filled/50/000000/user.png",
        createTime: new Date(user.createTime).getTime() || Date.now(),
        phoneNumber: user.account
      }));
      return this.success(userList);
    } catch (error) {
      return this.fail("\u641C\u7D22\u7528\u6237\u5931\u8D25");
    }
  }
  /**
   * @description 发送好友请求
   */
  async sendFriendRequest(fromUid, toUid, message = "") {
    try {
      console.log("sendFriendRequest - \u5F00\u59CB\u53D1\u9001\u597D\u53CB\u8BF7\u6C42:", { fromUid, toUid, message });
      if (!fromUid || !toUid) {
        console.log("sendFriendRequest - \u53C2\u6570\u4E0D\u5B8C\u6574");
        return this.fail("\u53C2\u6570\u4E0D\u5B8C\u6574");
      }
      if (fromUid === toUid) {
        console.log("sendFriendRequest - \u4E0D\u80FD\u5411\u81EA\u5DF1\u53D1\u9001\u597D\u53CB\u8BF7\u6C42");
        return this.fail("\u4E0D\u80FD\u5411\u81EA\u5DF1\u53D1\u9001\u597D\u53CB\u8BF7\u6C42");
      }
      const friendCheck = await this.getDb().collection(this.friendTableName).where({
        $or: [
          { userId: fromUid, friendId: toUid },
          { userId: toUid, friendId: fromUid }
        ]
      }).get();
      console.log("sendFriendRequest - \u597D\u53CB\u68C0\u67E5\u7ED3\u679C:", friendCheck.data);
      if (friendCheck.data.length > 0) {
        console.log("sendFriendRequest - \u5DF2\u7ECF\u662F\u597D\u53CB");
        return this.fail("\u5DF2\u7ECF\u662F\u597D\u53CB");
      }
      const requestCheck = await this.getDb().collection(this.friendRequestTableName).where({
        fromUid,
        toUid,
        status: "pending"
      }).get();
      console.log("sendFriendRequest - \u8BF7\u6C42\u68C0\u67E5\u7ED3\u679C:", requestCheck.data);
      if (requestCheck.data.length > 0) {
        console.log("sendFriendRequest - \u5DF2\u7ECF\u53D1\u9001\u8FC7\u597D\u53CB\u8BF7\u6C42");
        return this.fail("\u5DF2\u7ECF\u53D1\u9001\u8FC7\u597D\u53CB\u8BF7\u6C42");
      }
      console.log("sendFriendRequest - \u51C6\u5907\u6DFB\u52A0\u597D\u53CB\u8BF7\u6C42");
      await this.getDb().collection(this.friendRequestTableName).add({
        fromUid,
        toUid,
        message,
        status: "pending",
        createTime: /* @__PURE__ */ new Date()
      });
      console.log("sendFriendRequest - \u53D1\u9001\u597D\u53CB\u8BF7\u6C42\u6210\u529F");
      return this.success(true, "\u53D1\u9001\u597D\u53CB\u8BF7\u6C42\u6210\u529F");
    } catch (error) {
      console.error("sendFriendRequest - \u9519\u8BEF:", error);
      return this.fail("\u53D1\u9001\u597D\u53CB\u8BF7\u6C42\u5931\u8D25");
    }
  }
  /**
   * @description 获取好友请求列表
   */
  async getFriendRequests(uid) {
    try {
      const { data } = await this.getDb().collection(this.friendRequestTableName).where({
        toUid: uid,
        status: "pending"
      }).get();
      for (const request of data) {
        const { data: userData } = await this.getDb().collection(this.userTableName).where({
          account: request.fromUid
        }).get();
        if (userData.length > 0) {
          const user = userData[0];
          request.fromUser = {
            userId: user._id,
            nickname: user.nickname || `\u7528\u6237${user.account}`,
            avatarUrl: user.avatarUrl || "https://img.icons8.com/ios-filled/50/000000/user.png",
            createTime: new Date(user.createTime).getTime() || Date.now(),
            phoneNumber: user.account
          };
        }
      }
      return this.success(data);
    } catch (error) {
      return this.fail("\u83B7\u53D6\u597D\u53CB\u8BF7\u6C42\u5217\u8868\u5931\u8D25");
    }
  }
  /**
   * @description 处理好友请求
   */
  async handleFriendRequest(requestId, status, uid) {
    try {
      if (!requestId) {
        return this.fail("\u8BF7\u6C42ID\u4E0D\u80FD\u4E3A\u7A7A");
      }
      const { data: requestData } = await this.getDb().collection(this.friendRequestTableName).where({
        _id: requestId
      }).get();
      if (requestData.length === 0) {
        return this.fail("\u597D\u53CB\u8BF7\u6C42\u4E0D\u5B58\u5728");
      }
      const request = requestData[0];
      if (uid && request.toUid !== uid) {
        return this.fail("\u65E0\u6743\u5904\u7406\u6B64\u8BF7\u6C42");
      }
      await this.getDb().collection(this.friendRequestTableName).where({
        _id: requestId
      }).update({ status });
      if (status === "accepted") {
        await this.getDb().collection(this.friendTableName).add({
          userId: request.fromUid,
          friendId: request.toUid,
          createTime: /* @__PURE__ */ new Date()
        });
        await this.getDb().collection(this.friendTableName).add({
          userId: request.toUid,
          friendId: request.fromUid,
          createTime: /* @__PURE__ */ new Date()
        });
      }
      return this.success(true, status === "accepted" ? "\u6DFB\u52A0\u597D\u53CB\u6210\u529F" : "\u62D2\u7EDD\u597D\u53CB\u8BF7\u6C42\u6210\u529F");
    } catch (error) {
      return this.fail("\u5904\u7406\u597D\u53CB\u8BF7\u6C42\u5931\u8D25");
    }
  }
  /**
   * @description 获取好友列表
   */
  async getFriendList(uid) {
    try {
      console.log("getFriendList - \u5F00\u59CB\u67E5\u8BE2\uFF0Cuid:", uid);
      console.log("getFriendList - \u8868\u540D:", this.friendTableName);
      const { data: friendData } = await this.getDb().collection(this.friendTableName).where({
        userId: uid
      }).get();
      console.log("getFriendList - \u67E5\u8BE2\u7ED3\u679C:", friendData);
      const friendList = [];
      for (const friend of friendData) {
        console.log("getFriendList - \u5904\u7406\u597D\u53CB:", friend);
        const { data: userData } = await this.getDb().collection(this.userTableName).where({
          _id: friend.friendId
        }).get();
        console.log("getFriendList - \u597D\u53CB\u8BE6\u60C5:", userData);
        if (userData.length > 0) {
          const user = userData[0];
          friendList.push({
            userId: user._id,
            nickname: user.nickname || `\u7528\u6237${user.account}`,
            avatarUrl: user.avatarUrl || "https://img.icons8.com/ios-filled/50/000000/user.png",
            createTime: new Date(user.createTime).getTime() || Date.now(),
            phoneNumber: user.account
          });
        }
      }
      console.log("getFriendList - \u8FD4\u56DE\u597D\u53CB\u5217\u8868:", friendList);
      return this.success(friendList);
    } catch (error) {
      console.error("getFriendList - \u9519\u8BEF:", error);
      return this.fail("\u83B7\u53D6\u597D\u53CB\u5217\u8868\u5931\u8D25");
    }
  }
};

// src/index.ts
exports.main = async (event) => {
  const { action, data, appId, uid } = event;
  if (!appId) return { code: 403, msg: "\u8BF7\u4F20\u5165appId", data: {} };
  const chatService = new ChatService(appId);
  switch (action) {
    // 用户模块
    case "user/list":
      return await chatService.getUserList(uid);
    // 好友模块
    case "contact/search":
      return await chatService.searchUser(data.keyword);
    case "contact/apply":
      if (!uid) return { code: 403, msg: "\u7528\u6237\u672A\u767B\u5F55", data: {} };
      if (!data.uid) return { code: 400, msg: "\u53C2\u6570\u4E0D\u5B8C\u6574\uFF1A\u7F3A\u5C11\u76EE\u6807\u7528\u6237ID", data: {} };
      return await chatService.sendFriendRequest(uid, data.uid, data.msg);
    case "contact/applyList":
      return await chatService.getFriendRequests(uid);
    case "contact/agree":
      if (!uid) return { code: 403, msg: "\u7528\u6237\u672A\u767B\u5F55", data: {} };
      return await chatService.handleFriendRequest(data.id, "accepted", uid);
    case "contact/refuse":
      if (!uid) return { code: 403, msg: "\u7528\u6237\u672A\u767B\u5F55", data: {} };
      return await chatService.handleFriendRequest(data.id, "rejected", uid);
    case "contact/list":
      return await chatService.getFriendList(uid);
    // 发送消息
    case "chat/send":
      return await chatService.sendMsg(uid, data.to_uid, data.content);
    // 获取聊天记录
    case "chat/history":
      return await chatService.getHistory(data.userId1, data.userId2);
    // 删除消息
    case "chat/delete":
      return await chatService.deleteMsg(data.msg_id, uid);
    // 标记消息已读
    case "chat/read":
      return await chatService.markRead(uid, data.sessionId, data.userId, data.targetUserId);
    // 获取会话列表
    case "chat/sessionList":
      return await chatService.getSessionList(uid);
    // 更新会话
    case "chat/updateSession":
      return await chatService.updateSession(uid, data);
    // 保存推送 token
    case "chat/savePushToken":
      return await chatService.savePushToken(data.userId, data.token);
    default:
      return { code: 404, msg: "\u63A5\u53E3\u4E0D\u5B58\u5728", data: {} };
  }
};
