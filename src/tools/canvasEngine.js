import { createCanvas, loadImage } from "@napi-rs/canvas";

export async function drawPixelBankCard({ username, avatarUrl, coins, bank, job }) {
  const width = 700;
  const height = 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#1a0826");
  grad.addColorStop(0.5, "#2c0b4d");
  grad.addColorStop(1, "#0d021a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 0, 127, 0.15)";
  ctx.lineWidth = 2;
  for (let x = 0; x < width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#ff007f";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  try {
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(95, 110, 55, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 40, 55, 110, 110);
    ctx.restore();

    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(95, 110, 55, 0, Math.PI * 2, true);
    ctx.stroke();
  } catch {}

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px monospace";
  ctx.fillText(username.toUpperCase().slice(0, 18), 175, 85);

  ctx.fillStyle = "#00ffff";
  ctx.font = "16px monospace";
  ctx.fillText(`CARGO/PROFISSAO: [ ${job.toUpperCase()} ]`, 175, 115);

  ctx.fillStyle = "#ff007f";
  ctx.font = "14px monospace";
  ctx.fillText("NATASHA CENTRAL BANK • VISA PIXEL", 175, 140);

  ctx.strokeStyle = "#ff007f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(35, 195);
  ctx.lineTo(width - 35, 195);
  ctx.stroke();

  // Carteira
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(40, 215, 290, 95);
  ctx.strokeStyle = "#ffd700";
  ctx.strokeRect(40, 215, 290, 95);

  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 16px monospace";
  ctx.fillText("🪙 CARTEIRA (HAND):", 55, 245);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px monospace";
  ctx.fillText(`$ ${coins.toLocaleString("pt-BR")}`, 55, 285);

  // Banco
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(370, 215, 290, 95);
  ctx.strokeStyle = "#00ffff";
  ctx.strokeRect(370, 215, 290, 95);

  ctx.fillStyle = "#00ffff";
  ctx.font = "bold 16px monospace";
  ctx.fillText("🏦 COFRE (PROTEGIDO):", 385, 245);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px monospace";
  ctx.fillText(`$ ${bank.toLocaleString("pt-BR")}`, 385, 285);

  return canvas.toBuffer("image/png");
}

export async function drawRankCard({ username, avatarUrl, level, currentXp, maxXp, rankPos }) {
  const width = 800;
  const height = 260;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#0f051d");
  grad.addColorStop(0.5, "#250942");
  grad.addColorStop(1, "#0a0114");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 25) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  try {
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(115, 130, 65, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 50, 65, 130, 130);
    ctx.restore();

    ctx.strokeStyle = "#ff007f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(115, 130, 65, 0, Math.PI * 2, true);
    ctx.stroke();
  } catch {}

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px monospace";
  ctx.fillText(username.toUpperCase().slice(0, 15), 210, 85);

  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 20px monospace";
  ctx.fillText(`POSIÇÃO: #${rankPos}`, 210, 125);

  ctx.fillStyle = "#ff007f";
  ctx.font = "bold 28px monospace";
  ctx.fillText(`NÍVEL ${level}`, width - 200, 85);

  ctx.fillStyle = "#00ffff";
  ctx.font = "16px monospace";
  ctx.fillText(`XP: ${currentXp.toLocaleString("pt-BR")} / ${maxXp.toLocaleString("pt-BR")}`, width - 260, 160);

  const barX = 210;
  const barY = 175;
  const barWidth = 540;
  const barHeight = 32;

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.strokeStyle = "#ff007f";
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  const pct = Math.max(0, Math.min(1, currentXp / maxXp));
  const fillWidth = barWidth * pct;

  if (fillWidth > 0) {
    const barGrad = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
    barGrad.addColorStop(0, "#ff007f");
    barGrad.addColorStop(1, "#00ffff");
    ctx.fillStyle = barGrad;
    ctx.fillRect(barX + 2, barY + 2, fillWidth - 4, barHeight - 4);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px monospace";
  ctx.fillText(`${Math.round(pct * 100)}%`, barX + barWidth / 2 - 15, barY + 22);

  return canvas.toBuffer("image/png");
}

// NOVO: Renderizador do Cartão de Perfil Gamer Completo
export async function drawGamerProfileCard({ username, avatarUrl, level, coins, bank, job, partner, messages }) {
  const width = 850;
  const height = 450;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Fundo Gamer
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#120224");
  grad.addColorStop(0.5, "#24044a");
  grad.addColorStop(1, "#080012");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Grade Neon de Fundo
  ctx.strokeStyle = "rgba(255, 0, 127, 0.12)";
  ctx.lineWidth = 1.5;
  for (let x = 0; x < width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Bordas Duplas
  ctx.strokeStyle = "#ff007f";
  ctx.lineWidth = 5;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  // Avatar do Jogador
  try {
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 140, 75, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 45, 65, 150, 150);
    ctx.restore();

    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(120, 140, 75, 0, Math.PI * 2, true);
    ctx.stroke();
  } catch {}

  // Nome e Título
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px monospace";
  ctx.fillText(username.toUpperCase().slice(0, 16), 230, 95);

  ctx.fillStyle = "#00ffff";
  ctx.font = "bold 18px monospace";
  ctx.fillText(`🎮 CLASSE: ${job.toUpperCase()}`, 230, 130);

  ctx.fillStyle = "#ff007f";
  ctx.font = "bold 18px monospace";
  ctx.fillText(`💍 CASADO(A) COM: ${partner ? partner.toUpperCase() : "SOLTEIRO(A)"}`, 230, 160);

  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 20px monospace";
  ctx.fillText(`🌟 NÍVEL ${level}`, 230, 195);

  // Painéis Inferiores
  const drawStatBox = (x, y, w, h, title, val, color) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = color;
    ctx.font = "bold 14px monospace";
    ctx.fillText(title, x + 15, y + 28);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px monospace";
    ctx.fillText(val, x + 15, y + 62);
  };

  drawStatBox(40, 260, 230, 85, "🪙 CARTEIRA", `$ ${coins.toLocaleString("pt-BR")}`, "#ffd700");
  drawStatBox(310, 260, 230, 85, "🏦 BANCO", `$ ${bank.toLocaleString("pt-BR")}`, "#00ffff");
  drawStatBox(580, 260, 230, 85, "💬 MENSAGENS", `${messages.toLocaleString("pt-BR")}`, "#ff007f");

  // Barra de Status Inferior
  ctx.fillStyle = "#00ffff";
  ctx.font = "14px monospace";
  ctx.fillText("NATASHA GAMER ID • SISTEMA OFICIAL DE CARTÕES", 40, 400);

  return canvas.toBuffer("image/png");
}
