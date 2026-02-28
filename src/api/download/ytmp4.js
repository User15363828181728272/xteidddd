const axios = require('axios');

/**
 * YouTube Video Downloader V2 (MP4 ONLY)
 * Category: Download
 * Logic: Auto High Quality (720p)
 */

async function ytdlV2(youtubeUrl) {
    const headers = {
        "Content-Type": "application/json",
        "Origin": "https://ytmp3.gg",
        "Referer": "https://ytmp3.gg/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };

    // Kita patenkan di sini: Video MP4 720p
    const payload = {
        url: youtubeUrl,
        os: "windows",
        output: {
            type: "video",
            format: "mp4",
            quality: "720p"
        }
    };

    try {
        let res;
        try {
            res = await axios.post("https://hub.ytconvert.org/api/download", payload, { headers });
        } catch {
            res = await axios.post("https://api.ytconvert.org/api/download", payload, { headers });
        }

        const statusUrl = res.data.statusUrl;
        let finalData = null;

        // Loop nungguin proses convert di server sana
        while (!finalData) {
            const check = await axios.get(statusUrl, { headers });
            if (check.data.status === "completed" || check.data.downloadUrl) {
                finalData = check.data;
            } else if (check.data.status === "failed") {
                throw new Error("Konversi gagal di server sumber.");
            } else {
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        return {
            title: finalData.title,
            format: "mp4",
            quality: "720p",
            download: finalData.downloadUrl
        };
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v2/download/ytdl
     * @query ?url=https://youtu.be/xxx
     */
    app.get("/v2/download/ytmp4", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, error: "Linknya mana, Bos?" });

        try {
            const result = await ytdlV2(url);
            res.json({
                status: true,
                creator: "D2:业",
                result: result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: "Lagi sibuk servernya, coba bentar lagi." });
        }
    });
};
