const Tesseract = require('tesseract.js');

/**
 * AI OCR Pro (Auto Language)
 * Logic: Extract text from image with auto detection
 * Creator: D2:业
 */

module.exports = function (app) {
    app.get("/tools/ocr", async (req, res) => {
        const { url } = req.query;

        if (!url) return res.status(400).json({ status: false, msg: "Gambarnya mana, Bos? Masukin link dulu!" });

        try {
            // Langsung proses, Tesseract bakal handle deteksi teks dasar secara global
            const result = await Tesseract.recognize(
                url,
                'ind+eng', // Kita aktifkan Indo & Inggris sekaligus biar gak perlu milih
                { logger: m => console.log(m) }
            );

            res.json({
                status: true,
                creator: "D2:业",
                results: {
                    text: result.data.text.trim(),
                    confidence: `${Math.round(result.data.confidence)}%`
                }
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ status: false, error: "Gagal baca gambar. Pastikan gambarnya jelas dan link-nya benar!" });
        }
    });
};
