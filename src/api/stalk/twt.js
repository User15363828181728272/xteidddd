const axios = require('axios');
const crypto = require('crypto');

/**
 * Twitter Profile Stalker
 * Bypass Challenge logic via Snaplytics/B-CDN
 * Category: Stalk
 * Creator: D2:业
 */
async function twitterStalk(username) {
    try {
        if (!username) throw new Error('Username wajib diisi, Bang!');

        // 1. Ambil Challenge Token
        const ch = await axios.get('https://twittermedia.b-cdn.net/challenge/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Origin': 'https://snaplytics.io',
                'Referer': 'https://snaplytics.io/'
            }
        }).then(res => res.data);

        if (!ch.challenge_id) throw new Error('Challenge gagal didapatkan.');

        // 2. Selesaikan Hash Challenge
        const hash = crypto
            .createHash('sha256')
            .update(String(ch.timestamp) + ch.random_value)
            .digest('hex')
            .slice(0, 8);

        // 3. Ambil Data Profile
        const res = await axios.get(`https://twittermedia.b-cdn.net/viewer/?data=${username}&type=profile`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Origin': 'https://snaplytics.io',
                'Referer': 'https://snaplytics.io/',
                'X-Challenge-ID': ch.challenge_id,
                'X-Challenge-Solution': hash
            }
        });

        if (!res.data || !res.data.profile) throw new Error('Data tidak ditemukan atau akun di-suspend.');

        const profile = res.data.profile;
        return {
            name: profile.name,
            username: username.replace('@', ''),
            bio: profile.bio || "No Bio",
            avatar: profile.avatar_url,
            banner: profile.banner_url,
            verified: profile.verified || false,
            stats: {
                tweets: profile.stats?.tweets || 0,
                following: profile.stats?.following || 0,
                followers: profile.stats?.followers || 0
            }
        };
    } catch (e) {
        throw new Error(e.message);
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/stalk/twitter
     * @method GET
     */
    app.get("/v1/stalk/twitter", async (req, res) => {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ 
                status: false, 
                error: "Sebutkan username Twitter target, Bang D2:业!" 
            });
        }

        try {
            const result = await twitterStalk(username);

            res.json({
                status: true,
                creator: "D2:业",
                result: result
            });
        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
