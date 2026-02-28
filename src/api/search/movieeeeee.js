const axios = require('axios');
const cheerio = require('cheerio');

/**
 * MovieKu Search & Detail Pro
 * Path: /v1/search/movieku
 * Creator: D2:业
 */

async function MovieKu(query) {
  const searchUrl = `https://movieku.fit/?s=${encodeURIComponent(query)}`;
  const searchResponse = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
 
  const $search = cheerio.load(searchResponse.data);
  const results = [];
 
  $search('.los article.box').each((i, el) => {
    const article = $search(el);
    const link = article.find('a.tip');
    const title = link.attr('title') || link.find('h2.entry-title').text();
    const url = link.attr('href');
    const img = article.find('img').attr('src');
    const quality = article.find('.quality').text();
    const year = title.match(/\((\d{4})\)/)?.[1] || '';
   
    results.push({
      title: title,
      url: url,
      image: img,
      quality: quality,
      year: year,
      type: 'Movie'
    });
  });
 
  if (results.length === 0) return null;

  const firstResult = results[0];
  const detailResponse = await axios.get(firstResult.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
 
  const $detail = cheerio.load(detailResponse.data);
  const detail = {
    title: firstResult.title,
    url: firstResult.url,
    image: firstResult.image,
    synopsis: $detail('.synops .entry-content p').first().text().trim(),
    genres: [],
    release: '',
    duration: '',
    country: '',
    quality: firstResult.quality,
    rating: '',
    downloads: []
  };
 
  $detail('.data li').each((i, el) => {
    const text = $detail(el).text();
    if (text.includes('Genre:')) {
      $detail(el).find('a').each((j, a) => { detail.genres.push($detail(a).text()); });
    } else if (text.includes('Release:')) {
      detail.release = text.replace('Release:', '').trim();
    } else if (text.includes('Duration:')) {
      detail.duration = text.replace('Duration:', '').trim();
    } else if (text.includes('Country:')) {
      detail.country = text.replace('Country:', '').trim();
    } else if (text.includes('Rating:')) {
      detail.rating = text.replace('Rating:', '').trim();
    }
  });
 
  $detail('#smokeddl .smokeurl p').each((i, el) => {
    const qualityLabel = $detail(el).find('strong').text().replace(':', '').trim();
    const links = [];
    $detail(el).find('a').each((j, a) => {
      links.push({
        provider: $detail(a).text().trim(),
        url: $detail(a).attr('href')
      });
    });
    if (qualityLabel) {
      detail.downloads.push({ quality: qualityLabel, links: links });
    }
  });
 
  return { search_results: results, top_detail: detail };
}

module.exports = function (app) {
  // Update path ke /v1/
  app.get("/v1/search/movieku", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ status: false, creator: "D2:业", error: "Judul filmnya apa, Bos?" });

      const data = await MovieKu(q);
      if (!data) return res.json({ status: false, creator: "D2:业", msg: "Gak ada hasil buat judul itu." });

      res.json({
        status: true,
        creator: "D2:业",
        result: data
      });
    } catch (err) {
      res.status(500).json({ status: false, creator: "D2:业", error: err.message });
    }
  });
};
