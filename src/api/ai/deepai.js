/**
 * DeepAI Chat (Bypass Mode)
 * Path: /v1/ai/deepai
 * Creator: D2:业
 */

const crypto = require("crypto");
const axios = require("axios");
const FormData = require("form-data");

function getApiKey() {
  const prefix = "tryit";
  const id = Math.floor(1e10 + Math.random() * 9e10).toString();
  const hash = crypto.randomBytes(16).toString("hex");
  return `${prefix}-${id}-${hash}`;
}

// Helper: Hapus semua \n agar response clean di JSON
function cleanNewlines(data) {
  if (typeof data === "string") {
    return data.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  } else if (Array.isArray(data)) {
    return data.map(item => cleanNewlines(item));
  } else if (typeof data === "object" && data !== null) {
    const cleaned = {};
    for (const key in data) {
      cleaned[key] = cleanNewlines(data[key]);
    }
    return cleaned;
  }
  return data;
}

async function DeepAI(prompt) {
  const form = new FormData();
  form.append("chat_style", "chat");
  form.append("chatHistory", JSON.stringify([{ role: "user", content: prompt }]));
  form.append("model", "standard");
  form.append("hacker_is_stinky", "very_stinky");

  const headers = {
    ...form.getHeaders(),
    "api-key": getApiKey(),
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
    "Origin": "https://deepai.org",
    "Referer": "https://deepai.org/chat"
  };

  const response = await axios.post("https://api.deepai.org/hacking_is_a_serious_crime", form, { headers });
  return cleanNewlines(response.data);
}

module.exports = function (app) {
  app.get("/v1/ai/deepai", async (req, res) => {
    try {
      const { ask } = req.query;
      if (!ask) {
        return res.status(400).json({ 
          status: false, 
          creator: "D2:业", 
          error: "Tanya apa hari ini, Bos?" 
        });
      }

      const result = await DeepAI(ask);
      res.json({ 
        status: true, 
        creator: "D2:业", 
        query: ask, 
        result 
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
