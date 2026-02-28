const axios = require('axios');

module.exports = function (app) {
    app.get("/download/spotify", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, error: "URL Spotify wajib ada!" });

        const base = "https://api.videodropper.app";
        const scrapeApi = `${base}/api/download/get-url`;

        try {
            const scrapeRes = await axios.post(
                scrapeApi,
                { url: url },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    }
                }
            );

            let dlUrl = scrapeRes.data?.originalVideoUrl;
            if (!dlUrl) throw new Error("Link download tidak ditemukan.");

            // Fix relative path
            if (dlUrl.startsWith("/")) {
                dlUrl = base + dlUrl;
            }

            // Stream langsung audionya ke user
            const audioRes = await axios.get(dlUrl, { responseType: 'stream' });
            
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="spotify_music.mp3"`
            });

            return audioRes.data.pipe(res);
        } catch (err) {
            res.status(500).json({ status: false, error: "Download Error: " + err.message });
        }
    });
};
