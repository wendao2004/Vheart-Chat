'use strict';
exports.main = async (event, context) => {
  try {
    // 增强参数提取日志，明确来源
    console.log('事件对象结构:', { hasData: !!event.data, dataKeys: event.data ? Object.keys(event.data) : [], eventKeys: Object.keys(event) });
    const data = event.data || event; // 优先使用event.data
    const { action, username, password, saveData } = data;
    console.log('参数提取路径:', event.data ? 'event.data' : 'event', '-> action=', action);

    // 添加详细调试日志
    console.log('完整事件对象:', JSON.stringify(event, null, 2));
    console.log('使用的数据对象:', JSON.stringify(data, null, 2));
    console.log('提取到的操作类型:', action);

    // 验证操作类型
    const validActions = ['register', 'login', 'save'];
    if (!action || !validActions.includes(action)) {
      console.error('无效操作类型:', action, '，允许的操作类型:', validActions);
      return { 
        code: -2, 
        msg: `无效的操作类型: '${action}' (类型: ${typeof action})，允许的操作类型: ${validActions.join(', ')}`,
        receivedAction: action,
        actionType: typeof action,
        validActions: validActions,
        receivedData: data // 包含接收到的完整数据用于调试
      };
    }
    const bcrypt = require('bcryptjs');
    const db = uniCloud.database();
    const userCollection = db.collection('TextDungeon_UserData');
    const user = await userCollection.where({ username }).get();

    if (action === 'register') {
      // 注册逻辑
      if (user.data.length > 0) {
        return { code: 1, msg: '该用户已注册' };
      }

      await userCollection.add({
        username,
        password: bcrypt.hashSync(password, 10), // 使用bcrypt加密密码
        createdAt: new Date().getTime()
      });

      return { code: 0, msg: '注册成功' };
    } else if (action === 'save') {
      // 存档同步逻辑
      if (user.data.length === 0) {
        return { code: 2, msg: '用户不存在' };
      }

      // 从event或event.data中获取saveData
      const saveData = event.saveData || (event.data ? event.data.saveData : null);
      if (!saveData) {
        return { code: 3, msg: '缺少存档数据' };
      }

      await userCollection.doc(user.data[0]._id).update({
        saveData,
        updateTime: new Date()
      });

      return { code: 0, msg: '存档同步成功' };
    } else if (action === 'login') {
      // 登录逻辑
      if (user.data.length === 0) {
        return { code: 2, msg: '用户名或密码错误' };
      }

      const storedUser = user.data[0];
      const passwordMatch = bcrypt.compareSync(password, storedUser.password);
      if (!passwordMatch) {
        return { code: 2, msg: '用户名或密码错误' };
      }

      return { code: 0, msg: '登录成功', userInfo: { username: storedUser.username } };
    } else {
      return { code: -2, msg: '无效的操作类型' };
    }
  } catch (error) {
    // 统一异常处理，确保返回对象类型
    return { code: -1, msg: '服务器错误', error: error.message };
  }
};