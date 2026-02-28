const axios = require("axios");

/**
 * YouTube Play Downloader
 * Engine: Deline API
 * Category: Downloader
 * Creator: D2:业
 */
async function ytPlay(query) {
    try {
        const res = await axios.get(
            `https://api.deline.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`,
            { timeout: 20000 }
        );

        if (!res.data?.status || !res.data?.result) {
            throw new Error("Data tidak ditemukan di server Deline.");
        }

        const data = res.data.result;
        return {
            title: data.title,
            url: data.url,
            thumbnail: data.thumbnail,
            quality: data.pick?.quality || "128kbps",
            size: data.pick?.size || "N/A",
            download_url: data.dlink
        };
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/downloader/ytplay
     * @query ?text=judul lagu
     */
    app.get("/v1/search/ytplay", async (req, res) => {
        const { text } = req.query;

        if (!text) {
            return res.status(400).json({ 
                status: false, 
                creator: "D2:业",
                error: "Judul lagunya mana, Bang?" 
            });
        }

        try {
            const result = await ytPlay(text);
            res.json({
                status: true,
                creator: "D2:业",
                result: result
            });
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: "Server Deline mungkin lagi tepar atau kena limit." 
            });
        }
    });
};
