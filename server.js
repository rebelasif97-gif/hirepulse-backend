import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get("/", (req, res) => {
  res.send("HirePulse Backend is running.");
});

app.post("/generate", async (req, res) => {
  try {
    const { jobDescription, resumeInfo, targetRole, mode } = req.body;

    if (!jobDescription || !resumeInfo) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const modelName =
      mode === "standard" ? "gemini-1.5-flash" : "gemini-1.5-pro";

    const maxTokens = mode === "standard" ? 2500 : 5000;

    const prompt = `
You are HirePulse, an ATS-focused job application assistant.

JOB DESCRIPTION:
${jobDescription}

RESUME INFORMATION:
${resumeInfo}

TARGET ROLE:
${targetRole || "Not provided"}

Return output strictly in this format:

[ATS REPORT]
...
[ATS RESUME]
...
[COVER LETTER]
...
[LINKEDIN ABOUT]
...
[LINKEDIN MESSAGE]
...
[EMAIL TO RECRUITER]
...
[INTERVIEW PREP]
...
`;

    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7
      }
    });

    const text = result.response.text();

    res.json({ output: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Generation failed." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
