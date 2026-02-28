const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Chord Gitar & Lirik Scraper
 * Source: Gitagram / AgungDevX
 * Category: Entertainment / Tools
 * Creator: D2:业
 */

class Chords {
    constructor() {
        this.base = "https://www.gitagram.com";
        this.ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';
    }

    async search(query) {
        try {
            const { data } = await axios.get(`${this.base}/index.php?cat=&s=${encodeURIComponent(query)}`, {
                headers: { 'User-Agent': this.ua }
            });
            const $ = cheerio.load(data);
            let results = [];
            $("table.table tbody tr").each((i, el) => {
                let title = $(el).find("span.title.is-6").text().trim();
                let artist = $(el).find("span.subtitle.is-6").text().replace("‣", "").trim();
                let link = $(el).find("a").attr("href");
                if (title) {
                    results.push({
                        title, artist,
                        link: link.startsWith('http') ? link : `${this.base}${link}`
                    });
                }
            });
            return results;
        } catch (e) { return []; }
    }

    async detail(url) {
        try {
            const { data } = await axios.get(url, { headers: { 'User-Agent': this.ua } });
            const $ = cheerio.load(data);
            let chords = "";
            $("div.content pre").each((i, el) => { chords += $(el).text() + "\n"; });
            return {
                title: $("h1.title.is-5").text().trim(),
                artist: $("div.subheader a span.subtitle").text().replace("‣", "").trim(),
                thumb: $("figure.image img").attr("src") || null,
                chords: chords.trim()
            };
        } catch (e) { throw new Error("Gagal mengambil detail chord."); }
    }
}

const chordScraper = new Chords();

module.exports = function (app) {
    /**
     * @endpoint /v1/tools/chord
     * @query ?q=judul_lagu ATAU url_chord
     */
    app.get("/v1/tools/chord", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, error: "Masukan judul lagu atau link gitagram!" });

        try {
            // Jika inputnya link gitagram, langsung ambil detail
            if (q.includes("gitagram.com/chords/")) {
                const result = await chordScraper.detail(q);
                return res.json({ status: true, creator: "D2:业", type: "detail", result });
            }

            // Jika inputnya judul, lakukan pencarian
            const results = await chordScraper.search(q);
            if (results.length === 0) return res.status(404).json({ status: false, error: "Chord tidak ditemukan." });

            res.json({
                status: true,
                creator: "D2:业",
                type: "search",
                results
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
