/**
 * @Description:
 * 音乐业务核心逻辑
 * @author liuzhiheng
 * @createTime 2026-04-07 15:14:58
 * @Copyright by 文刀
 */

import { IMusic } from "../bean";
import { MusicData } from "../data/music-data";

// 导入音乐数据层


class MusicModel {
	private static instance : MusicModel;
	private constructor() { }
	static getInstance() : MusicModel {
		if (!MusicModel.instance) {
			MusicModel.instance = new MusicModel();
		}
		return MusicModel.instance;
	}

	async searchMusic(keyword : IMusic) : Promise<String[]> {
		const reMusic = await MusicData.getMusic(keyword);
		return reMusic;
	}
	
	async getMusicDetail(params : IMusic) : Promise<String[]> {
		const reMusic = await MusicData.getMusicDetail(params);
		return reMusic;
	}
}

export const globalMusic = MusicModel.getInstance();