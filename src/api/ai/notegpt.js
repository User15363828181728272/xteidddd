const axios = require('axios');

async function NoteGPT(message) {
    const conversation_id = Date.now().toString(16) + "-" + Math.random().toString(16).slice(2, 10);
    
    try {
        const { data } = await axios.post("https://notegpt.io/api/v2/chat/stream", {
            message,
            language: "auto",
            model: "gpt-4.1-mini",
            tone: "default",
            length: "moderate",
            conversation_id,
            image_urls: [],
            chat_mode: "standard",
        }, { 
            headers: { "Content-Type": "application/json" },
            responseType: "stream" 
        });

        return new Promise((resolve, reject) => {
            let fullText = "";
            data.on("data", chunk => {
                const lines = chunk.toString().split("\n");
                for (let line of lines) {
                    if (line.startsWith("data: ")) {
                        const jsonStr = line.replace("data: ", "").trim();
                        if (!jsonStr) continue;
                        try {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.text) fullText += parsed.text;
                            if (parsed.done) resolve(fullText.trim());
                        } catch {}
                    }
                }
            });
            data.on("error", reject);
            data.on("end", () => resolve(fullText.trim()));
        });
    } catch (err) {
        throw new Error(err.response?.data?.message || err.message);
    }
}

module.exports = function (app) {
    app.get("/ai/notegpt", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.json({ status: false, error: "Tanya apa, Kang?" });

        try {
            const result = await NoteGPT(q);
            res.json({ result });
        } catch (err) {
            res.json({ status: false, error: err.message });
        }
    });
};
