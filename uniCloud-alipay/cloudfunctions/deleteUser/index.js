// 云函数 deleteUser (需权限校验)
exports.main = async (event, context) => {
	const uid = context.uid // 从上下文中获取当前用户ID（需uni-id支持）
	const phone = event.phone // 接收前端传入的手机号

	// 1. 校验手机号是否属于当前用户
	const db = uniCloud.database()
	const userCol = db.collection('AroundRepair-user')

	// 查询当前用户信息
	const {
		data: currentUser
	} = await userCol.doc(uid).get()
	if (!currentUser) {
		return {
			code: 401,
			message: '用户不存在'
		}
	}

	// 2. 验证手机号匹配
	if (currentUser.phone !== phone) {
		return {
			code: 403,
			message: '无权操作其他用户'
		}
	}

	// 3. 执行删除操作
	try {
		await userCol.doc(uid).remove()
		return {
			code: 200,
			message: '注销成功'
		}
	} catch (e) {
		return {
			code: 500,
			message: '删除失败',
			error: e
		}
	}
}