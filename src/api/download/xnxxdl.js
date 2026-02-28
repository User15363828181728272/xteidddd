const axios = require('axios');

module.exports = function (app) {
    app.get("/download/xnxx", async (req, res) => {
        const { url, quality } = req.query; // quality: 'high' atau 'low'
        if (!url) return res.status(400).json({ status: false, error: "URL video wajib ada!" });

        try {
            const { data } = await axios.get(`https://apis.sandarux.sbs/api/download/xnxx-dl`, {
                params: { url, apikey: 'sayangku' }
            });

            if (!data.status) throw new Error("Gagal mendapatkan link download.");

            const selectedQuality = quality === 'low' ? 'low' : 'high';
            const streamUrl = data.links[selectedQuality];

            // Stream langsung videonya ke user
            const videoRes = await axios.get(streamUrl, { responseType: 'stream' });
            
            res.set({
                'Content-Type': 'video/mp4',
                'Content-Disposition': `attachment; filename="${data.title || 'video'}.mp4"`
            });

            return videoRes.data.pipe(res);
        } catch (err) {
            res.status(500).json({ status: false, error: "Download Error: " + err.message });
        }
    });
};
