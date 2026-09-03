import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { addCoins } from "../utils/usersManager.js";
import { getRPGPlayer, saveRPGPlayer, applyExp } from "./rpgEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOMB_DB_PATH = path.join(__dirname, "..", "database", "bomb.json");

function loadBombDB() {
  if (!fs.existsSync(BOMB_DB_PATH)) {
    fs.writeFileSync(BOMB_DB_PATH, JSON.stringify({ records: [] }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(BOMB_DB_PATH, "utf-8"));
  } catch {
    return { records: [] };
  }
}

function saveBombDB(data) {
  fs.writeFileSync(BOMB_DB_PATH, JSON.stringify(data, null, 2));
}

export function saveBombRecord(record) {
  const db = loadBombDB();
  db.records.push(record);
  db.records.sort((a, b) => a.timeSpent - b.timeSpent);
  db.records = db.records.slice(0, 10);
  saveBombDB(db);
}

export function getBombRecords() {
  const db = loadBombDB();
  return db.records;
}

export const WIRES = [
  { id: "red", name: "Vermelho", emoji: "🔴", style: ButtonStyle.Danger },
  { id: "blue", name: "Azul", emoji: "🔵", style: ButtonStyle.Primary },
  { id: "green", name: "Verde", emoji: "🟢", style: ButtonStyle.Success },
  { id: "yellow", name: "Amarelo", emoji: "🟡", style: ButtonStyle.Secondary },
];

export const DIFFICULTIES = {
  facil: { name: "🟢 Fácil", timeSec: 60, coins: 60, exp: 40 },
  medio: { name: "🟡 Médio", timeSec: 45, coins: 120, exp: 90 },
  dificil: { name: "🔴 Difícil", timeSec: 30, coins: 250, exp: 180 },
  insano: { name: "☠️ Insano", timeSec: 20, coins: 500, exp: 400 },
};

export const activeBombs = new Map();

// Gerador de Enigmas com Solução Única
export function generatePuzzle(diffKey) {
  const puzzleTypes = ["par_impar", "binario", "matematica", "posicao_cores", "sequencia"];
  const type = puzzleTypes[Math.floor(Math.random() * puzzleTypes.length)];

  let hint = "";
  let code = "";
  let correctWireId = "";

  if (type === "par_impar") {
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 9) + 1;
    const n3 = Math.floor(Math.random() * 8) + 2;
    const n4 = Math.floor(Math.random() * 9) + 1;
    code = `${n1} - ${n2} - ${n3} - ${n4}`;

    const pares = [n1, n2, n3, n4].filter((n) => n % 2 === 0);
    const somaPares = pares.reduce((acc, v) => acc + v, 0);

    if (somaPares >= 16) correctWireId = "red";
    else if (somaPares >= 10) correctWireId = "blue";
    else if (somaPares >= 4) correctWireId = "green";
    else correctWireId = "yellow";

    hint = `💻 **Terminal de Desarme:**\n"Some apenas os **números pares**. Se a soma for $\\ge 16$ corte o 🔴; se for entre 10 e 15 corte o 🔵; se for entre 4 e 9 corte o 🟢; caso contrário corte o 🟡."`;
  } else if (type === "matematica") {
    const a = Math.floor(Math.random() * 12) + 3;
    const b = Math.floor(Math.random() * 8) + 2;
    const mult = a * b;
    code = `${a} × ${b} = ${mult}`;

    if (mult % 4 === 0) correctWireId = "blue";
    else if (mult % 3 === 0) correctWireId = "green";
    else if (mult % 2 === 0) correctWireId = "red";
    else correctWireId = "yellow";

    hint = `💻 **Terminal de Desarme:**\n"Analise o produto da multiplicação:\n• Múltiplo de 4: corte o 🔵\n• Múltiplo de 3: corte o 🟢\n• Múltiplo de 2: corte o 🔴\n• Outro valor: corte o 🟡"`;
  } else if (type === "binario") {
    const binarios = [
      { bin: "0100 (4)", wire: "green" },
      { bin: "0010 (2)", wire: "blue" },
      { bin: "0001 (1)", wire: "yellow" },
      { bin: "1000 (8)", wire: "red" }
    ];
    const picked = binarios[Math.floor(Math.random() * binarios.length)];
    code = `PORT_STATUS: ${picked.bin.split(" ")[0]}`;
    correctWireId = picked.wire;
    hint = `💻 **Terminal de Desarme:**\n"Decodifique o bit ativo no registrador:\n• Bit 3 (8): 🔴 Vermelho\n• Bit 2 (4): 🟢 Verde\n• Bit 1 (2): 🔵 Azul\n• Bit 0 (1): 🟡 Amarelo"`;
  } else if (type === "sequencia") {
    const base = Math.floor(Math.random() * 5) + 2;
    const seq = [base, base * 2, base * 3, base * 4];
    code = `${seq[0]}, ${seq[1]}, ${seq[2]}, [ ? ]`;
    const faltando = seq[3];

    if (faltando % 2 === 0 && faltando > 14) correctWireId = "red";
    else if (faltando % 2 === 0) correctWireId = "blue";
    else correctWireId = "green";

    hint = `💻 **Terminal de Desarme:**\n"Descubra o próximo número da sequência. Se o número for par maior que 14, corte o 🔴; se for par menor ou igual a 14, corte o 🔵; se for ímpar corte o 🟢."`;
  } else {
    code = "REG-7702-X";
    correctWireId = WIRES[Math.floor(Math.random() * WIRES.length)].id;
    const wireObj = WIRES.find((w) => w.id === correctWireId);
    hint = `💻 **Terminal de Desarme:**\n"Manual de Instrução: O circuito principal identificou sobrecarga no terminal **${wireObj.name.toUpperCase()}**! Corte-o imediatamente!"`;
  }

  return { hint, code, correctWireId };
}

export function buildBombEmbed(bombState) {
  const { diff, puzzle, timeLeft } = bombState;

  const embed = new EmbedBuilder()
    .setColor("#E74C3C")
    .setTitle("💣 BOMBA RELÓGIO ARMADA!")
    .setDescription(
      `⚠️ **Dificuldade:** ${diff.name}\n` +
      `⏳ **Tempo Restante:** \`${timeLeft} segundos\`\n\n` +
      `📟 **Display do Painel:** \`[ ${puzzle.code} ]\`\n\n` +
      `${puzzle.hint}\n\n` +
      `✂️ **Qual fio você vai cortar? Escolha com sabedoria!**`
    )
    .setFooter({ text: "Desarme a Bomba • Natasha Games" });

  const row = new ActionRowBuilder().addComponents(
    WIRES.map((w) =>
      new ButtonBuilder()
        .setCustomId(`bomb_${w.id}`)
        .setLabel(w.name)
        .setEmoji(w.emoji)
        .setStyle(w.style)
    )
  );

  return { embed, components: [row] };
}
