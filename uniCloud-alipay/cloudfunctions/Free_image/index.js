// 云函数入口文件 index.js
exports.main = async (event, context) => {
	const db = uniCloud.database();
	const collection = db.collection('Free_image');
	const API_URL = 'https://api.lolimi.cn/API/dmtx/pc.php';
	for (let i = 0; i < 10; i++) {
		try {
			// 使用 uniCloud.httpclient 发送请求
			const res = await uniCloud.httpclient.request(API_URL, {
				method: 'GET',
			});
			// console.log(res.status)
			const item = res.status
			// 检查响应状态（注意阿里云返回结构差异）
			if (item != 302) {
				throw new Error('API 请求失败: ' + JSON.stringify(res.status));
			} else {
				// 构造存储数据
				const imageData = {
					url: "https://api.lolimi.cn/API/dmtx/" + res.headers.location,
					createDate: Date.now(),
					rawData: res.res // 保留原始数据
				};

				// 存入数据库
				await collection.add(imageData);

				console.log(`第${i + 1}条数据存储成功`, imageData);
			}
		} catch (error) {
			console.error(`第${i + 1}次请求失败:`, error);
		}

		// 间隔 1 秒防止高频请求
		if (i < 9) await new Promise(resolve => setTimeout(resolve, 1000));
	}

	return {
		code: 200,
		msg: '任务执行完成'
	};


	// 根据事件类型执行不同逻辑
	// if (event.type === 'timer') {
	// 	return await reqApi();
	// }

	// const getresult = await getLatest10Data();
	// return getresult;
	// // 调用 reqApi 函数并返回结果
	// const result = await reqApi();
	// return result;

};