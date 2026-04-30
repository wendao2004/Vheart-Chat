// cloudfunctions/deepseek-chat/index.js
const axios = require('axios');

exports.main = async (event, context) => {
	try {
		const {
			messages
		} = event;

		const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
			model: "deepseek-chat", // 根据实际模型调整
			messages: messages,
			temperature: 0.7,
			max_tokens: 2048
		}, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${"sk-43ed98a7ca4c4aa5845d096f64545d5d"}`, // 替换你的实际API Key
			}
		});

		return {
			code: 0,
			data: response.data.choices[0].message.content
		};
	} catch (error) {
		console.error('API请求失败:', error);
		return {
			code: error.response?.status || 500,
			message: error.response?.data?.error?.message || '服务请求失败'
		};
	}
};