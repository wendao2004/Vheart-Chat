/**
 * @Description:
 * 用户全局业务
 * @author liuzhiheng
 * @createTime 2026-03-06 09:56:41
 * @Copyright by 文刀
 */

// core/model/use-user-model.ts
import { ref } from 'vue';
import { UserData } from '../data/user-data';
import { NetApi } from '../net/net-api';
import { PushService } from '../services/push-service';
import type { ChatUser } from '../bean/index';

/**
 * 全局用户Model（单例Class）
 */
class UserModel {
  private static instance: UserModel;
  
  private _currentUser = ref<ChatUser | null>(UserData.getLocalUser());
  private _userList = ref<ChatUser[]>([]);
  private _friendList = ref<ChatUser[]>([]);

  private constructor() {}

  static getInstance(): UserModel {
    if (!UserModel.instance) {
      UserModel.instance = new UserModel();
    }
    return UserModel.instance;
  }

  get currentUser(): ChatUser | null {
    return this._currentUser.value;
  }

  get isLogin(): boolean {
    return !!this._currentUser.value && !!this._currentUser.value.userId;
  }

  get userList(): ChatUser[] {
    return this._userList.value;
  }

  get friendList(): ChatUser[] {
    return this._friendList.value;
  }

  async login(userInfo: Omit<ChatUser, 'createTime'>): Promise<ChatUser> {
    const user = await UserData.userLogin(userInfo);
    this._currentUser.value = user;
    // 保存推送 token
    await this.savePushToken();
    return user;
  }

  /**
   * 保存推送 token
   */
  async savePushToken(): Promise<void> {
    try {
      if (this.isLogin) {
        const token = await PushService.getClientToken();
        if (token) {
          console.log('保存推送 token:', token);
          await NetApi.VheartChat.savePushToken({
            userId: this._currentUser.value!.userId,
            token: token
          });
        }
      }
    } catch (error) {
      console.error('保存推送 token 失败:', error);
    }
  }

  async register(userInfo: Omit<ChatUser, 'createTime'>): Promise<ChatUser> {
    const user = await UserData.userRegister(userInfo);
    return user;
  }

  logout(): void {
    UserData.clearLocalUser();
    this._currentUser.value = null;
    this._userList.value = [];
    this._friendList.value = [];
    uni.showToast({ title: '退出登录成功', icon: 'none' });
    uni.reLaunch({
      url: '/pages/login/login'
    });
  }

  async loadUserList(): Promise<void> {
    const excludeUserId = this._currentUser.value?.userId;
    this._userList.value = await UserData.getUserList(excludeUserId);
  }

  async searchUser(keyword: string): Promise<ChatUser[]> {
    const excludeUserId = this._currentUser.value?.userId;
    return await UserData.searchUser(keyword, excludeUserId);
  }

  async sendFriendRequest(toUserId: string, message: string = ''): Promise<any> {
    if (!this._currentUser.value) {
      throw new Error('用户未登录');
    }
    return await UserData.sendFriendRequest(this._currentUser.value.userId, toUserId, message);
  }

  async getFriendRequests(): Promise<any[]> {
    if (!this._currentUser.value) {
      throw new Error('用户未登录');
    }
    return await UserData.getFriendRequests(this._currentUser.value.userId);
  }

  async handleFriendRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<void> {
    if (!this._currentUser.value || !this._currentUser.value.userId) {
      throw new Error('用户未登录');
    }
    console.log('use-user-model - handleFriendRequest - userId:', this._currentUser.value.userId);
    const result = await UserData.handleFriendRequest(requestId, this._currentUser.value.userId, status);
    // 刷新好友列表
    if (status === 'accepted') {
      await this.loadFriendList();
      // 触发全局事件，通知其他页面刷新好友列表
      uni.$emit('friendListUpdated');
    }
  }

  async loadFriendList(): Promise<void> {
    if (!this._currentUser.value) {
      throw new Error('用户未登录');
    }
    this._friendList.value = await UserData.getFriendList(this._currentUser.value.userId);
    // 缓存好友头像
    UserData.cacheAvatarsFromUserList(this._friendList.value);
  }

  getFriendList(): Promise<ChatUser[]> {
    if (!this._currentUser.value) {
      throw new Error('用户未登录');
    }
    return UserData.getFriendList(this._currentUser.value.userId);
  }

  /**
   * 获取用户头像（优先缓存）
   */
  getUserAvatar(userId: string): string {
	// 如果是当前用户，返回当前用户头像
	if (userId === this._currentUser.value?.userId) {
		const avatarUrl = this._currentUser.value?.avatarUrl || UserData.getUserAvatar(userId);
		// 缓存当前用户头像
		if (avatarUrl && avatarUrl !== UserData.getUserAvatar(userId)) {
			UserData.cacheUserAvatar(userId, avatarUrl);
		}
		return avatarUrl;
	}
	// 从缓存获取
	const cachedAvatar = UserData.getCachedAvatar(userId);
	if (cachedAvatar) {
		return cachedAvatar;
	}
	// 从好友列表中查找
	const friend = this._friendList.value.find(f => f.userId === userId);
	if (friend?.avatarUrl) {
		// 缓存头像
		UserData.cacheUserAvatar(userId, friend.avatarUrl);
		return friend.avatarUrl;
	}
	// 返回默认头像
	return UserData.getUserAvatar(userId);
  }

  /**
   * 验证手机号格式
   */
  validatePhoneNumber(phoneNumber: string): boolean {
	return UserData.validatePhoneNumber(phoneNumber);
  }
  
};

export const globalUser = UserModel.getInstance();
