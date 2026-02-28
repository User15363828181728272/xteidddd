const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

// 1. DAFTARKAN FONT (Lakukan di luar handler agar hanya diproses sekali)
const fontPath = path.join(__dirname, '../../ArchivoBlack-Regular.ttf');
GlobalFonts.registerFromPath(fontPath, 'ArchivoBlack');

const IMG_URL = "https://raw.githubusercontent.com/whatsapp-media/whatsapp-media/main/uploads/1770891834482_undefined.jpg";

function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    for (let w of words) {
        const test = line + w + " ";
        if (ctx.measureText(test).width > maxWidth) {
            lines.push(line.trim());
            line = w + " ";
        } else {
            line = test;
        }
    }
    lines.push(line.trim());
    return lines;
}

function fitText(ctx, text, maxWidth, maxHeight) {
    let fontSize = 55;
    let lines = [];
    while (fontSize > 10) {
        // 2. GUNAKAN NAMA FONT YANG SUDAH DIDAFTARKAN
        ctx.font = `${fontSize}px ArchivoBlack`; 
        lines = wrapText(ctx, text, maxWidth);
        const height = lines.length * (fontSize * 1.2);
        if (height < maxHeight) break;
        fontSize -= 2;
    }
    return { fontSize, lines };
}

module.exports = function (app) {
    app.get("/tools/bahlil", async (req, res) => {
        const { text } = req.query;
        if (!text) return res.status(400).json({ status: false, error: "Teksnya mana?" });

        try {
            const img = await loadImage(IMG_URL);
            const canvas = createCanvas(img.width, img.height);
            const ctx = canvas.getContext("2d");

            ctx.drawImage(img, 0, 0);

            const board = { x: 420, y: 415, w: 270, h: 410 };
            
            ctx.fillStyle = "#000000"; 
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const { fontSize, lines } = fitText(ctx, text, board.w, board.h);
            // 3. SET FONT LAGI SEBELUM FILLTEXT
            ctx.font = `${fontSize}px ArchivoBlack`;

            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;
            const centerX = board.x + (board.w / 2);
            const centerY = board.y + (board.h / 2);
            
            let startY = centerY - (totalHeight / 2) + (lineHeight / 2);

            lines.forEach((line, i) => {
                ctx.fillText(line, centerX, startY + (i * lineHeight));
            });

            const buffer = canvas.toBuffer("image/png");
            res.setHeader("Content-Type", "image/png");
            res.send(buffer);

        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    });
};
