// cloudfunctions/getDeviceData/index.js
'use strict';

const cloud = uniCloud;
// cloud.init({ env: '你的云环境ID' });
const db = cloud.database();
const deviceDataCol = db.collection('device_data');

// 云函数入口函数
exports.main = async (event, context) => {
	try {
		// 1. 解析前端传入的参数（默认查esp32_001的最新1条数据）
		const {
			deviceId = "esp32_001",
				limit = 1, // 默认查最新1条
				type = "latest" // latest：最新数据；history：历史数据
		} = event;

		let queryRes;
		// 2. 按类型查询数据
		if (type === "latest") {
			// 查询最新数据（按上传时间倒序）
			queryRes = await deviceDataCol
				.where({
					deviceId
				})
				.orderBy("uploadTime", "desc") // 倒序：最新的在前
				.limit(limit)
				.get();
		} else if (type === "history") {
			// 查询历史数据（可选：按时间范围，前端可传startTime/endTime）
			const {
				startTime,
				endTime
			} = event;
			let query = deviceDataCol.where({
				deviceId
			});
			// 若传了时间范围，添加时间筛选
			if (startTime) query = query.where({
				uploadTime: db.gte(startTime)
			});
			if (endTime) query = query.where({
				uploadTime: db.lte(endTime)
			});
			// 分页查询（默认查20条）
			queryRes = await query
				.orderBy("uploadTime", "desc")
				.limit(limit || 20)
				.get();
		}

		// 3. 返回查询结果
		return {
			code: 200,
			msg: "查询成功",
			data: queryRes.data || [], // 无数据返回空数组
			total: queryRes.data.length // 数据条数
		};
	} catch (err) {
		console.error("数据查询失败：", err);
		return {
			code: 500,
			msg: "查询失败",
			error: err.message
		};
	}
};