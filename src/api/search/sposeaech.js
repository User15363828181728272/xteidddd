const https = require('https');

/**
 * Spotify Search (Bypass Center)
 * Path: /v1/search/spotify
 * Creator: D2:业
 */

class SpotifySearch {
  constructor() {
    this.baseUrl = 'https://api.spotify.com/v1'; // Base asli atau proxy googleusercontent
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
    };
  }

  request(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      });
      req.on('error', reject);
      if (options.headers) {
        Object.entries(options.headers).forEach(([k, v]) => req.setHeader(k, v));
      }
      req.end();
    });
  }

  async getToken() {
    try {
      // Mengambil token dari endpoint web player (teknis bypass)
      const response = await this.request('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
        method: 'GET',
        headers: this.headers
      });
      if (response.statusCode !== 200) return null;
      const data = JSON.parse(response.body);
      return data.accessToken || null;
    } catch {
      return null;
    }
  }

  async search(query, limit = 10) {
    const token = await this.getToken();
    if (!token) throw new Error('Gagal mendapatkan akses token dari pusat, Bos!');

    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 10, 50));
    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&type=track&limit=${safeLimit}`;

    const response = await this.request(url, {
      method: 'GET',
      headers: { ...this.headers, 'Authorization': `Bearer ${token}` }
    });

    if (response.statusCode !== 200) throw new Error(`Spotify API Error: ${response.statusCode}`);
    
    const data = JSON.parse(response.body);
    return this.formatData(data);
  }

  formatData(data) {
    if (!data.tracks || !data.tracks.items) return [];
    return data.tracks.items.map(track => ({
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      duration: this.formatTime(track.duration_ms),
      popularity: track.popularity,
      releaseDate: track.album.release_date,
      imageUrl: track.album.images[0]?.url || '',
      trackUrl: `https://open.spotify.com/track/${track.id}`
    }));
  }

  formatTime(ms) {
    const min = Math.floor(ms / 60000);
    const sec = ((ms % 60000) / 1000).toFixed(0);
    return `${min}:${sec.padStart(2, '0')}`;
  }
}

const spotify = new SpotifySearch();

module.exports = function (app) {
  app.get("/search/spotify", async (req, res) => {
    try {
      const { q, limit } = req.query;
      if (!q) return res.status(400).json({ status: false, creator: "D2:业", error: "Judul lagunya mana, Aa? 🗿🖕" });

      const results = await spotify.search(q, limit);

      res.json({
        status: true,
        creator: "D2:业",
        result: results
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
