import axios from "axios";
import { createHash } from "crypto";

/**
 * Douyin Downloader Pro
 * Logic: Auto-generate Sign SHA256 (Seekin AI Bypass)
 * Path: /v1/download/douyin
 * Creator: D2:业
 */

const base = "https://api.seekin.ai/ikool/media/download";
const secret = "3HT8hjE79L";

function sortAndStringify(obj) {
  if (!obj || typeof obj !== "object") return "";
  return Object.keys(obj).sort().map(k => `${k}=${obj[k]}`).join("&");
}

function generateSign(lang, timestamp, body = {}) {
  const raw = `${lang}${timestamp}${secret}${sortAndStringify(body)}`;
  return createHash("sha256").update(raw).digest("hex");
}

function buildHeaders(body = {}) {
  const lang = "en";
  const timestamp = Date.now().toString();
  const sign = generateSign(lang, timestamp, body);
  return {
    "accept": "*/*",
    "content-type": "application/json",
    "lang": lang,
    "origin": "https://www.seekin.ai",
    "referer": "https://www.seekin.ai/",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
    "sign": sign,
    "timestamp": timestamp,
  };
}

module.exports = function (app) {
  app.get("/v1/download/douyin", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).json({ status: false, creator: "D2:业", error: "Link Douyin-nya mana, Bos?" });

      const body = { url };
      const response = await axios.post(base, body, { headers: buildHeaders(body) });

      const { msg, data } = response.data;
      
      if (!data) throw new Error(msg || "Gagal mengambil data video");

      res.json({
        status: true,
        creator: "D2:业",
        result: {
          title: data.title,
          thumbnail: data.imageUrl,
          video: data.medias?.[0]?.url ?? null,
          media_info: data.medias || []
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
