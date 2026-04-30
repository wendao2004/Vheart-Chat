/**
 * @Description:
 * 音乐服务
 * @author liuzhiheng
 * @createTime 2026-03-20 13:41:27
 * @Copyright by 文刀
 */

declare var uniCloud : any;
import BaseService from "./BaseService";
import { IApiResult, IMusic, IMusicSource, IPageParams } from "./interface";
const apiKey = '223e7588-df6b-ea2d-78b1-0ba6a609a54fdfdee94e';
const url = 'https://api.yyy001.com/api/mgmusic/';

//在线音乐（调用第三方API）
export class OnlineMusicSource extends BaseService implements IMusicSource {
	// 调用外部API获取歌曲列表

	async getMusicList(params : IPageParams) : Promise<IApiResult<IMusic[]>> {
		try {
			// 👇 这里直接调用你的音乐API，和Base层无关！
			const res = await uniCloud.httpclient.request(`${url}` + '?apikey=' + `${apiKey}` + `&msg=&type=json&br=1&num=20`, {
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
			else if (res.data && res.data.code === 200) {
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

			// 格式化返回（用Base层的success方法）
			return this.success(res.data.data);
		} catch (error) {
			console.error('请求失败:', error);
			return this.fail('API请求失败');

		}
	}

	async getMusic(params : IPageParams) : Promise<IApiResult<IMusic[]>> {
		try {
			const res = await uniCloud.httpclient.request(`${url}` + '?apikey=' + `${apiKey}` + `${params}` + "&type=json&br=1&n=", {
				method: 'GET',
				dataType: 'json',
				data: params
			});
			// 格式化返回（用Base层的success方法）
			return this.success(res.data.data);
		} catch (error) {
			return this.fail('API请求失败');
		}
	}
}