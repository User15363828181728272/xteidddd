const axios = require('axios');

/**
 * Telegram Sticker Downloader
 * Scraper via fstik.app
 * Category: Download
 * Creator: D2:业
 */
async function scrapeFstiker(input) {
    let name = input.trim();
    // Logic untuk ambil pack name dari URL atau teks biasa
    if (name.includes('/addstickers/')) {
        name = name.split('/addstickers/')[1].split('?')[0];
    }

    try {
        const res = await axios.post('https://api.fstik.app/getStickerSetByName', 
            { 
                name: name, 
                user_token: null 
            }, 
            { 
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'content-type': 'application/json',
                    'origin': 'https://webapp.fstik.app',
                    'referer': 'https://webapp.fstik.app/',
                    'user-agent': 'NB Android/1.0.0'
                }
            }
        );

        const data = res.data;

        if (data.ok && data.result) {
            const set = data.result;
            
            const stickerLinks = set.stickers
                .map(s => {
                    const id = s.thumb?.file_id ?? s.thumb?.fileid;
                    return id ? `https://api.fstik.app/file/${id}/sticker.webp` : null;
                })
                .filter(url => url !== null);

            return {
                info: {
                    title: set.title,
                    name: set.name,
                    is_animated: set.is_animated,
                    count: stickerLinks.length
                },
                results: stickerLinks 
            };
        } else {
            throw new Error("Sticker pack tidak ditemukan.");
        }

    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/download/tstiker
     * @method GET
     */
    app.get("/v1/download/tstiker", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ 
                status: false, 
                error: "Masukin link stiker atau nama pack-nya, Bang" 
            });
        }

        try {
            const result = await scrapeFstiker(url);

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
