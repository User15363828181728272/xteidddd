const axios = require('axios');

/**
 * AI Image Generator (Text to Image)
 * Source: Crictos AI
 * Category: AI
 * Creator: D2:业
 */

async function generateAIImage(prompt) {
    try {
        const response = await axios.post('https://image.crictos.my.id', 
            { prompt: prompt },
            {
                headers: {
                    'Authorization': 'Bearer nimesh2026',
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer' // Kita ambil sebagai buffer biar gampang diolah
            }
        );
        return response.data;
    } catch (err) {
        throw new Error("Gagal generate gambar. Mungkin API limit atau server down.");
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/ai/text2img
     * @query ?prompt=a cat wearing sunglasses
     */
    app.get("/v2/ai/text2img", async (req, res) => {
        const { prompt } = req.query;

        if (!prompt) return res.status(400).json({ 
            status: false, 
            creator: "D2:业", 
            error: "Masukan prompt-nya, Bos! Contoh: ?prompt=cyberpunk city" 
        });

        try {
            const imageBuffer = await generateAIImage(prompt);
            
            // Kirim balik sebagai format image agar langsung tampil di browser/bot
            res.set("Content-Type", "image/jpeg");
            res.send(imageBuffer);
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
