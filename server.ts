import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.VITE_PORT || '3000', 10);

  // Ensure public/images directory exists
  const imagesDir =  "/images";
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // API to list images in the images folder
  app.get("/api/images", (req, res) => {
    try {
      const files = fs.readdirSync(imagesDir);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg)$/i.test(file)
      );
      res.json(imageFiles.map(file => ({
        id: file,
        url: `/images/${file}`,
        name: file
      })));
    } catch (error) {
      console.error("Error reading images directory:", error);
      res.status(500).json({ error: "Failed to read images" });
    }
  });

  // Serve static images
  app.use("/images", express.static(imagesDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
