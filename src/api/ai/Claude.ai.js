const axios = require('axios');
const FormData = require('form-data');

/**
 * 🤖 Claude 3 Haiku (via DeepAI) - UPGRADED V2
 * Path: /v2/ai/claude
 * Creator: D2:业
 */

// Helper: Ambil Token Fresh dari DeepAI
async function getDeepToken() {
    try {
        const { data } = await axios.get("https://deepai.org/chat", {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36' 
            }
        });
        const match = data.match(/tryit-[\d]+-([a-f0-9]+)/);
        const r = Math.floor(1e11 * Math.random());
        return match ? `tryit-${r}-${match[1]}` : `tryit-${r}-a3edf17b505349f1794bcdbc7290a045`;
    } catch {
        return `tryit-${Math.floor(1e11 * Math.random())}-a3edf17b505349f1794bcdbc7290a045`;
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

module.exports = function (app) {
    app.get("/v2/ai/claude", async (req, res) => {
        try {
            const { ask } = req.query;
            if (!ask) {
                return res.status(400).json({ 
                    status: false, 
                    creator: "D2:业", 
                    error: "Parameter 'ask' wajib diisi, Bos!" 
                });
            }

            const apiKey = await getDeepToken();
            const sessionUuid = generateUUID();

            const formData = new FormData();
            formData.append('chat_style', 'claudeai_0');
            formData.append('chatHistory', JSON.stringify([{ role: "user", content: ask }]));
            formData.append('model', 'standard');
            formData.append('session_uuid', sessionUuid);
            formData.append('hacker_is_stinky', 'very_stinky');

            const response = await axios.post("https://api.deepai.org/hacking_is_a_serious_crime", formData, {
                headers: {
                    "api-key": apiKey,
                    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
                    "referer": "https://deepai.org/chat/claude-3-haiku",
                    ...formData.getHeaders()
                },
                timeout: 30000
            });

            res.json({
                status: true,
                creator: "D2:业",
                result: response.data
            });

        } catch (err) {
            res.status(500).json({ 
                status: false, 
                creator: "D2:业", 
                error: "Claude sedang istirahat, coba lagi nanti.",
                detail: err.response?.data || err.message 
            });
        }
    });
};