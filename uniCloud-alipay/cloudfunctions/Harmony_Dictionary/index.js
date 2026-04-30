/**
 * @Description:
 * 
 * @author liuzhiheng
 * 
 * @property 
 * @event 
 * 聚合api
 * 鸿蒙元服务数据接口
 * 根据汉字查询字典:http://v.juhe.cn/xhzd/query
 * 汉字部首列表:http://v.juhe.cn/xhzd/bushou
 * 汉字拼音列表:http://v.juhe.cn/xhzd/pinyin
 * 根据部首查询汉字:http://v.juhe.cn/xhzd/querybs
 * 根据拼音查询汉字:http://v.juhe.cn/xhzd/querypy
 * 根据id查询汉字完整信息:http://v.juhe.cn/xhzd/queryid
 * @createTime: 2025-07-11 09:59:28
 */

// 云函数入口文件
const axios = require('axios'); // 引入axios依赖
const cloud = uniCloud;
const db = cloud.database();
const collection = db.collection('Harmony_Dictionary');

exports.main = async (event, context) => {
	const {
		action
	} = event;

	switch (action) {
		case 'query':
			return await queryHanzi(event);
		case 'bushou':
			return await getBushouList(event);
		case 'pinyin':
			return await getPinyinList(event);
		case 'querybs':
			return await queryByBushou(event);
		case 'querypy':
			return await queryByPinyin(event);
		case 'queryid':
			return await queryById(event);
		default:
			return {
				code: -1, message: '无效的操作类型'
			};
	}
};

// 获取当前日期字符串
function getTodayDate() {
	const now = new Date();
	return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

// 根据汉字查询字典
async function queryHanzi(event) {
	const {
		word
	} = event;
	if (!word) {
		return {
			code: -1,
			message: '请提供汉字参数'
		};
	}

	const today = getTodayDate();
	const cacheKey = `query_${word}_${today}`;

	// 检查数据库缓存
	const checkData = await collection.where({
		_id: cacheKey
	}).get();
	if (checkData.data.length > 0) {
		return {
			code: 0,
			data: checkData.data[0].data
		};
	}

	// 请求第三方API
	const apiResult = await requestThirdPartyAPI('http://v.juhe.cn/xhzd/', {
		word
	});

	// 保存到数据库
	try {
		await collection.add({
			_id: cacheKey,
			data: apiResult,
			createTime: new Date()
		});
		console.log(`数据库添加成功: ${cacheKey}`);
	} catch (err) {
		console.error(`数据库添加失败: ${cacheKey}`, err);
	}

	return {
		code: 0,
		data: apiResult
	};
}

// 获取汉字部首列表
async function getBushouList(event) {
	const {
		word
	} = event;
	if (!word) {
		return {
			code: -1,
			message: '请提供汉字参数'
		};
	}
	const today = getTodayDate();
	const cacheKey = `bushou_${today}`;

	// 检查数据库缓存
	const checkData = await collection.where({
		_id: cacheKey
	}).get();
	if (checkData.data.length > 0) {
		return {
			code: 0,
			data: checkData.data[0].data
		};
	}

	// 请求第三方API
	const apiResult = await requestThirdPartyAPI('http://v.juhe.cn/xhzd/', {
		word
	});

	// 保存到数据库
	try {
		await collection.add({
			_id: cacheKey,
			data: apiResult,
			createTime: new Date()
		});
		console.log(`数据库添加成功: ${cacheKey}`);
	} catch (err) {
		console.error(`数据库添加失败: ${cacheKey}`, err);
	}

	return {
		code: 0,
		data: apiResult
	};
}

// 获取汉字拼音列表
async function getPinyinList(event) {
	const {
		word
	} = event;
	if (!word) {
		return {
			code: -1,
			message: '请提供汉字参数'
		};
	}
	const today = getTodayDate();
	const cacheKey = `pinyin_${today}`;

	// 检查数据库缓存
	const checkData = await collection.where({
		_id: cacheKey
	}).get();
	if (checkData.data.length > 0) {
		return {
			code: 0,
			data: checkData.data[0].data
		};
	}

	// 请求第三方API
	const apiResult = await requestThirdPartyAPI('http://v.juhe.cn/xhzd/', {
		word
	});

	// 保存到数据库
	try {
		await collection.add({
			_id: cacheKey,
			data: apiResult,
			createTime: new Date()
		});
		console.log(`数据库添加成功: ${cacheKey}`);
	} catch (err) {
		console.error(`数据库添加失败: ${cacheKey}`, err);
	}

	return {
		code: 0,
		data: apiResult
	};
}

// 根据部首查询汉字
async function queryByBushou(event) {
	const {
		bushou
	} = event;
	if (!bushou) {
		return {
			code: -1,
			message: '请提供部首参数'
		};
	}

	const today = getTodayDate();
	const cacheKey = `querybs_${bushou}_${today}`;

	// 检查数据库缓存
	const checkData = await collection.where({
		_id: cacheKey
	}).get();
	if (checkData.data.length > 0) {
		return {
			code: 0,
			data: checkData.data[0].data
		};
	}

	// 请求第三方API
	const apiResult = await requestThirdPartyAPI('http://v.juhe.cn/xhzd/', {
		bushou
	});

	// 保存到数据库
	try {
		await collection.add({
			_id: cacheKey,
			data: apiResult,
			createTime: new Date()
		});
		console.log(`数据库添加成功: ${cacheKey}`);
	} catch (err) {
		console.error(`数据库添加失败: ${cacheKey}`, err);
	}

	return {
		code: 0,
		data: apiResult
	};
}

// 根据拼音查询汉字
async function queryByPinyin(event) {
	const {
		pinyin
	} = event;
	if (!pinyin) {
		return {
			code: -1,
			message: '请提供拼音参数'
		};
	}

	const today = getTodayDate();
	const cacheKey = `querypy_${pinyin}_${today}`;

	// 检查数据库缓存
	const checkData = await collection.where({
		_id: cacheKey
	}).get();
	if (checkData.data.length > 0) {
		return {
			code: 0,
			data: checkData.data[0].data
		};
	}

	// 请求第三方API
	const apiResult = await requestThirdPartyAPI('http://v.juhe.cn/xhzd/', {
		pinyin
	});

	// 保存到数据库
	try {
		await collection.add({
			_id: cacheKey,
			data: apiResult,
			createTime: new Date()
		});
		console.log(`数据库添加成功: ${cacheKey}`);
	} catch (err) {
		console.error(`数据库添加失败: ${cacheKey}`, err);
	}

	return {
		code: 0,
		data: apiResult
	};
}

// 根据ID查询汉字完整信息
async function queryById(event) {
	const {
		id
	} = event;
	if (!id) {
		return {
			code: -1,
			message: '请提供ID参数'
		};
	}

	const today = getTodayDate();
	const cacheKey = `queryid_${id}_${today}`;

	// 检查数据库缓存
	const checkData = await collection.where({
		_id: cacheKey
	}).get();
	if (checkData.data.length > 0) {
		return {
			code: 0,
			data: checkData.data[0].data
		};
	}

	// 请求第三方API
	const apiResult = await requestThirdPartyAPI('http://v.juhe.cn/xhzd/queryid', {
		id
	});

	// 保存到数据库
	try {
		await collection.add({
			_id: cacheKey,
			data: apiResult,
			createTime: new Date()
		});
		console.log(`数据库添加成功: ${cacheKey}`);
	} catch (err) {
		console.error(`数据库添加失败: ${cacheKey}`, err);
	}

	return {
		code: 0,
		data: apiResult
	};
}


// 请求第三方API的函数
async function requestThirdPartyAPI(apiUrl, params = {}) {
	const apiKey = '4858154cac23aa0273d857f252f86776';
	const requestParams = {
		key: apiKey,
		dtype: 'json',
		...params
	};

	try {
		const response = await axios.get(apiUrl, {
			params: requestParams
		});

		if (response.status === 200) {
			const result = response.data;
			// 验证API返回状态码
			if (result.resultcode === '200') {
				return result;
			} else {
				console.error(`API错误: ${result.reason} (${result.error_code})`);
				throw new Error(`API请求失败: ${result.reason}`);
			}
		} else {
			console.error(`HTTP错误: 状态码 ${response.status}`);
			throw new Error(`网络请求异常，状态码: ${response.status}`);
		}
	} catch (error) {
		console.error('请求失败:', error.message);
		throw error; // 抛出错误以便上层处理
	}
}