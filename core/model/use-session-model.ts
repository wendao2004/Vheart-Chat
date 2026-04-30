/**
 * @Description:
 * 会话列表业务逻辑
 * @author liuzhiheng
 * @createTime 2026-03-06 09:59:15
 * @Copyright by 文刀
 */
// core/model/use-session-model.ts
import { ref, watch } from 'vue';
import { SessionData } from '../data/session-data';
import { globalUser } from './use-user-model';
import type { ChatSession } from '../bean/index';

/**
 * 会话列表业务模型（单例Class）
 */
class SessionModel {
	private static instance: SessionModel;
	
	private _sessionList = ref<ChatSession[]>([]);
	private _loading = ref(false);

	static getInstance(): SessionModel {
		if (!SessionModel.instance) {
			SessionModel.instance = new SessionModel();
		}
		return SessionModel.instance;
	}

	get sessionList(): ChatSession[] {
		return this._sessionList.value;
	}

	get loading(): boolean {
		return this._loading.value;
	}

	/**
	 * 加载会话列表（优先缓存）
	 */
	loadSessionList = async () => {
			if (!globalUser.currentUser || !globalUser.currentUser.userId) {
				this._sessionList.value = [];
				return;
			}
			this._loading.value = true;
			try {
				this._sessionList.value = await SessionData.getSessionList(globalUser.currentUser.userId);
			} catch (error) {
				console.error('加载会话列表失败', error);
			} finally {
				this._loading.value = false;
			}
		};

	/**
	 * 删除会话（本地操作）
	 */
	deleteSession = async (sessionId: string) => {
		if (!globalUser.currentUser) return;
		try {
			this._sessionList.value = this._sessionList.value.filter(session => session.sessionId !== sessionId);
			
			// 更新本地缓存
			const cacheKey = `chat_session_list_cache_${globalUser.currentUser.userId}`;
			uni.setStorageSync(cacheKey, JSON.stringify({
				data: this._sessionList.value,
				timestamp: Date.now()
			}));
			
			uni.showToast({ title: '删除成功', icon: 'success' });
		} catch (error) {
			console.error('删除会话失败', error);
			uni.showToast({ title: '删除失败', icon: 'none' });
		}
	};

	/**
	 * 清空未读消息（本地优先）
	 */
	clearUnreadCount = async (sessionId: string) => {
		if (!globalUser.currentUser) return;
		
		try {
			// 本地更新未读数
			const session = this._sessionList.value.find(s => s.sessionId === sessionId);
			if (session) {
				session.unreadCount = 0;
			}
			
			// 更新本地缓存
			SessionData.updateLocalSessionCache(globalUser.currentUser.userId, {
				sessionId,
				unreadCount: 0
			} as ChatSession);
		} catch (error) {
			console.error('清除未读数失败', error);
		}
	};

	/**
	 * 更新会话（发送消息后调用）
	 */
	updateSession = (session: ChatSession) => {
		if (!globalUser.currentUser) return;
		
		const index = this._sessionList.value.findIndex(s => s.sessionId === session.sessionId);
		if (index >= 0) {
			this._sessionList.value[index] = { ...this._sessionList.value[index], ...session };
		} else {
			this._sessionList.value.push(session);
		}
		
		// 按更新时间排序
		this._sessionList.value.sort((a, b) => b.updateTime - a.updateTime);
		
		// 更新本地缓存
		SessionData.updateLocalSessionCache(globalUser.currentUser.userId, session);
	};

	private initWatchers() {
		watch(() => globalUser.currentUser, () => {
			this.loadSessionList();
		}, { deep: true, immediate: false });
	}

	constructor() {
		this.initWatchers();
	}
}

export const globalSession = SessionModel.getInstance();
