const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Sfile Downloader Pro
 * Logic: Multi-step bypass for direct download link
 * Creator: D2:业
 */

module.exports = function (app) {
    app.get("/v1/download/sfile-dl", async (req, res) => {
        const { url } = req.query;

        if (!url) return res.status(400).json({ status: false, msg: "Link sfile-nya mana, Bos?" });

        try {
            const userAgent = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
            
            // 1. Init Request
            const init = await axios.get(url, { headers: { 'User-Agent': userAgent } });
            const cookies = init.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ');

            let $ = cheerio.load(init.data);
            
            // Metadata Scraper
            const meta = {
                filename: $('.overflow-hidden img').attr('alt')?.trim(),
                mimetype: $('.divide-y span').first().text().trim(),
                upload_date: $('.divide-y .font-semibold').eq(2).text().trim(),
                download_count: $('.divide-y .font-semibold').eq(1).text().trim(),
                author_name: $('.divide-y a').first().text().trim()
            };

            const dwUrl = $('#download').attr('data-dw-url');
            if (!dwUrl) throw new Error('Download URL tidak ditemukan.');

            // 2. Process Request (Bypass Page)
            const proc = await axios.get(dwUrl, {
                headers: { 
                    'User-Agent': userAgent,
                    'Cookie': cookies,
                    'Referer': url
                }
            });

            $ = cheerio.load(proc.data);
            const scriptHtml = $('script').map((i, el) => $(el).html()).get().join('\n');

            // Regex buat nyari link download HD
            const re = /https:\\\/\\\/download\d+\.sfile\.co\\\/downloadfile\\\/\d+\\\/\d+\\\/[a-z0-9]+\\\/[^\s'"]+\.[a-z0-9]+(\?[^"']+)?/gi;
            const match = scriptHtml.match(re);

            if (!match) throw new Error('Link download final tidak ditemukan di script.');

            const finalDownloadLink = match[0].replace(/\\\/ /g, '').replace(/\\\//g, '/');

            res.json({
                status: true,
                creator: "D2:业",
                metadata: meta,
                download_url: finalDownloadLink
            });

        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
