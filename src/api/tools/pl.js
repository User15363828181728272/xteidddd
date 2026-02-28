const { createCanvas } = require('canvas');

/**
 * Planet Info Planet Generator 
 * Author: RafzVellNs
 * Category: Tools
 * Creator: D2:业
 */
const planetData = {
    matahari: {
        nama: "Matahari", tipe: "Bintang (G2V)", diameter: "1.392.700 km", massa: "1.98 × 10^30 kg",
        jarak: "Pusat Tata Surya", orbit: "-", rotasi: "25-35 hari", suhu: "5.500°C (Permukaan)",
        fakta: ["Mengandung 99.8% massa tata surya.", "Energi dari fusi nuklir."], warna: "#ffcc00"
    },
    merkurius: {
        nama: "Merkurius", tipe: "Planet Terestrial", diameter: "4.879 km", massa: "3.30 × 10^23 kg",
        jarak: "57,9 Juta km", orbit: "88 Hari", rotasi: "59 Hari", suhu: "-173°C s/d 427°C",
        fakta: ["Terdekat dari Matahari.", "Atmosfer sangat tipis."], warna: "#b1b1b1"
    },
    venus: {
        nama: "Venus", tipe: "Planet Terestrial", diameter: "12.104 km", massa: "4.87 × 10^24 kg",
        jarak: "108 Juta km", orbit: "225 Hari", rotasi: "243 Hari", suhu: "±465°C",
        fakta: ["Planet terpanas.", "Rotasi searah jarum jam."], warna: "#eccc9a"
    },
    bumi: {
        nama: "Bumi", tipe: "Planet Terestrial", diameter: "12.742 km", massa: "5.97 × 10^24 kg",
        jarak: "149,6 Juta km", orbit: "365,25 Hari", rotasi: "24 Jam", suhu: "-88°C s/d 58°C",
        fakta: ["Satu-satunya kehidupan.", "71% adalah air."], warna: "#2e8bff"
    },
    mars: {
        nama: "Mars", tipe: "Planet Terestrial", diameter: "6.779 km", massa: "6.42 × 10^23 kg",
        jarak: "227 Juta km", orbit: "687 Hari", rotasi: "24,6 Jam", suhu: "-125°C s/d 20°C",
        fakta: ["Disebut Planet Merah.", "Memiliki gunung tertinggi."], warna: "#d14c32"
    },
    jupiter: {
        nama: "Jupiter", tipe: "Gas Giant", diameter: "139.820 km", massa: "1.90 × 10^27 kg",
        jarak: "778 Juta km", orbit: "11,86 Tahun", rotasi: "9,9 Jam", suhu: "-145°C",
        fakta: ["Planet terbesar.", "Memiliki 95+ satelit."], warna: "#d9a066"
    },
    saturnus: {
        nama: "Saturnus", tipe: "Gas Giant", diameter: "116.460 km", massa: "5.68 × 10^26 kg",
        jarak: "1,4 Miliar km", orbit: "29,5 Tahun", rotasi: "10,7 Jam", suhu: "-178°C",
        fakta: ["Sistem cincin tercantik.", "Bisa mengapung di air."], warna: "#f4d28c", cincin: true
    },
    uranus: {
        nama: "Uranus", tipe: "Ice Giant", diameter: "50.724 km", massa: "8.68 × 10^25 kg",
        jarak: "2,9 Miliar km", orbit: "84 Tahun", rotasi: "17,2 Jam", suhu: "-224°C",
        fakta: ["Rotasi menyamping.", "Atmosfer mengandung metana."], warna: "#afeeee"
    },
    neptunus: {
        nama: "Neptunus", tipe: "Ice Giant", diameter: "49.244 km", massa: "1.02 × 10^26 kg",
        jarak: "4,5 Miliar km", orbit: "165 Tahun", rotasi: "16,1 Jam", suhu: "-214°C",
        fakta: ["Planet paling berangin.", "Jarak terjauh."], warna: "#3d5afe"
    },
    pluto: {
        nama: "Pluto", tipe: "Dwarf Planet", diameter: "2.376 km", massa: "1.31 × 10^22 kg",
        jarak: "5,9 Miliar km", orbit: "248 Tahun", rotasi: "6,4 Hari", suhu: "-232°C",
        fakta: ["Bukan lagi planet utama.", "Lebih kecil dari Bulan."], warna: "#deb887"
    }
};

async function createPlanetImage(name) {
    const planet = planetData[name.toLowerCase()] || planetData.bumi;
    const canvas = createCanvas(900, 600);
    const ctx = canvas.getContext('2d');

    // Background & Stars logic (Sama seperti sebelumnya)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
    bgGrad.addColorStop(0, "#050510");
    bgGrad.addColorStop(1, "#000000");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 900, 600);
    for (let i = 0; i < 200; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 900, Math.random() * 600, Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
    }

    // Glow & Planet (Sama seperti sebelumnya)
    const centerX = 250; const centerY = 300; const radius = 150;
    const glow = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius + 100);
    glow.addColorStop(0, planet.warna);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(centerX, centerY, radius + 100, 0, Math.PI * 2); ctx.fill();

    const grad = ctx.createRadialGradient(centerX - 50, centerY - 50, 50, centerX, centerY, radius);
    grad.addColorStop(0, "#ffffff44");
    grad.addColorStop(1, planet.warna);
    ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();

    if (planet.cincin) {
        ctx.beginPath(); ctx.ellipse(centerX, centerY, 240, 70, 0.2, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff66"; ctx.lineWidth = 10; ctx.stroke();
    }

    // Info Rendering
    ctx.fillStyle = "white";
    ctx.font = "bold 45px Arial"; ctx.fillText(planet.nama, 500, 100);
    ctx.font = "18px Arial"; let y = 170;
    const items = [`Tipe: ${planet.tipe}`, `Diameter: ${planet.diameter}`, `Massa: ${planet.massa}`, `Jarak: ${planet.jarak}`, `Orbit: ${planet.orbit}`, `Rotasi: ${planet.rotasi}`, `Suhu: ${planet.suhu}`];
    items.forEach(t => { ctx.fillText(t, 500, y); y += 35; });
    ctx.font = "bold 22px Arial"; ctx.fillText("Fakta Menarik:", 500, y + 20);
    ctx.font = "17px Arial"; planet.fakta.forEach((f, i) => { ctx.fillText(`• ${f}`, 500, y + 55 + (i * 30)); });

    return canvas.toBuffer();
}

module.exports = function (app) {
    app.get("/v1/tools/planet", async (req, res) => {
        const { name } = req.query;
        if (!name) return res.status(400).json({ status: false, error: "Contoh: ?name=jupiter" });
        if (!planetData[name.toLowerCase()]) return res.status(404).json({ status: false, error: "Planet tidak ada di tata surya kita, Bang!" });

        try {
            const buffer = await createPlanetImage(name);
            res.set("Content-Type", "image/png");
            res.send(buffer);
        } catch (e) { res.status(500).json({ status: false, error: e.message }); }
    });

    app.get("/v1/tools/planet-list", (req, res) => {
        res.json({ status: true, creator: "D2:业", result: Object.keys(planetData) });
    });
};
