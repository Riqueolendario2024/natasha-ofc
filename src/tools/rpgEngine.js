import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { addCoins, getCoins } from "../utils/usersManager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RPG_DB_PATH = path.join(__dirname, "..", "database", "rpg.json");

function loadRPGDB() {
  if (!fs.existsSync(RPG_DB_PATH)) {
    fs.writeFileSync(RPG_DB_PATH, JSON.stringify({ players: {} }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(RPG_DB_PATH, "utf-8"));
  } catch {
    return { players: {} };
  }
}

function saveRPGDB(data) {
  fs.writeFileSync(RPG_DB_PATH, JSON.stringify(data, null, 2));
}

// Modelos de Monstros
export const MONSTERS = [
  { name: "Goblin Sorrateiro", emoji: "👹", minLvl: 1, maxHp: 80, atkMin: 8, atkMax: 15, exp: 35, coins: 25 },
  { name: "Lobo Faminto", emoji: "🐺", minLvl: 1, maxHp: 100, atkMin: 12, atkMax: 18, exp: 45, coins: 35 },
  { name: "Zumbi Putrefato", emoji: "🧟", minLvl: 2, maxHp: 130, atkMin: 14, atkMax: 22, exp: 60, coins: 45 },
  { name: "Robô Sentinela", emoji: "🤖", minLvl: 3, maxHp: 170, atkMin: 18, atkMax: 26, exp: 85, coins: 65 },
  { name: "Fantasma Vingativo", emoji: "👻", minLvl: 4, maxHp: 210, atkMin: 22, atkMax: 32, exp: 120, coins: 90 },
  { name: "Dragão Infernal", emoji: "🐉", minLvl: 6, maxHp: 320, atkMin: 28, atkMax: 42, exp: 220, coins: 180 },
  { name: "Chefão Soberano das Trevas", emoji: "👑", minLvl: 9, maxHp: 500, atkMin: 38, atkMax: 55, exp: 500, coins: 450, isBoss: true }
];

export const RARE_EVENTS = [
  { name: "Slime Dourado Lendário", emoji: "🌟", maxHp: 120, atkMin: 5, atkMax: 10, exp: 300, coins: 500, rare: true },
  { name: "Baú Mímico Encantado", emoji: "🎁", maxHp: 90, atkMin: 10, atkMax: 15, exp: 150, coins: 350, rare: true }
];

// Perfil do Jogador de RPG
export function getRPGPlayer(userId, username = "Guerreiro") {
  const db = loadRPGDB();
  if (!db.players[userId]) {
    db.players[userId] = {
      name: username,
      level: 1,
      exp: 0,
      maxExp: 100,
      hp: 100,
      maxHp: 100,
      energy: 50,
      maxEnergy: 50,
      potions: 3,
      wins: 0,
      losses: 0,
      equippedWeapon: "Espada de Madeira (+5)",
      weaponBonus: 5,
    };
    saveRPGDB(db);
  }
  return db.players[userId];
}

export function saveRPGPlayer(userId, player) {
  const db = loadRPGDB();
  db.players[userId] = player;
  saveRPGDB(db);
}

export function getAllRPGPlayers() {
  const db = loadRPGDB();
  return Object.entries(db.players).map(([id, data]) => ({ id, ...data }));
}

// Cálculo de Level Up
export function applyExp(player, gainedExp) {
  player.exp += gainedExp;
  let leveledUp = false;

  while (player.exp >= player.maxExp) {
    player.exp -= player.maxExp;
    player.level += 1;
    player.maxExp = Math.floor(player.maxExp * 1.5);
    player.maxHp += 20;
    player.hp = player.maxHp;
    player.maxEnergy += 10;
    player.energy = player.maxEnergy;
    player.weaponBonus += 3;
    leveledUp = true;
  }

  return leveledUp;
}

// Batalhas Ativas em Memória (com proteção contra concorrência e spam)
export const activeBattles = new Map();

export function createBattle(userId, username) {
  const player = getRPGPlayer(userId, username);
  player.hp = player.maxHp;
  player.energy = player.maxEnergy;

  // 15% de chance de evento raro
  const isRare = Math.random() < 0.15;
  let monster;

  if (isRare) {
    monster = { ...RARE_EVENTS[Math.floor(Math.random() * RARE_EVENTS.length)] };
  } else {
    const available = MONSTERS.filter((m) => m.minLvl <= player.level);
    monster = { ...available[Math.floor(Math.random() * available.length)] };
  }

  monster.currentHp = monster.maxHp;

  const battleState = {
    userId,
    player,
    monster,
    turn: 1,
    defending: false,
    combatLog: `⚔️ **A batalha começou!** Um **${monster.name}** apareceu no seu caminho!`,
    isLocked: false,
  };

  activeBattles.set(userId, battleState);
  return battleState;
}

// Gerador de Interface Discord da Batalha
export function buildBattlePayload(battle) {
  const { player, monster, combatLog } = battle;

  const hpBarPlayer = renderProgressBar(player.hp, player.maxHp);
  const hpBarMonster = renderProgressBar(monster.currentHp, monster.maxHp);
  const energyBar = renderProgressBar(player.energy, player.maxEnergy, "⚡");

  const embed = new EmbedBuilder()
    .setColor(monster.rare ? "#FFD700" : monster.isBoss ? "#8E44AD" : "#E74C3C")
    .setTitle(monster.rare ? `🌟 EVENTO RARO: ${monster.name.toUpperCase()}!` : `⚔️ NATASHA BATTLE — TURNO ${battle.turn}`)
    .setDescription(
      `${monster.emoji} **${monster.name}**\n` +
      `❤️ **HP Inimigo:** \`${monster.currentHp}/${monster.maxHp}\`\n${hpBarMonster}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🧙 **${player.name}** (Nível ${player.level})\n` +
      `❤️ **Seu HP:** \`${player.hp}/${player.maxHp}\`\n${hpBarPlayer}\n` +
      `⚡ **Energia:** \`${player.energy}/${player.maxEnergy}\`\n${energyBar}\n` +
      `🧪 **Poções restantes:** \`${player.potions}x\`\n\n` +
      `📜 **Registro do Combate:**\n${combatLog}`
    )
    .setFooter({ text: "Selecione sua ação no painel abaixo • Natasha RPG Engine" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rpg_attack_${player.userId || ""}`)
      .setLabel("Atacar")
      .setEmoji("⚔️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`rpg_skill_${player.userId || ""}`)
      .setLabel(player.level >= 2 ? "Golpe Pesado (15⚡)" : "Bloqueado (Nv 2)")
      .setEmoji("🔥")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(player.level < 2 || player.energy < 15),
    new ButtonBuilder()
      .setCustomId(`rpg_defend_${player.userId || ""}`)
      .setLabel("Defender")
      .setEmoji("🛡️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`rpg_potion_${player.userId || ""}`)
      .setLabel(`Poção (+40 HP)`)
      .setEmoji("🧪")
      .setStyle(ButtonStyle.Success)
      .setDisabled(player.potions <= 0)
  );

  return { embed, components: [row] };
}

function renderProgressBar(current, max, fillEmoji = "🟩", emptyEmoji = "⬛") {
  const totalBlocks = 8;
  const safeCurrent = Math.max(0, current);
  const filled = Math.round((safeCurrent / max) * totalBlocks);
  const empty = totalBlocks - filled;
  return `${fillEmoji.repeat(Math.max(0, filled))}${emptyEmoji.repeat(Math.max(0, empty))}`;
}
