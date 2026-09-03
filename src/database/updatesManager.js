import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "updates.json");

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      knownCommands: [],
      history: [],
      firstRunCompleted: false,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { knownCommands: [], history: [], firstRunCompleted: false };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function getUpdatesState() {
  return loadDB();
}

export function isFirstRun() {
  return !loadDB().firstRunCompleted;
}

export function markFirstRunComplete(currentCommands) {
  const db = loadDB();
  db.knownCommands = Array.from(new Set([...db.knownCommands, ...currentCommands]));
  db.firstRunCompleted = true;
  saveDB(db);
}

export function getKnownCommands() {
  return loadDB().knownCommands || [];
}

export function saveAnnouncedUpdates(newItems, version) {
  const db = loadDB();
  const names = newItems.map((it) => it.name);
  db.knownCommands = Array.from(new Set([...db.knownCommands, ...names]));

  db.history.unshift({
    id: `upd_${Date.now()}`,
    version,
    date: new Date().toLocaleDateString("pt-BR"),
    timestamp: Date.now(),
    items: newItems,
  });

  if (db.history.length > 50) db.history = db.history.slice(0, 50);
  saveDB(db);
}

export function getCategoryEmoji(cat) {
  const map = {
    games: "🎮",
    ia: "🧠",
    economy: "🪙",
    utilities: "🛠️",
    information: "📰",
    admin: "👑",
  };
  return map[cat] || "✨";
}
