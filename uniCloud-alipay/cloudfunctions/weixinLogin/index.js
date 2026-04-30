'use strict';
exports.main = async (event, context) => {
	// event为客户端上传的参数
	console.log('event : ', event)
	const {
		nickName,
		avatarUrl,
		city,
		id
	} = event

	const db = uniCloud.database()
	const collection = db.collection('AroundRepair-weixinuser')

	try {
		// 查询数据库
		const {
			data
		} = await collection.where({
			_id: id
		}).get()

		// 处理查询结果
		if (data.length > 0) {
			// 用户已存在，返回用户信息（取第一条匹配记录）
			return {
				code: 200,
				msg: '登录成功',
				nickName: nickName,
				avatarUrl: avatarUrl,
				city: city,
				id: id
			}
		} else {
			// 用户不存在，插入新用户数据
			await collection.add({
				nickName: nickName,
				avatarUrl: avatarUrl,
				city: city,
				_id: id,
				createdAt: new Date().getTime()
			});
			// 返回用户名（取第一条匹配记录）
			return {
				code: 200,
				msg: '登录成功',
				nickName: nickName,
				avatarUrl: avatarUrl,
				city: city,
				id: id
			}
		}

	} catch (err) {
		// 打印具体错误信息，方便调试
		console.error('数据库操作出错：', err)
		return {
			code: 500,
			msg: '服务器错误'
		}
	}
};