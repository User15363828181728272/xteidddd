const axios = require('axios');

/**
 * 🦖 Pterodactyl Admin & Server Force Delete
 * Path: /pterodactyl/deleteadmin
 * Creator: D2:业
 */

class PteroForceDeleteAdmin {
  constructor(domain, apikey) {
    this.domain = domain.replace(/\/$/, "");
    this.headers = {
      'Authorization': `Bearer ${apikey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async getUserWithServers(userId) {
    const url = `${this.domain}/api/application/users/${userId}?include=servers`;
    const res = await axios.get(url, { headers: this.headers });
    return res.data.attributes;
  }

  async deleteServer(serverId) {
    const url = `${this.domain}/api/application/servers/${serverId}`;
    return axios.delete(url, { headers: this.headers });
  }

  async deleteUser(userId) {
    const url = `${this.domain}/api/application/users/${userId}`;
    return axios.delete(url, { headers: this.headers });
  }
}

module.exports = function (app) {
  app.get('/pterodactyl/deleteadmin', async (req, res) => {
    const { userid, domain, apikeyptero } = req.query;

    if (!userid || !domain || !apikeyptero) {
      return res.status(400).json({ 
        status: false, 
        creator: 'D2:业', 
        error: 'Parameter userid, domain, dan apikeyptero (PTLA) wajib diisi!' 
      });
    }

    try {
      const deleter = new PteroForceDeleteAdmin(domain, apikeyptero);
      
      // 1. Ambil data user & list servernya
      const user = await deleter.getUserWithServers(userid);
      
      // Keamanan tambahan: Cek apakah user benar-benar ada
      if (!user) throw new Error("User tidak ditemukan.");

      const servers = user.relationships?.servers?.data || [];
      let deletedServers = [];

      // 2. Loop Hapus semua server milik user tersebut
      for (const s of servers) {
        await deleter.deleteServer(s.attributes.id);
        deletedServers.push({
          id: s.attributes.id,
          name: s.attributes.name
        });
      }

      // 3. Hapus User-nya
      await deleter.deleteUser(userid);

      res.json({
        status: true,
        creator: 'D2:业',
        message: 'Force Delete Berhasil!',
        result: {
          domain,
          user_deleted: {
            id: userid,
            username: user.username,
            is_admin: user.root_admin
          },
          total_servers_wiped: deletedServers.length,
          servers_detail: deletedServers
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: 'D2:业',
        error: 'Gagal melakukan Force Delete.',
        detail: err.response?.data || err.message
      });
    }
  });
};
