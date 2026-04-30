import { ref, computed } from 'vue';
import { globalUser } from './use-user-model';

export const useFavoriteModel = () => {
  // 收藏列表
  const favoriteList = ref([]);

  // 获取当前用户的收藏列表
  const getFavorites = () => {
    try {
      const currentUserId = globalUser.currentUser?.userId;
      if (!currentUserId) return [];

      const key = `chat_favorites_${currentUserId}`;
      const data = uni.getStorageSync(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('获取收藏列表失败', error);
    }
    return [];
  };

  // 保存收藏（单条消息）
  const saveFavorite = async (message, targetUserInfo) => {
    try {
      const currentUserId = globalUser.currentUser?.userId;
      if (!currentUserId) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return false;
      }

      const key = `chat_favorites_${currentUserId}`;
      let favorites = getFavorites();

      // 检查是否已收藏
      const existingIndex = favorites.findIndex(fav => fav.messageId === message._id || fav.messageId === message.id);
      if (existingIndex > -1) {
        uni.showToast({
          title: '已经收藏过了',
          icon: 'none'
        });
        return false;
      }

      // 创建收藏对象
      const favorite = {
        id: Date.now().toString(),
        messageId: message._id || message.id || Date.now().toString(),
        userId: currentUserId,
        targetUserId: message.fromUserId === currentUserId ? message.toUserId : message.fromUserId,
        targetUserInfo: targetUserInfo,
        message: message,
        favoriteTime: Date.now()
      };

      // 添加到收藏列表
      favorites.push(favorite);

      // 保存到本地存储
      uni.setStorageSync(key, JSON.stringify(favorites));
      favoriteList.value = favorites;

      uni.showToast({
        title: '收藏成功',
        icon: 'success'
      });
      return true;
    } catch (error) {
      console.error('保存收藏失败', error);
      uni.showToast({
        title: '收藏失败',
        icon: 'none'
      });
      return false;
    }
  };

  // 删除收藏
  const removeFavorite = async (favoriteId) => {
    try {
      const currentUserId = globalUser.currentUser?.userId;
      if (!currentUserId) return false;

      const key = `chat_favorites_${currentUserId}`;
      let favorites = getFavorites();

      // 过滤掉要删除的收藏
      favorites = favorites.filter(fav => fav.id !== favoriteId);

      // 保存到本地存储
      uni.setStorageSync(key, JSON.stringify(favorites));
      favoriteList.value = favorites;

      return true;
    } catch (error) {
      console.error('删除收藏失败', error);
      return false;
    }
  };

  // 检查是否已收藏
  const isFavorited = (messageId) => {
    const favorites = getFavorites();
    return favorites.some(fav => fav.messageId === messageId);
  };

  // 加载收藏列表
  const loadFavorites = () => {
    favoriteList.value = getFavorites();
  };

  return {
    favoriteList,
    getFavorites,
    saveFavorite,
    removeFavorite,
    isFavorited,
    loadFavorites
  };
};

export const favoriteModel = useFavoriteModel();
