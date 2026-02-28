const axios = require('axios');

/**
 * 🦖 Pterodactyl Server & User Creator
 * Path: /pterodactyl/create
 * Creator: D2:业
 */

class PteroCreate {
  constructor(domain, apikey) {
    this.domain = domain.replace(/\/$/, "");
    this.headers = {
      'Authorization': `Bearer ${apikey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async getEggData(nestId, eggId) {
    const url = `${this.domain}/api/application/nests/${nestId}/eggs/${eggId}?include=variables`;
    const res = await axios.get(url, { headers: this.headers });
    return res.data.attributes;
  }

  async createUser(email, username, password, rootAdmin = false) {
    const url = `${this.domain}/api/application/users`;
    const payload = {
      email,
      username,
      first_name: 'D2',
      last_name: '业 User',
      password,
      root_admin: rootAdmin,
      language: 'en'
    };
    const res = await axios.post(url, payload, { headers: this.headers });
    return res.data.attributes;
  }

  async createServer(payload) {
    const url = `${this.domain}/api/application/servers`;
    const res = await axios.post(url, payload, { headers: this.headers });
    return res.data.attributes;
  }
}

module.exports = function (app) {
  app.get('/pterodactyl/create', async (req, res) => {
    const { domain, apikeyptero, nameserver, disk, cpu, password, rootadmin } = req.query;

    if (!domain || !apikeyptero || !nameserver || !disk || !cpu || !password) {
      return res.status(400).json({ 
        status: false, 
        creator: 'D2:业', 
        error: 'Parameter domain, apikeyptero, nameserver, disk, cpu, dan password wajib diisi!' 
      });
    }

    // Konfigurasi Default (Bisa diubah sesuai kebutuhan panel)
    const NEST_ID = 5; 
    const EGG_ID = 15; 
    const LOC_ID = 1;

    try {
      const creator = new PteroCreate(domain, apikeyptero);
      
      // 1. Generate User Info
      const username = nameserver.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
      const email = `${username}@pterodactyl.org`;
      const isRoot = rootadmin === "true";

      // 2. Ambil Egg Data & Environment
      const eggData = await creator.getEggData(NEST_ID, EGG_ID);
      const environment = {};
      
      if (eggData.relationships?.variables?.data) {
        eggData.relationships.variables.data.forEach(v => {
          const attr = v.attributes;
          environment[attr.env_variable] = attr.env_variable === "CMD_RUN" ? "npm start" : (attr.default_value || "");
        });
      }

      // 3. Eksekusi Create User
      const user = await creator.createUser(email, username, password, isRoot);

      // 4. Payload & Eksekusi Create Server
      const serverPayload = {
        name: nameserver,
        user: user.id,
        egg: EGG_ID,
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
        startup: eggData.startup,
        environment,
        limits: {
          memory: parseInt(disk),
          swap: 0,
          disk: parseInt(disk),
          io: 500,
          cpu: parseInt(cpu)
        },
        feature_limits: { databases: 1, allocations: 1, backups: 1 },
        deploy: { locations: [LOC_ID], dedicated_ip: false, port_range: [] },
        start_on_completion: true
      };

      const server = await creator.createServer(serverPayload);

      res.json({
        status: true,
        creator: 'D2:业',
        message: 'User & Server berhasil dibuat!',
        result: {
          user: {
            id: user.id,
            username: user.username,
            password: password,
            is_admin: user.root_admin
          },
          server: {
            id: server.id,
            name: server.name,
            identifier: server.identifier,
            limits: server.limits
          },
          panel_url: domain
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: 'D2:业',
        error: 'Proses gagal. Cek PTLA atau Limit Resources Panel.',
        detail: err.response?.data || err.message
      });
    }
  });
};
