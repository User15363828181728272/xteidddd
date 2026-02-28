const axios = require('axios');

/**
 * 🦖 Pterodactyl Global User Wiper (Mass Delete Users)
 * Path: /pterodactyl/deletealluser
 * Creator: D2:业
 */

class PteroUserWiper {
  constructor(domain, apikey) {
    this.domain = domain.replace(/\/$/, "");
    this.headers = {
      'Authorization': `Bearer ${apikey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Rekursif tarik semua halaman user
  async getAllUsers(page = 1, collected = []) {
    const url = `${this.domain}/api/application/users?page=${page}&per_page=50`;
    const res = await axios.get(url, { headers: this.headers });
    const data = res.data.data;
    
    collected.push(...data.map(u => u.attributes));
    
    if (res.data.meta.pagination.current_page < res.data.meta.pagination.total_pages) {
      return this.getAllUsers(page + 1, collected);
    }
    return collected;
  }

  async deleteUser(userId) {
    const url = `${this.domain}/api/application/users/${userId}`;
    return axios.delete(url, { headers: this.headers });
  }
}

module.exports = function (app) {
  app.get('/pterodactyl/deletealluser', async (req, res) => {
    const { domain, apikeyptero, preview } = req.query;

    if (!domain || !apikeyptero) {
      return res.status(400).json({ 
        status: false, 
        creator: 'D2:业', 
        error: 'Parameter domain & apikeyptero (PTLA) wajib diisi!' 
      });
    }

    try {
      const wiper = new PteroUserWiper(domain, apikeyptero);
      const allUsers = await wiper.getAllUsers();
      
      // Filter: Hanya hapus non-admin (Biar panel aman)
      const toDelete = allUsers.filter(u => !u.root_admin);
      const admins = allUsers.filter(u => u.root_admin);

      const success = [];
      const failed = [];
      const previewList = toDelete.map(u => ({ id: u.id, username: u.username, email: u.email }));

      if (preview !== "true") {
        for (const user of toDelete) {
          try {
            await wiper.deleteUser(user.id);
            success.push({ id: user.id, username: user.username });
          } catch (e) {
            failed.push({ id: user.id, username: user.username, reason: e.message });
          }
        }
      }

      res.json({
        status: true,
        creator: 'D2:业',
        mode: preview === "true" ? "PREVIEW_MODE" : "MASS_USER_DELETE_EXECUTION",
        result: {
          stats: {
            total_users: allUsers.length,
            target_to_delete: toDelete.length,
            protected_admins: admins.length
          },
          details: {
            deleted: preview === "true" ? previewList : success,
            failed: failed,
            protected: admins.map(u => ({ id: u.id, username: u.username }))
          }
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: 'D2:业',
        error: 'Gagal melakukan mass user delete.',
        detail: err.response?.data || err.message
      });
    }
  });
};
