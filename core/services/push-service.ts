/**
 * @Description:
 * 推送服务
 * @author liuzhiheng
 * @createTime 2026-03-18 16:00:00
 * @Copyright by 文刀
 */

/**
 * 推送消息类型
 */
export interface PushMessage {
  title: string;
  content: string;
  payload: any;
}

/**
 * 推送服务
 */
export class PushService {
  /**
   * 初始化推送服务
   */
  static init(): void {
    // #ifdef APP-PLUS
    const _push = uni.getPushManager();
    if (_push) {
      // 注册推送通道
      _push.registerChannel({
        id: 'chat',
        name: '聊天消息',
        importance: 4,
        vibration: true
      });

      // 监听推送消息
      _push.onNotificationClick((result) => {
        console.log('推送消息点击:', result);
        // 处理推送消息点击事件
        if (result.data.payload) {
          const payload = result.data.payload;
          if (payload.type === 'chat') {
            // 跳转到聊天页面
            uni.navigateTo({
              url: `/pages/chat-detail/chat-detail?targetUserId=${payload.targetUserId}&nickname=${encodeURIComponent(payload.nickname)}`
            });
          }
        }
      });

      // 监听推送消息接收
      _push.onNotificationArrived((result) => {
        console.log('推送消息到达:', result);
      });
    }
    // #endif
  }

  /**
   * 获取客户端推送 token
   */
  static async getClientToken(): Promise<string | null> {
    return new Promise((resolve) => {
      // #ifdef APP-PLUS
      const _push = uni.getPushManager();
      if (_push) {
        _push.getToken((token) => {
          console.log('获取推送 token:', token);
          resolve(token);
        });
      } else {
        resolve(null);
      }
      // #endif
      // #ifndef APP-PLUS
      resolve(null);
      // #endif
    });
  }

  /**
   * 发送推送消息（后端调用）
   * @param deviceToken 设备 token
   * @param message 推送消息
   */
  static async sendPush(deviceToken: string, message: PushMessage): Promise<boolean> {
    try {
      // 这里需要调用后端 API 发送推送
      // 实际实现需要根据后端 API 进行调整
      console.log('发送推送消息:', deviceToken, message);
      return true;
    } catch (error) {
      console.error('发送推送消息失败:', error);
      return false;
    }
  }
}
