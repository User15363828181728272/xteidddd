const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

/**
 * 🐉 Donghub Anime Scraper (UPGRADED V2)
 * Path: /v2/anime/donghub
 * Creator: D2:业
 */

class Donghub {
    constructor() {
        this.baseUrl = 'https://donghub.vip';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        };
    }

    generateCookies() {
        const rnd = (l) => crypto.randomBytes(Math.ceil(l/2)).toString('hex').slice(0, l);
        const ts = Date.now();
        return `_ga=GA1.1.${rnd(8)}.${rnd(10)}; HstCfa5009307=${ts}; HstCla5009307=${ts}; panoramaId=${rnd(64)}; _ga_BC9Q6DVLH9=GS2.1.s${ts}`;
    }

    async search(query) {
        try {
            const { data } = await axios.get(`${this.baseUrl}/?s=${encodeURIComponent(query)}`, {
                headers: { ...this.headers, 'Cookie': this.generateCookies() }
            });
            const $ = cheerio.load(data);
            const results = [];

            $('.listupd article.bs').each((i, el) => {
                const a = $(el).find('a');
                results.push({
                    title: a.attr('title') || a.find('h2').text(),
                    url: a.attr('href'),
                    image: $(el).find('img').attr('src'),
                    status: $(el).find('.epx').text(),
                    type: $(el).find('.typez').text(),
                    subtitle: $(el).find('.sb').text()
                });
            });
            return results;
        } catch (e) { throw new Error(e.message); }
    }

    async getDetail(url) {
        try {
            const { data } = await axios.get(url, {
                headers: { ...this.headers, 'Cookie': this.generateCookies() }
            });
            const $ = cheerio.load(data);
            
            const detail = {
                title: $('.entry-title').text().trim(),
                image: $('.thumb img').attr('src'),
                rating: $('.num').text(),
                info: {},
                genres: [],
                synopsis: $('.entry-content p').text().trim(),
                episodes: []
            };

            $('.spe span').each((i, el) => {
                const text = $(el).text().split(':');
                if (text.length > 1) detail.info[text[0].trim().toLowerCase()] = text[1].trim();
            });

            $('.genxed a').each((i, el) => detail.genres.push($(el).text()));

            $('.eplister ul li').each((i, el) => {
                detail.episodes.push({
                    episode: $(el).find('.epl-num').text(),
                    title: $(el).find('.epl-title').text(),
                    date: $(el).find('.epl-date').text(),
                    url: $(el).find('a').attr('href')
                });
            });

            return detail;
        } catch (e) { throw new Error(e.message); }
    }
}

const dhub = new Donghub();

module.exports = function (app) {
    // V2 Search Endpoint
    app.get("/v2/anime/donghub/search", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, creator: "D2:业", error: "Mau cari donghua apa, Bos?" });
        try {
            const result = await dhub.search(q);
            res.json({ status: true, creator: "D2:业", result });
        } catch (err) { res.status(500).json({ status: false, error: err.message }); }
    });

    // V2 Detail Endpoint
    app.get("/v2/anime/donghub/detail", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, creator: "D2:业", error: "URL Detail mana?" });
        try {
            const result = await dhub.getDetail(url);
            res.json({ status: true, creator: "D2:业", result });
        } catch (err) { res.status(500).json({ status: false, error: err.message }); }
    });
};