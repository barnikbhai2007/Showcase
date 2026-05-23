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
      if (!term) {
        return res.status(400).json({ error: "Missing term" });
      }

      const steamRes = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`);
      const steamData = await steamRes.json();
      
      const items = steamData.items || [];
      const formattedItems = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        thumbnail: item.tiny_image,
        banner: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`
      }));

      res.json({ items: formattedItems });
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
