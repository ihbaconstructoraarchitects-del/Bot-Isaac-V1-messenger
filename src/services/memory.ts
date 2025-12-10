import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "data", "memory.json");

function loadMemory() {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return {};
  }
}

function saveMemory(data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

export function getUserMemory(userId: string) {
  const db = loadMemory();

  if (!db[userId]) {
    db[userId] = {
      id: userId,
      name: null,
      age: null,
      interests: [],
      history: [],
      lastInteraction: new Date().toISOString(),
    };
    saveMemory(db);
  }

  return db[userId];
}

export function updateUserMemory(userId: string, update: any) {
  const db = loadMemory();

  db[userId] = {
    ...db[userId],
    ...update,
    lastInteraction: new Date().toISOString()
  };

  saveMemory(db);
}

export function pushHistory(userId: string, text: string) {
  const db = loadMemory();

  db[userId].history.push(text);
  db[userId].lastInteraction = new Date().toISOString();

  if (db[userId].history.length > 50) {
    db[userId].history = db[userId].history.slice(-50);
  }

  saveMemory(db);
}
