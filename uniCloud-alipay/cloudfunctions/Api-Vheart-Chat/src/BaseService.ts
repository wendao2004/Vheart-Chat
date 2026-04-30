/**
 * @Description:
 * 基类
 * @author liuzhiheng
 * @createTime 2026-03-17 13:37:15
 * @Copyright by 文刀
 */
declare var uniCloud : any;
import { IApiResult } from "./interface";
const db = uniCloud.database()

export default class BaseService {
	// 成功返回
	protected success<T>(data : T, msg = '操作成功') : IApiResult<T> {
		return { code: 200, msg, data }
	}

	protected fail<T = undefined>(msg = "操作失败", code = 500) : IApiResult<T> {
		return { code, msg, data: undefined as T }
	}

	// 获取数据库
	protected getDb() {
		return db
	}
}