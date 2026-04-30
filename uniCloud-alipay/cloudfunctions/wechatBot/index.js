'use strict';
const crypto = require('crypto');
const { parseStringPromise } = require('xml2js');

// 微信配置信息
const config = {
  appId: 'J7V8N22LwD4Blvr',
  token: 'Aa5qHaBNaMecormp5K5wqGGjKnEsbi',
  encodingAESKey: 'zqbQ7hHotYaxuv1Ha9qnJfy4UBkn9tnjBQf6ACFMzxd',
};

// 验证微信服务器的签名
function verifySignature(signature, timestamp, nonce) {
  const { token } = config;
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const sha1 = crypto.createHash('sha1');
  sha1.update(str);
  return sha1.digest('hex') === signature;
}

// 处理微信消息
async function handleMessage(xmlData) {
  const result = await parseStringPromise(xmlData, { explicitArray: false });
  const message = result.xml;

  // 返回一个简单的文本消息
  const response = `
    <xml>
      <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
      <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
      <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[你好，欢迎使用微信机器人！]]></Content>
    </xml>
  `;

  return response;
}

// 云函数入口
exports.main = async (event, context) => {
  const { signature, timestamp, nonce, echostr } = event.queryStringParameters || {};

  // 验证服务器地址的有效性
  if (echostr) {
    if (verifySignature(signature, timestamp, nonce)) {
      return {
        statusCode: 200,
        body: echostr,
      };
    } else {
      return {
        statusCode: 403,
        body: '验证失败',
      };
    }
  }

  // 处理微信消息
  if (event.body) {
    const response = await handleMessage(event.body);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/xml' },
      body: response,
    };
  }

  return {
    statusCode: 400,
    body: '无效请求',
  };
};