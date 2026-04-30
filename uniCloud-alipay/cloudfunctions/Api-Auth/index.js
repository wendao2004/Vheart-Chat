// src/BaseService.ts
var db = uniCloud.database();
var BaseService = class {
  // 成功返回
  success(data = {}, msg = "\u64CD\u4F5C\u6210\u529F") {
    return { code: 200, msg, data };
  }
  // 返回失败
  fail(msg = "\u64CD\u4F5C\u5931\u8D25", code = 500) {
    return { code, msg, data: {} };
  }
  // 获取数据库
  getDb() {
    return db;
  }
};

// src/AuthService.ts
var AuthService = class extends BaseService {
  // 将用户数据库动态处理
  constructor(appId) {
    super();
    this.tableName = `user_${appId}`;
  }
  // 密码加密
  encryptPassword(password) {
    return require("crypto").createHash("md5").update(password).digest("hex");
  }
  // async异步函数 返回Promise
  // <>接口类型，login主方法 选用IApiResult 基本信息 code,msg,data
  async login(account, password) {
    if (!account || !password) return this.fail("\u53C2\u6570\u4E0D\u80FD\u4E3A\u7A7A");
    try {
      const encryptPwd = this.encryptPassword(password);
      const { data } = await this.getDb().collection(this.tableName).where({ account, password }).get();
      if (data.length === 0) {
        return this.fail("\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF");
      }
      const token = `TOKEN_${data[0]._id}_${Date.now()}`;
      return this.success({ token, userInfo: data[0] }, "\u767B\u9646\u6210\u529F");
    } catch (error) {
      return this.fail("\u767B\u5F55\u670D\u52A1\u5F02\u5E38");
    }
  }
  /**
   * @Description:
   * 注册方法
   * @author liuzhiheng
   * @createTime 2026-03-17 14:01:52
   * @Copyright by 文刀
   */
  async register(account, password) {
    if (!account || !password) return this.fail("\u53C2\u6570\u4E0D\u80FD\u4E3A\u7A7A");
    try {
      const encryptPwd = this.encryptPassword(password);
      const { data } = await this.getDb().collection(this.tableName).where({ account }).get();
      if (data.length) return this.fail("\u8D26\u53F7\u5DF2\u5B58\u5728");
      await this.getDb().collection(this.tableName).add({
        account,
        password: encryptPwd,
        createTime: /* @__PURE__ */ new Date()
      });
      return this.success({}, "\u6CE8\u518C\u6210\u529F");
    } catch (e) {
      console.error("\u6CE8\u518C\u903B\u8F91\u62A5\u9519\u8BE6\u60C5:", e);
      return { code: 500, msg: e.message || "\u6CE8\u518C\u670D\u52A1\u5F02\u5E38", data: {} };
    }
  }
};

// src/index.ts
exports.main = async (event) => {
  const { action, data, appId } = event;
  const auth = new AuthService(appId);
  if (!appId) return { code: 403, msg: "\u8BF7\u4F20\u5165appId" };
  switch (action) {
    case "auth/login":
      return await auth.login(data.account, data.password);
    case "auth/register":
      return await auth.register(data.account, data.password);
    default:
      return { code: 404, msg: "\u63A5\u53E3\u4E0D\u5B58\u5728" };
  }
};
