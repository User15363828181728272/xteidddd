const axios = require("axios");

/**
 * Felo AI Search (AI Search Engine)
 * Path: /v1/ai/felo
 * Creator: D2:业
 */

async function scrapeFelo(query) {
  const headers = {
    "Accept": "*/*",
    "User-Agent": "Postify/1.0.0",
    "Content-Type": "application/json",
  };

  const payload = {
    query,
    search_uuid: Date.now().toString(),
    search_options: { langcode: "id-ID" },
    search_video: true,
  };

  try {
    const response = await axios.post(
      "https://api.felo.ai/search/threads",
      payload,
      { headers, timeout: 30000, responseType: "text" }
    );

    const result = { answer: "", sources: [] };
    
    // Parsing SSE (Server-Sent Events) format
    const lines = response.data.split("\n");
    for (const line of lines) {
      if (line.startsWith("data:")) {
        try {
          const jsonStr = line.slice(5).trim();
          if (jsonStr === "[DONE]") continue;
          
          const parsed = JSON.parse(jsonStr);
          if (parsed.data) {
            if (parsed.data.text) {
              // Menghapus sitasi angka seperti [1], [2]
              result.answer = parsed.data.text.replace(/\[\d+\]/g, "");
            }
            if (parsed.data.sources) {
              result.sources = parsed.data.sources;
            }
          }
        } catch (e) {
          // Skip if not valid JSON
        }
      }
    }
    return result;
  } catch (error) {
    throw new Error("Felo AI sedang sibuk, coba lagi nanti.");
  }
}

module.exports = function (app) {
  app.get("/v1/ai/felo", async (req, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          status: false,
          creator: "D2:业",
          error: "Mau cari info apa, Bos?"
        });
      }

      const result = await scrapeFelo(q);

      res.json({
        status: true,
        creator: "D2:业",
        result: {
          query: q,
          answer: result.answer,
          sources: result.sources
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
