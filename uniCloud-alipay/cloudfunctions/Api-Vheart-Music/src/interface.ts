/**
 * @Description:
 * 接口
 * @author liuzhiheng
 * @createTime 2026-03-20 13:39:57
 * @Copyright by 文刀
 */


// 统一返回体（泛型干掉any，开闭根基）
export interface IApiResult<T = null> {
	code : number
	msg : string
	data : T
}

// 分页通用接口（列表必用）
export interface IPageParams {
	page : number
	size : number
}

// 1. 音乐实体（核心数据）
export interface IMusic {
	_id ?: string
	name : string        // 歌曲名
	singer : string     // 歌手
	url : string        // 播放地址
	cover ?: string     // 封面
	duration : number   // 时长
	type : 'local' | 'online' // 音源类型（多态标记）
	createTime ?: number
}

// 2. 歌单实体
export interface IPlaylist {
	_id ?: string
	name : string
	userId : string     // 创建人
	cover ?: string
	musicIds : string[] // 歌曲ID列表
	isDefault ?: boolean // 默认歌单
}

// 3. 播放记录实体
export interface IPlayRecord {
	userId : string
	musicId : string
	playTime : number
}

// 开闭：以后加QQ音乐/网易云，只写新实现类，不改这个接口
export interface IMusicSource {
	// 获取歌曲列表
	getMusic(params : IPageParams) : Promise<IApiResult<IMusic[]>>
	// 获取歌曲播放地址	
}

export interface IMusicService {
	// 获取音乐详情
	getMusicDetail(musicId : string) : Promise<IApiResult<IMusic>>
	// 上传音乐（本地）
	uploadMusic(music : Partial<IMusic>) : Promise<IApiResult<IMusic>>
	// 删除音乐
	deleteMusic(musicId : string) : Promise<IApiResult>
}

export interface IMusicPlaylistService {
	// 创建歌单
	createPlaylist(data : IPlaylist) : Promise<IApiResult<IPlaylist>>
	// 获取我的歌单
	getMyPlaylist(userId : string) : Promise<IApiResult<IPlaylist[]>>
	// 歌单添加歌曲
	addMusicToPlaylist(playlistId : string, musicId : string) : Promise<IApiResult>
	// 删除歌单歌曲
	removeMusicFromPlaylist(playlistId : string, musicId : string) : Promise<IApiResult>
}

export interface IMusicPlayService {
  // 记录播放历史
  savePlayRecord(record: IPlayRecord): Promise<IApiResult>
  // 获取播放历史
  getPlayRecord(userId: string): Promise<IApiResult<IMusic[]>>
  // 清空播放历史
  clearPlayRecord(userId: string): Promise<IApiResult>
}

// 音乐模块云函数对外API（前端调用清单）
export interface IMusicCloudApi {
  // 歌曲
  getMusicList: (data: IPageParams) => Promise<IApiResult<IMusic[]>>
  getMusicDetail: (data: { musicId: string }) => Promise<IApiResult<IMusic>>
  uploadMusic: (data: Partial<IMusic>) => Promise<IApiResult<IMusic>>
  
  // 歌单
  createPlaylist: (data: IPlaylist) => Promise<IApiResult<IPlaylist>>
  getMyPlaylist: (data: { userId: string }) => Promise<IApiResult<IPlaylist[]>>
  
  // 播放
  savePlayRecord: (data: IPlayRecord) => Promise<IApiResult>
}