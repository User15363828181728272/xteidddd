const cheerio = require('cheerio');
const axios = require('axios');

const generatorEmail = {
    api: {
        base: 'https://generator.email/',
        validate: 'check_adres_validation3.php'
    },
    h: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    },
    async _v(u, d) {
        try {
            const params = new URLSearchParams({ usr: u, dmn: d });
            const res = await axios.post(this.api.base + this.api.validate, params.toString(), {
                headers: { ...this.h, 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return res.data;
        } catch (e) { return { err: e.message }; }
    },
    _p: (e) => e?.includes('@') ? e.split('@') : null,

    async generate() {
        const res = await axios.get(this.api.base, { headers: this.h });
        const $ = cheerio.load(res.data);
        const em = $('#email_ch_text').text();
        if (!em) throw new Error('Gagal generate email');
        const [u, d] = this._p(em);
        const v = await this._v(u, d);
        return { email: em, status: v.status || null, uptime: v.uptime || null };
    },

    async inbox(em) {
        const p = this._p(em);
        if (!p) throw new Error('Email tidak valid');
        const [u, d] = p;
        const v = await this._v(u, d);
        const ck = `surl=${d}/${u}`;
        
        const res = await axios.get(this.api.base, { 
            headers: { ...this.h, Cookie: ck } 
        });
        
        if (res.data.includes('Email generator is ready')) return { email: em, status: v.status, inbox: [] };

        const $ = cheerio.load(res.data);
        const c = parseInt($('#mess_number').text()) || 0;
        const ib = [];
        
        if (c === 1) {
            const el = $('#email-table .e7m.row');
            const sp = el.find('.e7m.col-md-9 span');
            ib.push({
                from: sp.eq(3).text().replace(/\(.*?\)/, '').trim(),
                to: sp.eq(1).text(),
                created: el.find('.e7m.tooltip').text().replace('Created: ', ''),
                subject: el.find('h1').text(),
                message: el.find('.e7m.mess_bodiyy').text().trim()
            });
        } else if (c > 1) {
            const links = $('#email-table a').map((_, a) => $(a).attr('href')).get();
            for (const l of links) {
                const mRes = await axios.get(this.api.base, { 
                    headers: { ...this.h, Cookie: `surl=${l.replace('/', '')}` } 
                });
                const m = cheerio.load(mRes.data);
                const sp = m('.e7m.col-md-9 span');
                ib.push({
                    from: sp.eq(3).text().replace(/\(.*?\)/, '').trim(),
                    to: sp.eq(1).text(),
                    created: m('.e7m.tooltip').text().replace('Created: ', ''),
                    subject: m('h1').text(),
                    message: m('.e7m.mess_bodiyy').text().trim()
                });
            }
        }
        return { email: em, status: v.status, uptime: v.uptime, inbox: ib };
    }
};

module.exports = function (app) {
    // Endpoint Generate Email Baru
    app.get("/tempmail/tempmail-gen", async (req, res) => {
        try {
            const result = await generatorEmail.generate();
            res.json({ status: true, result });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });

    // Endpoint Cek Inbox
    app.get("/tempmail/tempmail-inbox", async (req, res) => {
        const { email } = req.query;
        if (!email) return res.json({ status: false, error: "Masukkan alamat email-nya, Kang!" });
        try {
            const result = await generatorEmail.inbox(email);
            res.json({ status: true, result });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
