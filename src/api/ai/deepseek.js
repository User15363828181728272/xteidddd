const axios = require('axios');

async function deepseek(message) {
    const conversation_id = Date.now().toString(16) + "-" + Math.random().toString(16).slice(2, 10);
    const { data } = await axios.post("https://notegpt.io/api/v2/chat/stream", {
        message,
        language: "auto",
        model: "deepseek-chat",
        tone: "default",
        length: "moderate",
        conversation_id,
        image_urls: [],
        chat_mode: "standard",
    }, { responseType: "stream" });

    return new Promise((resolve, reject) => {
        let fullText = "";
        data.on("data", chunk => {
            const lines = chunk.toString().split("\n");
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    try {
                        const json = JSON.parse(line.slice(6));
                        if (json.text) fullText += json.text;
                        if (json.done) resolve(fullText.trim());
                    } catch {}
                }
            }
        });
        data.on("error", reject);
        data.on("end", () => resolve(fullText.trim()));
    });
}

module.exports = function (app) {
    app.get("/ai/deepseek", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.json({ status: false, error: "Tanya apa, Bos?" });

        try {
            const result = await deepseek(q);
            res.json({ result });
        } catch (err) {
            res.json({ status: false, error: err.message });
        }
    });
};
