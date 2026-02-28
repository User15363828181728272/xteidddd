const axios = require('axios');

class Zerochan {
    constructor() {
        this.is = axios.create({
            baseURL: "https://www.zerochan.net",
            headers: {
                "user-agent": "okhttp/3.14.9"
            }
        });
        this.cookie = "";
    }

    async getCookie() {
        if (!this.cookie) {
            const { headers } = await this.is.get("/xbotcheck-image.svg");
            const cookie = headers["set-cookie"]?.[0];
            if (!cookie) throw new Error("Failed to get Zerochan cookie");
            this.is.defaults.headers.cookie = cookie;
            this.cookie = cookie;
        }
    }

    async search(query) {
        await this.getCookie();
        const res = await this.is.get("/search", {
            validateStatus: () => true,
            maxRedirects: 0,
            params: { q: query }
        });
        if (!res.headers.location) return [];
        const { data } = await this.is.get(res.headers.location, {
            params: { s: "recent", json: 1 }
        });
        return data?.items || [];
    }

    async detail(id) {
        await this.getCookie();
        const { data } = await this.is.get(`/${id}`, {
            params: { json: 1 }
        });
        return data;
    }
}

const zc = new Zerochan();

module.exports = function (app) {
    /**
     * @endpoint /search/zerochan
     * @description Cari gambar anime di Zerochan.
     */
    app.get("/search/zerochan", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.json({ status: false, error: "Mau cari karakter apa, Kang?" });

        try {
            const result = await zc.search(q);
            res.json({ status: true, result });
        } catch (err) {
            res.json({ status: false, error: err.message });
        }
    });

    /**
     * @endpoint /search/zerochan-detail
     * @description Ambil detail gambar HD berdasarkan ID Zerochan.
     */
    app.get("/search/zerochan-detail", async (req, res) => {
        const { id } = req.query;
        if (!id) return res.json({ status: false, error: "Masukkan ID-nya!" });

        try {
            const result = await zc.detail(id);
            res.json({ status: true, result });
        } catch (err) {
            res.json({ status: false, error: err.message });
        }
    });
};
