import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";    
dotenv.config();

const API_KEY = process.env.DEEPSEEK_API_KEY;

if (!API_KEY) {
  console.error("❌ FALTA DEEPSEEK_API_KEY en .env");
  process.exit(1);
}

// 📌 Ruta del prompt externo
const promptPath = path.join(process.cwd(), "assets", "Prompts", "prompt.txt");

// 📌 Leer el prompt una sola vez
let systemPrompt = "";
try {
  systemPrompt = fs.readFileSync(promptPath, "utf8");
  console.log("📄 Prompt cargado desde archivo");
} catch (err) {
  console.error("❌ Error leyendo prompt:", err);
  systemPrompt = "Eres un asistente útil y amable.";
}

export async function deepSeekChat(prompt: string, user: string) {
  try {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    );

    return res.data?.choices?.[0]?.message?.content ?? "Lo siento, no entendí.";

  } catch (err: any) {
    console.error("❌ Error DeepSeek:", err.response?.data || err);
    return "Lo siento, tuve un problema procesando tu mensaje.";
  }
}
