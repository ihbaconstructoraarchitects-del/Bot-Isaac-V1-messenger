import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Obtener memoria del usuario
export async function getUserMemory(userId: string) {
  const raw = await redis.get(`memory:${userId}`);
  if (!raw) return { name: null, interests: [], history: [] };
  return JSON.parse(raw);
}

// Guardar la memoria del usuario
export async function updateUserMemory(userId: string, newData: any) {
  const current = await getUserMemory(userId);
  const merged = { ...current, ...newData };
  await redis.set(`memory:${userId}`, JSON.stringify(merged));
  return merged;
}

// Añadir historial
export async function pushHistory(userId: string, message: string) {
  const mem = await getUserMemory(userId);
  mem.history = [...(mem.history || []), message].slice(-20); // Guarda últimos 20 mensajes
  await redis.set(`memory:${userId}`, JSON.stringify(mem));
}
