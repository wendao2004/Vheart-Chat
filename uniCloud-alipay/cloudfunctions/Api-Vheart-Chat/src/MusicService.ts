/**
 * @Description:
 * 音乐服务
 * @author liuzhiheng
 * @createTime 2026-03-20 13:41:27
 * @Copyright by 文刀
 */


declare var uniCloud : any;
import BaseService from "./BaseService";
import { IApiResult, IMusic, IPageParams } from "./interface";
// const url = "https://api.yaohud.cn/api/music/migu?apikey=223e7588-df6b-ea2d-78b1-0ba6a609a54fdfdee94e&msg=" +
// 	searchMsg + "&type=json&br=1&n=";


//音乐api封装
export class MusicService extends BaseService {
	// 构造函数
	constructor() {
		super();
	}
	async getMiguMusicList(params : IPageParams) : Promise<IApiResult<IMusic[]>> {
		const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
		const url = "https://api.yaohud.cn/api/music/migu?key=veQAvBgr8cVs43ly2Ee&msg=" +
			searchMsg + "&n=";
		try {
			const res = await uniCloud.httpclient.request(url, {
				method: 'GET',
				dataType: 'json',
			});
			console.log('API返回数据:', res.data);
			console.log('API返回数据格式检查:', res.data);
			if (!res?.data) {
				return this.fail('API返回数据为空');
			}
			const { code, data } = res.data;
			if (code === 200 && data && Array.isArray(data.songs)) {
				return this.success(data.songs);
			}
			return this.fail('歌曲列表数据格式错误');
		} catch (error) {
			console.error('获取歌曲列表失败:', error);
			return this.fail('获取歌曲列表失败');
		}
	}

	async getMiguMusic(params : IMusic) : Promise<IApiResult<IMusic[]>> {
		console.log('getMiguMusic params:', params);
		const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
		if (!searchMsg) {
			console.log('搜索关键词为空');
			return this.fail('搜索关键词不能为空');
		}
		
		// 构建API请求URL，包含n参数
		const url = "https://api.yaohud.cn/api/music/migu?key=veQAvBgr8cVs43ly2Ee&msg=" +
			searchMsg + "&n=" + (params.n || 0);
		console.log('API请求URL:', url);
		try {
			const res = await uniCloud.httpclient.request(url, {
				method: 'GET',
				dataType: 'json',
			});
			console.log('API返回数据:', res);
			if (!res?.data) {
				console.log('API返回数据为空');
				return this.fail('API返回数据为空');
			}
			console.log('API返回数据data:', res.data);
			
			// 处理嵌套的数据结构
			let apiData = res.data;
			console.log('原始API返回数据:', apiData);
			
			// 检查是否有嵌套的data对象
			if (apiData.data && typeof apiData.data === 'object') {
				apiData = apiData.data;
				console.log('处理后的API数据:', apiData);
			}
			
			// 检查是否是单曲详情（当传递n参数时）
			if (apiData.code === 200 && apiData.title && apiData.singer) {
				console.log('API返回单曲详情:', apiData);
				const result = this.success([apiData]);
				console.log('返回结果:', result);
				return result;
			}
			// 检查是否是包含data字段的单曲详情
			else if (apiData.code === 200 && apiData.data && typeof apiData.data === 'object' && apiData.data.title && apiData.data.singer) {
				console.log('API返回嵌套的单曲详情:', apiData.data);
				const result = this.success([apiData.data]);
				console.log('返回结果:', result);
				return result;
			}
			// 检查是否是歌曲列表（当不传递n参数时）
			else if (apiData.code === 200 && apiData.data && Array.isArray(apiData.data.songs)) {
				console.log('API返回songs:', apiData.data.songs);
				
				let targetSong;
				// 如果提供了n参数，根据n值获取对应的歌曲
				if (params.n && params.n > 0 && params.n <= apiData.data.songs.length) {
					targetSong = apiData.data.songs[params.n - 1]; // 因为数组索引从0开始
					console.log('根据n值获取歌曲:', targetSong);
				} else {
					// 否则找到匹配的歌曲（优先第一个）
					targetSong = apiData.data.songs.find(song => 
						song.title === params.title || 
						song.singer === params.singer
					) || apiData.data.songs[0];
					console.log('匹配的歌曲:', targetSong);
				}
				
				const result = this.success(targetSong ? [targetSong] : []);
				console.log('返回结果:', result);
				return result;
			}
			console.log('歌曲数据格式错误');
			return this.fail('歌曲数据格式错误');
		} catch (error) {
			console.error('获取歌曲失败:', error);
			const result = this.fail('API请求失败');
			console.log('返回结果:', result);
			return result;
		}
	}

	async getFreeMusic(params : IMusic) : Promise<IApiResult<IMusic[]>> {
		console.log(params);
		if (!params.title) {
			const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
			const url = "" +
				searchMsg + "&type=json&br=1&n=";
			try {
				const res = await uniCloud.httpclient.request(url, {
					method: 'GET',
					dataType: 'json',
				});
				console.log('请求成功', res);
				return this.success(res.data.data);
			} catch (error) {
				return this.fail('API请求失败');
			}
		}
	}

	async getAppleMusicList(params : IPageParams) : Promise<IApiResult<IMusic[]>> {
		const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
		// 构建API请求URL，只有当n参数大于0时才添加
		let url = "https://api.yaohud.cn/api/music/apple?key=veQAvBgr8cVs43ly2Ee&msg=" +
			searchMsg + "&g=" + (params.pageSize || 12);
		if (params.n && params.n > 0) {
			url += "&n=" + params.n;
		}
		console.log('API请求URL:', url);
		try {
			const res = await uniCloud.httpclient.request(url, {
				method: 'GET',
				dataType: 'json',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset:utf-8;'
				}
			});
			console.log('API返回数据:', res.data);
			if (!res?.data) {
				return this.fail('API返回数据为空');
			}
			// 处理嵌套的数据结构
			let apiData = res.data;
			const { code, data, msg } = apiData;
			
			// 检查是否有嵌套的data对象
			let songsData = apiData.data;
			if (songsData && typeof songsData === 'object') {
				console.log('处理后的API数据:', songsData);
			}
			
			// 检查是否是单曲详情（当传递n参数时）
			if (code === 200 && data && data.trackName && data.artistName) {
				console.log('API返回苹果音乐单曲详情:', data);
				// 转换苹果音乐API返回的字段格式
				const songData = {
					title: data.trackName,
					singer: data.artistName,
					music_url: data.url,
					cover: data.cover,
					album: data.collectionName,
					link: data.trackViewUrl
				};
				return this.success([songData]);
			}
			
			// 检查是否是歌曲列表
			if (code === 200 && songsData && Array.isArray(songsData.songs)) {
				// 如果提供了n参数，根据n值获取对应的歌曲
				if (params.n && params.n > 0 && params.n <= songsData.songs.length) {
					const targetSong = songsData.songs[params.n - 1]; // 因为数组索引从0开始
					console.log('根据n值获取歌曲:', targetSong);
					return this.success([targetSong]);
				}
				return this.success(songsData.songs);
			}
			
			// 处理API返回的错误
			if (code === 404) {
				console.log('API返回404错误:', msg);
				return this.fail(msg || '搜索结果为空');
			}
			
			// 处理其他成功情况
			if (code === 200) {
				console.log('API返回成功但数据格式不符合预期:', data);
				return this.fail('歌曲数据格式错误');
			}
			
			return this.fail('API返回错误');
			
		} catch (error) {
			console.error('获取歌曲列表失败:', error);
			return this.fail('获取歌曲列表失败');
		}
	}

	async getAppleMusic(params : IMusic) : Promise<IApiResult<IMusic[]>> {
		console.log('getAppleMusic params:', params);
		const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
		if (!searchMsg) {
			console.log('搜索关键词为空');
			return this.fail('搜索关键词不能为空');
		}
		
		// 构建API请求URL，只有当n参数大于0时才添加
		let url = "https://api.yaohud.cn/api/music/apple?key=veQAvBgr8cVs43ly2Ee&msg=" +
			searchMsg + "&g=12";
		if (params.n && params.n > 0) {
			url += "&n=" + params.n;
		}
		console.log('API请求URL:', url);
		try {
			const res = await uniCloud.httpclient.request(url, {
				method: 'GET',
				dataType: 'json',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset:utf-8;'
				}
			});
			console.log('API返回数据:', res);
			if (!res?.data) {
				console.log('API返回数据为空');
				return this.fail('API返回数据为空');
			}
			console.log('API返回数据data:', res.data);
			
			// 处理嵌套的数据结构
			let apiData = res.data;
			console.log('原始API返回数据:', apiData);
			const { code, data, msg } = apiData;
			
			// 检查是否有嵌套的data对象
			let songData = apiData.data;
			if (songData && typeof songData === 'object') {
				console.log('处理后的API数据:', songData);
			}
			
			// 检查是否是单曲详情（当传递n参数时）
			console.log('检查单曲详情条件 1:', code === 200, !!songData, !!songData?.trackName, !!songData?.artistName);
			if (code === 200 && songData && songData.trackName && songData.artistName) {
				console.log('API返回苹果音乐单曲详情:', songData);
				// 转换苹果音乐API返回的字段格式
				const formattedSongData = {
					title: songData.trackName,
					singer: songData.artistName,
					music_url: songData.url,
					cover: songData.cover,
					album: songData.collectionName,
					link: songData.trackViewUrl
				};
				const result = this.success([formattedSongData]);
				console.log('返回结果:', result);
				return result;
			}
			// 检查是否是包含data字段的单曲详情
			console.log('检查单曲详情条件 2:', code === 200, !!apiData.trackName, !!apiData.artistName);
			if (code === 200 && apiData.trackName && apiData.artistName) {
				console.log('API返回嵌套的苹果音乐单曲详情:', apiData);
				// 转换苹果音乐API返回的字段格式
				const formattedSongData = {
					title: apiData.trackName,
					singer: apiData.artistName,
					music_url: apiData.url,
					cover: apiData.cover,
					album: apiData.collectionName,
					link: apiData.trackViewUrl
				};
				const result = this.success([formattedSongData]);
				console.log('返回结果:', result);
				return result;
			}
			// 检查是否是单曲详情（当传递n参数时）- 兼容旧格式
			console.log('检查单曲详情条件 3:', code === 200, !!apiData.title, !!apiData.singer);
			if (code === 200 && apiData.title && apiData.singer) {
				console.log('API返回单曲详情:', apiData);
				const result = this.success([apiData]);
				console.log('返回结果:', result);
				return result;
			}
			// 检查是否是包含data字段的单曲详情 - 兼容旧格式
			console.log('检查单曲详情条件 4:', code === 200, !!songData, typeof songData === 'object', !!songData?.title, !!songData?.singer);
			if (code === 200 && songData && typeof songData === 'object' && songData.title && songData.singer) {
				console.log('API返回嵌套的单曲详情:', songData);
				const result = this.success([songData]);
				console.log('返回结果:', result);
				return result;
			}
			// 检查是否是歌曲列表（当不传递n参数时）
			console.log('检查歌曲列表条件:', code === 200, !!songData, Array.isArray(songData?.songs));
			if (code === 200 && songData && Array.isArray(songData.songs)) {
				console.log('API返回songs:', songData.songs);
				
				let targetSong;
				// 如果提供了n参数，根据n值获取对应的歌曲
				if (params.n && params.n > 0 && params.n <= songData.songs.length) {
					targetSong = songData.songs[params.n - 1]; // 因为数组索引从0开始
					console.log('根据n值获取歌曲:', targetSong);
				} else {
					// 否则找到匹配的歌曲（优先第一个）
					targetSong = songData.songs.find(song => 
						song.title === params.title || 
						song.singer === params.singer
					) || songData.songs[0];
					console.log('匹配的歌曲:', targetSong);
				}
				
				const result = this.success(targetSong ? [targetSong] : []);
				console.log('返回结果:', result);
				return result;
			}
			// 处理其他成功情况
			else if (code === 200) {
				console.log('API返回成功但数据格式不符合预期:', apiData);
				return this.fail('歌曲数据格式错误');
			}
			// 处理API返回的错误
			else if (code) {
				console.log('API返回错误:', apiData.msg);
				return this.fail(apiData.msg || 'API返回错误');
			}
			console.log('歌曲数据格式错误');
			return this.fail('歌曲数据格式错误');
		} catch (error) {
			console.error('获取歌曲失败:', error);
			const result = this.fail('API请求失败');
			console.log('返回结果:', result);
			return result;
		}
	}

	async getQQMusicList(params : IPageParams) : Promise<IApiResult<IMusic[]>> {
		const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
		// 构建API请求URL，只有当n参数大于0时才添加
		let url = "https://api.yaohud.cn/api/music/qq?key=veQAvBgr8cVs43ly2Ee&msg=" +
			searchMsg + "&g=" + (params.pageSize || 10);
		if (params.n && params.n > 0) {
			url += "&n=" + params.n;
			// 不传size参数，使用默认m4a试听音质（不需要cookie）
		}
		console.log('QQ音乐API请求URL:', url);
		try {
			const res = await uniCloud.httpclient.request(url, {
				method: 'GET',
				dataType: 'json',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset:utf-8;'
				}
			});
			console.log('QQ音乐API返回数据:', res.data);
			if (!res?.data) {
				return this.fail('API返回数据为空');
			}
			
			// 直接返回原始数据，由前端处理格式
			return this.success(res.data);
			
		} catch (error) {
			console.error('获取QQ音乐歌曲列表失败:', error);
			return this.fail('获取歌曲列表失败');
		}
	}

	async getQQMusic(params : IMusic) : Promise<IApiResult<IMusic[]>> {
		console.log('getQQMusic params:', params);
		const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
		if (!searchMsg) {
			console.log('搜索关键词为空');
			return this.fail('搜索关键词不能为空');
		}
		
		// 构建API请求URL，只有当n参数大于0时才添加
		let url = "https://api.yaohud.cn/api/music/qq?key=veQAvBgr8cVs43ly2Ee&msg=" +
			searchMsg + "&g=10";
		if (params.n && params.n > 0) {
			url += "&n=" + params.n;
			// 不传size参数，使用默认m4a试听音质（不需要cookie）
		}
		console.log('QQ音乐API请求URL:', url);
		try {
			const res = await uniCloud.httpclient.request(url, {
				method: 'GET',
				dataType: 'json',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset:utf-8;'
				}
			});
			console.log('QQ音乐API返回数据:', res);
			if (!res?.data) {
				console.log('API返回数据为空');
				return this.fail('API返回数据为空');
			}
			
			// 直接返回原始数据，由前端处理格式
			return this.success(res.data);
			
		} catch (error) {
			console.error('获取QQ音乐歌曲失败:', error);
			const result = this.fail('API请求失败');
			console.log('返回结果:', result);
			return result;
		}
	}

	// 酷我音乐API
	async getKuwoMusicList(params : IPageParams) : Promise<IApiResult<IMusic[]>> {
		const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
		// 构建API请求URL，只有当n参数大于0时才添加
		let url = "https://api.yaohud.cn/api/music/kuwo?key=veQAvBgr8cVs43ly2Ee&msg=" +
			searchMsg + "&g=" + (params.pageSize || 13);
		if (params.n && params.n > 0) {
			url += "&n=" + params.n;
		}
		console.log('酷我音乐API请求URL:', url);
		try {
			const res = await uniCloud.httpclient.request(url, {
				method: 'GET',
				dataType: 'json',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset:utf-8;'
				}
			});
			console.log('酷我音乐API返回数据:', res.data);
			if (!res?.data) {
				return this.fail('API返回数据为空');
			}
			
			// 直接返回原始数据，由前端处理格式
			return this.success(res.data);
			
		} catch (error) {
			console.error('获取酷我音乐歌曲列表失败:', error);
			return this.fail('获取歌曲列表失败');
		}
	}

	async getKuwoMusic(params : IMusic) : Promise<IApiResult<IMusic[]>> {
		console.log('getKuwoMusic params:', params);
		const searchMsg = `${params.singer || ""} ${params.title || ""}`.trim();
		if (!searchMsg) {
			console.log('搜索关键词为空');
			return this.fail('搜索关键词不能为空');
		}
		
		// 构建API请求URL，只有当n参数大于0时才添加
		let url = "https://api.yaohud.cn/api/music/kuwo?key=veQAvBgr8cVs43ly2Ee&msg=" +
			searchMsg + "&g=13";
		if (params.n && params.n > 0) {
			url += "&n=" + params.n;
		}
		console.log('酷我音乐API请求URL:', url);
		try {
			const res = await uniCloud.httpclient.request(url, {
				method: 'GET',
				dataType: 'json',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset:utf-8;'
				}
			});
			console.log('酷我音乐API返回数据:', res);
			if (!res?.data) {
				console.log('API返回数据为空');
				return this.fail('API返回数据为空');
			}
			
			// 直接返回原始数据，由前端处理格式
			return this.success(res.data);
			
		} catch (error) {
			console.error('获取酷我音乐歌曲失败:', error);
			const result = this.fail('API请求失败');
			console.log('返回结果:', result);
			return result;
		}
	}

	// 歌词API
	async getLyrics(params : { mid: string, type: string }) : Promise<IApiResult<any>> {
		const { mid, type } = params;
		if (!mid || !type) {
			return this.fail('歌曲ID和平台类型不能为空');
		}
		
		// 构建API请求URL
		const url = `https://api.yaohud.cn/api/music/lrc?key=veQAvBgr8cVs43ly2Ee&mid=${encodeURIComponent(mid)}&type=${encodeURIComponent(type)}`;
		console.log('歌词API请求URL:', url);
		
		try {
			const res = await uniCloud.httpclient.request(url, {
				method: 'GET',
				dataType: 'json',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset:utf-8;'
				}
			});
			console.log('歌词API返回数据:', res.data);
			if (!res?.data) {
				return this.fail('API返回数据为空');
			}
			
			// 直接返回原始数据，由前端处理格式
			return this.success(res.data);
			
		} catch (error) {
			console.error('获取歌词失败:', error);
			return this.fail('获取歌词失败');
		}
	}

}