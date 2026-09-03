import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { addCoins, removeCoins, getCoins } from "../utils/usersManager.js";
import { applyExp, getRPGPlayer, saveRPGPlayer } from "./rpgEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RACE_DB_PATH = path.join(__dirname, "..", "database", "race.json");

function loadRaceDB() {
  if (!fs.existsSync(RACE_DB_PATH)) {
    fs.writeFileSync(RACE_DB_PATH, JSON.stringify({ pilots: {} }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(RACE_DB_PATH, "utf-8"));
  } catch {
    return { pilots: {} };
  }
}

function saveRaceDB(data) {
  fs.writeFileSync(RACE_DB_PATH, JSON.stringify(data, null, 2));
}

export function getPilot(userId, username = "Piloto") {
  const db = loadRaceDB();
  if (!db.pilots[userId]) {
    db.pilots[userId] = {
      name: username,
      races: 0,
      wins: 0,
      streak: 0,
      bestStreak: 0,
    };
    saveRaceDB(db);
  }
  return db.pilots[userId];
}

export function savePilot(userId, pilot) {
  const db = loadRaceDB();
  db.pilots[userId] = pilot;
  saveRaceDB(db);
}

export function getAllPilots() {
  const db = loadRaceDB();
  return Object.entries(db.pilots).map(([id, data]) => ({ id, ...data }));
}

// Veículos disponíveis
export const VEHICLES = [
  { emoji: "🏎️", name: "Fórmula 1" },
  { emoji: "🚗", name: "Esportivo" },
  { emoji: "🛻", name: "Picape Turbo" },
  { emoji: "🏍️", name: "Superbike" },
  { emoji: "🏎️‍💨", name: "Hypercar" }
];

// Eventos da Pista
const EVENTS = [
  { text: "🚀 ativou o NITRO!", delta: 4 },
  { text: "⚡ pegou o vácuo perfeito!", delta: 3 },
  { text: "🛢️ derrapou na poça de óleo!", delta: -3 },
  { text: "💥 se chocou na mureta!", delta: -4 },
  { text: "🛠️ precisou de um Pit Stop rápido!", delta: -2 },
  { text: "🍀 cortou caminho pela zebra!", delta: 3 }
];

export const activeRaceRooms = new Map();
export const TRACK_LENGTH = 20;

export function renderTrack(progress, vehicleEmoji) {
  const safeProgress = Math.max(0, Math.min(TRACK_LENGTH, progress));
  const before = "━".repeat(safeProgress);
  const after = "━".repeat(TRACK_LENGTH - safeProgress);
  return `${before}${vehicleEmoji}${after} 🏁`;
}

export function createRaceRoom(channelId, hostUser, bet = 0) {
  const room = {
    channelId,
    hostId: hostUser.id,
    bet,
    status: "lobby", // lobby | running | finished
    players: [
      {
        id: hostUser.id,
        name: hostUser.username,
        vehicle: VEHICLES[0],
        progress: 0,
      }
    ],
    round: 0,
    log: "🏁 Aguardando pilotos entrarem no grid de largada...",
  };

  activeRaceRooms.set(channelId, room);
  return room;
}
