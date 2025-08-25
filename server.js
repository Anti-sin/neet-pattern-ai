// server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load env vars
dotenv.config();

const app = express();
app.use(express.json()); // parse JSON bodies

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, "public")));

const API_KEY = process.env.GEMINI_API_KEY;

// Proxy route to Gemini
app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body?.prompt || "";
    if (!API_KEY)
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // Optional tuning:
          // ,generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
        }),
      }
    );

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("❌ /generate error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
