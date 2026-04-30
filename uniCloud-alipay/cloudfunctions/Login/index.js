const cloud = uniCloud;
const db = cloud.database();

// const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
// const _id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

exports.main = async (event, context) => {

	const res = await uniCloud.Login({
		appid: '__UNI__013CB0C', // 替换成自己开通一键登录的应用的DCloud appid，使用callFunction方式调用时可以不传（会自动取当前客户端的appid），如果使用云函数URL化的方式访问必须传此参数
		provider: 'univerify',
		access_token: event.access_token,
		openid: event.openid
	});

	console.log(res); // res里的数据格式	{ code: 0, success: true, phoneNumber: '186*****078' }

	// 执行入库等操作，正常情况下不要把完整手机号返回给前端	
	return await db.collection('AroundRepair-user').add({
		openid: event.openid, //前端提交过来的数据
		PhoneNumber: res.phoneNumber,
		createTime: Date.now()
	})
};