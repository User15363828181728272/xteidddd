const axios = require('axios');

module.exports = function (app) {
    /**
     * @endpoint /search/xnxx
     * @description Mencari video dari database XNXX menggunakan apikey khusus.
     */
    app.get("/search/xnxx", async (req, res) => {
        const { q } = req.query;
        const API_KEY = 'sayangku'; // Apikey sesuai request kamu

        if (!q) {
            return res.status(400).json({ 
                status: false, 
                error: "Masukkan kata kunci pencarian, Bos!" 
            });
        }

        try {
            const { data } = await axios.get(`https://apis.sandarux.sbs/api/download/xnxx-search`, {
                params: { 
                    q: q, 
                    apikey: API_KEY 
                }
            });

            if (!data.status || !data.data) {
                return res.status(404).json({ 
                    status: false, 
                    error: "Video tidak ditemukan atau API Error." 
                });
            }

            res.json({
                status: true,
                creator: "D2:业",
                result: data.data.map(video => ({
                    title: video.title,
                    id: video.videoId,
                    duration: video.duration,
                    info: video.info,
                    url: video.url // URL ini yang nanti dipake buat download
                }))
            });
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: "Terjadi kesalahan pada server: " + err.message 
            });
        }
    });
};
