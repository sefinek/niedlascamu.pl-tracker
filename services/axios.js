const axios = require('axios');

axios.defaults.headers.common = {
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 EdwardGilek/2.0',
	'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
	'Accept-Encoding': 'gzip, deflate, br',
	'Accept-Language': 'pl;q=0.9',
	'Cache-Control': 'no-cache',
	'Connection': 'keep-alive',
	'Upgrade-Insecure-Requests': '1',
	'Sec-Fetch-Dest': 'document',
	'Sec-Fetch-Mode': 'navigate',
	'Sec-Fetch-Site': 'same-origin',
	'Sec-Fetch-User': '?1',
	'Sec-CH-UA-Mobile': '?0',
	'Priority': 'u=0, i'
};

axios.defaults.timeout = 15000;

module.exports = axios;