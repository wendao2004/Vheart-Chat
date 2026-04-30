/**
 * @Description:
 * 云函数入口
 * 所有云函数业务入口
 * @author liuzhiheng
 * @createTime 2026-03-17 14:07:37
 * @Copyright by 文刀
 */


import AuthService from "./AuthService"

exports.main = async (event: any) => {
    // ====================== 调试日志（关键！） ======================
    console.log("【完整event对象】", JSON.stringify(event));
    console.log("【event.body】", event.body);
    
    // 解析参数
    let params = event;
    if (event.body) {
        params = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    }
    
    // 打印解析后的参数
    console.log("【解析后params】", JSON.stringify(params));
    console.log("【拿到的appId】", params.appId);
    // ==============================================================

    const { action, data, appId } = params;
    const auth = new AuthService(appId);
    
    // 强制校验APPID
    if (!appId) {
        console.log("【校验失败】appId为空！");
        return { code: 403, msg: "请传入appId" };
    }
    
    switch (action) {
        case 'auth/login':
            return await auth.login(data.account, data.password);
        case 'auth/register':
            return await auth.register(data.account, data.password);
        default:
            return { code: 404, msg: '接口不存在' };
    }
}