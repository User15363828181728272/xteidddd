const axios = require("axios");
const cheerio = require("cheerio");

async function ffKarakter() {
    try {
        const { data: html } = await axios.get("https://freefire.fandom.com/wiki/Characters", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
            }
        });
        const $ = cheerio.load(html);
        let result = [];

        $('tr').each((i, v) => {
            const tds = $(v).find('td');
            if (tds.length >= 2) {
                const nameTd = $(tds[0]);
                const imageTd = $(tds[1]);
                const name = nameTd.find('a').text().trim();
                const wikiLink = 'https://freefire.fandom.com' + nameTd.find('a').attr('href');
                const fileSpan = imageTd.find('span[typeof="mw:File/Frameless"]');
                const imgLink = fileSpan.find('a').attr('href');
                const img = fileSpan.find('img');
                
                if (name) {
                    result.push({
                        name: name,
                        wiki: wikiLink,
                        image: {
                            original: imgLink,
                            thumbnail: img.attr('data-src') || img.attr('src'),
                            alt: img.attr('alt')
                        }
                    });
                }
            }
        });
        return result;
    } catch (err) {
        throw new Error("Gagal mengambil data karakter FF");
    }
}

module.exports = function (app) {
    app.get("/tools/ff-karakter", async (req, res) => {
        try {
            const result = await ffKarakter();
            res.json({
                status: true,
                creator: "D2:业",
                total: result.length,
                result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
