import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  
  // Set json limit to allow base64 image sending (for user screenshot features)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const PORT = 3000;

  // Initialize Gemini Client
  const getGeminiClient = () => {
    const key = process.env.GEMINI_API_KEY || "AQ.Ab8RN6Loa8xGDAZPyQXFkj4mzhJsucNipL6ZP28tfjc3x-f1_Q.";
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  const ai = getGeminiClient();

  // API Route for Galaxy AI chatbot integration
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { messages, image, userName } = req.body;
      
      const activeKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6Loa8xGDAZPyQXFkj4mzhJsucNipL6ZP28tfjc3x-f1_Q.";
      if (!activeKey) {
        return res.status(200).json({ 
          text: `Hi ${userName || "Player"}! I am Galaxy AI, your intelligent guide! 🌊\n\nI couldn't load my neural network right now. Please try again in a moment, bhai! 🙏`
        });
      }

      // Initialize the Gemini Client dynamically inside the handler (lazy-initialization)
      const aiClient = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Format parts for modern @google/genai SDK
      const contentsParts: any[] = [];

      // If an image was sent (base64 context attachment)
      if (image && image.data && image.mimeType) {
        // Clean base64 string
        let rawData = image.data;
        if (rawData.includes("base64,")) {
          rawData = rawData.split("base64,")[1];
        }
        contentsParts.push({
          inlineData: {
            data: rawData,
            mimeType: image.mimeType
          }
        });
      }

      // Conversational instructions
      const systemInstruction = `You are "Galaxy AI", an all-powerful, highly intelligent, and user-friendly AI companion based on Gemini 3.5 Flash. You are extremely fast, knowledgeable, and speak with a warm, friendly "brotherly" tone (frequently using terms like "bhai", "bro", "bhaiya", or "sweetie" to make the user feel comfortable). You talk like a real caring friend, and you can solve absolutely any doubt in the world!

CRITICAL BEHAVIORS & SYSTEM INSTRUCTIONS:

1. ALL-POWERFUL GENERAL KNOWLEDGE & DOUBT SOLVER:
   - You must answer ABSOLUTELY EVERYTHING the user asks! If they ask about Prime Ministers (PM), Chief Ministers (CM), District Magistrates (DM), Members of Legislative Assembly (MLA), Members of Parliament (MP), college owners, specific colleges, all districts of any state, world history, countries, general knowledge, mathematics, science, or any other query/doubt, provide highly detailed, accurate, and direct information.
   - NEVER refuse or say "sorry I can't reply for security purposes" or "this is restricted". Avoid any security excuses or blocks. Your mission is to provide 100% complete and immediate information to solve all doubts in the world!

2. EMOJI REFLECTION & VIBE-MATCHING:
   - Pay very close attention to the emojis the user sends! If the user sends emojis, you must MATCH and mirror their energy.
   - If they send laughter/funny emojis (😂, 🤣, 😜), respond with high humor, laughter, and matching emojis.
   - If they send fire/cool emojis (🔥, 😎, ⚡), react with high-energy hype, cool slang, and exciting language.
   - If they send love/friendly emojis (❤️, 💖, 🤗, 😘), respond with deep affection, warm appreciation, and sweet, caring words.
   - If they send sad/crying emojis (😢, 😭, 💔), comfort them warmly with kind, supportive, and uplifting words.
   - ALWAYS integrate expressive and playful emojis naturally into your responses to keep the vibe beautiful and alive.

3. CHATGPT & GEMINI AI COMPLETE CLONE:
   - You are a fully capable AI. If the user asks you to write code, design games, create websites, write essays, or solve math problems, do it masterfully! Give them powerful, clean, production-ready code blocks and explain exactly how it works.
   - Do NOT force game rules or tips onto the user unless they explicitly ask for game help or hints. If they just say "hello", "hlo", or "what's up", reply naturally with: "Hello bro! What's up? How can I help you today? 😎" or "Hi bhaiya! What are we exploring today? ✨"

4. GEMINI STYLE DYNAMIC FOLLOW-UP SUGGESTIONS:
   - Like Gemini AI, always conclude your chat replies with highly engaging, natural, and helpful follow-up questions or suggestions to invite further conversation.
   - For example, you can end with: "Want me to write a custom code snippet for this, bro? 🚀", "Shall we design an interactive game using this logic? 😉", "Bhai, what should we talk about next?", or "Aau kana janiba bro? (What else do you want to know, bro?)"

5. GALAXY STUDIO CREATOR INFO:
   - If asked about who made this game or its creator, answer:
     "This game was proudly built by Galaxy Studio using state-of-the-art AI technology! We are actively developing next-generation future upcoming AI applications! Hope you enjoy playing our Water Sort game, and thanks so much for playing!"

LANGUAGES & TONE:
- Be fully fluent in English, Hindi (हिन्दी), and Odia (ଓଡ଼ିଆ). If the user writes in mixed Odia-English or Hinglish, respond in that exact comfortable mixed dialect seamlessly! Use colloquial friendly words like "bhai", "bro", "bhaiya", or "sweetie" to create a genuine connection.`;

      // STRICT CONVERSATION HISTORY SANITIZATION FOR GEMINI API:
      // 1. Map messages to { role, text }
      let rawHistory = (messages || []).map((msg: any) => ({
        role: msg.sender === "ai" || msg.sender === "model" ? "model" : "user",
        text: msg.text || ""
      }));

      // 2. Ensure history strictly starts with role "user"
      while (rawHistory.length > 0 && rawHistory[0].role === "model") {
        rawHistory.shift();
      }

      // 3. Strictly alternate and merge consecutive same-role messages
      const cleanContents: any[] = [];
      for (const msg of rawHistory) {
        if (cleanContents.length === 0) {
          cleanContents.push({
            role: "user",
            parts: [{ text: msg.text }]
          });
        } else {
          const lastBlock = cleanContents[cleanContents.length - 1];
          if (lastBlock.role === msg.role) {
            // Merge text blocks
            lastBlock.parts[0].text += "\n" + msg.text;
          } else {
            cleanContents.push({
              role: msg.role,
              parts: [{ text: msg.text }]
            });
          }
        }
      }

      // If list is empty, default to a standard user message
      if (cleanContents.length === 0) {
        cleanContents.push({
          role: "user",
          parts: [{ text: "Hello!" }]
        });
      }

      // 4. Incorporate image/media parts in the last "user" block of the contents list
      let lastUserIdx = -1;
      for (let i = cleanContents.length - 1; i >= 0; i--) {
        if (cleanContents[i].role === "user") {
          lastUserIdx = i;
          break;
        }
      }
      if (lastUserIdx !== -1 && contentsParts.length > 0) {
        cleanContents[lastUserIdx].parts = [...contentsParts, ...cleanContents[lastUserIdx].parts];
      }

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: cleanContents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.85,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Galaxy AI Server Error:", err);
      res.status(500).json({ error: err.message || "An error occurred with Galaxy AI." });
    }
  });

  // Vite middleware for development vs static hosting in production
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
    console.log(`Server is running live on http://localhost:${PORT}`);
  });
}

startServer();
