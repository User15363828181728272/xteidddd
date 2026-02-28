const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * TalkAI GPT-4.1 Nano Wrapper
 * Category: AI
 * Creator: D2:业 (Scrape by Sandarux)
 */
async function talkToAI(userMessage) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios({
                method: 'post',
                url: 'https://talkai.info/chat/send/',
                data: {
                    type: "chat",
                    messagesHistory: [
                        {
                            id: uuidv4(),
                            from: "you",
                            content: userMessage,
                            model: ""
                        }
                    ],
                    settings: {
                        model: "gpt-4.1-nano",
                        temperature: 0.7
                    }
                },
                headers: {
                    'Accept': 'text/event-stream',
                    'Content-Type': 'application/json',
                    'Origin': 'https://talkai.info',
                    'Referer': 'https://talkai.info/chat/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                },
                responseType: 'stream'
            });

            let fullText = "";

            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                lines.forEach(line => {
                    // Filter data stream agar bersih dari noise
                    if (line.startsWith('data: ') && !line.includes('GPT 4.1 nano') && !line.includes('-1')) {
                        let content = line.replace('data: ', '').trim();
                        // Hilangkan tanda kutip jika ada di awal/akhir stream
                        if (content && content !== '"' && content !== '""') {
                            fullText += content.replace(/^"|"$/g, '') + "";
                        }
                    }
                });
            });

            response.data.on('end', () => {
                resolve(fullText.trim().replace(/\s+/g, ' '));
            });

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = function (app) {
    /**
     * @endpoint /v1/ai/gpt-nano
     * @method GET
     */
    app.get("/v1/ai/gpt-nano", async (req, res) => {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ 
                status: false, 
                error: "Mau ngomong apa sama AI-nya, Bang D2:业?" 
            });
        }

        try {
            const reply = await talkToAI(query);
            res.json({
                status: true,
                creator: "D2:业",
                result: reply
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
