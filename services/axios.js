const axios = require('axios');

axios.defaults.headers.common = {
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
	'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
	'Accept-Language': 'pl;q=0.9',
	'Cache-Control': 'max-age=0',
	'Priority': 'u=0, i',
	'Sec-CH-UA': '"Google Chrome";v="137", "Not-A.Brand";v="8", "Chromium";v="137"',
	'Sec-CH-UA-Mobile': '?0',
	'Sec-CH-UA-Platform': '"Windows"',
	'Sec-Fetch-Dest': 'document',
	'Sec-Fetch-Mode': 'navigate',
	'Sec-Fetch-Site': 'none',
	'Sec-Fetch-User': '?1',
	'Upgrade-Insecure-Requests': '1',
};

axios.defaults.timeout = 15000;

module.exports = axios;