const axios = require("axios");

const SaveWeb = {
  baseURL: "https://copier.saveweb2zip.com",

  headers: {
    "content-type": "application/json",
    origin: "https://saveweb2zip.com",
    referer: "https://saveweb2zip.com/",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36",
  },

  async process(targetUrl) {
    if (!/^https?:\/\//i.test(targetUrl)) {
      throw new Error("URL harus http/https");
    }

    try {
      // 1️⃣ start cloning
      const start = await axios.post(
        `${this.baseURL}/api/copySite`,
        {
          url: targetUrl,
          renameAssets: false,
          saveStructure: false,
          alternativeAlgorithm: false,
          mobileVersion: false,
        },
        { headers: this.headers, timeout: 60000 }
      );

      const md5 = start.data?.md5;
      if (!md5) throw new Error("Gagal inisialisasi cloning");

      // 2️⃣ polling status (3-5 menit)
      let finished = false;

      for (let i = 0; i < 60; i++) {
        const check = await axios.get(
          `${this.baseURL}/api/getStatus/${md5}`,
          { headers: this.headers, timeout: 30000 }
        );

        if (check.data?.isFinished) {
          finished = true;
          break;
        }

        await new Promise((r) => setTimeout(r, 5000));
      }

      if (!finished) throw new Error("Cloning timeout");

      // 3️⃣ download zip
      const download = await axios.get(
        `${this.baseURL}/api/downloadArchive/${md5}`,
        {
          responseType: "arraybuffer",
          headers: { ...this.headers, accept: "application/zip" },
          timeout: 120000,
        }
      );

      return {
        buffer: Buffer.from(download.data),
        filename: `cloned_${md5.slice(0, 8)}.zip`,
      };
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message);
    }
  },
};

module.exports = function (app) {
  app.get("/tools/cloneweb", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res
        .status(400)
        .json({ status: false, error: "URL target mana" });
    }

    try {
      const result = await SaveWeb.process(url);

      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Content-Length": result.buffer.length,
      });

      return res.send(result.buffer);
    } catch (err) {
      return res.status(500).json({
        status: false,
        error: err.message,
      });
    }
  });
};
