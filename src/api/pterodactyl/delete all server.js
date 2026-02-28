const axios = require('axios');

/**
 * 🦖 Pterodactyl Global Server Wiper (Mass Delete)
 * Path: /pterodactyl/deleteallserver
 * Creator: D2:业
 */

class PteroWiper {
  constructor(domain, apikey) {
    this.domain = domain.replace(/\/$/, "");
    this.headers = {
      'Authorization': `Bearer ${apikey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Rekursif buat ambil semua halaman server
  async getAllServers(page = 1, servers = []) {
    const url = `${this.domain}/api/application/servers?page=${page}&per_page=50`;
    const res = await axios.get(url, { headers: this.headers });
    const data = res.data.data;
    
    servers.push(...data.map(s => s.attributes));
    
    if (res.data.meta.pagination.current_page < res.data.meta.pagination.total_pages) {
      return this.getAllServers(page + 1, servers);
    }
    return servers;
  }

  async deleteServer(id) {
    const url = `${this.domain}/api/application/servers/${id}`;
    return axios.delete(url, { headers: this.headers });
  }
}

module.exports = function (app) {
  app.get('/pterodactyl/deleteallserver', async (req, res) => {
    const { domain, apikeyptero, pengecualian, preview } = req.query;

    if (!domain || !apikeyptero) {
      return res.status(400).json({ 
        status: false, 
        creator: 'D2:业', 
        error: 'Parameter domain & apikeyptero (PTLA) wajib diisi!' 
      });
    }

    try {
      const wiper = new PteroWiper(domain, apikeyptero);
      const allServers = await wiper.getAllServers();
      
      // Parsing ID yang dikecualikan (misal: "1,5,10")
      const excludedIds = pengecualian ? pengecualian.split(',').map(id => id.trim()) : [];
      
      const toDelete = [];
      const ignored = [];
      const success = [];
      const failed = [];

      for (const server of allServers) {
        const info = { id: server.id, name: server.name, identifier: server.identifier };
        
        if (excludedIds.includes(server.id.toString())) {
          ignored.push(info);
          continue;
        }

        if (preview === "true") {
          toDelete.push(info);
        } else {
          try {
            await wiper.deleteServer(server.id);
            success.push(info);
          } catch (e) {
            failed.push({ ...info, reason: e.message });
          }
        }
      }

      res.json({
        status: true,
        creator: 'D2:业',
        mode: preview === "true" ? "PREVIEW_ONLY" : "MASS_DELETE_EXECUTION",
        result: {
          total_found: allServers.length,
          to_delete_count: preview === "true" ? toDelete.length : success.length,
          ignored_count: ignored.length,
          details: {
            deleted: preview === "true" ? toDelete : success,
            failed: failed,
            ignored: ignored
          }
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: 'D2:业',
        error: 'Gagal melakukan mass delete.',
        detail: err.response?.data || err.message
      });
    }
  });
};
