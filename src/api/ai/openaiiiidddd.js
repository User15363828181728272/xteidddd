const axios = require('axios');
const FormData = require('form-data');

/**
 * 🤖 OpenAI ID Chat Scraper (UPGRADED V2)
 * Path: /v2/ai/openaiid
 * Creator: D2:业
 */

module.exports = function (app) {
    app.get("/v2/ai/openaiid", async (req, res) => {
        try {
            const { ask } = req.query;
            if (!ask) return res.status(400).json({ status: false, creator: "D2:业", error: "Parameter 'ask' wajib diisi!" });

            // Upgrade: Dynamic Client ID & Better Timeout
            const formData = new FormData();
            formData.append('_wpnonce', "22283ad593"); 
            formData.append('post_id', '2');
            formData.append('url', 'https://chatopenai.id');
            formData.append('action', 'wpaicg_chat_shortcode_message');
            formData.append('message', ask);
            formData.append('bot_id', '0');
            formData.append('chatbot_identity', 'shortcode');
            formData.append('wpaicg_chat_client_id', Math.random().toString(36).substring(7));
            formData.append('wpaicg_chat_history', '[]');

            const response = await axios.post("https://chatopenai.id/wp-admin/admin-ajax.php", formData, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0",
                    ...formData.getHeaders()
                },
                timeout: 15000
            });

            if (response.data?.status === "success") {
                res.json({
                    status: true,
                    creator: "D2:业",
                    result: response.data.data
                });
            } else {
                throw new Error("Provider sedang limit atau Nonce kadaluarsa.");
            }

        } catch (err) {
            res.status(500).json({ status: false, creator: "D2:业", error: err.message });
        }
    });
};