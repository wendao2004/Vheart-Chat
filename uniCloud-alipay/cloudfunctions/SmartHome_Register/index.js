'use strict';
exports.main = async (event, context) => {
	const {
		username,
		phone,
		password
	} = event;

	// 检查手机号是否已注册
	const db = uniCloud.database();
	const userCollection = db.collection('SmartHome-user');
	const user = await userCollection.where({
		phone
	}).get();

	if (user.data.length > 0) {
		return {
			code: 1,
			msg: '该手机号已注册'
		};
	}

	// 插入新用户数据
	await userCollection.add({
		username,
		phone,
		password, // 实际应用中应对密码进行加密存储
		createdAt: new Date().getTime()
	});

	return {
		code: 0,
		msg: '注册成功'
	};
};