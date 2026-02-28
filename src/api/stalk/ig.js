const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Instagram Profile Stalker
 * Scraper via insta-stories-viewer (Anti-Login)
 * Category: Stalk
 * Creator: D2:业
 */
async function stalkIG(username) {
    try {
        const url = `https://insta-stories-viewer.com/${username.replace('@', '')}/`;

        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                "Referer": "https://insta-stories-viewer.com/"
            }
        });

        const $ = cheerio.load(html);

        const cleanUsername = $(".profile__nickname")
            .clone()
            .children()
            .remove()
            .end()
            .text()
            .trim();

        if (!cleanUsername) throw new Error("User tidak ditemukan atau akun di-private.");

        const followers = $(".profile__stats-followers").text().replace(/\D/g, "") || "0";
        const following = $(".profile__stats-follows").text().replace(/\D/g, "") || "0";
        const posts = $(".profile__stats-posts").text().replace(/\D/g, "") || "0";
        const description = $(".profile__description").text().trim() || "";
        const profilePicture = $(".profile__avatar-pic").attr("src") || null;
        const bioLinks = description.match(/(https?:\/\/[^\s]+)/gi) || [];

        return {
            username: cleanUsername,
            full_name: $(".profile__name").text().trim() || cleanUsername,
            followers: parseInt(followers),
            following: parseInt(following),
            posts: parseInt(posts),
            profile_picture: profilePicture,
            bio_links: bioLinks,
            description: description
        };
    } catch (err) {
        throw new Error("Gagal stalking. Pastikan username benar atau server lagi sibuk.");
    }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/stalk/ig
     * @method GET
     */
    app.get("/v1/stalk/ig", async (req, res) => {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ 
                status: false, 
                error: "Username-nya mana, Bang D2:业? Kasih tau siapa yang mau di-stalk." 
            });
        }

        try {
            const result = await stalkIG(username);

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
