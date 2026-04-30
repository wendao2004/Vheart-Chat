// 云函数入口文件
const cloud = uniCloud;
const db = cloud.database();
const collection = db.collection('Web_zhihuNews');

exports.main = async (event, context) => {
	// API密钥
	// const apiKey = '';
	const apiUrl = 'https://v.api.aa1.cn/api/zhihu-news/index.php?aa1=xiarou';

	// 获取当前日期
	const now = new Date();
	const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

	// 检查数据库中是否已有当天数据
	const checkData = await collection.where({
		_id: today
	}).get();

	if (checkData.data.length > 0) {
		// 如果存在，直接返回数据库中的数据
		return checkData.data[0];
	} else {
		// 如果不存在，请求第三方API
		const apiResult = await requestThirdPartyAPI(apiUrl);
		// 保存API返回的数据到数据库
		await collection.add({
			_id: today, // 添加日期字段
			data: apiResult,
			success: function(res) {
				console.log('数据库添加成功', res);
			},
			fail: function(err) {
				console.error('数据库添加失败', err);
			}
		});
		return apiResult;
	}
};

// 请求第三方API的函数
async function requestThirdPartyAPI(apiUrl) {
	// 发起请求
	const response = await uniCloud.httpclient.request(apiUrl, {
		method: 'GET',
		dataType: 'json'
	});
	return response.data;
}