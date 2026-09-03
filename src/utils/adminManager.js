import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_DB_PATH = path.join(__dirname, "..", "database", "admin.json");

function loadAdminDB() {
  if (!fs.existsSync(ADMIN_DB_PATH)) {
    fs.writeFileSync(ADMIN_DB_PATH, JSON.stringify({ warns: {}, blockedWords: [] }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(ADMIN_DB_PATH, "utf-8"));
  } catch {
    return { warns: {}, blockedWords: [] };
  }
}

function saveAdminDB(data) {
  fs.writeFileSync(ADMIN_DB_PATH, JSON.stringify(data, null, 2));
}

export function addWarn(guildId, userId, reason = "Sem motivo especificado") {
  const db = loadAdminDB();
  const key = `${guildId}_${userId}`;
  if (!db.warns[key]) db.warns[key] = [];
  db.warns[key].push({ reason, date: new Date().toLocaleDateString("pt-BR") });
  saveAdminDB(db);
  return db.warns[key].length;
}

export function removeWarn(guildId, userId) {
  const db = loadAdminDB();
  const key = `${guildId}_${userId}`;
  if (!db.warns[key] || db.warns[key].length === 0) return 0;
  db.warns[key].pop();
  saveAdminDB(db);
  return db.warns[key].length;
}

export function getWarns(guildId, userId) {
  const db = loadAdminDB();
  return db.warns[`${guildId}_${userId}`] || [];
}

export function addBlockedWord(word) {
  const db = loadAdminDB();
  const cleanWord = word.toLowerCase().trim();
  if (!db.blockedWords.includes(cleanWord)) {
    db.blockedWords.push(cleanWord);
    saveAdminDB(db);
    return true;
  }
  return false;
}

export function removeBlockedWord(word) {
  const db = loadAdminDB();
  const cleanWord = word.toLowerCase().trim();
  db.blockedWords = db.blockedWords.filter((w) => w !== cleanWord);
  saveAdminDB(db);
}

export function getBlockedWords() {
  return loadAdminDB().blockedWords || [];
}
