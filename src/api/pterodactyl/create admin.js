const axios = require('axios');

/**
 * 🦖 Pterodactyl Admin Creator
 * Path: /pterodactyl/createadmin
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

  async createAdmin(email, username, password) {
    const url = `${this.domain}/api/application/users`;
    const payload = {
      email,
      username,
      first_name: 'Admin',
      last_name: 'D2:业',
      password,
      root_admin: true,
      language: 'en'
    };
    const res = await axios.post(url, payload, { headers: this.headers });
    return res.data.attributes;
  }
}

function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

module.exports = function (app) {
  app.get('/pterodactyl/createadmin', async (req, res) => {
    const { domain, apikeyptero, nameuser, password } = req.query;

    if (!domain || !apikeyptero || !nameuser) {
      return res.status(400).json({ 
        status: false, 
        creator: 'D2:业', 
        error: 'Parameter domain, apikeyptero, dan nameuser wajib diisi!' 
      });
    }

    try {
      const creator = new PteroCreate(domain, apikeyptero);
      
      // Sanitasi Username
      const username = nameuser.toLowerCase().replace(/[^a-z0-9]/g, '');
      const finalEmail = `${username}@d2-ye.com`;
      const finalPassword = password || generatePassword();

      const adminUser = await creator.createAdmin(finalEmail, username, finalPassword);

      res.json({
        status: true,
        creator: 'D2:业',
        message: 'Admin User berhasil dibuat!',
        result: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          password: finalPassword,
          is_root: adminUser.root_admin,
          created_at: adminUser.created_at
        }
      });

    } catch (err) {
      res.status(err.response?.status || 500).json({
        status: false,
        creator: 'D2:业',
        error: 'Gagal membuat admin. Pastikan API Key Application (PTLA) valid.',
        detail: err.response?.data || err.message
      });
    }
  });
};
