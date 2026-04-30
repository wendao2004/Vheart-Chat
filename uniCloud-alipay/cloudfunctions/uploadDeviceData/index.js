'use strict';
// 阿里云HTTP触发专用：先解析请求体，再取参数
exports.main = async (event, context) => {
  try {
    // 1. 解析ESP32上传的JSON请求体（关键：HTTP触发的参数在event.body里）
    const requestBody = JSON.parse(event.body); // 把body字符串转成JSON对象
    // 从解析后的body中取参数
    const {
      deviceId,
      temperature,
      humidity
    } = requestBody;

    // 2. 初始化数据库
    const db = uniCloud.database();
    const deviceDataCol = db.collection('device_data');

    // 3. 验证参数存在（避免undefined）
    if (!deviceId || temperature === undefined || humidity === undefined) {
      return {
        code: 1,
        msg: '参数缺失：deviceId/temperature/humidity不能为空'
      };
    }

    // 4. 写入数据库（转数字后存储）
    await deviceDataCol.add({
      deviceId,
      temperature: Number(temperature), // 转数字（确保是数值类型）
      humidity: Number(humidity),
      uploadTime: new Date().getTime(),
      uploadType: "自动上传"
    });

    return {
      code: 0,
      msg: '数据上传成功，参数正常'
    };
  } catch (err) {
    console.error("数据写入失败：", err);
    return {
      code: 1,
      msg: '失败原因：' + err.message
    };
  }
};