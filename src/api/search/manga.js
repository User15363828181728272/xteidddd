
const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://lc4.cosmicscans.asia";

async function searchManga(keyword, page = 1) {
    try {
        const targetUrl = page > 1 
            ? `${BASE_URL}/page/${page}/?s=${encodeURIComponent(keyword)}`
            : `${BASE_URL}/?s=${encodeURIComponent(keyword)}`;

        const { data } = await axios.get(targetUrl, {
            headers: {
                'authority': 'lc4.cosmicscans.asia',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'referer': 'https://lc4.cosmicscans.asia/',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
            },
            timeout: 15000
        });

        const $ = cheerio.load(data);
        const results = [];

        // Selector .bsx itu buat list pencarian di CosmicScans
        $(".bsx").each((_, el) => {
            const a = $(el).find("a").first();
            const title = $(el).find(".tt").text().trim() || a.attr("title");
            const link = a.attr("href");
            
            // Ambil gambar dari data-src (lazyload) atau src biasa
            let thumb = $(el).find("img").attr("data-src") || 
                        $(el).find("img").attr("src") || 
                        $(el).find("img").attr("data-lazy-src");

            if (title && link) {
                results.push({
                    title,
                    thumbnail: thumb,
                    url: link,
                    type: $(el).find(".typez").text().trim() || "Manga"
                });
            }
        });

        if (results.length === 0) {
            return { msg: "Judul kagak ketemu, Bang. Coba keyword lain." };
        }

        return {
            total: results.length,
            results
        };
    } catch (err) {
        throw new Error(`Waduh: ${err.message}`);
    }
}

module.exports = function (app) {
    app.get("/v1/search/manga", async (req, res) => {
        const { q, page } = req.query;
        if (!q) return res.status(400).json({ status: false, error: "Isi query-nya dulu!" });

        try {
            const data = await searchManga(q, page || 1);
            res.json({
                status: true,
                creator: "D2:业",
                result: data
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
