const axios = require('axios');

/**
 * GitHub Search & Repo Downloader
 * Source: AgungDevX / GitHub API
 * Category: Tools / Internet
 */

// Fungsi ambil thumbnail cantik repo GitHub
async function getGitHubThumbnail(repoUrl) {
    try {
        const apiUrl = `https://lpf64gdwdb.execute-api.us-east-1.amazonaws.com/?repo=${encodeURIComponent(repoUrl)}`;
        const { data } = await axios.get(apiUrl);
        return Array.isArray(data) && data.length > 0 ? data[2] : null;
    } catch { return null; }
}

module.exports = function (app) {
    /**
     * @endpoint /v1/tools/github
     * @query ?q=judul_repo ATAU link_github
     */
    app.get("/v1/tools/github", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, error: "Masukan judul repository atau link GitHub!" });

        try {
            // JIKA USER MASUKIN LINK GITHUB
            if (q.match(/github\.com\/([^\/]+)\/([^\/]+)/)) {
                const cleanUrl = q.replace(/\.git$/, '');
                const [, user, repo] = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/) || [];
                
                const repoRes = await axios.get(`https://api.github.com/repos/${user}/${repo}`);
                const thumbnail = await getGitHubThumbnail(`https://github.com/${user}/${repo}`);

                return res.json({
                    status: true,
                    creator: "D2:业",
                    type: "detail",
                    result: {
                        name: repoRes.data.full_name,
                        description: repoRes.data.description,
                        stars: repoRes.data.stargazers_count,
                        forks: repoRes.data.forks_count,
                        language: repoRes.data.language,
                        thumbnail: thumbnail,
                        zip_download: `https://api.github.com/repos/${user}/${repo}/zipball`
                    }
                });
            }

            // JIKA USER CUMA SEARCH JUDUL
            const search = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=10`);
            if (search.data.total_count === 0) throw new Error("Repo tidak ditemukan.");

            const results = search.data.items.map(repo => ({
                name: repo.full_name,
                description: repo.description,
                stars: repo.stargazers_count,
                owner: repo.owner.login,
                link: repo.html_url
            }));

            res.json({
                status: true,
                creator: "D2:业",
                type: "search",
                results: results
            });

        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
