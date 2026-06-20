import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Deep interactive Audit API endpoint
app.post("/api/audit", async (req, res) => {
  const { moduleName, question } = req.body;

  if (!ai) {
    return res.status(500).json({
      error: "Gemini API key is not configured. Please add it via AI Studio Settings Secrets.",
    });
  }

  try {
    const prompt = `
You are a highly premium hospitality software engineer, UX Architect, and property management systems (PMS) security consultant.
A hotel owner is analyzing their property management software (hosted at pms.devhotelmansarover.com/pms-app/index.html#app-booking).
They want a high-value deep-research analysis about structural and user experience flaws in the specified area: "${moduleName}".

Additional context or question from the user: "${question || 'Standard full architectural analysis request'}"

Draft a high-quality audit response in Hindi (as requested by the user's Hindi query or elegant Mix of Hindi/English with direct clarity). Focus on actionable technical criticisms and UX flaws common in local/custom-built systems:
1. **UX/UI Shortcomings** (User journey, mobile responsiveness, calendar loading, room-grid navigation, friction during guest check-in, form simplicity).
2. **Technical & API Bottlenecks** (Sync issues with OTA channel managers like Staah/AxisRooms, slow queries in booking status checks, non-responsive state handling).
3. **Database & Audit Trail Vulnerabilities** (Lack of proper ledger control, voided-bill vulnerabilities, staff manual adjustments without change logs, critical security loopholes in local server builds).
4. **Actionable Suggestions (सुझाव / Redesign Checklist)** - Bulleted points with clear architecture recommendations, step-by-step UI adjustments, and modern SaaS alternatives.

Return your response in clean Markdown with professional, authoritative styling.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ results: response.text });
  } catch (error: any) {
    console.error("Gemini Audit Error:", error);
    res.status(500).json({ error: error.message || "Something went wrong during dynamic audit lookup." });
  }
});

async function main() {
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
    console.log(`Mansarover PMS Audit Hub running on http://0.0.0.0:${PORT}`);
  });
}

main();
