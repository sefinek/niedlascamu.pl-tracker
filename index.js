require('dotenv').config();
const axios = require('./services/axios.js');
const cheerio = require('cheerio');
const { CronJob } = require('cron');
const simpleGit = require('simple-git');
const { html: beautifyHTML, css: beautifyCSS, js: beautifyJS } = require('js-beautify');
const fs = require('node:fs');
const path = require('node:path');
const git = simpleGit();

const WWW_DIR = './www';
const BASE_URL = ['https://niedlascamu.pl', 'https://filmy.niedlascamu.pl', 'https://banq.niedlascamu.pl'];
const TRACK_RESOURCES = ['css', 'js', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico', 'pdf'];
const MAX_FILENAME_LENGTH = 128;

const VISITED_URLS = new Set();

if (!fs.existsSync(WWW_DIR)) fs.mkdirSync(WWW_DIR, { recursive: true });

const fetchPageContent = async url => {
	if (process.env.NODE_ENV === 'development') console.log('GET', url);

	try {
		const { data } = await axios.get(url);
		return data;
	} catch (err) {
		if (err.response?.status !== 404) console.error(`Error fetching ${url}:`, err.message);
		return null;
	}
};

const saveToFile = (content, fileName) => fs.writeFileSync(fileName, content, 'utf8');
const saveBinaryToFile = (content, fileName) => fs.writeFileSync(fileName, content, 'binary');
const hasChanges = (newContent, filePath) => !fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== newContent;

const cleanContent = html => {
	const $ = cheerio.load(html);

	$('script').filter((_, el) => $(el).html()?.startsWith('(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement(\'script\');')).remove();

	$('a[href], link[href]').each((_, el) => {
		const href = $(el).attr('href');
		if (href && !href.startsWith('index.php')) $(el).attr('href', href.split(/[?#]/)[0]);
	});

	$('[data-cf-beacon], [data-cfemail]').remove();

	return beautifyHTML($.html(), {
		indent_size: 4,
		wrap_line_length: 120,
		preserve_newlines: true,
		unformatted: ['pre', 'code', 'li'],
	});
};

const truncateFileName = fileName => {
	if (fileName.length > MAX_FILENAME_LENGTH) {
		const extIndex = fileName.lastIndexOf('.');
		const ext = extIndex !== -1 ? fileName.slice(extIndex) : '';
		const baseName = extIndex !== -1 ? fileName.slice(0, extIndex) : fileName;
		return `${baseName.slice(0, MAX_FILENAME_LENGTH - ext.length - 3)}[...]${ext}`;
	}
	return fileName;
};

const saveResources = async ($, fileName, baseUrl) => {
	const regex = new RegExp(`\\.(${TRACK_RESOURCES.join('|')})$`);
	const tasks = [];

	$('link[href], script[src], img[src], source[src], a[href]').each((_, el) => {
		let resourceUrl = $(el).attr('href') || $(el).attr('src');
		if (!resourceUrl) return;

		resourceUrl = resourceUrl.split('?')[0];
		if (!regex.test(resourceUrl)) return;

		if (!resourceUrl.startsWith('http')) resourceUrl = new URL(resourceUrl, baseUrl).href;

		const resourceDomain = new URL(resourceUrl).origin;
		if (!BASE_URL.includes(resourceDomain)) return;

		const ext = path.extname(resourceUrl).slice(1).toLowerCase();
		const resourceDir = path.join(path.dirname(fileName), ext);
		if (!fs.existsSync(resourceDir)) fs.mkdirSync(resourceDir, { recursive: true });

		if (process.env.NODE_ENV === 'development') console.log('GET', resourceUrl);
		const resourceFileName = truncateFileName(path.join(resourceDir, path.basename(resourceUrl)));
		tasks.push(
			axios.get(resourceUrl, { responseType: ext === 'css' || ext === 'js' ? 'text' : 'arraybuffer' })
				.then(({ data }) => {
					if (ext === 'css') {
						saveToFile(beautifyCSS(data, { indent_size: 4 }), resourceFileName);
					} else if (ext === 'js') {
						saveToFile(beautifyJS(data, { indent_size: 4 }), resourceFileName);
					} else {
						saveBinaryToFile(data, resourceFileName);
					}
				})
				.catch(err => console.log(`Error downloading ${resourceUrl}:`, err.message))
		);
	});

	await Promise.all(tasks);
};

const urlToFileName = (url, baseUrl) => {
	const domainDir = path.join(WWW_DIR, new URL(baseUrl).hostname);
	if (!fs.existsSync(domainDir)) fs.mkdirSync(domainDir, { recursive: true });

	let sanitizedUrl = url.replace(baseUrl, '').replace(/\/$/, '')
		.replace(/[^a-z0-9\\/]/gi, '-')
		.replace(/\//g, '_')
		.toLowerCase();

	if (url.includes('index.php?page=')) {
		sanitizedUrl = url.split('index.php?page=')[1]
			.replace(/[^a-z0-9_]/gi, '-')
			.toLowerCase();
	}

	sanitizedUrl = sanitizedUrl.replace(/^[-_]+|[-_]+$/g, '');
	const fileName = sanitizedUrl ? `${sanitizedUrl}.html` : 'index.html';
	return path.join(domainDir, truncateFileName(fileName));
};

const crawlPage = async (url, baseUrl) => {
	if (VISITED_URLS.has(url)) return;
	VISITED_URLS.add(url);

	const content = await fetchPageContent(url);
	if (!content) return;

	const fileName = urlToFileName(url, baseUrl);
	if (!fileName) return;

	const $ = cheerio.load(content);
	await saveResources($, fileName, baseUrl);

	const cleanedContent = cleanContent(content);
	if (hasChanges(cleanedContent, fileName)) saveToFile(cleanedContent, fileName);

	const links = $('a[href]').map((_, el) => $(el).attr('href')).get()
		.filter(link => !link.includes('cdn-cgi') && !link.startsWith('mailto:') && !link.includes('#'))
		.map(link => new URL(link, url).href)
		.filter(link => link.startsWith(baseUrl));

	for (const link of links) await crawlPage(link, baseUrl);
};

const crawl = async () => {
	VISITED_URLS.clear();
	await git.pull('origin', 'main');

	for (const baseUrl of BASE_URL) await crawlPage(baseUrl, baseUrl);

	try {
		const { modified = [], created = [], deleted = [], not_added = [] } = await git.status();

		const all = [...modified, ...created, ...deleted, ...not_added];
		if (!all.length) return console.log('No changes to commit');

		const logChanges = { Modified: modified, Created: created, Deleted: deleted, 'Not added': not_added };
		for (const [label, files] of Object.entries(logChanges)) {
			if (files.length) console.log(label, files);
		}

		if (process.env.NODE_ENV === 'production' && [modified, created, deleted, not_added].every(arr => arr.length)) {
			await git.add('.');
			await git.commit(`Content updated, date: ${new Date().toLocaleString('pl-PL')}`);
			await git.push('origin', 'main');
		}
	} catch (err) {
		console.error('Error during Git operations:', err);
	}
};

new CronJob('0 12,19 * * *', crawl, null, true, 'Europe/Warsaw');
(async () => crawl())();