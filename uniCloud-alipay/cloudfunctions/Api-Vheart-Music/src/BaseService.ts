/**
 * @Description:
 * 基类
 * @author liuzhiheng
 * @createTime 2026-03-20 13:38:02
 * @Copyright by 文刀
 */

import { IApiResult } from "./interface";

export default class BaseService {
	// 成功返回
	success<T>(data : T, msg = '操作成功') : IApiResult<T> {
		return { code: 200, msg, data }
	}
	// 返回失败
	fail(msg = "操作失败", code = 500) : IApiResult {
		return { code, msg, data: null }
	}
}