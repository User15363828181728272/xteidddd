const axios = require("axios");

const SUPABASE_URL = "https://bfnagdegsgqrrhlurlpc.supabase.co";
const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbmFnZGVnc2dxcnJobHVybHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTE1NzQsImV4cCI6MjA2OTI4NzU3NH0._RoSCboOxjr3ldxbn_WYPGOCsTADqV6siaS0wVmkBSA";

async function db(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}&select=*`;

  try {
    const res = await axios.get(url, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (e) {
    console.error("DB Error:", e.response?.data || e.message);
    throw new Error("Database request failed");
  }
}

async function findHeroByName(name) {
  const q = `name=ilike.%25${name}%25`;
  const list = await db("heroes", q);
  return list.length ? list[0] : null;
}

function normalizeItems(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  if (typeof raw === "string" && raw.includes(",")) {
    return raw.split(",").map(i => Number(i.trim()));
  }

  return [raw];
}

const mlbuild = {
  search: async (heroName) => {
    const hero = await findHeroByName(heroName);
    if (!hero) {
      return {
        status: false,
        message: `Hero '${heroName}' not found`,
      };
    }

    const [builds, items] = await Promise.all([
      db("builds", `hero_id=eq.${hero.id}`),
      db("items"),
    ]);

    const finalBuilds = builds.map(b => {
      const itemIds = normalizeItems(b.items);
      return {
        title: b.title,
        items: itemIds.map(
          id => items.find(i => i.id == id) || { name: "Unknown Item" }
        ),
      };
    });

    return {
      status: true,
      hero: hero.name,
      total: finalBuilds.length,
      builds: finalBuilds,
    };
  },
};

module.exports = function (app) {
  app.get("/v1/search/buildml", async (req, res) => {
    const { hero } = req.query;

    if (!hero) {
      return res.status(400).json({
        status: false,
        message: "Query hero is required",
        example: "/search/buildml?hero=layla",
      });
    }

    try {
      const result = await mlbuild.search(hero);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  });
};