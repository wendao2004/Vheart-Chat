'use strict';
exports.main = async (event, context) => {
	// event里包含着客户端提交的参数
	console.log("event:", event);

	// 检查手机号是否已注册
	const db = uniCloud.database();
	const userCollection = db.collection('PhoneNumber_User');

	let accessToken, openId;

	if (event) {
		accessToken = event.access_token;
		openId = event.openid;
	}

	if (!accessToken || !openId) {
		return {
			code: -1,
			message: '缺少必要参数 access_token 或 openid',
			data: null
		};
	}

	try {
		const res = await uniCloud.getPhoneNumber({
			appid: '__UNI__013CB0C', // 填写你自己的appid
			provider: 'univerify',
			access_token: accessToken,
			openid: openId
		});

		console.log(res);
		const phone = res.phoneNumber;
		const user = await userCollection.where({
			phone
		}).get();

		// 检查 user.data 是否有数据
		if (user.data && user.data.length > 0) {
			console.log("手机号已存储");
		} else {
			// 插入新用户数据并处理异步操作
			await userCollection.add({
				phone,
				createdAt: new Date().getTime()
			});
			console.log("手机号存储成功");
		}
		return {
			code: 0,
			message: '获取手机号成功',
			data: res.phoneNumber
		};
	} catch (error) {
		console.error('获取手机号失败:', error);
		return {
			code: -2,
			message: '获取手机号失败',
			data: null
		};
	}
}