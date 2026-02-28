const axios = require('axios');
const crypto = require('crypto');

const Instagram = {
    encrypt(text) {
        try {
            const key = Buffer.from('qwertyuioplkjhgf', 'utf-8');
            const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
            cipher.setAutoPadding(true);
            let encrypted = cipher.update(text, 'utf-8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted;
        } catch (err) {
            throw new Error("Encrypt failed: " + err.message);
        }
    },

    async download(url) {
        const encLink = this.encrypt(url);
        const config = {
            method: 'get',
            url: 'https://api.videodropper.app/allinone',
            headers: {
                'accept': '*/*',
                'origin': 'https://fastvideosave.net',
                'referer': 'https://fastvideosave.net/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'url': encLink
            }
        };
        const { data } = await axios(config);
        return data;
    }
};

module.exports = function (app) {
    app.get("/download/igdl", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ status: false, error: "Link Instagram-nya mana?" });

        try {
            const data = await Instagram.download(url);
            
            res.json({
                status: true,
                creator: "D2:业",
                result: data.data // Berisi array link download video/foto
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
