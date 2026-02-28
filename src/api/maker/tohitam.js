const axios = require('axios');
const FormData = require('form-data');

/**
 * AI Skin Color Transformer (Deep Skin Edition)
 * Engine: MagicEraser V2 via ImgUpscaler AI
 * Logic: Cloud Upload -> Job Creation -> Polling -> Result
 * Creator: D2:业
 */

// Helper: Generate Serial Number untuk Bypass Product-Check
function genserial() {
    let s = '';
    for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
}

// Helper: Upload Step 1 (Get Put URL)
async function upload(filename) {
    const form = new FormData();
    form.append('file_name', filename);
    const res = await axios.post('https://api.imgupscaler.ai/api/common/upload/upload-image', form, {
        headers: { 
            ...form.getHeaders(),
            'origin': 'https://imgupscaler.ai',
            'referer': 'https://imgupscaler.ai/'
        }
    });
    return res.data.result;
}

// Helper: Upload Step 2 (Direct Put to OSS)
async function uploadtoOSS(putUrl, buffer, mime) {
    await axios.put(putUrl, buffer, { headers: { 'Content-Type': mime } });
    return true;
}

// Helper: Create AI Job
async function createJob(imageUrl, prompt) {
    const form = new FormData();
    form.append('model_name', 'magiceraser_v4'); // V4 lebih stabil untuk deteksi kulit
    form.append('original_image_url', imageUrl);
    form.append('prompt', prompt); 
    form.append('ratio', 'match_input_image');
    form.append('output_format', 'jpg');

    const res = await axios.post('https://api.magiceraser.org/api/magiceraser/v2/image-editor/create-job', form, {
        headers: {
            ...form.getHeaders(),
            'product-code': 'magiceraser',
            'product-serial': genserial(),
            'origin': 'https://imgupscaler.ai',
            'referer': 'https://imgupscaler.ai/'
        }
    });
    return res.data;
}

// Helper: Check Job Status
async function cekjob(jobId) {
    const res = await axios.get(`https://api.magiceraser.org/api/magiceraser/v1/ai-remove/get-job/${jobId}`, {
        headers: { 'origin': 'https://imgupscaler.ai', 'referer': 'https://imgupscaler.ai/' }
    });
    return res.data;
}

module.exports = function (app) {
    app.get('/v1/maker/tohitam', async (req, res) => {
        const { url } = req.query;
        
        // Prompt AI spesialis yang Abang buat tadi (Sangat Bagus!)
        const fixedPrompt = `Anda adalah spesialis kolorimetri digital dan ahli dermatologi visual. Tugas: Analisis foto subjek dan lakukan transformasi warna kulit menjadi gelap natural (Deep/Dark Skin Tone). Instruksi: Peta Segmentasi Dermas, Penyesuaian Melanin, Rich Umber/Deep Golden, Preservasi Tekstur.`;

        if (!url) return res.status(400).json({ status: false, error: "Link gambarnya mana, Bos?" });

        try {
            // 1. Download image original
            const imageBuffer = await axios.get(url, { responseType: 'arraybuffer' });
            const mime = imageBuffer.headers['content-type'] || 'image/jpeg';
            
            // 2. Upload ke Cloud Storage ImgUpscaler
            const up = await upload(`edit_${Date.now()}.jpg`);
            await uploadtoOSS(up.url, Buffer.from(imageBuffer.data), mime);

            // 3. Create Processing Job
            const targetUrl = 'https://cdn.imgupscaler.ai/' + up.object_name;
            const jobResponse = await createJob(targetUrl, fixedPrompt);

            if (!jobResponse.result || !jobResponse.result.job_id) {
                throw new Error(`API Error: ${jobResponse.msg || 'Gagal membuat job'}`);
            }

            const jobId = jobResponse.result.job_id;
            let finalUrl = null;
            let attempts = 0;

            // 4. Polling status job (Maks 1 menit / 15x percobaan)
            while (attempts < 15) {
                await new Promise(r => setTimeout(r, 4000)); 
                const status = await cekjob(jobId);
                
                if (status.result?.output_url && status.result.output_url.length > 0) {
                    finalUrl = status.result.output_url[0];
                    break;
                }
                
                // Jika error permanen (bukan nunggu)
                if (status.code !== 300006 && status.code !== 100000 && status.code !== 0) {
                    throw new Error("AI gagal memproses gambar ini.");
                }
                attempts++;
            }

            if (!finalUrl) throw new Error("Waktu tunggu habis (Timeout).");

            // 5. Kirim respon berupa link atau Buffer (Saran: Link saja agar lebih hemat RAM Vercel)
            res.json({
                status: true,
                creator: "D2:业",
                original_url: targetUrl,
                result_url: finalUrl
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({ status: false, error: e.message });
        }
    });
};
