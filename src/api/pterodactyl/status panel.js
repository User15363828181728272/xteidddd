/**
 * 🦖 Pterodactyl Panel API Checker
 * Path: /pterodactyl/statuspanel
 * Creator: D2:业
 */

module.exports = function (app) {
  app.get("/pterodactyl/statuspanel", async (req, res) => {
    try {
      const { domain, apikeyptero } = req.query;

      if (!domain || !apikeyptero) {
        return res.status(400).json({
          status: false,
          creator: "D2:业",
          error: "Parameter 'domain' dan 'apikeyptero' wajib diisi"
        });
      }

      let panelDomain = domain.trim();
      if (!/^https?:\/\//i.test(panelDomain)) {
        panelDomain = `https://${panelDomain}`;
      }
      panelDomain = panelDomain.replace(/\/$/, "");

      const username = `check${Math.random().toString(36).substring(7)}`;
      const password = `${username}99X`;
      const url = `${panelDomain}/api/application/users`;

      let createRes;
      try {
        createRes = await fetch(url, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apikeyptero}`
          },
          body: JSON.stringify({
            email: `${username}@d2ye.com`,
            username,
            first_name: "Checker",
            last_name: "D2:业",
            language: "en",
            root_admin: false,
            password
          })
        });
      } catch (err) {
        return res.status(502).json({
          status: false,
          creator: "D2:业",
          error: "Api Server Tidak Terdeteksi atau Domain Salah",
          detail: err.message
        });
      }

      // Cek jika API Key valid tapi tidak punya akses Admin
      if (createRes.status === 401 || createRes.status === 403) {
        return res.json({
          status: true,
          creator: "D2:业",
          message: "API Terdeteksi, tetapi User bukan Admin (Client API Only).",
          admin: false
        });
      }

      const createData = await createRes.json().catch(() => null);

      if (!createRes.ok || !createData?.attributes?.id) {
        return res.status(400).json({
          status: false,
          creator: "D2:业",
          error: "Gagal memproses pengecekan (Invalid Response)",
          detail: createData || null
        });
      }

      const userId = createData.attributes.id;

      // Hapus User Tester setelah berhasil (Cleanup)
      try {
        await fetch(`${panelDomain}/api/application/users/${userId}`, {
          method: "DELETE",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${apikeyptero}`
          }
        });
      } catch (e) {
        // Abaikan jika gagal hapus, yang penting admin sudah terdeteksi
      }

      return res.json({
        status: true,
        creator: "D2:业",
        message: "API Terdeteksi dan memiliki kontrol penuh (Admin Access).",
        admin: true,
        info: {
          checked_at: new Date().toISOString(),
          test_user_id: userId
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "D2:业",
        error: "Internal Server Error",
        detail: err.message
      });
    }
  });
};
