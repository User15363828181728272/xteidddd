const puppeteer = require('puppeteer');

/**
 * Random ASCII Generator (Puppeteer Scraper)
 * Path: /v1/tools/random-ascii
 * Creator: D2:业
 */

async function scrapeRandomAscii(options = {}) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.goto('https://onlinetools.com/ascii/generate-random-ascii', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        await page.waitForSelector('#tool-output textarea.data');

        // Input Length
        if (options.length) {
            await page.evaluate((val) => {
                const el = document.querySelector('input[data-index="length"]');
                if (el) { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }
            }, options.length);
        }

        // Input Count
        if (options.count) {
            await page.evaluate((val) => {
                const el = document.querySelector('input[data-index="count"]');
                if (el) { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }
            }, options.count);
        }

        // Select Charset
        if (options.charset) {
            await page.evaluate((val) => {
                const el = document.querySelector('select[data-index="predefined-charset"]');
                if (el) { el.value = val; el.dispatchEvent(new Event('change', { bubbles: true })); }
            }, options.charset);
        }

        // Tunggu generate (Simulasi klik action)
        await new Promise(r => setTimeout(r, 1000));
        await page.click('#tour-action');
        await new Promise(r => setTimeout(r, 1500));

        const result = await page.evaluate(() => {
            return document.querySelector('#tool-output textarea.data')?.value || null;
        });

        await browser.close();
        return result;
    } catch (err) {
        await browser.close();
        throw err;
    }
}

module.exports = function (app) {
    app.get("/v1/tools/random-ascii", async (req, res) => {
        try {
            const { length, count, charset } = req.query;
            
            const data = await scrapeRandomAscii({
                length: length || 16,
                count: count || 1,
                charset: charset || 'alphanumeric'
            });

            res.json({
                status: true,
                creator: "D2:业",
                result: data,
                options: { length, count, charset }
            });
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                creator: "D2:业", 
                error: "Gagal generate ASCII, server onlinetools mungkin sibuk." 
            });
        }
    });
};
