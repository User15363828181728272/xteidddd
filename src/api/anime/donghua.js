const axios = require("axios");
const cheerio = require("cheerio");

async function donghua(search) {
  try {
    const { data: html } = await axios.get("https://donghuafilm.com/", {
      params: { s: search },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const $ = cheerio.load(html);
    let result = [];

    $("article.bs").each((i, v) => {
      const $article = $(v);
      const $link = $article.find('a[itemprop="url"]');

      result.push({
        title: $link.attr("title") || "",
        url: $link.attr("href") || "",
        image: $article.find("img").attr("data-src") || $article.find("img").attr("src") || "",
        type: $article.find(".typez").text().trim() || "",
        status: $article.find(".status, .epx").first().text().trim() || "",
        isHot: $article.find(".hotbadge").length > 0,
        subDub: $article.find(".sb").text().trim() || "",
        displayTitle: $article.find(".tt").contents().first().text().trim() || $article.find('h2[itemprop="headline"]').text().trim(),
      });
    });
    return result;
  } catch (err) {
    throw new Error("Gagal mencari donghua.");
  }
}

async function detail(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const $ = cheerio.load(html);

    const getImageSrc = (selector) => {
      const $img = $(selector);
      return $img.attr("data-src") || $img.attr("src") || "";
    };

    const description = $(".desc").text().trim() || $(".info-content .desc").text().trim() || $(".ninfo .desc").text().trim() || $(".infox .desc").text().trim();

    const details = {
      title: $(".entry-title").text().trim(),
      description: description,
      coverImage: getImageSrc(".bigcover img"),
      thumbnail: getImageSrc(".thumb img"),
      status: $('span:contains("Status:")').next().text().trim(),
      network: $('span:contains("Network:") a').text().trim(),
      studio: $('span:contains("Studio:") a').text().trim(),
      duration: $('span:contains("Duration:")').text().replace("Duration:", "").trim(),
      type: $('span:contains("Type:")').text().replace("Type:", "").trim(),
      releasedDate: $('time[itemprop="datePublished"]').text().trim(),
      genres: [],
      synopsis: $(".entry-content p").text().trim(),
      episodes: [],
    };

    $(".genxed a").each((i, v) => { details.genres.push($(v).text().trim()); });

    $(".eplister li").each((i, v) => {
      details.episodes.push({
        number: $(v).find(".epl-num").text().trim(),
        title: $(v).find(".epl-title").text().trim(),
        date: $(v).find(".epl-date").text().trim(),
        url: $(v).find("a").attr("href") || "",
      });
    });

    return details;
  } catch (err) {
    throw new Error("Gagal mengambil detail donghua.");
  }
}

module.exports = function (app) {
  // Endpoint Search Donghua
  app.get("/anime/donghua-search", async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json({ status: false, error: "Cari judul apa, Bang D2:业?" });
    try {
      const result = await donghua(query);
      res.json({ status: true, creator: "D2:业", result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });

  // Endpoint Detail Donghua
  app.get("/anime/donghua-detail", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.json({ status: false, error: "Link-nya mana, Bang D2:业?" });
    try {
      const result = await detail(url);
      res.json({ status: true, creator: "D2:业", result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};
