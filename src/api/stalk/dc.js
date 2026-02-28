const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Discord User Stalker / Lookup
 * Scraper via Rappytv
 * Category: Stalk
 * Creator: D2:业
 */
async function discordLookup(id) {
    try {
        const { data } = await axios.get(`https://id.rappytv.com/${id}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        
        // Cek apakah ID ditemukan (biasanya elemen hasil bakal kosong kalau zonk)
        const checkId = $('span.resulth').first().text().trim();
        if (!checkId) throw new Error("User ID Discord tidak ditemukan.");

        return {
            id: checkId,
            global_name: $('strong:contains("Global Name")').parent().find('.resulth').text().trim() || null,
            display_name: $('strong:contains("Display Name")').parent().find('.resulth').text().trim() || null,
            avatar: $('.avyimg').attr('src') || null,
            created: $('strong:contains("Created")').parent().find('.resulth').text().trim() || null,
            banner_color: $('#color').attr('style')?.match(/background-color:\s*(#[0-9a-fA-F]+)/)?.[1] || null
        };
    } catch (err) {
        throw new Error("Gagal mengambil data Discord. Pastikan ID benar.");
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/stalk/discord
     * @method GET
     */
    app.get("/v1/stalk/discord", async (req, res) => {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ 
                status: false, 
                error: "Sertakan User ID Discord-nya, Bang D2:业!" 
            });
        }

        try {
            const result = await discordLookup(id);

            res.json({
                status: true,
                creator: "D2:业",
                result: result
            });
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
