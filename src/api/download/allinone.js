const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

/**
 * Universal Downloader V4 (AIO Elite)
 * Engine: allinonedownloader.com
 * Security: AES-256-CBC Decryption
 * Source: Fgsi / FongsiDev
 * Creator: D2:业
 */

async function AIODownloader(url) {
    try {
        const res = await axios.get("https://allinonedownloader.com", {
            headers: { "user-agent": "Mozilla/5.0" }
        });
        const $ = cheerio.load(res.data);
        const token = $("#token").val();
        const pos = $("#scc").val();
        
        if (!token || !pos) throw new Error("Gagal mengambil token halaman.");

        const key = Buffer.from(token, "hex");
        const iv = Buffer.from("afc4e290725a3bf0ac4d3ff826c43c10", "hex");

        let data = Buffer.from(url, "utf8");
        const block = 16;
        const mod = data.length % block;
        const pad = mod === 0 ? block : block - mod;
        data = Buffer.concat([data, Buffer.alloc(pad, 0x00)]);

        const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
        cipher.setAutoPadding(false);

        const encrypted = Buffer.concat([
            cipher.update(data),
            cipher.final()
        ]);

        const urlhash = encrypted.toString("base64");
        const cookie = res.headers["set-cookie"]?.[0];

        const response = await axios.post(
            "https://allinonedownloader.com" + pos,
            new URLSearchParams({
                url,
                token,
                urlhash,
                pos
            }),
            {
                headers: {
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "cookie": cookie,
                    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
                    "x-requested-with": "XMLHttpRequest"
                }
            }
        );
        return response.data;
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/download/aio
     * @query ?url=https://www.instagram.com/reel/xxx
     */
    app.get("/v1/download/allinone", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, msg: "URL mana, Cik?" });

        try {
            const result = await AIODownloader(url);
            res.json({
                status: true,
                creator: "D2:业",
                result: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
