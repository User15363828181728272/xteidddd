const express = require("express");
const chalk = require("chalk");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK || "https://discord.com/api/webhooks/1475655302383665213/U5FwGe2sMbUcujPKvq9fgLdjIO3Euf1xxsgI95fwHcaYHJ-x3VBAh_wSCENEnpK6p0h1";

async function sendDiscord(message, embed = null) {
    try {
        const payload = { content: message };
        if (embed) payload.embeds = [embed];
        await axios.post(DISCORD_WEBHOOK_URL, payload);
    } catch (err) {
        console.error(chalk.red(`[DiscordError] ${err.message}`));
    }
}

app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(fileUpload());
app.set("json spaces", 2);
app.use("/", express.static(path.join(__dirname, "api-page")));
app.use("/src", express.static(path.join(__dirname, "src")));

const openApiPath = path.join(__dirname, "src", "schema.json");
let openApi = {};
if (fs.existsSync(openApiPath)) {
    openApi = JSON.parse(fs.readFileSync(openApiPath));
}

app.use((req, res, next) => {
    const original = res.json;
    res.json = function (data) {
        if (typeof data === "object") {
            data = { status: data.status ?? true, creator: "D2:業", ...data };
        }
        return original.call(this, data);
    };
    next();
});

const apiFolder = path.join(__dirname, "src", "api");
if (fs.existsSync(apiFolder)) {
    const categories = fs.readdirSync(apiFolder);
    categories.forEach((sub) => {
        const subPath = path.join(apiFolder, sub);
        if (fs.statSync(subPath).isDirectory()) {
            const files = fs.readdirSync(subPath);
            files.forEach((file) => {
                if (file.endsWith(".js")) {
                    try {
                        const route = require(path.join(subPath, file));
                        if (typeof route === "function") {
                            route(app);
                            console.log(chalk.bgGreen.black(` OK `) + ` ${file}`);
                        }
                    } catch (e) {
                        console.error(chalk.bgRed.white(` ERROR LOADER `) + ` ${file}: ${e.message}`);
                        sendDiscord(`❌ **Gagal Memuat API**`, {
                            title: "Loader Error",
                            description: `File: \`${file}\`\nError: \`${e.message}\``,
                            color: 16711680
                        });
                    }
                }
            });
        }
    });
}

app.get('/api/config', (req, res) => {
    res.json({
        ok: true,
        version: "v2.5.0-Stable",
        node_version: process.version,
        uptime: process.uptime(),
        memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        token_preview: "https://discord.com/api/webhooks/1475655302383665213/U5FwGe2sMbUcujPKvq9fgLdjIO3Euf1xxsgI95fwHcaYHJ-x3VBAh_wSCENEnpK6p0h1"
    });
});

app.post('/api/request', async (req, res) => {
    const { name, type, detail, timestamp } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
        await sendDiscord(`🚀 **NEW REQUEST**`, {
            color: 3447003,
            title: "Incoming Payload from Web Portal",
            fields: [
                { name: "Fitur/Name", value: `\`${name || "N/A"}\``, inline: true },
                { name: "Type", value: `\`${type || "SECURE_PUSH"}\``, inline: true },
                { name: "IP Address", value: `\`${ip}\``, inline: true },
                { name: "Client Time", value: timestamp ? new Date(timestamp).toLocaleString('id-ID') : "N/A", inline: true },
                { name: "User Agent", value: `\`${userAgent.substring(0, 50)}...\``, inline: false },
                { name: "Code/Detail", value: `\`\`\`javascript\n${detail ? detail.substring(0, 1000) : "No Detail Provided"}\n\`\`\`` }
            ],
            footer: { text: "XTE ID Secure Bridge System" },
            timestamp: new Date()
        });

        res.json({ 
            ok: true, 
            message: "Request successfully transmitted to Discord",
            request_id: Math.random().toString(36).substring(7).toUpperCase()
        });
    } catch (err) {
        console.error(chalk.red(`[RequestError] ${err.message}`));
        res.status(500).json({ ok: false, description: "Failed to transmit payload" });
    }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "api-page", "index.html")));
app.get("/docs", (req, res) => res.sendFile(path.join(__dirname, "api-page", "docs.html")));
app.get("/nt", (req, res) => res.sendFile(path.join(__dirname, "api-page", "nt.html")));
app.get("/dev", (req, res) => res.sendFile(path.join(__dirname, "api-page", "dev.html")));
app.get("/req", (req, res) => res.sendFile(path.join(__dirname, "api-page", "r.html")));
app.get("/schema.json", (req, res) => res.sendFile(openApiPath));

app.use((err, req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.error(chalk.red(`[RuntimeError] ${req.url} - ${err.message}`));
    
    sendDiscord(`🚨 **Server Error Runtime**`, {
        color: 15105570,
        fields: [
            { name: "Path", value: `\`${req.url}\``, inline: true },
            { name: "Method", value: `\`${req.method}\``, inline: true },
            { name: "IP Address", value: `\`${ip}\``, inline: true },
            { name: "Error Message", value: `\`${err.message}\`` }
        ],
        timestamp: new Date()
    });

    res.status(500).json({ status: false, error: "Internal Server Error. Notified to Owner." });
});

app.listen(PORT, () => {
    console.log(chalk.bgCyan.black(` INFO `) + ` Server running on port ${PORT}`);
    sendDiscord("🟢 **Server Dinzo Apis Started**", {
        description: `Server successfully running on port ${PORT}`,
        color: 3066993,
        timestamp: new Date()
    });
});

module.exports = app;
