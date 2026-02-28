const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Telegram ID Stalker (Hybrid Engine)
 * Engine 1: TelegramDB (For User ID)
 * Engine 2: Telegram Web Preview (For Profile Metadata)
 * Category: Stalk
 * Creator: D2:业
 */
async function stalkTeleID(username) {
    const user = username.replace('@', '');
    const publicUrl = `https://t.me/${user}`;
    const dbUrl = `https://telegramdb.org/users/${user}`;

    try {
        // 1. Ambil Data Publik (Pasti ada kalau username bener)
        const { data: webData } = await axios.get(publicUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(webData);
        
        const name = $('.tgme_page_title span').text().trim();
        const bio = $('.tgme_page_description').text().trim();
        const photo = $('.tgme_page_photo_image').attr('src');

        // Jika nama tidak ada, berarti username tidak valid
        if (!name) throw new Error("Username tidak ditemukan.");

        // 2. Coba ambil ID Angka dari Database OSINT
        let idAngka = "NOT_INDEXED";
        try {
            const dbRes = await axios.get(dbUrl, { timeout: 5000 });
            const $db = cheerio.load(dbRes.data);
            
            // Seleksi ID dari tabel atau class spesifik di TelegramDB
            const rawId = $('.user-id').first().text().trim() || 
                          $('td:contains("ID")').next().text().trim() ||
                          $('strong:contains("ID:")').parent().text().replace('ID:', '').trim();
            
            if (rawId && !isNaN(rawId)) {
                idAngka = rawId;
            }
        } catch (dbErr) {
            // Jika DB offline, biarkan idAngka tetap "NOT_INDEXED"
            console.log("OSINT DB Offline/Limit.");
        }

        return {
            id: idAngka,
            username: user,
            name: name,
            bio: bio || "No bio available",
            photo: photo || "https://path-to-default-avatar.com/none.png",
            index_status: idAngka !== "NOT_INDEXED" ? "Found" : "Missing from Database"
        };

    } catch (err) {
        throw new Error(err.message || "Gagal melakukan stalking.");
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/stalk/teleid
     * @query ?username=shannz
     */
    app.get("/v1/stalk/teleid", async (req, res) => {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ 
                status: false, 
                creator: "D2:业",
                error: "Sertakan username tanpa @, Bang!" 
            });
        }

        try {
            const result = await stalkTeleID(username);
            res.json({
                status: true,
                creator: "D2:业",
                result: result
            });
        } catch (err) {
            res.status(404).json({ 
                status: false, 
                creator: "D2:业",
                error: err.message 
            });
        }
    });
};
