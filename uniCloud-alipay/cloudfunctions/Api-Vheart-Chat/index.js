// src/BaseService.ts
var db = uniCloud.database();
var BaseService = class {
  // 成功返回
  success(data, msg = "\u64CD\u4F5C\u6210\u529F") {
    return { code: 200, msg, data };
  }
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

// src/MusicService.ts
var MusicService = class extends BaseService {
  // 构造函数
  constructor() {
    super();
  }
  async getMiguMusicList(params) {
    const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
    const url = "https://api.yaohud.cn/api/music/migu?key=veQAvBgr8cVs43ly2Ee&msg=" + searchMsg + "&n=";
    try {
      const res = await uniCloud.httpclient.request(url, {
        method: "GET",
        dataType: "json"
      });
      console.log("API\u8FD4\u56DE\u6570\u636E:", res.data);
      console.log("API\u8FD4\u56DE\u6570\u636E\u683C\u5F0F\u68C0\u67E5:", res.data);
      if (!res?.data) {
        return this.fail("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
      }
      const { code, data } = res.data;
      if (code === 200 && data && Array.isArray(data.songs)) {
        return this.success(data.songs);
      }
      return this.fail("\u6B4C\u66F2\u5217\u8868\u6570\u636E\u683C\u5F0F\u9519\u8BEF");
    } catch (error) {
      console.error("\u83B7\u53D6\u6B4C\u66F2\u5217\u8868\u5931\u8D25:", error);
      return this.fail("\u83B7\u53D6\u6B4C\u66F2\u5217\u8868\u5931\u8D25");
    }
  }
  async getMiguMusic(params) {
    console.log("getMiguMusic params:", params);
    const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
    if (!searchMsg) {
      console.log("\u641C\u7D22\u5173\u952E\u8BCD\u4E3A\u7A7A");
      return this.fail("\u641C\u7D22\u5173\u952E\u8BCD\u4E0D\u80FD\u4E3A\u7A7A");
    }
    const url = "https://api.yaohud.cn/api/music/migu?key=veQAvBgr8cVs43ly2Ee&msg=" + searchMsg + "&n=" + (params.n || 0);
    console.log("API\u8BF7\u6C42URL:", url);
    try {
      const res = await uniCloud.httpclient.request(url, {
        method: "GET",
        dataType: "json"
      });
      console.log("API\u8FD4\u56DE\u6570\u636E:", res);
      if (!res?.data) {
        console.log("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
        return this.fail("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
      }
      console.log("API\u8FD4\u56DE\u6570\u636Edata:", res.data);
      let apiData = res.data;
      console.log("\u539F\u59CBAPI\u8FD4\u56DE\u6570\u636E:", apiData);
      if (apiData.data && typeof apiData.data === "object") {
        apiData = apiData.data;
        console.log("\u5904\u7406\u540E\u7684API\u6570\u636E:", apiData);
      }
      if (apiData.code === 200 && apiData.title && apiData.singer) {
        console.log("API\u8FD4\u56DE\u5355\u66F2\u8BE6\u60C5:", apiData);
        const result = this.success([apiData]);
        console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
        return result;
      } else if (apiData.code === 200 && apiData.data && typeof apiData.data === "object" && apiData.data.title && apiData.data.singer) {
        console.log("API\u8FD4\u56DE\u5D4C\u5957\u7684\u5355\u66F2\u8BE6\u60C5:", apiData.data);
        const result = this.success([apiData.data]);
        console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
        return result;
      } else if (apiData.code === 200 && apiData.data && Array.isArray(apiData.data.songs)) {
        console.log("API\u8FD4\u56DEsongs:", apiData.data.songs);
        let targetSong;
        if (params.n && params.n > 0 && params.n <= apiData.data.songs.length) {
          targetSong = apiData.data.songs[params.n - 1];
          console.log("\u6839\u636En\u503C\u83B7\u53D6\u6B4C\u66F2:", targetSong);
        } else {
          targetSong = apiData.data.songs.find(
            (song) => song.title === params.title || song.singer === params.singer
          ) || apiData.data.songs[0];
          console.log("\u5339\u914D\u7684\u6B4C\u66F2:", targetSong);
        }
        const result = this.success(targetSong ? [targetSong] : []);
        console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
        return result;
      }
      console.log("\u6B4C\u66F2\u6570\u636E\u683C\u5F0F\u9519\u8BEF");
      return this.fail("\u6B4C\u66F2\u6570\u636E\u683C\u5F0F\u9519\u8BEF");
    } catch (error) {
      console.error("\u83B7\u53D6\u6B4C\u66F2\u5931\u8D25:", error);
      const result = this.fail("API\u8BF7\u6C42\u5931\u8D25");
      console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
      return result;
    }
  }
  async getFreeMusic(params) {
    console.log(params);
    if (!params.title) {
      const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
      const url = "" + searchMsg + "&type=json&br=1&n=";
      try {
        const res = await uniCloud.httpclient.request(url, {
          method: "GET",
          dataType: "json"
        });
        console.log("\u8BF7\u6C42\u6210\u529F", res);
        return this.success(res.data.data);
      } catch (error) {
        return this.fail("API\u8BF7\u6C42\u5931\u8D25");
      }
    }
  }
  async getAppleMusicList(params) {
    const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
    let url = "https://api.yaohud.cn/api/music/apple?key=veQAvBgr8cVs43ly2Ee&msg=" + searchMsg + "&g=" + (params.pageSize || 12);
    if (params.n && params.n > 0) {
      url += "&n=" + params.n;
    }
    console.log("API\u8BF7\u6C42URL:", url);
    try {
      const res = await uniCloud.httpclient.request(url, {
        method: "GET",
        dataType: "json",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset:utf-8;"
        }
      });
      console.log("API\u8FD4\u56DE\u6570\u636E:", res.data);
      if (!res?.data) {
        return this.fail("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
      }
      let apiData = res.data;
      const { code, data, msg } = apiData;
      let songsData = apiData.data;
      if (songsData && typeof songsData === "object") {
        console.log("\u5904\u7406\u540E\u7684API\u6570\u636E:", songsData);
      }
      if (code === 200 && data && data.trackName && data.artistName) {
        console.log("API\u8FD4\u56DE\u82F9\u679C\u97F3\u4E50\u5355\u66F2\u8BE6\u60C5:", data);
        const songData = {
          title: data.trackName,
          singer: data.artistName,
          music_url: data.url,
          cover: data.cover,
          album: data.collectionName,
          link: data.trackViewUrl
        };
        return this.success([songData]);
      }
      if (code === 200 && songsData && Array.isArray(songsData.songs)) {
        if (params.n && params.n > 0 && params.n <= songsData.songs.length) {
          const targetSong = songsData.songs[params.n - 1];
          console.log("\u6839\u636En\u503C\u83B7\u53D6\u6B4C\u66F2:", targetSong);
          return this.success([targetSong]);
        }
        return this.success(songsData.songs);
      }
      if (code === 404) {
        console.log("API\u8FD4\u56DE404\u9519\u8BEF:", msg);
        return this.fail(msg || "\u641C\u7D22\u7ED3\u679C\u4E3A\u7A7A");
      }
      if (code === 200) {
        console.log("API\u8FD4\u56DE\u6210\u529F\u4F46\u6570\u636E\u683C\u5F0F\u4E0D\u7B26\u5408\u9884\u671F:", data);
        return this.fail("\u6B4C\u66F2\u6570\u636E\u683C\u5F0F\u9519\u8BEF");
      }
      return this.fail("API\u8FD4\u56DE\u9519\u8BEF");
    } catch (error) {
      console.error("\u83B7\u53D6\u6B4C\u66F2\u5217\u8868\u5931\u8D25:", error);
      return this.fail("\u83B7\u53D6\u6B4C\u66F2\u5217\u8868\u5931\u8D25");
    }
  }
  async getAppleMusic(params) {
    console.log("getAppleMusic params:", params);
    const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
    if (!searchMsg) {
      console.log("\u641C\u7D22\u5173\u952E\u8BCD\u4E3A\u7A7A");
      return this.fail("\u641C\u7D22\u5173\u952E\u8BCD\u4E0D\u80FD\u4E3A\u7A7A");
    }
    let url = "https://api.yaohud.cn/api/music/apple?key=veQAvBgr8cVs43ly2Ee&msg=" + searchMsg + "&g=12";
    if (params.n && params.n > 0) {
      url += "&n=" + params.n;
    }
    console.log("API\u8BF7\u6C42URL:", url);
    try {
      const res = await uniCloud.httpclient.request(url, {
        method: "GET",
        dataType: "json",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset:utf-8;"
        }
      });
      console.log("API\u8FD4\u56DE\u6570\u636E:", res);
      if (!res?.data) {
        console.log("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
        return this.fail("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
      }
      console.log("API\u8FD4\u56DE\u6570\u636Edata:", res.data);
      let apiData = res.data;
      console.log("\u539F\u59CBAPI\u8FD4\u56DE\u6570\u636E:", apiData);
      const { code, data, msg } = apiData;
      let songData = apiData.data;
      if (songData && typeof songData === "object") {
        console.log("\u5904\u7406\u540E\u7684API\u6570\u636E:", songData);
      }
      console.log("\u68C0\u67E5\u5355\u66F2\u8BE6\u60C5\u6761\u4EF6 1:", code === 200, !!songData, !!songData?.trackName, !!songData?.artistName);
      if (code === 200 && songData && songData.trackName && songData.artistName) {
        console.log("API\u8FD4\u56DE\u82F9\u679C\u97F3\u4E50\u5355\u66F2\u8BE6\u60C5:", songData);
        const formattedSongData = {
          title: songData.trackName,
          singer: songData.artistName,
          music_url: songData.url,
          cover: songData.cover,
          album: songData.collectionName,
          link: songData.trackViewUrl
        };
        const result = this.success([formattedSongData]);
        console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
        return result;
      }
      console.log("\u68C0\u67E5\u5355\u66F2\u8BE6\u60C5\u6761\u4EF6 2:", code === 200, !!apiData.trackName, !!apiData.artistName);
      if (code === 200 && apiData.trackName && apiData.artistName) {
        console.log("API\u8FD4\u56DE\u5D4C\u5957\u7684\u82F9\u679C\u97F3\u4E50\u5355\u66F2\u8BE6\u60C5:", apiData);
        const formattedSongData = {
          title: apiData.trackName,
          singer: apiData.artistName,
          music_url: apiData.url,
          cover: apiData.cover,
          album: apiData.collectionName,
          link: apiData.trackViewUrl
        };
        const result = this.success([formattedSongData]);
        console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
        return result;
      }
      console.log("\u68C0\u67E5\u5355\u66F2\u8BE6\u60C5\u6761\u4EF6 3:", code === 200, !!apiData.title, !!apiData.singer);
      if (code === 200 && apiData.title && apiData.singer) {
        console.log("API\u8FD4\u56DE\u5355\u66F2\u8BE6\u60C5:", apiData);
        const result = this.success([apiData]);
        console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
        return result;
      }
      console.log("\u68C0\u67E5\u5355\u66F2\u8BE6\u60C5\u6761\u4EF6 4:", code === 200, !!songData, typeof songData === "object", !!songData?.title, !!songData?.singer);
      if (code === 200 && songData && typeof songData === "object" && songData.title && songData.singer) {
        console.log("API\u8FD4\u56DE\u5D4C\u5957\u7684\u5355\u66F2\u8BE6\u60C5:", songData);
        const result = this.success([songData]);
        console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
        return result;
      }
      console.log("\u68C0\u67E5\u6B4C\u66F2\u5217\u8868\u6761\u4EF6:", code === 200, !!songData, Array.isArray(songData?.songs));
      if (code === 200 && songData && Array.isArray(songData.songs)) {
        console.log("API\u8FD4\u56DEsongs:", songData.songs);
        let targetSong;
        if (params.n && params.n > 0 && params.n <= songData.songs.length) {
          targetSong = songData.songs[params.n - 1];
          console.log("\u6839\u636En\u503C\u83B7\u53D6\u6B4C\u66F2:", targetSong);
        } else {
          targetSong = songData.songs.find(
            (song) => song.title === params.title || song.singer === params.singer
          ) || songData.songs[0];
          console.log("\u5339\u914D\u7684\u6B4C\u66F2:", targetSong);
        }
        const result = this.success(targetSong ? [targetSong] : []);
        console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
        return result;
      } else if (code === 200) {
        console.log("API\u8FD4\u56DE\u6210\u529F\u4F46\u6570\u636E\u683C\u5F0F\u4E0D\u7B26\u5408\u9884\u671F:", apiData);
        return this.fail("\u6B4C\u66F2\u6570\u636E\u683C\u5F0F\u9519\u8BEF");
      } else if (code) {
        console.log("API\u8FD4\u56DE\u9519\u8BEF:", apiData.msg);
        return this.fail(apiData.msg || "API\u8FD4\u56DE\u9519\u8BEF");
      }
      console.log("\u6B4C\u66F2\u6570\u636E\u683C\u5F0F\u9519\u8BEF");
      return this.fail("\u6B4C\u66F2\u6570\u636E\u683C\u5F0F\u9519\u8BEF");
    } catch (error) {
      console.error("\u83B7\u53D6\u6B4C\u66F2\u5931\u8D25:", error);
      const result = this.fail("API\u8BF7\u6C42\u5931\u8D25");
      console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
      return result;
    }
  }
  async getQQMusicList(params) {
    const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
    let url = "https://api.yaohud.cn/api/music/qq?key=veQAvBgr8cVs43ly2Ee&msg=" + searchMsg + "&g=" + (params.pageSize || 10);
    if (params.n && params.n > 0) {
      url += "&n=" + params.n;
    }
    console.log("QQ\u97F3\u4E50API\u8BF7\u6C42URL:", url);
    try {
      const res = await uniCloud.httpclient.request(url, {
        method: "GET",
        dataType: "json",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset:utf-8;"
        }
      });
      console.log("QQ\u97F3\u4E50API\u8FD4\u56DE\u6570\u636E:", res.data);
      if (!res?.data) {
        return this.fail("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
      }
      return this.success(res.data);
    } catch (error) {
      console.error("\u83B7\u53D6QQ\u97F3\u4E50\u6B4C\u66F2\u5217\u8868\u5931\u8D25:", error);
      return this.fail("\u83B7\u53D6\u6B4C\u66F2\u5217\u8868\u5931\u8D25");
    }
  }
  async getQQMusic(params) {
    console.log("getQQMusic params:", params);
    const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
    if (!searchMsg) {
      console.log("\u641C\u7D22\u5173\u952E\u8BCD\u4E3A\u7A7A");
      return this.fail("\u641C\u7D22\u5173\u952E\u8BCD\u4E0D\u80FD\u4E3A\u7A7A");
    }
    let url = "https://api.yaohud.cn/api/music/qq?key=veQAvBgr8cVs43ly2Ee&msg=" + searchMsg + "&g=10";
    if (params.n && params.n > 0) {
      url += "&n=" + params.n;
    }
    console.log("QQ\u97F3\u4E50API\u8BF7\u6C42URL:", url);
    try {
      const res = await uniCloud.httpclient.request(url, {
        method: "GET",
        dataType: "json",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset:utf-8;"
        }
      });
      console.log("QQ\u97F3\u4E50API\u8FD4\u56DE\u6570\u636E:", res);
      if (!res?.data) {
        console.log("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
        return this.fail("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
      }
      return this.success(res.data);
    } catch (error) {
      console.error("\u83B7\u53D6QQ\u97F3\u4E50\u6B4C\u66F2\u5931\u8D25:", error);
      const result = this.fail("API\u8BF7\u6C42\u5931\u8D25");
      console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
      return result;
    }
  }
  // 酷我音乐API
  async getKuwoMusicList(params) {
    const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
    let url = "https://api.yaohud.cn/api/music/kuwo?key=veQAvBgr8cVs43ly2Ee&msg=" + searchMsg + "&g=" + (params.pageSize || 13);
    if (params.n && params.n > 0) {
      url += "&n=" + params.n;
    }
    console.log("\u9177\u6211\u97F3\u4E50API\u8BF7\u6C42URL:", url);
    try {
      const res = await uniCloud.httpclient.request(url, {
        method: "GET",
        dataType: "json",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset:utf-8;"
        }
      });
      console.log("\u9177\u6211\u97F3\u4E50API\u8FD4\u56DE\u6570\u636E:", res.data);
      if (!res?.data) {
        return this.fail("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
      }
      return this.success(res.data);
    } catch (error) {
      console.error("\u83B7\u53D6\u9177\u6211\u97F3\u4E50\u6B4C\u66F2\u5217\u8868\u5931\u8D25:", error);
      return this.fail("\u83B7\u53D6\u6B4C\u66F2\u5217\u8868\u5931\u8D25");
    }
  }
  async getKuwoMusic(params) {
    console.log("getKuwoMusic params:", params);
    const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
    if (!searchMsg) {
      console.log("\u641C\u7D22\u5173\u952E\u8BCD\u4E3A\u7A7A");
      return this.fail("\u641C\u7D22\u5173\u952E\u8BCD\u4E0D\u80FD\u4E3A\u7A7A");
    }
    let url = "https://api.yaohud.cn/api/music/kuwo?key=veQAvBgr8cVs43ly2Ee&msg=" + searchMsg + "&g=13";
    if (params.n && params.n > 0) {
      url += "&n=" + params.n;
    }
    console.log("\u9177\u6211\u97F3\u4E50API\u8BF7\u6C42URL:", url);
    try {
      const res = await uniCloud.httpclient.request(url, {
        method: "GET",
        dataType: "json",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset:utf-8;"
        }
      });
      console.log("\u9177\u6211\u97F3\u4E50API\u8FD4\u56DE\u6570\u636E:", res);
      if (!res?.data) {
        console.log("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
        return this.fail("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
      }
      return this.success(res.data);
    } catch (error) {
      console.error("\u83B7\u53D6\u9177\u6211\u97F3\u4E50\u6B4C\u66F2\u5931\u8D25:", error);
      const result = this.fail("API\u8BF7\u6C42\u5931\u8D25");
      console.log("\u8FD4\u56DE\u7ED3\u679C:", result);
      return result;
    }
  }
  // 歌词API
  async getLyrics(params) {
    const { mid, type } = params;
    if (!mid || !type) {
      return this.fail("\u6B4C\u66F2ID\u548C\u5E73\u53F0\u7C7B\u578B\u4E0D\u80FD\u4E3A\u7A7A");
    }
    const url = `https://api.yaohud.cn/api/music/lrc?key=veQAvBgr8cVs43ly2Ee&mid=${encodeURIComponent(mid)}&type=${encodeURIComponent(type)}`;
    console.log("\u6B4C\u8BCDAPI\u8BF7\u6C42URL:", url);
    try {
      const res = await uniCloud.httpclient.request(url, {
        method: "GET",
        dataType: "json",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset:utf-8;"
        }
      });
      console.log("\u6B4C\u8BCDAPI\u8FD4\u56DE\u6570\u636E:", res.data);
      if (!res?.data) {
        return this.fail("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
      }
      return this.success(res.data);
    } catch (error) {
      console.error("\u83B7\u53D6\u6B4C\u8BCD\u5931\u8D25:", error);
      return this.fail("\u83B7\u53D6\u6B4C\u8BCD\u5931\u8D25");
    }
  }
};

// src/AnimeService.ts
var AnimeService = class extends BaseService {
  // 构造函数
  constructor() {
    super();
    // API密钥
    this.apiKey = "veQAvBgr8cVs43ly2Ee";
    // API基础URL
    this.baseUrl = "https://api.yaohud.cn/api/v5/fqdm";
  }
  /**
   * 搜索动漫
   * @param params 搜索参数
   * @returns 动漫搜索结果
   */
  async searchAnime(params) {
    const { msg, page = 1 } = params;
    if (!msg || !msg.trim()) {
      return this.fail("\u641C\u7D22\u5173\u952E\u8BCD\u4E0D\u80FD\u4E3A\u7A7A");
    }
    const url = `${this.baseUrl}?key=${this.apiKey}&msg=${encodeURIComponent(msg.trim())}&g=${page}`;
    console.log("\u52A8\u6F2BAPI\u8BF7\u6C42URL:", url);
    try {
      const res = await uniCloud.httpclient.request(url, {
        method: "GET",
        dataType: "json",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset:utf-8;"
        }
      });
      console.log("\u52A8\u6F2BAPI\u8FD4\u56DE\u6570\u636E:", res.data);
      if (!res?.data) {
        return this.fail("API\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A");
      }
      const apiData = res.data;
      if (apiData.code !== 200) {
        return this.fail(apiData.msg || "\u641C\u7D22\u5931\u8D25");
      }
      const result = {
        list: [],
        pagination: {
          current_page: page,
          total_page: 1,
          total_count: 0,
          per_page: 18
        }
      };
      if (apiData.data && Array.isArray(apiData.data.list)) {
        result.list = apiData.data.list.map((item) => ({
          class_: item.class || "",
          title: item.title || "",
          detail_url: item.detail_url || "",
          play_url: item.play_url || "",
          cover: item.cover || "",
          episode: item.episode || "",
          info: item.info || ""
        }));
      }
      if (apiData.data && apiData.data.pagination) {
        result.pagination = {
          current_page: apiData.data.pagination.current_page || page,
          total_page: apiData.data.pagination.total_page || 1,
          total_count: apiData.data.pagination.total_count || 0,
          per_page: apiData.data.pagination.per_page || 18
        };
      }
      return this.success(result, "\u641C\u7D22\u6210\u529F");
    } catch (error) {
      console.error("\u641C\u7D22\u52A8\u6F2B\u5931\u8D25:", error);
      return this.fail("\u641C\u7D22\u52A8\u6F2B\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    }
  }
};

// src/index.ts
exports.main = async (event) => {
  const { action, data, appId, uid } = event;
  if (!appId) return { code: 403, msg: "\u8BF7\u4F20\u5165appId", data: {} };
  const chatService = new ChatService(appId);
  const musicService = new MusicService();
  const animeService = new AnimeService();
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
    case "music/getMiguMusicList":
      return await musicService.getMiguMusicList(data);
    case "music/getMiguMusic":
      return await musicService.getMiguMusic(data);
    case "music/getAppleMusicList":
      return await musicService.getAppleMusicList(data);
    case "music/getAppleMusic":
      return await musicService.getAppleMusic(data);
    case "music/getQQMusicList":
      return await musicService.getQQMusicList(data);
    case "music/getQQMusic":
      return await musicService.getQQMusic(data);
    case "music/getKuwoMusicList":
      return await musicService.getKuwoMusicList(data);
    case "music/getKuwoMusic":
      return await musicService.getKuwoMusic(data);
    case "music/getLyrics":
      return await musicService.getLyrics(data);
    case "anime/search":
      return await animeService.searchAnime(data);
    default:
      return { code: 404, msg: "\u63A5\u53E3\u4E0D\u5B58\u5728", data: {} };
  }
};
