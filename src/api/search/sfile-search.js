const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Sfile Search Simple
 * Logic: Direct search without page parameter
 * Creator: D2:业
 */

module.exports = function (app) {
    app.get("/v1/search/sfile-search", async (req, res) => {
        const { q } = req.query;

        if (!q) return res.status(400).json({ status: false, msg: "Tulis kata kunci pencariannya dulu, Bos!" });

        try {
            // Langsung nembak page 1 biar simpel
            const response = await axios.get(`https://sfile.co/search.php?q=${q}&page=1`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            const result = [];

            $('.group.px-2').each((_, el) => {
                const title = $(el).find('.min-w-0 a').text().trim();
                const link = $(el).find('a').attr('href');
                const elm = $(el).find('.mt-1').text().split('•');

                if (link) {
                    result.push({
                        title,
                        size: elm[0]?.trim() || 'Unknown',
                        upload_at: elm[1]?.trim() || 'Unknown',
                        link,
                    });
                }
            });

            res.json({
                status: true,
                creator: "D2:业",
                query: q,
                total_found: result.length,
                results: result
            });

        } catch (err) {
            res.status(500).json({ status: false, error: "Gagal mencari file. Coba lagi nanti!" });
        }
    });
};
