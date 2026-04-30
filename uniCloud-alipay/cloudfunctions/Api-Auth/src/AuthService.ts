/**
 * @Description:
 * 登录 + 注册，实现 TS 接口
 * @author liuzhiheng
 * @createTime 2026-03-17 13:42:57
 * @Copyright by 文刀
 */


import BaseService from "./BaseService";
import { IApiResult, IAuth } from "./interface";

/**
 * @Description:
 * 实现登录注册服务类（AuthService）
 * 继承（BaseService） 实现接口（Iauth）
 * @author liuzhiheng
 * @createTime 2026-03-17 13:55:30
 * @Copyright by 文刀
 */

export default class AuthService extends BaseService implements IAuth {
	private tableName : string
	// 将用户数据库动态处理
	constructor(appId : string) {
		super()
		this.tableName = `user_${appId}`
	}
	// 密码加密
	private encryptPassword(password : string) {
		return require('crypto').createHash('md5').update(password).digest('hex');
	}

	// async异步函数 返回Promise
	// <>接口类型，login主方法 选用IApiResult 基本信息 code,msg,data
	async login(account : string, password : string) : Promise<IApiResult> {
		if (!account || !password) return this.fail("参数不能为空");
		try {
			// 声明密码加密变量
			const encryptPwd = this.encryptPassword(password);
			// 定义变量
			// 实现查找数据库中user表
			// 匹配用户名及密码
			// 获取数据
			const { data } = await this.getDb()
				.collection(this.tableName)
				.where({ account, password })
				.get()

			// 简单判断
			// 数据为0即未注册
			if (data.length === 0) {
				return this.fail("账号或密码错误")
			}

			// 简单token
			// 每位用户唯一识别码
			const token = `TOKEN_${data[0]._id}_${Date.now()}`
			return this.success({ token, userInfo: data[0] }, '登陆成功')
		} catch (error) {
			//TODO handle the exception
			return this.fail("登录服务异常")
		}
	}


	/**
	 * @Description:
	 * 注册方法
	 * @author liuzhiheng
	 * @createTime 2026-03-17 14:01:52
	 * @Copyright by 文刀
	 */


	async register(account : string, password : string) : Promise<IApiResult> {
		if (!account || !password) return this.fail("参数不能为空");
		try {
			const encryptPwd = this.encryptPassword(password);
			const { data } = await this.getDb().collection(this.tableName).where({ account }).get();
			if (data.length) return this.fail("账号已存在");
			await this.getDb().collection(this.tableName).add({
				account, password: encryptPwd, createTime: new Date()
			});
			return this.success({}, "注册成功");
		} catch (e) {
			console.error('注册逻辑报错详情:', e); // 2. 这里会打出真正的错误原因
			return { code: 500, msg: e.message || '注册服务异常', data: {} };
		}
	}

}