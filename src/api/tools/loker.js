const axios = require("axios");
const dayjs = require("dayjs");

/**
 * 💼 JobStreet Loker Scraper
 * Path: /v1/info/loker
 * Creator: D2:业
 */

const jobStreet = {
  base: "https://jobsearch-api.cloud.seek.com.au",
  headers: {
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  }
};

module.exports = function (app) {
  app.get("/v1/info/loker", async (req, res) => {
    try {
      const { q, loc, limit } = req.query;

      if (!q || !loc) {
        return res.status(400).json({
          status: false,
          creator: "D2:业",
          error: "Parameter 'q' (pekerjaan) dan 'loc' (kota) wajib diisi!",
          example: "/v1/info/loker?q=programmer&loc=jakarta&limit=5"
        });
      }

      const params = {
        keywords: q,
        where: loc,
        sitekey: "ID",
        sourcesystem: "houston",
        pageSize: limit ? parseInt(limit) : 5,
        page: 1,
        locale: "id-ID",
      };

      const response = await axios.get(`${jobStreet.base}/v5/search`, {
        params,
        headers: jobStreet.headers,
        timeout: 15000,
      });

      const jobs = response.data.data || [];

      if (!jobs.length) {
        return res.status(404).json({
          status: false,
          creator: "D2:业",
          error: "Tidak ada lowongan ditemukan untuk kriteria tersebut.",
        });
      }

      const results = jobs.map((job) => ({
        title: job.title || "-",
        company: job.companyName || "-",
        location: job.locations?.[0]?.label || "-",
        date: job.listingDate ? dayjs(job.listingDate).format("DD MMM YYYY") : "-",
        salary: job.salaryLabel || "Tidak dicantumkan",
        description: job.teaser ? job.teaser.replace(/\n/g, ' ').trim() : "-",
        logo: job.branding?.serpLogoUrl || "",
        link: `https://id.jobstreet.com/job/${job.id}`,
      }));

      res.json({
        status: true,
        creator: "D2:业",
        result: {
          search: { q, loc, total_found: results.length },
          jobs: results
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "D2:业",
        error: "Gagal mengambil data loker, coba lagi nanti."
      });
    }
  });
};
