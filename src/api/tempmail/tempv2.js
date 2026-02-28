const cloudscraper = require('cloudscraper');

const tempMailV2 = {
    api: {
        base: 'https://web2.temp-mail.org',
        mailbox: '/mailbox',
        messages: '/messages'
    },

    _req: async (options, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await cloudscraper({
                    ...options,
                    cloudflareTimeout: 7000,
                    followAllRedirects: true,
                    json: false
                });
                return typeof response === 'string' ? JSON.parse(response) : response;
            } catch (err) {
                if (i === maxRetries - 1) throw new Error(err.error || err.message);
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }
};

module.exports = function (app) {
    /**
     * @endpoint /tools/tempmail-v2-gen
     * @description Generate Premium Temp Mail (temp-mail.org)
     */
    app.get("/tempmail/tempmail", async (req, res) => {
        try {
            const result = await tempMailV2._req({
                uri: tempMailV2.api.base + tempMailV2.api.mailbox,
                method: 'POST',
                body: '{}'
            });

            res.json({
                status: true,
                result: {
                    token: result.token,
                    email: result.mailbox
                }
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });

    /**
     * @endpoint /tools/tempmail-v2-inbox
     * @description Cek inbox Temp Mail V2 menggunakan Token.
     */
   
};
