const cheerio = require('cheerio');

/**
 * Al-Qur'an Digital (NU Online Scraper)
 * Path: /v1/religi/quran
 * Creator: D2:业
 */

async function listSurah() {
    const htmlRaw = await fetch('https://quran.nu.or.id');
    if (!htmlRaw.ok) throw new Error('Gagal mengambil daftar surah');
    const html = await htmlRaw.text();
    const $ = cheerio.load(html);
    const result = [];

    $('.line-clamp-1').each((i, el) => {
        const title = $(el).attr('title');
        const href = $(el).attr('href');
        if (title && href) {
            result.push({
                no: i + 1,
                title: title.trim(),
                id: href.replace('/', ''), // Contoh: 'al-fatihah'
                link: 'https://quran.nu.or.id' + href
            });
        }
    });
    return result;
}

async function readSurah(id) {
    const url = `https://quran.nu.or.id/${id}`;
    const htmlRaw = await fetch(url);
    if (!htmlRaw.ok) throw new Error('Surah tidak ditemukan');
    const html = await htmlRaw.text();
    const $ = cheerio.load(html);
    const result = [];

    $('.flex-grow.flex').each((i, el) => {
        const arab = $(el).find('.__className_8a198f').text().trim();
        const latin = $(el).find('.mb-3').text().trim();
        const indo = $(el).find('.text-neutral-700').text().trim();
        
        if (arab) {
            result.push({
                ayat: i + 1,
                arab,
                latin,
                indo
            });
        }
    });
    return result;
}

module.exports = function (app) {
    // Endpoint List Surah
    app.get("/v1/religi/quran", async (req, res) => {
        try {
            const data = await listSurah();
            res.json({
                status: true,
                creator: "D2:业",
                result: data
            });
        } catch (err) {
            res.status(500).json({ status: false, creator: "D2:业", error: err.message });
        }
    });

    // Endpoint Detail Surah (Baca)
    app.get("/v1/religi/quran/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const data = await readSurah(id);
            res.json({
                status: true,
                creator: "D2:业",
                surah: id,
                result: data
            });
        } catch (err) {
            res.status(500).json({ status: false, creator: "D2:业", error: err.message });
        }
    });
};
