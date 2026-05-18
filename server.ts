import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  // Simulated Log Data & Statistics
  let alerts = [
    { id: 1, type: "CRITICAL", source: "Auth", message: "Multiple failed SSH logins from 192.168.1.105", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: 2, type: "WARNING", source: "Sudo", message: "Unauthorized sudo attempt by 'guest'", timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 3, type: "INFO", source: "Kernel", message: "BTRFS: device scan complete", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  ];

  let activeBlocks = [
    { ip: "192.168.1.105", reason: "SSH Brute Force", expiry: new Date(Date.now() + 1000 * 60 * 25).toISOString() },
    { ip: "45.132.22.11", reason: "Nginx 404 Flood", expiry: new Date(Date.now() + 1000 * 60 * 5).toISOString() },
  ];

  // API Endpoints
  app.get("/api/stats", (req, res) => {
    res.json({
      activeUsers: 42,
      uptime: "15d 4h 22m",
      totalLogsProcessed: 125430,
      threatsDetected: 14,
      systemHealth: "Optimal",
      activeBlocks: activeBlocks.length,
      cpuUsage: [
        { time: "00:00", value: 32 },
        { time: "04:00", value: 45 },
        { time: "08:00", value: 85 },
        { time: "12:00", value: 62 },
        { time: "16:00", value: 42 },
        { time: "20:00", value: 38 },
        { time: "23:59", value: 31 },
      ],
      threatDistribution: [
        { name: "SSH Brute Force", value: 45 },
        { name: "Unauthorized Sudo", value: 25 },
        { name: "Nginx 404 Flood", value: 20 },
        { name: "Suspicious Script", value: 10 },
      ]
    });
  });

  app.get("/api/alerts", (req, res) => {
    res.json(alerts);
  });

  app.get("/api/active-blocks", (req, res) => {
    res.json(activeBlocks);
  });

  app.post("/api/analyze", async (req, res) => {
    const { logEntry } = req.body;
    if (!logEntry) return res.status(400).json({ error: "No log entry provided" });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this Linux log entry for security threats and provide a concise explanation and recommended action: "${logEntry}"`,
        config: {
          systemInstruction: "You are a Senior SOC Analyst and Linux Security Expert. Provide professional, actionable intelligence.",
        }
      });
      res.json({ analysis: response.text });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to analyze log" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SentinelLog Pro running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
