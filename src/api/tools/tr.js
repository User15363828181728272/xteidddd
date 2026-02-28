const axios = require('axios');

const langList = {
    id: "Indonesian", en: "English", ja: "Japanese", ko: "Korean",
    zh: "Chinese", ar: "Arabic", hi: "Hindi", fr: "French",
    de: "German", es: "Spanish", ru: "Russian", pt: "Portuguese",
    it: "Italian", tr: "Turkish", th: "Thai", vi: "Vietnamese",
    ms: "Malay", nl: "Dutch", pl: "Polish"
};

module.exports = function (app) {
    /**
     * @endpoint /tools/translate
     * @description Terjemahkan teks ke berbagai bahasa via Google Translate.
     */
    app.get("/tools/translate", async (req, res) => {
        const { text, to } = req.query;

        // Jika tidak ada parameter, kasih list bahasa
        if (!text || !to) {
            return res.status(400).json({
                status: false,
                error: "Parameter 'text' dan 'to' wajib ada!",
                example: "/tools/translate?text=Halo&to=en",
                list_languages: langList
            });
        }

        const target = to.toLowerCase();
        if (!langList[target]) {
            return res.status(400).json({
                status: false,
                error: "Bahasa tidak tersedia!",
                available_languages: Object.keys(langList)
            });
        }

        try {
            const { data } = await axios.get("https://translate.googleapis.com/translate_a/single", {
                params: {
                    client: "gtx",
                    sl: "auto",
                    tl: target,
                    dt: "t",
                    q: text
                }
            });

            const result = data[0].map(v => v[0]).join("");

            res.json({
                status: true,
                result: {
                    from: data[2], // Deteksi bahasa asal otomatis
                    to: langList[target],
                    text: result
                }
            });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });
};
