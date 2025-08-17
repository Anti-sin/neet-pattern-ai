import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public")); // serve frontend files (index.html, script.js, etc.)

const API_KEY = process.env.GEMINI_API_KEY;

// API route to call Gemini safely
app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt; // ✅ match frontend key

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    res.json(data); // send response back to frontend
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = 3000;
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (your frontend) from "public"
app.use(express.static(path.join(__dirname, "public")));
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
