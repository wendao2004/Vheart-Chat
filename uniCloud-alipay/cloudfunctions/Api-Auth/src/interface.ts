/**
 * @Description:
 * 后端项目分层
 * Ts接口
 * @author liuzhiheng
 * @createTime 2026-03-17 13:31:47
 * @Copyright by 文刀
 */

// 统一返回接口
export interface IApiResult {
	code : number
	msg : string
	data : any
}


// 用户登录接口
export interface IUser {
	_id ?: string
	account : string
	password : string
	createTime ?: Date
}


// 注册接口
export interface IAuth {
	login(account : string, password : string) : Promise<IApiResult>
	register(account : string, password : string) : Promise<IApiResult>
}