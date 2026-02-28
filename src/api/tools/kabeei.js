const axios = require('axios');
const cheerio = require('cheerio');

/**
 * KBBI Search Tool
 * Path: /v1/tools/kbbi
 * Creator: D2:业
 */

async function kbbi(kata) {
  try {
    const { data } = await axios.get(`https://kbbi.web.id/${encodeURIComponent(kata)}`, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0'
      }
    });
    
    const $ = cheerio.load(data);
    // Kita ambil text dari ID #d1 yang berisi definisi kata
    const definisi = $('#d1').text().trim();
    
    return definisi || null;
  } catch (err) {
    return null;
  }
}

module.exports = function (app) {
  app.get("/v1/tools/kbbi", async (req, res) => {
    try {
      const { kata } = req.query;

      if (!kata) {
        return res.status(400).json({
          status: false,
          creator: "D2:业",
          error: "Masukkan kata yang ingin dicari, Bos!"
        });
      }

      const result = await kbbi(kata);

      if (!result) {
        return res.json({
          status: false,
          creator: "D2:业",
          msg: `Kata '${kata}' tidak ditemukan dalam KBBI.`
        });
      }

      res.json({
        status: true,
        creator: "D2:业",
        result: {
          kata: kata,
          definisi: result
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "D2:业",
        error: err.message
      });
    }
  });
};
