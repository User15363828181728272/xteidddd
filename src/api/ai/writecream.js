const axios = require('axios');

async function writeCream(userInput) {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
    ];
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    const params = new URLSearchParams();
    params.append('action', 'generate_chat');
    params.append('query', JSON.stringify([
        { "role": "system", "content": "You are a helpful and informative AI assistant." },
        { "role": "user", "content": userInput }
    ]));
    params.append('link', 'writecream.com');

    const { data } = await axios.post('https://www.writecream.com/wp-admin/admin-ajax.php', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': randomUA,
            'Origin': 'https://www.writecream.com',
            'Referer': 'https://www.writecream.com/ai-chat/',
            'X-Requested-With': 'XMLHttpRequest'
        }
    });

    if (data && data.success) return data.data.response_content;
    throw new Error("WriteCream server rejected the request.");
}

module.exports = function (app) {
    app.get("/ai/writecream", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.json({ status: false, error: "Tanya apa, Kang?" });
        try {
            const result = await writeCream(q);
            res.json({ result });
        } catch (err) {
            res.json({ status: false, error: err.message });
        }
    });
};
