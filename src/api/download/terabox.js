const axios = require('axios');
const FormData = require('form-data');

async function teraboxdl(urls) {
    const form = new FormData();
    form.append('action', 'terabox_fetch');
    form.append('url', urls);
    form.append('nonce', '96dddaff35');

    const { data: result } = await axios.post('https://terabxdownloader.org/wp-admin/admin-ajax.php', form, {
        headers: {
            ...form.getHeaders(),
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
            "referer": "https://terabxdownloader.org/",
            "x-requested-with": "XMLHttpRequest"
        }
    });

    if (!result.success || !result.data) {
        throw new Error(typeof result.data === 'string' ? result.data : "Gagal mengambil data Terabox.");
    }

    const data = result.data;
    const files = data['📄 Files'] || [];

    return {
        status: data['✅ Status'] || "Success",
        files: files.map(f => ({
            name: f['📂 Name'] || "No Name",
            url: f['🔽 Direct Download Link'] || "",
            size: f['📏 Size'] || "Unknown"
        })),
        shortLink: data['🔗 ShortLink'] || ""
    };
}

module.exports = function (app) {
    /**
     * @endpoint /download/terabox
     * @description Download file Terabox via TerabxDownloader
     */
    app.get("/download/terabox", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.json({ status: false, error: "Mana link Terabox-nya, Kang?" });

        try {
            const result = await teraboxdl(url);
            res.json({
                status: true,
                result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
