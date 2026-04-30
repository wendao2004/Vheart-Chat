exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event);
	const song = event.song;
	// const song = "梁博";
	const n = event.n; // 使用正确的参数名n
	const page = event.page || 1; // 添加page参数，默认为1
	const pageSize = event.pageSize || 20; // 添加pageSize参数，默认为20
	const apiKey = 'Dragon0B2723402643FF354B060F6B0DD7B54D';
	let url = '';

	try {
		// 参数分离实现
		if (song && n) {
			// 当同时传入song和n参数时，获取指定歌曲的详细数据
			url = "https://sdkapi.hhlqilongzhu.cn/api/dgMusic_wyy/?key=" + apiKey + "&gm=" + song + "&n=" + n;
		} else if (song) {
			// 当只传入song参数时，进行歌曲搜索并返回列表
			url = "https://sdkapi.hhlqilongzhu.cn/api/dgMusic_wyy/?key=" + apiKey + "&gm=" + song;
		} else {
			// 默认请求
			url = "https://sdkapi.hhlqilongzhu.cn/api/dgMusic_wyy/?key=" + apiKey + "&gm=";
		}

		// 将dataType设置为text，因为API返回的是文本格式
		const res = await uniCloud.httpclient.request(url, {
			method: 'GET',
			dataType: 'text'
		});

		console.log('API返回原始数据:', res.data);

		// 检查返回数据格式并适配
		let finalData = {};

		try {
			// 检查返回内容是否为空
			if (!res.data || res.data.trim() === '') {
				throw new Error('API返回空数据');
			}

			// 根据参数判断是返回歌曲列表还是详细歌曲信息
			if (song && n) {
				// 详细歌曲信息处理
				finalData = parseSongDetail(res.data);
			} else {
				// 歌曲列表处理
				finalData = parseSongList(res.data, page, pageSize);
			}

		} catch (dataError) {
			console.error('数据处理失败:', dataError);
			// 数据处理失败时返回错误信息
			finalData = {
				code: '204',
				message: `数据处理失败: ${dataError.message || '未知错误'}`,
				data: null,
				errorDetail: res.data.substring(0, 200) // 截取部分原始数据用于调试
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
					n,
					page,
					pageSize
				}
			}
		};
	}
};

// 解析详细歌曲信息
function parseSongDetail(rawData) {
	const songData = {};
	const lines = rawData.split('\n');

	// 解析每行数据
	lines.forEach(line => {
		line = line.trim();
		// 移除可能的特殊字符前缀
		if (line.startsWith('±')) {
			line = line.substring(1);
		}
		if (line.endsWith('±')) {
			line = line.substring(0, line.length - 1);
		}

		if (line.startsWith('img=')) {
			songData.img = line.substring(4);
			songData.cover = line.substring(4); // 兼容前端使用的cover字段
		} else if (line.startsWith('歌名：')) {
			songData.title = line.substring(3);
		} else if (line.startsWith('歌手：')) {
			songData.singer = line.substring(3);
		} else if (line.startsWith('播放链接：')) {
			songData.mp3 = line.substring(5);
			songData.music_url = line.substring(5); // 兼容前端使用的music_url字段
		} else if (line.startsWith('歌曲详情页：')) {
			songData.link = line.substring(6);
		} else if (line.startsWith('歌曲详情：')) {
			songData.link = line.substring(5);
		}
	});

	// 确保必要的字段存在
	if (songData.title && songData.singer && songData.mp3) {
		songData.code = '200';
	} else {
		songData.code = '204';
		songData.message = '歌曲数据不完整';
	}

	return songData;
}

// 解析歌曲列表
function parseSongList(rawData, page = 1, pageSize = 20) {
	// 解析歌曲列表数据
	const lines = rawData.trim().split('\n');
	const songList = [];

	lines.forEach((line, index) => {
		// 跳过标题行
		if (index === 0) return;

		const trimmedLine = line.trim();
		if (trimmedLine) {
			try {
				// 尝试解析格式：序号、歌名 -- 歌手
				const songMatch = trimmedLine.match(/^(\d+)[,、](.+?)\s+--\s+(.+)$/);
				if (songMatch) {
					songList.push({
						n: parseInt(songMatch[1]), // 使用n作为序号字段，匹配前端期望，并确保是数字
						title: songMatch[2].trim(),
						singer: songMatch[3].trim(),
						song: songMatch[2].trim(), // 兼容字段
						name: songMatch[2].trim(), // 兼容字段
						author: songMatch[3].trim() // 兼容字段
						// 其他字段会在前端根据需要添加
					});
				} else {
					// 尝试解析格式：序号、歌曲信息
					const altMatch = trimmedLine.match(/^(\d+)[,、](.+)$/);
					if (altMatch) {
						songList.push({
							n: parseInt(altMatch[1]), // 使用n作为序号字段，匹配前端期望，并确保是数字
							title: altMatch[2].trim(),
							singer: '未知',
							song: altMatch[2].trim(), // 兼容字段
							name: altMatch[2].trim() // 兼容字段
						});
					}
				}
			} catch (e) {
				console.error('解析行失败:', trimmedLine, e);
			}
		}
	});

	// 分页处理
	const total = songList.length;
	const start = (page - 1) * pageSize;
	const end = start + pageSize;
	const pagedData = songList.slice(start, end);

	// 检查是否包含歌曲数据
	if (songList.length > 0) {
		return {
			code: '200',
			message: 'success',
			data: pagedData,
			total: total,
			page: page,
			pageSize: pageSize
		};
	} else {
		// 如果没有匹配到歌曲，返回空结果但状态码为200
		return {
			code: '200',
			message: '未找到相关歌曲',
			data: [],
			total: 0,
			page: page,
			pageSize: pageSize
		};
	}
}