/**
 * @Description:
 * 动漫服务
 * 处理动漫相关的业务逻辑
 * @author liuzhiheng
 * @createTime 2026-04-09
 * @Copyright by 文刀
 */

declare var uniCloud : any;
import BaseService from "./BaseService";
import { IApiResult } from "./interface";

// 动漫搜索参数接口
export interface IAnimeSearchParams {
	msg: string
	page?: number
}

// 动漫列表项接口
export interface IAnimeItem {
	class_: string
	title: string
	detail_url: string
	play_url: string
	cover: string
	episode: string
	info: string
}

// 动漫搜索结果接口
export interface IAnimeSearchResult {
	list: IAnimeItem[]
	pagination: {
		current_page: number
		total_page: number
		total_count: number
		per_page: number
	}
}

// 动漫API封装
export class AnimeService extends BaseService {
	// API密钥
	private readonly apiKey = 'veQAvBgr8cVs43ly2Ee';
	// API基础URL
	private readonly baseUrl = 'https://api.yaohud.cn/api/v5/fqdm';

	// 构造函数
	constructor() {
		super();
	}

	/**
	 * 搜索动漫
	 * @param params 搜索参数
	 * @returns 动漫搜索结果
	 */
	async searchAnime(params: IAnimeSearchParams): Promise<IApiResult<IAnimeSearchResult>> {
		const { msg, page = 1 } = params;
		
		if (!msg || !msg.trim()) {
			return this.fail('搜索关键词不能为空');
		}

		// 构建API请求URL
		const url = `${this.baseUrl}?key=${this.apiKey}&msg=${encodeURIComponent(msg.trim())}&g=${page}`;
		console.log('动漫API请求URL:', url);

		try {
			const res = await uniCloud.httpclient.request(url, {
				method: 'GET',
				dataType: 'json',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset:utf-8;'
				}
			});

			console.log('动漫API返回数据:', res.data);

			if (!res?.data) {
				return this.fail('API返回数据为空');
			}

			const apiData = res.data;

			// 检查返回状态码
			if (apiData.code !== 200) {
				return this.fail(apiData.msg || '搜索失败');
			}

			// 处理返回数据
			const result: IAnimeSearchResult = {
				list: [],
				pagination: {
					current_page: page,
					total_page: 1,
					total_count: 0,
					per_page: 18
				}
			};

			// 解析动漫列表
			if (apiData.data && Array.isArray(apiData.data.list)) {
				result.list = apiData.data.list.map((item: any) => ({
					class_: item.class || '',
					title: item.title || '',
					detail_url: item.detail_url || '',
					play_url: item.play_url || '',
					cover: item.cover || '',
					episode: item.episode || '',
					info: item.info || ''
				}));
			}

			// 解析分页信息
			if (apiData.data && apiData.data.pagination) {
				result.pagination = {
					current_page: apiData.data.pagination.current_page || page,
					total_page: apiData.data.pagination.total_page || 1,
					total_count: apiData.data.pagination.total_count || 0,
					per_page: apiData.data.pagination.per_page || 18
				};
			}

			return this.success(result, '搜索成功');

		} catch (error) {
			console.error('搜索动漫失败:', error);
			return this.fail('搜索动漫失败，请稍后重试');
		}
	}
}
