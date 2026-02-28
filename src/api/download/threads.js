const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Threads Downloader
 * Source: savethr.com / AgungDevx
 * Category: Download
 * Creator: D2:业
 */

async function threadsDl(url) {
    try {
        const form = new URLSearchParams();
        form.append("id", url);
        form.append("locale", "en");

        const { data } = await axios.post("https://savethr.com/process", form, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "HX-Request": "true",
                "HX-Target": "result-container",
                "HX-Current-URL": "https://savethr.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
        });

        const $ = cheerio.load(data);
        
        const downloadUrl = $("a.download_link").attr("href");
        if (!downloadUrl) throw new Error("Gagal mengambil link download. Pastikan URL Threads benar.");

        return {
            user: $(".font-semibold.text-gray-900.text-sm").first().text().trim() || "Unknown",
            profilePic: $(".w-12.h-12.rounded-full").attr("src"),
            preview: $(".w-full.h-40.object-cover").attr("src"),
            download: downloadUrl
        };

    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/download/threads
     * @query ?url=https://www.threads.net/@user/post/xxx
     */
    app.get("/v1/download/threads", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, error: "Link Threads-nya mana, Bos?" });

        try {
            const result = await threadsDl(url);
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
