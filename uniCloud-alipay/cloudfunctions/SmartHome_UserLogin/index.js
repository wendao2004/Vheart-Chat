// cloudfunctions/userLogin/index.js
exports.main = async (event, context) => {
	const {
		phone,
		password
	} = event

	// 参数校验
	if (!phone || !password) {
		return {
			code: 400,
			msg: '参数不完整'
		}
	}

	const db = uniCloud.database()
	const collection = db.collection('SmartHome-user')

	try {
		// 查询数据库
		const {
			data
		} = await collection.where({
			phone: phone,
			password: password
		}).get()

		// 处理查询结果
		if (data.length === 0) {
			return {
				code: 401,
				msg: '手机号或密码错误'
			}
		}

		// 返回用户名（取第一条匹配记录）
		return {
			code: 200,
			msg: '登录成功',
			username: data[0].username,
			data: data[0]
		}

	} catch (err) {
		console.error(err)
		return {
			code: 500,
			msg: '服务器错误'
		}
	}
}