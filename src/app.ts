import express from "express";
import axios from "axios";
import dotenv from "dotenv";

import { deepSeekChat } from "./services/deepseek";
import { getUserMemory, updateUserMemory, pushHistory } from "./services/memory";
import { getUserName } from "./services/facebook";

dotenv.config();

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const HUMAN_TRIGGERS = [
  "agente",
  "asesor",
  "humano",
  "quiero hablar",
  "quiero un agente",
  "quiero hablar con un asesor"
];

if (!VERIFY_TOKEN || !ACCESS_TOKEN) {
  console.error("❌ Faltan claves en .env");
  process.exit(1);
}

// 🧰 Cache para evitar mensajes duplicados
const processedEvents = new Set<string>();

// ⏳ Tiempo máximo permitido para procesar mensajes (60s)
const MAX_EVENT_AGE_MS = 60 * 1000;

/**
 * Webhook verification
 */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

/**
 * Construir prompt IA
 */
function buildPrompt(message: string, mem: any) {
  return `
Eres un asistente amable, profesional y experto en bienes raíces.

Datos del usuario:
- Nombre: ${mem.name ?? "No guardado"}
- Intereses: ${mem.interests?.join(", ") || "ninguno"}

Historial reciente:
${mem.history.slice(-5).join("\n")}

Mensaje actual:
"${message}"
  `;
}

/**
 * Webhook de mensajes
 */
app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object !== "page") return res.sendStatus(404);

  for (const entry of body.entry) {
    for (const event of entry.messaging) {

      // ❌ Ignorar ECO (mensajes enviados por tu bot)
      if (event.message?.is_echo) continue;

      // ❌ Ignorar eventos sin texto
      if (!event.message?.text) continue;

      // 🛡 Evitar duplicados por ID único
      const eventId = `${event.sender.id}_${event.timestamp}`;
      if (processedEvents.has(eventId)) {
        console.log("⚠ Evento duplicado ignorado.");
        continue;
      }
      processedEvents.add(eventId);

      // ⏳ Evitar eventos viejos que FB reenvía al reconectar
      const age = Date.now() - event.timestamp;
      if (age > MAX_EVENT_AGE_MS) {
        console.log("⏳ Mensaje viejo ignorado:", event.message.text);
        continue;
      }

      const sender = event.sender.id;
      const text = event.message.text.trim().toLowerCase();

      console.log("📥 Usuario:", sender);
      console.log("💬 Texto REAL:", text);

      // ------------------------
      // 🚨 DETECCIÓN DE ASESOR
  
      const triggered = HUMAN_TRIGGERS.some(t => text.includes(t));

      if (triggered) {
        console.log("🔔 Usuario pidió hablar con un asesor");

        await sendMessage(sender, "👌 Te conecto con un asesor humano. Un momento por favor.");

        const fbName = await getUserName(sender) || "Usuario sin nombre visible";
        const agents = process.env.AGENT_IDS?.split(",") || [];

        const alertMsg =
          `🚨 *Nuevo cliente solicita un asesor humano*\n\n` +
          `👤 Nombre: ${fbName}\n` +
          `🆔 PSID: ${sender}\n` +
          `💬 Mensaje: "${text}"\n` +
          `🕒 ${new Date().toLocaleString("es-PE")}`;

        for (const agent of agents) {
          await sendMessage(agent.trim(), alertMsg);
        }
        continue;
      }

      // ------------------------
      // 🧠 IA + MEMORIA

      const mem = getUserMemory(sender);
      pushHistory(sender, text);

      const matchName = text.match(/me llamo ([a-záéíóúñ ]+)/i);
      if (matchName) {
        const name = matchName[1].trim();
        updateUserMemory(sender, { name });
        await sendMessage(sender, `¡Mucho gusto, ${name}! 😄`);
        continue;
      }

      const matchInterest = text.match(/me gusta(?:n)? (.+)/i);
      if (matchInterest) {
        const interest = matchInterest[1].trim();
        const interests = mem.interests || [];
        interests.push(interest);
        updateUserMemory(sender, { interests });
        await sendMessage(sender, `¡Qué bien! A mí también me gusta ${interest} 😄`);
        continue;
      }

      const prompt = buildPrompt(text, mem);
      const reply = await deepSeekChat(prompt, sender);

      pushHistory(sender, reply);

      await sendMessage(sender, reply);
    }
  }

  res.sendStatus(200);
});

/**
 * Enviar mensaje
 */
async function sendMessage(userId: string, text: string) {
  try {
    await axios.post(
      "https://graph.facebook.com/v19.0/me/messages",
      {
        messaging_type: "RESPONSE",
        recipient: { id: userId },
        message: { text }
      },
      { params: { access_token: ACCESS_TOKEN } }
    );

    console.log(`📤 Mensaje enviado a ${userId}`);
  } catch (err: any) {
    console.error("❌ Error enviando mensaje:", err.response?.data || err.message);
  }
}

app.listen(3008, () => {
  console.log("🚀 Bot Messenger + IA + Memoria + Human Handoff (estable)");
});
