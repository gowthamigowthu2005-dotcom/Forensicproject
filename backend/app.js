import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";
import path from "path";

import authRouter from "./routes/auth.js";
import dashboardRouter from "./routes/dashboard.js";
import generationRouter from "./routes/generation.js";
import labelerRouter from "./routes/labeler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/forensic_db";

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Serve the built frontend from backend/dist (populated at deploy time)
const frontendDist = path.join(__dirname, "dist");
app.use(express.static(frontendDist));

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api", generationRouter);
app.use("/api/labeler", labelerRouter);

app.get("/", (req, res) => {
  // If frontend is built, serve index.html; otherwise show API status
  const indexPath = path.join(__dirname, "dist", "index.html");
  if (require("fs").existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: "Forensic Face Generation API is running." });
  }
});

// SPA fallback: any non-API route serves the frontend
app.get(/^\/(?!api).*/, (req, res) => {
  const indexPath = path.join(__dirname, "dist", "index.html");
  if (require("fs").existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: "Frontend not built" });
  }
});

// ── MongoDB: connect with a short timeout so the server starts fast ───────────
const client = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 3000,  // fail fast instead of the 30s default
  connectTimeoutMS: 3000,
});

async function startServer() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    app.locals.db = client.db();
    console.log("✅ MongoDB connected →", mongoUri);
  } catch (err) {
    console.warn("⚠️  MongoDB not reachable — running without DB (auth uses local users.json).");
    console.warn("   Reason:", err.message);
    app.locals.db = null;
  }

  app.listen(port, () => {
    console.log(`🚀 Forensic Face Generation API is running on port ${port}.`);
  });
}

startServer();

process.on("SIGINT", async () => {
  await client.close().catch(() => {});
  process.exit(0);
});
