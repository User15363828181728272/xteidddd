const axios = require('axios');

/**
 * 🤖 Writify AI Chat (UPGRADED V2)
 * Path: /v2/ai/writify
 * Creator: D2:业
 */

module.exports = function (app) {
    app.get("/v2/ai/writify", async (req, res) => {
        try {
            const { ask } = req.query;
            if (!ask) {
                return res.status(400).json({ 
                    status: false, 
                    creator: "D2:业", 
                    error: "Kasih pertanyaan dong, Bos! (Contoh: ?ask=halo)" 
                });
            }

            const baseUrl = 'https://writify.ai/wp-json';

            // 1. Start Session & Get Nonce
            const sessionRes = await axios.post(`${baseUrl}/mwai/v1/start_session`);
            const { restNonce } = sessionRes.data;

            // 2. Submit Chat with Stream
            const response = await axios({
                method: 'post',
                url: `${baseUrl}/mwai-ui/v1/chats/submit`,
                data: {
                    botId: "chatbot-b7j5gh",
                    chatId: "d2ye-" + Math.random().toString(36).substring(7),
                    newMessage: ask,
                    stream: true
                },
                headers: {
                    'X-WP-Nonce': restNonce,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                },
                responseType: 'stream',
                timeout: 30000
            });

            let fullReply = "";

            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                for (let line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.replace('data: ', '').trim();
                        try {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.type === 'live') {
                                fullReply += parsed.data;
                            }
                        } catch (e) {
                            // Skip parse error for non-json lines
                        }
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
                error: "Writify AI sedang lelah, coba lagi nanti.",
                detail: err.response ? err.response.data : err.message 
            });
        }
    });
};