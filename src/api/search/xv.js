const axios = require('axios');
const cheerio = require('cheerio');

/**
 * XV Search (Secured)
 * Category: Search
 * Creator: D2:业
 */
async function scrapeXV(keyword) {
    try {
        const url = `https://www.xvideos.com/?k=${encodeURIComponent(keyword)}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const results = [];

        $('.thumb-block').each((index, element) => {
            const titleElement = $(element).find('p.title a');
            const title = titleElement.attr('title');
            const partialLink = titleElement.attr('href');
            
            if (title && partialLink) {
                results.push({
                    title: title,
                    link: `https://www.xvideos.com${partialLink}`,
                    duration: $(element).find('p.title .duration').text().replace(/[\(\)]/g, '').trim(),
                    thumbnail: $(element).find('.thumb img').attr('data-src') || $(element).find('.thumb img').attr('src'),
                    uploader: $(element).find('p.metadata span.name').text() || "Unknown"
                });
            }
        });

        return results;
    } catch (error) {
        throw new Error("Gagal terhubung ke engine pencari.");
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/search/xv
     * @method GET
     */
    app.get("/v1/search/xv", async (req, res) => {
        const { query, apikey } = req.query;

        // Validasi API Key
        if (apikey !== "kertas") {
            return res.status(403).json({ 
                status: false, 
                error: "API Key salah atau tidak ditemukan, Bang!" 
            });
        }

        if (!query) {
            return res.status(400).json({ 
                status: false, 
                error: "Masukin keyword pencariannya dulu." 
            });
        }

        try {
            const result = await scrapeXV(query);
            res.json({
                status: true,
                creator: "D2:业",
                result: result.slice(0, 15)
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
