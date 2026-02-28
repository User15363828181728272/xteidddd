const axios = require('axios');

/**
 * Pinterest Search API
 * Source: There's APIs (Vercel)
 * Category: Search
 * Creator: D2:业
 */
async function pinSearch(query) {
    try {
        const { data } = await axios.get(`https://theresapis.vercel.app/search/pinterest?q=${encodeURIComponent(query)}`);
        
        if (!data || !data.result) throw new Error("Gagal mengambil data dari Pinterest.");

        // Ambil link-nya aja dan rapihin
        let results = data.result.map(v => ({
            url: v.directLink || v.link,
            source: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
        }));

        // Shuffle & Limit (Biar gak keberatan pas dikirim)
        return results.sort(() => 0.5 - Math.random()).slice(0, 10);
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/search/pinterest
     * @query ?q=aesthetic
     */
    app.get("/v1/search/pinterest", async (req, res) => {
        const { q } = req.query;

        if (!q) return res.status(400).json({ status: false, creator: "D2:业", error: "Mau cari gambar apa?" });

        try {
            const result = await pinSearch(q);
            res.json({
                status: true,
                creator: "D2:业",
                total: result.length,
                result: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: "Server API Pinterest lagi tumbang." });
        }
    });
};
