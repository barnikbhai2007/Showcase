import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/search", async (req, res) => {
    try {
      const term = req.query.term as string;
      const category = req.query.category as string;
      if (!term) {
        return res.status(400).json({ error: "Missing term" });
      }
      
      const isLust = category === 'Lust Games';

      const extraGames = [
        { id: 'custom-1', name: 'Valorant', banner: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Valorant_logo_-_pink_color_version.svg' },
        { id: 'custom-2', name: 'League of Legends', banner: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/League_of_Legends_2019_vector.svg' },
        { id: 'custom-3', name: 'Fortnite', banner: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/FortniteLogo.svg' },
        { id: 'custom-4', name: 'Minecraft', banner: 'https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png' },
        { id: 'custom-5', name: 'Overwatch 2', banner: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Overwatch_2_logo.svg' },
        { id: 'custom-6', name: 'Escape from Tarkov', banner: 'https://upload.wikimedia.org/wikipedia/en/9/90/Escape_from_Tarkov_logo.png' },
        { id: 'custom-7', name: 'Genshin Impact', banner: 'https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_logo.svg' },
        { id: 'custom-8', name: 'Honkai: Star Rail', banner: 'https://upload.wikimedia.org/wikipedia/en/8/87/Honkai_Star_Rail_logo.png' },
        { id: 'custom-9', name: 'Roblox', banner: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Roblox_Logo_2022.svg' },
        { id: 'custom-10', name: 'Rocket League', banner: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Rocket_League_coverart.jpg' },
        // Hardcoded some popular items that might bypass simple searches
        { id: 'lust-1', name: 'Summertime Saga', banner: 'https://summertimesaga.com/assets/images/logo.png' },
        { id: 'lust-2', name: 'Milfy City', banner: 'https://pictures.hentai-foundry.com/i/icstor/863412/icstor-863412-Milfy_City-Banner_Final.jpg' },
        { id: 'lust-3', name: 'Being a DIK', banner: 'https://cdn.akamai.steamstatic.com/steam/apps/1126320/header.jpg' },
        { id: 'lust-4', name: 'Dreams of Desire', banner: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Square_200x200.png/200px-Square_200x200.png' }
      ];

      const matchExtra = extraGames.filter(g => g.name.toLowerCase().includes(term.toLowerCase())).map(g => ({
        id: g.id,
        name: g.name,
        thumbnail: g.banner,
        banner: g.banner
      }));

      let steamData: any = { items: [] };
      if (!isLust) {
        try {
          const steamRes = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`);
          steamData = await steamRes.json();
        } catch(e) {}
      }
      
      const items = steamData.items || [];
      const formattedItems = items.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        thumbnail: item.tiny_image,
        banner: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`
      }));

      // Fallback search with iTunes (for mobile games)
      let itunesItems: any[] = [];
      if (!isLust) {
        try {
           const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&limit=10`);
           const itunesData = await itunesRes.json();
           if (itunesData && itunesData.results) {
               itunesItems = itunesData.results.map((item: any) => ({
                   id: item.trackId.toString(),
                   name: item.trackName,
                   thumbnail: item.artworkUrl100 || item.artworkUrl60 || '',
                   banner: item.artworkUrl512 || item.artworkUrl100 || ''
               }));
           }
        } catch (e) {
            // ignore
        }
      }

      // Add Itch.io fetch for indie games
      let itchItems: any[] = [];
      try {
         const itchRes = await fetch(`https://itch.io/search?q=${encodeURIComponent(term)}`);
         const itchHtml = await itchRes.text();
         
         const itchCells = itchHtml.match(/<div class="game_cell[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/g) || [];
         for (let i = 0; i < Math.min(itchCells.length, 10); i++) {
             const cell = itchCells[i];
             const idMatch = cell.match(/data-game_id="([^"]+)"/);
             const titleMatch = cell.match(/<a class="title game_link"[^>]+>([^<]+)<\/a>/);
             let thumbMatch = cell.match(/data-lazy_src="([^"]+)"/);
             if (!thumbMatch) {
               thumbMatch = cell.match(/<img[^>]+src="([^"]+)"/);
             }
             if (titleMatch) {
                 itchItems.push({
                     id: `itch-${idMatch ? idMatch[1] : Math.random().toString()}`,
                     name: titleMatch[1].trim(),
                     thumbnail: thumbMatch ? thumbMatch[1] : '',
                     banner: thumbMatch ? thumbMatch[1] : ''
                 });
             }
         }
      } catch (e) {
          // ignore
      }

      // Combine and remove exact name duplicates
      const combined = isLust ? [...matchExtra, ...itchItems] : [...matchExtra, ...itchItems, ...formattedItems, ...itunesItems];
      const uniqueNames = new Set();
      const uniqueItems = [];
      for (const item of combined) {
         if (!uniqueNames.has(item.name.toLowerCase())) {
             uniqueNames.add(item.name.toLowerCase());
             uniqueItems.push(item);
         }
      }

      res.json({ items: uniqueItems });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to search for game" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
