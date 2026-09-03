import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "database", "users.json");

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { users: {} };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function getUser(userId) {
  const db = loadDB();
  if (!db.users[userId]) {
    db.users[userId] = {
      name: "Membro",
      messageCount: 0,
      coins: 100,
      bank: 0,
      level: 1,
      xp: 0,
      maxXp: 100,
      lastXpGain: 0,
      lastDaily: 0,
      lastWork: 0,
      lastCrime: 0,
      lastFish: 0,
      lastMine: 0,
      job: "Iniciante",
      inventory: [],
      relationship: null,
      relationshipSince: null,
    };
    saveDB(db);
  }
  return db.users[userId];
}

export function updateUser(userId, data) {
  const db = loadDB();
  db.users[userId] = { ...getUser(userId), ...data };
  saveDB(db);
  return db.users[userId];
}

export function getAllUsers() {
  return loadDB().users;
}

export function getCoins(userId) {
  return getUser(userId).coins || 0;
}

export function getBank(userId) {
  return getUser(userId).bank || 0;
}

export function addCoins(userId, amount) {
  const user = getUser(userId);
  user.coins = (user.coins || 0) + amount;
  updateUser(userId, user);
  return user.coins;
}

export function removeCoins(userId, amount) {
  const user = getUser(userId);
  if ((user.coins || 0) < amount) return false;
  user.coins -= amount;
  updateUser(userId, user);
  return true;
}

export function depositBank(userId, amount) {
  const user = getUser(userId);
  if ((user.coins || 0) < amount || amount <= 0) return false;
  user.coins -= amount;
  user.bank = (user.bank || 0) + amount;
  updateUser(userId, user);
  return true;
}

export function withdrawBank(userId, amount) {
  const user = getUser(userId);
  if ((user.bank || 0) < amount || amount <= 0) return false;
  user.bank -= amount;
  user.coins = (user.coins || 0) + amount;
  updateUser(userId, user);
  return true;
}

export function transferCoins(fromId, toId, amount) {
  const fromUser = getUser(fromId);
  if ((fromUser.coins || 0) < amount || amount <= 0) {
    return { success: false, message: "Saldo insuficiente na carteira!" };
  }
  fromUser.coins -= amount;
  const toUser = getUser(toId);
  toUser.coins = (toUser.coins || 0) + amount;
  updateUser(fromId, fromUser);
  updateUser(toId, toUser);
  return { success: true, fromBalance: fromUser.coins, toBalance: toUser.coins };
}

// Funções legadas esperadas por daily.js e namorar.js
export function getDaily(userId) {
  return getUser(userId).lastDaily || 0;
}

export function setDaily(userId, timestamp) {
  const user = getUser(userId);
  user.lastDaily = timestamp;
  updateUser(userId, user);
}

export function getProfile(userId) {
  return getUser(userId);
}

export function setProfile(userId, data) {
  return updateUser(userId, data);
}

export function getRelationship(userId) {
  return getUser(userId).relationship;
}

export function setRelationship(userId, partnerId) {
  const user = getUser(userId);
  user.relationship = partnerId;
  user.relationshipSince = partnerId ? Date.now() : null;
  updateUser(userId, user);
}

export function processChatXp(userId, username = "Membro") {
  const user = getUser(userId);
  user.name = username;
  user.messageCount = (user.messageCount || 0) + 1;

  const now = Date.now();
  const cooldown = 45 * 1000;

  if (now - (user.lastXpGain || 0) < cooldown) {
    updateUser(userId, user);
    return { leveledUp: false };
  }

  user.lastXpGain = now;
  const earnedXp = Math.floor(Math.random() * 11) + 15;
  user.xp = (user.xp || 0) + earnedXp;

  let leveledUp = false;
  let rewardCoins = 0;

  user.maxXp = user.maxXp || 100;
  user.level = user.level || 1;

  while (user.xp >= user.maxXp) {
    user.xp -= user.maxXp;
    user.level += 1;
    user.maxXp = Math.floor(user.maxXp * 1.45) + 50;
    rewardCoins += user.level * 100;
    user.coins = (user.coins || 0) + (user.level * 100);
    leveledUp = true;
  }

  updateUser(userId, user);

  return {
    leveledUp,
    newLevel: user.level,
    rewardCoins,
    currentXp: user.xp,
    maxXp: user.maxXp,
  };
}
