const axios = require('axios');

/**
 * XHamster & XV Video Downloader (Public Version)
 * Engine: Savethevideo
 * Category: Download
 * Creator: D2:业
 */
async function xhamsterDl(targetUrl) {
    const apiUrl = 'https://api.v02.savethevideo.com/tasks';
    const payload = { type: "info", url: targetUrl };
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        'Referer': 'https://www.savethevideo.com/',
        'Origin': 'https://www.savethevideo.com'
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        let data;
        let attempts = 0;
        const maxAttempts = 5; // Kita persingkat biar user gak nunggu kelamaan
        let waitTime = 5000;

        while (attempts < maxAttempts) {
            const response = await axios.post(apiUrl, payload, { headers });
            data = response.data;

            if (data && data.state === "completed") {
                break;
            } else if (data.state === "pending" || data.state === "processing") {
                attempts++;
                await sleep(waitTime);
            } else {
                throw new Error("Engine busy. Try again.");
            }
        }

        if (!data || data.state !== "completed") throw new Error("Timeout. Try again later.");

        const result = data.result[0];
        return {
            title: result.title,
            thumbnail: result.thumbnail,
            duration: result.duration,
            links: result.formats.map(v => {
                let quality = "Normal";
                if (v.url.includes("1080p")) quality = "1080p (FHD)";
                else if (v.url.includes("720p")) quality = "720p (HD)";
                else if (v.url.includes("480p")) quality = "480p (SD)";
                else if (v.url.includes("240p")) quality = "240p (Low)";
                
                return {
                    quality: quality,
                    url: v.url
                };
            })
        };
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/download/xhamster
     * @method GET
     */
    app.get("/v1/download/xv", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ 
                status: false, 
                error: "Sertakan URL videonya, Bang D2:业!" 
            });
        }

        try {
            const result = await xhamsterDl(url);
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
