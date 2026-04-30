// cloudfunctions/sync-data/index.js
const db = uniCloud.database()
exports.main = async (event, context) => {
	const {
		type,
		data
	} = event
	const uid = context.APP_PUID

	if (type === 'upload') {
		return await db.collection('RelicsDream-Userdata').add({
			...data,
			uid,
			createTime: Date.now()
		})
	}

	if (type === 'download') {
		return await db.collection('RelicsDream-Userdata')
			.where({
				uid
			})
			.orderBy('createTime', 'desc')
			.get()
	}

	if (type === 'update') {
		return await db.collection('RelicsDream-Userdata')
			.doc(data._id)
			.update({
				...data,
				updateTime: Date.now()
			})
	}
}