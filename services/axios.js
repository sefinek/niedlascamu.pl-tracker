const axios = require('axios');

axios.defaults.headers.common = {
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 EdwardGilek/2.0',
	'Accept-Language': 'pl;q=0.9',
	'Cache-Control': 'max-age=0',
	'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
	'Sec-CH-UA-Mobile': '?0',
	'Sec-CH-UA-Platform': '"Windows"',
	'Sec-Fetch-Dest': 'document',
	'Sec-Fetch-Mode': 'navigate',
	'Sec-Fetch-Site': 'none',
	'Sec-Fetch-User': '?1',
	'Upgrade-Insecure-Requests': '1',
	'Priority': 'u=0, i',
};

axios.defaults.timeout = 15000;

module.exports = axios;