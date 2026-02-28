/**
 * Nano Banana AI (AI Face Swap / Edit)
 * Path: /v1/ai/nanobanana
 * Creator: D2:业
 */

const crypto = require('crypto');
const path = require('path');

const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCwlO+boC6cwRo3UfXVBadaYwcX
0zKS2fuVNY2qZ0dgwb1NJ+/Q9FeAosL4ONiosD71on3PVYqRUlL5045mvH2K9i8b
AFVMEip7E6RMK6tKAAif7xzZrXnP1GZ5Rijtqdgwh+YmzTo39cuBCsZqK9oEoeQ3
r/myG9S+9cR5huTuFQIDAQAB
-----END PUBLIC KEY-----`;

const fp = crypto.randomUUID();
let cachethemeversi = null;

const headers = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'origin': 'https://aifaceswap.io',
  'referer': 'https://aifaceswap.io/nano-banana-ai/'
};

async function ambilthemeversi() {
  if (cachethemeversi) return cachethemeversi;
  try {
    const gethtml = await fetch('https://aifaceswap.io/nano-banana-ai/');
    const html = await gethtml.text();
    const jsMatch = html.match(/src="([^"]*aifaceswap_nano_banana[^"]*\.js)"/);
    if (!jsMatch) throw new Error();
    let jsUrl = jsMatch[1].startsWith('http') ? jsMatch[1] : `https://aifaceswap.io${jsMatch[1]}`;
    const jsRes = await fetch(jsUrl);
    const jsText = await jsRes.text();
    const themeMatch = jsText.match(/headers\["theme-version"\]="([^"]+)"/);
    cachethemeversi = themeMatch ? themeMatch[1] : 'EC25Co3HGfI91bGmpWR6JF0JKD+nZ/mD0OYvKNm5WUXcLfKnEE/80DQg60MXcYpM';
    return cachethemeversi;
  } catch (e) {
    return 'EC25Co3HGfI91bGmpWR6JF0JKD+nZ/mD0OYvKNm5WUXcLfKnEE/80DQg60MXcYpM';
  }
}

async function gensigs() {
  const themeVersion = await ambilthemeversi();
  const aesSecret = crypto.randomBytes(8).toString('hex');
  const xGuide = crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  }, Buffer.from(aesSecret, 'utf8')).toString('base64');
  
  const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(aesSecret), Buffer.from(aesSecret));
  let fp1 = cipher.update('aifaceswap:' + fp, 'utf8', 'base64');
  fp1 += cipher.final('base64');
  
  return { fp, fp1, 'x-guide': xGuide, 'x-code': Date.now().toString(), 'theme-version': themeVersion };
}

async function uploadFile(buffer, ext = 'jpg') {
  const filename = crypto.randomUUID().replace(/-/g, '') + '.' + ext;
  const sigs = await gensigs();
  const res = await fetch('https://aifaceswap.io/api/upload_file', {
    method: 'POST',
    headers: { ...headers, ...sigs, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: filename, type: 'image', request_from: 1, origin_from: '4b06e7fa483b761a' })
  });
  const data = await res.json();
  const putUrl = data.data.url;
  await fetch(putUrl, {
    method: 'PUT',
    headers: { 'Content-Type': `image/${ext}`, 'x-oss-storage-class': 'Standard' },
    body: buffer
  });
  return putUrl.split('?')[0].split('.aliyuncs.com/')[1];
}

module.exports = function (app) {
  // Gunakan POST karena mengirim file (buffer/base64) dan prompt
  app.post("/v1/ai/nanobanana", async (req, res) => {
    try {
      const { image_base64, prompt } = req.body;
      if (!image_base64 || !prompt) {
        return res.status(400).json({ status: false, creator: "D2:业", error: "image_base64 dan prompt wajib diisi!" });
      }

      // Convert base64 ke Buffer
      const buffer = Buffer.from(image_base64, 'base64');
      const uploadPath = await uploadFile(buffer);
      
      const sigs = await gensigs();
      const createRes = await fetch('https://aifaceswap.io/api/aikit/create', {
        method: 'POST',
        headers: { ...headers, ...sigs, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fn_name: 'demo-nano-banana',
          call_type: 1,
          input: { prompt, scene: 'standard', resolution: '1K', aspect_ratio: 'auto', source_images: [uploadPath] },
          consume_type: 0, request_from: 1, origin_from: '4b06e7fa483b761a'
        })
      });
      const createData = await createRes.json();
      const taskId = createData.data.task_id;

      // Polling Status
      let result;
      let attempts = 0;
      while (attempts < 20) {
        await new Promise(r => setTimeout(r, 4000));
        const checkSigs = await gensigs();
        const checkRes = await fetch('https://aifaceswap.io/api/aikit/check_status', {
          method: 'POST',
          headers: { ...headers, ...checkSigs, 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: taskId, fn_name: 'demo-nano-banana', call_type: 1, request_from: 1, origin_from: '4b06e7fa483b761a' })
        });
        const checkData = await checkRes.json();
        result = checkData.data;
        if (result && result.status === 2) break; // Selesai
        if (result && result.status === -1) throw new Error("Gagal memproses gambar");
        attempts++;
      }

      res.json({
        status: true,
        creator: "D2:业",
        result: {
          job_id: taskId,
          image_url: result.result_image
        }
      });

    } catch (err) {
      res.status(500).json({ status: false, creator: "D2:业", error: err.message });
    }
  });
};
