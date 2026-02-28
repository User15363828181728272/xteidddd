const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

/**
 * Twitter Video Downloader
 * Source: ExpertsPHP / AgungDevX
 * Category: Download
 * Creator: D2:业
 */

async function twitterDl(link) {
    try {
        const config = { 'url': link };
        const { data } = await axios.post('https://www.expertsphp.com/instagram-reels-downloader.php', qs.stringify(config), {
            headers: {
                "content-type": 'application/x-www-form-urlencoded',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            },
        });

        const $ = cheerio.load(data);
        const videoUrl = $('table.table-condensed tbody tr td video').attr('src') || 
                         $('table.table-condensed tbody tr td a[download]').attr('href');

        if (!videoUrl) throw new Error("Video tidak ditemukan. Pastikan tweet mengandung video dan tidak di-private.");

        return {
            url: link,
            video: videoUrl
        };
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/download/twitter
     * @query ?url=https://twitter.com/xxx
     */
    app.get("/v1/download/twitter", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, error: "Link Twitter-nya mana, Bos?" });

        try {
            const result = await twitterDl(url);
            res.json({
                status: true,
                creator: "D2:业",
                result: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
