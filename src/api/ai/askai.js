const axios = require('axios');

async function askFreeAI(userInput) {
    const { data } = await axios.post('https://askai.free/api/chat', {
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: userInput }
        ],
        modelName: "ChatGPT 4o",
        currentPagePath: "/chatgpt-4o"
    }, {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Origin': 'https://askai.free',
            'Referer': 'https://askai.free/chatgpt-4o'
        }
    });

    if (data && data.response) return data.response;
    throw new Error("Invalid response from AskAI server.");
}

module.exports = function (app) {
    app.get("/ai/askai", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.json({ status: false, error: "Tanya apa, Kang?" });
        try {
            const result = await askFreeAI(q);
            res.json({ result });
        } catch (err) {
            res.json({ status: false, error: err.message });
        }
    });
};
