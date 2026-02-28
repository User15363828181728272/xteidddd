const axios = require('axios');

/**
 * 🤖 SoftOrbits AI Chat (UPGRADED V2)
 * Path: /v2/ai/softorbits
 * Creator: D2:业
 */

const generateRandomId = (length = 16) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

module.exports = function (app) {
    app.get("/v2/ai/softorbits", async (req, res) => {
        try {
            const { ask } = req.query;
            if (!ask) {
                return res.status(400).json({ 
                    status: false, 
                    creator: "D2:业", 
                    error: "Parameter 'ask' jangan lupa diisi, Bos!" 
                });
            }

            const url = 'https://cf-worker.pr-2da.workers.dev/api/chat';
            const mId = generateRandomId();
            
            const payload = {
                id: "D2_YE_SESSION",
                messages: [{
                    role: "user",
                    parts: [{ type: "text", text: ask }],
                    id: mId
                }],
                metadata: {},
                tools: {},
                trigger: "submit-message"
            };

            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'https://www.softorbits.net',
                    'Referer': 'https://www.softorbits.net/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                },
                responseType: 'stream',
                timeout: 30000
            });

            let fullReply = "";

            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                for (let line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const parsed = JSON.parse(line.replace('data: ', ''));
                            if (parsed.type === 'text-delta') {
                                fullReply += parsed.delta;
                            }
                        } catch (e) {}
                    }
                }
            });

            response.data.on('end', () => {
                res.json({
                    status: true,
                    creator: "D2:业",
                    result: fullReply.trim()
                });
            });

        } catch (err) {
            res.status(500).json({ 
                status: false, 
                creator: "D2:业", 
                error: "SoftOrbits sedang gangguan atau timeout.",
                detail: err.message 
            });
        }
    });
};