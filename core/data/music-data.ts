/**
 * @Description:
 * 音乐数据处理
 * @author liuzhiheng
 * @createTime 2026-04-07 15:04:31
 * @Copyright by 文刀
 */

import { IMusic } from '../bean';
import { NetApi } from '../net/net-api';

export const MusicData = {
	// QQ音乐配置
	qqMusicConfig: {
		// 用户自定义cookie（base64编码后的）
		cookie: '',
		// 音质设置：'' = m4a试听, 'mp3' = 普通音质, 'hq' = 高品质, 'sq' = 无损, 'hires' = HiRes
		size: ''
	},
	
	// 设置QQ音乐配置
	setQQMusicConfig: (config : { cookie ?: string, size ?: string }) => {
		if (config.cookie !== undefined) {
			MusicData.qqMusicConfig.cookie = config.cookie;
			// 保存到本地存储
			uni.setStorageSync('qqMusicCookie', config.cookie);
		}
		if (config.size !== undefined) {
			MusicData.qqMusicConfig.size = config.size;
			// 保存到本地存储
			uni.setStorageSync('qqMusicSize', config.size);
		}
	},
	
	// 初始化QQ音乐配置（从本地存储加载）
	initQQMusicConfig: () => {
		try {
			const cookie = uni.getStorageSync('qqMusicCookie');
			const size = uni.getStorageSync('qqMusicSize');
			if (cookie) {
				MusicData.qqMusicConfig.cookie = cookie;
			}
			if (size) {
				MusicData.qqMusicConfig.size = size;
			}
		} catch (error) {
			console.error('加载QQ音乐配置失败:', error);
		}
	},
	
	// 格式化QQ音乐数据
	formatQQMusicData: (data : any) => {
		if (!data) return null;
		
		// 处理musicurl为空的情况，使用vipmusicurl
		let musicUrl = data.musicurl || '';
		
		// 如果musicurl为空，尝试使用vipmusicurl
		if (!musicUrl && data.vipmusicurl) {
			console.log('musicurl为空，尝试使用vipmusicurl:', data.vipmusicurl);
			// 清理URL中的反引号
			musicUrl = data.vipmusicurl.replace(/`/g, '').trim();
		}
		
		console.log('最终音乐URL:', musicUrl);
		
		// 如果音乐URL为空，返回null
		if (!musicUrl) {
			console.log('音乐URL为空，可能是VIP歌曲');
			return null;
		}
		
		// 转换QQ音乐API返回的字段格式
		return {
			title: data.name,
			singer: data.songname,
			music_url: musicUrl,
			cover: data.picture ? data.picture.replace(/`/g, '').trim() : '',
			link: data.html ? data.html.replace(/`/g, '').trim() : '',
			lrc: data.viplrc ? data.viplrc.replace(/`/g, '').trim() : '',
			mid: data.mid || '',
			isVipUrl: musicUrl.includes('api.yaohud.cn/api/qqmusic/v2')
		};
	},
	
	// 格式化酷我音乐数据
	formatKuwoMusicData: (data : any) => {
		if (!data) return null;
		
		// 处理vipmusic字段
		let musicUrl = '';
		if (data.vipmusic && data.vipmusic.url) {
			// 清理URL中的反引号
			musicUrl = data.vipmusic.url.replace(/`/g, '').trim();
		}
		
		console.log('酷我音乐URL:', musicUrl);
		
		// 如果音乐URL为空，返回null
		if (!musicUrl) {
			console.log('音乐URL为空，可能是VIP歌曲');
			return null;
		}
		
		// 转换酷我音乐API返回的字段格式
		return {
			title: data.name,
			singer: data.songname,
			music_url: musicUrl,
			cover: data.picture ? data.picture.replace(/`/g, '').trim() : '',
			album: data.album || '',
			bitrate: data.vipmusic ? data.vipmusic.bitrate : '',
			mid: data.mid || ''
		};
	},
	
	// 获取歌词
	getLyrics: async (params : { mid: string, type: string }) => {
		try {
			const res = await NetApi.VheartMusic.getLyrics(params);
			console.log('获取歌词返回数据:', res.data);
			
			// 检查歌词API的返回格式
			if (res.data && res.data.code === 200 && res.data.data) {
				return res.data.data.lrc || '';
			}
			
			return '';
		} catch (error) {
			console.error('获取歌词失败:', error);
			return '';
		}
	},
	
	// 解析歌词
	parseLyrics: (lyrics : string) => {
		if (!lyrics) return [];
		
		const lines = lyrics.split('\n');
		const parsedLyrics = [];
		
		const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
		
		for (const line of lines) {
			const matches = [...line.matchAll(timeRegex)];
			if (matches.length > 0) {
				const text = line.replace(timeRegex, '').trim();
				if (text) {
					for (const match of matches) {
						const minutes = parseInt(match[1], 10);
						const seconds = parseInt(match[2], 10);
						const milliseconds = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
						const time = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
						
						parsedLyrics.push({
							time,
							text
						});
					}
				}
			}
		}
		
		// 按时间排序
		parsedLyrics.sort((a, b) => a.time - b.time);
		return parsedLyrics;
	},
	
	// 获取QQ音乐VIP歌曲的真实URL
	getQQMusicVipUrl: async (vipUrl : string) : Promise<string> => {
		try {
			console.log('请求VIP音乐URL:', vipUrl);
			
			// 确保URL包含size参数，尝试获取试听音质
			let requestUrl = vipUrl;
			
			// 添加size参数
			if (!requestUrl.includes('size=')) {
				// 使用用户配置的音质，如果没有配置则使用默认m4a试听音质
				const size = MusicData.qqMusicConfig.size || '';
				requestUrl += '&size=' + size;
			}
			
			// 添加cookie参数（如果用户配置了）
			if (MusicData.qqMusicConfig.cookie && !requestUrl.includes('cookie=')) {
				requestUrl += '&cookie=' + MusicData.qqMusicConfig.cookie;
			}
			
			console.log('最终请求URL:', requestUrl);
			
			const response = await uni.request({
				url: requestUrl,
				method: 'GET',
				dataType: 'json'
			});
			
			console.log('VIP音乐URL返回:', response.data);
			
			if (response.data && response.data.code === 200 && response.data.data) {
				return response.data.data;
			} else if (response.data && response.data.msg) {
				throw new Error(response.data.msg);
			}
			
			throw new Error('获取音乐URL失败');
		} catch (error) {
			console.error('获取VIP音乐URL失败:', error);
			throw error;
		}
	},
	
	// 封装请求
	getMusic: async (params : IMusic) => {
		try {
			const fullParams : Required<IMusic> = {
				title: params.title,
				...params
			};
			// 根据apiSource选择不同的API接口
			let res;
			if (params.apiSource === 'apple') {
				res = await NetApi.VheartMusic.getAppleMusicList(fullParams);
			} else if (params.apiSource === 'qq') {
				res = await NetApi.VheartMusic.getQQMusicList(fullParams);
			} else if (params.apiSource === 'kuwo') {
				res = await NetApi.VheartMusic.getKuwoMusicList(fullParams);
			} else {
				// 默认使用咪咕音乐
				res = await NetApi.VheartMusic.getMiguMusicList(fullParams);
			}
			
			// 如果是QQ音乐，在本地处理数据格式
			if (params.apiSource === 'qq' && res.data) {
				console.log('QQ音乐原始返回数据:', res.data);
				
				// 处理两层嵌套：res.data是QQ音乐API的完整返回
				let qqData = res.data;
				
				// 检查QQ音乐API的返回格式
				if (qqData.code === 200 && qqData.data) {
					const songData = qqData.data;
					
					// 检查是否是单曲详情
					if (songData.name && !songData.songs) {
						const formattedData = MusicData.formatQQMusicData(songData);
						if (!formattedData) {
							throw new Error('该歌曲需要VIP权限才能播放');
						}
						
						// 如果是VIP URL，需要再次请求获取真实URL
						if (formattedData.isVipUrl) {
							try {
								console.log('检测到VIP URL，尝试获取真实音乐URL');
								const realUrl = await MusicData.getQQMusicVipUrl(formattedData.music_url);
								formattedData.music_url = realUrl;
								console.log('获取到真实音乐URL:', realUrl);
							} catch (error : any) {
								console.error('获取VIP音乐URL失败:', error);
								throw new Error(error.message || '该歌曲需要VIP权限才能播放');
							}
						}
						
						return [formattedData];
					}
					
					// 检查是否是歌曲列表
					if (songData.songs && Array.isArray(songData.songs)) {
						console.log('返回QQ音乐歌曲列表:', songData.songs);
						return songData.songs;
					}
				}
			}
			
			// 如果是酷我音乐，在本地处理数据格式
			if (params.apiSource === 'kuwo' && res.data) {
				console.log('酷我音乐原始返回数据:', res.data);
				
				// 处理两层嵌套：res.data是酷我音乐API的完整返回
				let kuwoData = res.data;
				
				// 检查酷我音乐API的返回格式
				if (kuwoData.code === 200 && kuwoData.data) {
					const songData = kuwoData.data;
					
					// 检查是否是单曲详情
					if (songData.name && !songData.songs) {
						const formattedData = MusicData.formatKuwoMusicData(songData);
						if (!formattedData) {
							throw new Error('该歌曲需要VIP权限才能播放');
						}
						return [formattedData];
					}
					
					// 检查是否是歌曲列表
					if (songData.songs && Array.isArray(songData.songs)) {
						console.log('返回酷我音乐歌曲列表:', songData.songs);
						return songData.songs;
					}
				}
			}
			
			return res.data;
		} catch (error) {
			console.error('获取音乐失败', error);
			throw error;
		}
	},
	
	// 获取单个歌曲详情
	getMusicDetail: async (params : IMusic) => {
		try {
			const fullParams : Required<IMusic> = {
				title: params.title,
				...params
			};
			// 根据apiSource选择不同的API接口
			let res;
			if (params.apiSource === 'apple') {
				res = await NetApi.VheartMusic.getAppleMusic(fullParams);
			} else if (params.apiSource === 'qq') {
				res = await NetApi.VheartMusic.getQQMusic(fullParams);
			} else if (params.apiSource === 'kuwo') {
				res = await NetApi.VheartMusic.getKuwoMusic(fullParams);
			} else {
				// 默认使用咪咕音乐
				res = await NetApi.VheartMusic.getMiguMusic(fullParams);
			}
			
			// 如果是QQ音乐，在本地处理数据格式
			if (params.apiSource === 'qq' && res.data) {
				console.log('QQ音乐详情原始返回数据:', res.data);
				
				// 处理两层嵌套：res.data是QQ音乐API的完整返回
				let qqData = res.data;
				
				// 检查QQ音乐API的返回格式
				if (qqData.code === 200 && qqData.data) {
					const songData = qqData.data;
					
					// 检查是否是单曲详情
					if (songData.name && !songData.songs) {
						const formattedData = MusicData.formatQQMusicData(songData);
						if (!formattedData) {
							throw new Error('该歌曲需要VIP权限才能播放');
						}
						
						// 如果是VIP URL，需要再次请求获取真实URL
						if (formattedData.isVipUrl) {
							try {
								console.log('检测到VIP URL，尝试获取真实音乐URL');
								const realUrl = await MusicData.getQQMusicVipUrl(formattedData.music_url);
								formattedData.music_url = realUrl;
								console.log('获取到真实音乐URL:', realUrl);
							} catch (error : any) {
								console.error('获取VIP音乐URL失败:', error);
								throw new Error(error.message || '该歌曲需要VIP权限才能播放');
							}
						}
						
						return [formattedData];
					}
					
					// 检查是否是歌曲列表
					if (songData.songs && Array.isArray(songData.songs)) {
						// 如果提供了n参数，根据n值获取对应的歌曲
						if (params.n && params.n > 0 && params.n <= songData.songs.length) {
							return [songData.songs[params.n - 1]];
						}
						return songData.songs;
					}
				}
			}
			
			// 如果是酷我音乐，在本地处理数据格式
			if (params.apiSource === 'kuwo' && res.data) {
				console.log('酷我音乐详情原始返回数据:', res.data);
				
				// 处理两层嵌套：res.data是酷我音乐API的完整返回
				let kuwoData = res.data;
				
				// 检查酷我音乐API的返回格式
				if (kuwoData.code === 200 && kuwoData.data) {
					const songData = kuwoData.data;
					
					// 检查是否是单曲详情
					if (songData.name && !songData.songs) {
						const formattedData = MusicData.formatKuwoMusicData(songData);
						if (!formattedData) {
							throw new Error('该歌曲需要VIP权限才能播放');
						}
						return [formattedData];
					}
					
					// 检查是否是歌曲列表
					if (songData.songs && Array.isArray(songData.songs)) {
						// 如果提供了n参数，根据n值获取对应的歌曲
						if (params.n && params.n > 0 && params.n <= songData.songs.length) {
							return [songData.songs[params.n - 1]];
						}
						return songData.songs;
					}
				}
			}
			
			return res.data;
		} catch (error) {
			console.error('获取音乐详情失败', error);
			throw error;
		}
	}
}