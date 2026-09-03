import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, "..", "assets", "cards");

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

const NAIPES = ["S", "H", "D", "C"]; // Spades (Espadas), Hearts (Copas), Diamonds (Ouros), Clubs (Paus)
const VALORES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const NAIPES_SIMBOLOS = { S: "♠", H: "♥", D: "♦", C: "♣" };

// Baixa os PNGs reais do repositório padrão de baralho se não existirem localmente
export async function ensureCardImages() {
  const baseUrl = "https://deckofcardsapi.com/static/img";

  // Baixa o verso da carta (Back)
  const backPath = path.join(ASSETS_DIR, "back.png");
  if (!fs.existsSync(backPath)) {
    try {
      const res = await axios.get("https://deckofcardsapi.com/static/img/back.png", { responseType: "arraybuffer" });
      fs.writeFileSync(backPath, res.data);
    } catch {}
  }

  // Baixa cada uma das 52 cartas
  for (const n of NAIPES) {
    for (let i = 0; i < VALORES.length; i++) {
      let code = `${VALORES[i] === "10" ? "0" : VALORES[i]}${n}`;
      const filePath = path.join(ASSETS_DIR, `${code}.png`);
      if (!fs.existsSync(filePath)) {
        try {
          const res = await axios.get(`${baseUrl}/${code}.png`, { responseType: "arraybuffer" });
          fs.writeFileSync(filePath, res.data);
        } catch {}
      }
    }
  }
}

// Inicialização do Baralho
export function createDeck() {
  const deck = [];
  for (const n of NAIPES) {
    for (let i = 0; i < VALORES.length; i++) {
      const code = `${VALORES[i] === "10" ? "0" : VALORES[i]}${n}`;
      deck.push({
        naipeCode: n,
        naipe: NAIPES_SIMBOLOS[n],
        valStr: VALORES[i],
        valNum: i + 1,
        code,
        color: n === "H" || n === "D" ? "red" : "black",
        faceUp: false,
      });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function initGame() {
  const deck = createDeck();
  const tableau = [[], [], [], [], [], [], []];

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck.pop();
      if (row === col) card.faceUp = true;
      tableau[col].push(card);
    }
  }

  return {
    stock: deck,
    waste: [],
    foundations: { S: [], H: [], D: [], C: [] },
    tableau,
    moves: 0,
    startTime: Date.now(),
  };
}

// Cache de imagens em memória para carregar rápido sem delay de disco
const loadedImages = new Map();

async function getCardImg(name) {
  if (loadedImages.has(name)) return loadedImages.get(name);
  const p = path.join(ASSETS_DIR, `${name}.png`);
  if (fs.existsSync(p)) {
    try {
      const img = await loadImage(p);
      loadedImages.set(name, img);
      return img;
    } catch {
      return null;
    }
  }
  return null;
}

// Renderizador com Texturas e PNGs Reais
export async function drawSolitaireBoard(game) {
  await ensureCardImages();

  const width = 1000;
  const height = 650;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Mesa Verde com Sombra e Feltro
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#0e6b2c");
  grad.addColorStop(0.5, "#148538");
  grad.addColorStop(1, "#0a5220");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Moldura de Madeira Envernizada
  ctx.strokeStyle = "#381f0d";
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, width - 14, height - 14);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  const cardW = 95;
  const cardH = 135;
  const startX = 40;
  const gapX = 130;

  async function renderCard(x, y, card) {
    if (!card) {
      // Slot vazio com contorno translúcido
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cardW, cardH);
      return;
    }

    if (!card.faceUp) {
      // PNG do Verso da Carta
      const backImg = await getCardImg("back");
      if (backImg) {
        ctx.drawImage(backImg, x, y, cardW, cardH);
      } else {
        ctx.fillStyle = "#1e3799";
        ctx.fillRect(x, y, cardW, cardH);
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(x, y, cardW, cardH);
      }
      return;
    }

    // PNG Real da Frente da Carta
    const cardImg = await getCardImg(card.code);
    if (cardImg) {
      ctx.drawImage(cardImg, x, y, cardW, cardH);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeStyle = "#000000";
      ctx.strokeRect(x, y, cardW, cardH);
      ctx.fillStyle = card.color === "red" ? "#c0392b" : "#2c3e50";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`${card.valStr}${card.naipe}`, x + 5, y + 25);
    }
  }

  // 1. Linha Superior: Stock e Waste
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px monospace";
  ctx.fillText("COMPRA [C]", startX, 40);
  ctx.fillText("DESCARTE [D]", startX + gapX, 40);

  if (game.stock.length > 0) {
    await renderCard(startX, 50, { faceUp: false });
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 18px monospace";
    ctx.fillText(`${game.stock.length}`, startX + cardW / 2 - 10, 125);
  } else {
    await renderCard(startX, 50, null);
    ctx.fillStyle = "#ffffff";
    ctx.font = "24px monospace";
    ctx.fillText("🔄", startX + 35, 125);
  }

  const topWaste = game.waste[game.waste.length - 1];
  await renderCard(startX + gapX, 50, topWaste);

  // 2. Linha Superior: 4 Fundações Reais
  const fundNaipes = [
    { code: "S", symbol: "♠", color: "#ffffff" },
    { code: "H", symbol: "♥", color: "#ff7675" },
    { code: "D", symbol: "♦", color: "#ff7675" },
    { code: "C", symbol: "♣", color: "#ffffff" },
  ];

  for (let idx = 0; idx < fundNaipes.length; idx++) {
    const fn = fundNaipes[idx];
    const fx = startX + gapX * 3 + idx * (cardW + 25);

    ctx.fillStyle = fn.color;
    ctx.font = "bold 15px monospace";
    ctx.fillText(`BASE ${fn.symbol}`, fx, 40);

    const pile = game.foundations[fn.code];
    const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
    await renderCard(fx, 50, topCard);
  }

  // Linha Divisória de Feltro
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, 205);
  ctx.lineTo(width - startX, 205);
  ctx.stroke();

  // 3. Colunas de Baixo (Tableau 1 a 7)
  for (let c = 0; c < 7; c++) {
    const cx = startX + c * (cardW + 38);
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`COL ${c + 1}`, cx + 22, 230);

    const colCards = game.tableau[c];
    if (colCards.length === 0) {
      await renderCard(cx, 245, null);
    } else {
      let currentY = 245;
      for (const card of colCards) {
        await renderCard(cx, currentY, card);
        currentY += card.faceUp ? 32 : 18;
      }
    }
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px monospace";
  ctx.fillText(`MOVIMENTOS: ${game.moves} | USE: !paciencia c (COMPRAR), !paciencia m 1 2 (MOVER), !paciencia auto`, startX, height - 20);

  return canvas.toBuffer("image/png");
}
