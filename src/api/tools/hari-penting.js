const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Daftar Hari Penting Indonesia Scraper
 * Source: Wikipedia / AgungDevX
 * Category: Information / Tools
 */

async function getHariPenting() {
    try {
        const url = "https://id.wikipedia.org/wiki/Daftar_hari_penting_di_Indonesia";
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(data);
        const hasil = [];

        $('.mw-parser-output ul li').each((i, el) => {
            const text = $(el).text().trim();
            
            if (text.includes(':')) {
                const parts = text.split(':');
                const tanggal = parts[0].trim();
                const event = parts[1].trim();

                const cleanText = (t) => t.replace(/\[\d+\]/g, '').trim();

                // Pastikan yang masuk adalah format tanggal (mengandung angka)
                if (/\d/.test(tanggal) && tanggal.length < 30) {
                    hasil.push({
                        tanggal: cleanText(tanggal),
                        event: cleanText(event)
                    });
                }
            }
        });

        return hasil;
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/tools/hari-penting
     * @description Mendapatkan daftar hari besar dan penting di Indonesia
     */
    app.get("/v1/tools/hari-penting", async (req, res) => {
        try {
            const data = await getHariPenting();
            res.json({
                status: true,
                creator: "D2:业",
                total_data: data.length,
                result: data
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
