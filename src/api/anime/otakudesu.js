const axios = require('axios');
const cheerio = require('cheerio');

const baseUrl = 'https://otakudesu.best';

async function searchAnime(query) {
    const { data } = await axios.get(`${baseUrl}/?s=${query}&post_type=anime`);
    const $ = cheerio.load(data);
    const result = [];

    $('.chivsrc li').each((_, el) => {
        result.push({
            title: $(el).find('h2 a').text().trim(),
            thumb: $(el).find('img').attr('src'),
            status: $(el).find('.set').eq(0).text().replace('Status : ', '').trim(),
            rating: $(el).find('.set').eq(1).text().replace('Rating : ', '').trim(),
            url: $(el).find('h2 a').attr('href')
        });
    });
    return result;
}

async function getDetail(url) {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const detail = {};

    $('.infozingle p').each((_, el) => {
        const [key, value] = $(el).text().split(':').map(s => s.trim());
        if (key && value) detail[key.toLowerCase().replace(/\s+/g, '_')] = value;
    });

    const episodes = [];
    $('.episodelist ul li').each((_, el) => {
        episodes.push({
            title: $(el).find('a').text().trim(),
            url: $(el).find('a').attr('href'),
            date: $(el).find('.zeebr').text().trim()
        });
    });

    return {
        title: $('.jdlrx h1').text().trim(),
        thumb: $('.fotoanime img').attr('src'),
        sinopsis: $('.sinopc').text().trim(),
        detail,
        episodes
    };
}

module.exports = function (app) {
    // Endpoint Search
    app.get("/anime/otakudesu-search", async (req, res) => {
        const { query } = req.query;
        if (!query) return res.json({ status: false, error: "Mau cari anime apa, Bang D2:业?" });

        try {
            const result = await searchAnime(query);
            res.json({
                status: true,
                creator: "D2:业",
                result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });

};
