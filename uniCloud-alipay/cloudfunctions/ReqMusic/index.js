'use strict';
exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event);
	const song = event.song;
	const n = event.n; // 使用正确的参数名n
	const apiKey = '223e7588-df6b-ea2d-78b1-0ba6a609a54fdfdee94e';
	let url = '';

	// 参数分离实现
	if (song && n) {
		// 当同时传入song和n参数时，获取指定歌曲的详细数据
		url = "https://api.yyy001.com/api/mgmuisc/?apikey=223e7588-df6b-ea2d-78b1-0ba6a609a54fdfdee94e&msg=" +
			song + "&type=json&br=1&n=" + n;
	} else if (song) {
		// 当只传入song参数时，进行歌曲搜索并返回列表
		url = "https://api.yyy001.com/api/mgmuisc/?apikey=223e7588-df6b-ea2d-78b1-0ba6a609a54fdfdee94e&msg=" +
			song + "&type=json&br=1&n=";
	} else {
		// 默认请求
		url = `https://api.yyy001.com/api/mgmusic/?apikey=${apiKey}&msg=&type=json&br=1&num=20`;
	}

	try {
		// 使用 uniCloud.httpclient 发送请求
		const res = await uniCloud.httpclient.request(url, {
			method: 'GET',
			dataType: 'json'
		});

		console.log('API返回数据:', res.data);

		console.log('API返回数据格式检查:', res.data);

		// 检查返回数据格式并适配
		let finalData = {};

		// 如果是歌曲列表数据（code=200且data是数组）
		if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
			finalData = {
				code: '200',
				data: res.data.data // 直接使用歌曲数组
			};
		}
		// 如果是获取详细数据
		else if (n && res.data && res.data.code === 200) {
			finalData = {
				code: '200',
				data: res.data,
				img: res.data.img || '',
				mp3: res.data.mp3 || ''
			};
		}
		// 其他情况直接返回原始数据
		else {
			finalData = {
				code: res.data && res.data.code ? res.data.code.toString() : '200',
				data: res.data
			};
		}

		return {
			data: finalData
		};
	} catch (error) {
		console.error('请求失败:', error);
		// 错误处理，返回详细的错误信息
		return {
			data: {
				code: '204',
				message: `数据解析失败: ${error.message || '未知错误'}`,
				data: null,
				errorType: error.name || '请求异常',
				requestUrl: url,
				requestParams: {
					song,
					n
				}
			}
		};
	}
};