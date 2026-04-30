/**
 * @Description:
 * 动漫业务核心逻辑
 * @author liuzhiheng
 * @createTime 2026-04-09 08:31:43
 * @Copyright by 文刀
 */

import { NetApi } from '../net/net-api';

// 动漫数据类型
export interface IAnime {
	class_ : string;
	title : string;
	detail_url : string;
	play_url : string;
	cover : string;
	episode : string;
	info : string;
}

// 分页信息
export interface IPagination {
	current_page : number;
	total_page : number;
	total_count : number;
	per_page : number;
}

// 搜索结果
export interface IAnimeSearchResult {
	list : IAnime[];
	pagination : IPagination;
}

/**
 * 动漫业务逻辑
 */
export const useAnimeModel = {
	/**
	 * 搜索动漫
	 * @param params 搜索参数
	 * @returns 搜索结果
	 */
	searchAnime: async (params : { msg : string; page : number }) : Promise<IAnimeSearchResult | null> => {
		try {
			const res = await NetApi.VheartMusic.searchAnime(params);
			console.log('搜索动漫返回数据:', res.data);

			// 检查返回数据格式
			if (res.code === 200 && res.data) {
				const data = res.data;

				// 清理数据中的反引号
				if (data.list && Array.isArray(data.list)) {
					data.list.forEach((item: any) => {
						if (item.cover) {
							item.cover = item.cover.replace(/`/g, '').trim();
						}
						if (item.play_url) {
							item.play_url = item.play_url.replace(/`/g, '').trim();
						}
						if (item.detail_url) {
							item.detail_url = item.detail_url.replace(/`/g, '').trim();
						}
						// 处理class字段（TypeScript保留关键字）
						if (item.class) {
							item.class_ = item.class;
							delete item.class;
						}
					});
				}

				return data;
			}

			return null;
		} catch (error) {
			console.error('搜索动漫失败:', error);
			throw error;
		}
	}
};