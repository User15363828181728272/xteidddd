const { generateIQC } = require("iqc-canvas");

/**
 * iPhone Quote Center (IQC) - Auto Mode
 * Logic: Auto Time (WIB), Random Battery, Direct Buffer
 * Creator: D2:业 (Z8)
 */

module.exports = function (app) {
  app.get("/v1/canvas/iqc", async (req, res) => {
    try {
      const { teks } = req.query;

      // Validasi Input
      if (!teks || typeof teks !== "string" || !teks.trim()) {
        return res.status(400).json({
          status: false,
          creator: "",
          error: "Parameter 'teks' wajib diisi, Bos!"
        });
      }

      // Auto Time: Asia/Jakarta (WIB)
      const finalTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta"
      }).format(new Date());

      // Random Battery 10 - 100% biar kelihatan real
      const randomBattery = Math.floor(Math.random() * 91 + 10).toString();

      // Generate Image dari Library
      const result = await generateIQC(teks, finalTime, {
        baterai: [true, randomBattery],
        operator: true,
        timebar: true,
        wifi: true
      });

      // Header untuk Output Buffer Gambar
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": result.image.length,
        "Cache-Control": "public, max-age=86400", // Cache 24 jam biar irit RAM server
        "X-Creator": "Z8"
      });

      // Kirim hasil akhir
      res.end(result.image);

    } catch (err) {
      console.error("IQC Error:", err);
      res.status(500).json({
        status: false,
        creator: "Z8",
        error: "Gagal memproses gambar: " + err.message
      });
    }
  });
};
