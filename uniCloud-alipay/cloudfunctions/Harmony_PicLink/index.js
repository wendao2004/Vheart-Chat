exports.main = async (event, context) => {
	const db = uniCloud.database();
	const collection = db.collection('PixelFlow-ImageData');

	 async function getLatest10Data() {
		try {
			const res = await collection.orderBy('createDate', 'desc').limit(20).get();
			return {
				code: 200,
				msg: '获取成功',
				data: res.data
			};
		} catch (error) {
			console.error('获取最新 10 条数据失败:', error);
			return {
				code: 500,
				msg: '获取失败',
				error: error.message
			};
		}
	}
	const getresult = await getLatest10Data();
	return getresult;
};