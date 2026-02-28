const FormData = require('form-data');
const axios = require('axios');
const path = require('path');

const MagicEraser = {
    genserial() {
        let s = '';
        for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
        return s;
    },

    async upimage(filename) {
        const form = new FormData();
        form.append('file_name', filename);
        const res = await axios.post('https://api.imgupscaler.ai/api/common/upload/upload-image', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                origin: 'https://imgupscaler.ai',
                referer: 'https://imgupscaler.ai/'
            }
        });
        return res.data.result;
    },

    async uploadtoOSS(putUrl, fileBuffer, contentType) {
        const res = await axios.put(putUrl, fileBuffer, {
            headers: { 'Content-Type': contentType },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });
        return res.status === 200;
    },

    async createJob(imgurl, originalText, replaceText) {
        const form = new FormData();
        form.append('original_image_url', imgurl);
        form.append('original_text', originalText);
        form.append('replace_text', replaceText);

        const res = await axios.post('https://api.magiceraser.org/api/magiceraser/v2/text-replace/create-job', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                'product-code': 'magiceraser',
                'product-serial': this.genserial(),
                origin: 'https://imgupscaler.ai',
                referer: 'https://imgupscaler.ai/'
            }
        });
        return res.data.result.job_id;
    },

    async cekjob(jobId) {
        const res = await axios.get(`https://api.magiceraser.org/api/magiceraser/v1/ai-remove/get-job/${jobId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                origin: 'https://imgupscaler.ai',
                referer: 'https://imgupscaler.ai/'
            }
        });
        return res.data;
    }
};

module.exports = function (app) {
    /**
     * @endpoint /tools/text-replace
     * @method GET
     * @description Ganti teks di dalam gambar menggunakan link gambar (AI Magic Eraser).
     */
    app.get("/tools/text-replace", async (req, res) => {
        const { url, find, replace } = req.query;

        if (!url || !find || !replace) {
            return res.json({ 
                status: false, 
                error: "Parameter 'url', 'find', dan 'replace' wajib ada!",
                example: "/tools/text-replace?url=LINK_GAMBAR&find=TEKS_LAMA&replace=TEKS_BARU"
            });
        }

        try {
            // 1. Download gambar dari link dulu buat dapetin buffer & mimetype
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            const contentType = response.headers['content-type'] || 'image/jpeg';
            const filename = path.basename(url.split('?')[0]) || 'image.jpg';

            // 2. Minta URL Upload ke AI Server
            const uploadInfo = await MagicEraser.upimage(filename);
            
            // 3. Upload Buffer hasil download tadi ke OSS
            await MagicEraser.uploadtoOSS(uploadInfo.url, buffer, contentType);

            // 4. Create Job AI
            const cdnUrl = 'https://cdn.imgupscaler.ai/' + uploadInfo.object_name;
            const jobId = await MagicEraser.createJob(cdnUrl, find, replace);

            // 5. Polling Hasil (Cek tiap 3 detik)
            let jobResult;
            let attempts = 0;
            do {
                await new Promise(r => setTimeout(r, 3000));
                jobResult = await MagicEraser.cekjob(jobId);
                attempts++;
                if (attempts > 15) throw new Error("Waktu proses AI terlalu lama (Timeout)");
            } while (!jobResult.result || !jobResult.result.output_url);

            res.json({
                status: true,
                result: {
                    output_image: jobResult.result.output_url[0],
                    original_text: find,
                    replaced_with: replace
                }
            });

        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
