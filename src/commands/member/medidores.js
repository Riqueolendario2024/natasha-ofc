import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const MEDIDORES = {
  gay: { title: "🌈 Teste Gaymer / Gay", emoji: "🏳️‍🌈" },
  gado: { title: "🐂 Nível de Gado", emoji: "🌾" },
  corno: { title: "🦌 Detector de Chifre", emoji: "💔" },
  gostoso: { title: "🔥 Nível de Gostosura", emoji: "✨" },
  feio: { title: "🗿 Nível de Feiura", emoji: "🤢" },
  rico: { title: "💰 Chance de Ficar Rico", emoji: "💸" },
  burro: { title: "🧠 Nível de QI / Inteligência Inversa", emoji: "🦧" },
  sigma: { title: "🍷🗿 Nível de Sigma / Aura", emoji: "🕶️" },
  vagabundo: { title: "🌴 Nível de Procrastinação", emoji: "😴" },
  safado: { title: "😈 Nível de Safadeza", emoji: "🔞" },
  comunista: { title: "⚒️ Nível Camarada", emoji: "🚩" },
  ditador: { title: "🎖️ Nível Ditador", emoji: "🪖" },
};

function getSeedPercentage(userId, type) {
  const day = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const str = `${userId}_${type}_${day}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 101);
}

export default {
  name: "gay",
  description: "Mede porcentagens diárias e divertidas entre os membros",
  category: "games",
  commands: [
    "gado", "corno", "gostoso", "feio", "rico", "burro", 
    "sigma", "vagabundo", "safado", "comunista", "ditador",
    "farmar-aura", "qi", "bobo", "inseguro", "lindo"
  ],
  usage: `${PREFIX}<brincadeira> [@membro]`,
  handle: async ({ message, reply, sendReact }) => {
    const rawCmd = message.content.slice(PREFIX.length).trim().split(/ +/)[0].toLowerCase();
    const target = message.mentions?.users?.first() || message.author;
    
    let key = rawCmd;
    if (key === "farmar-aura") key = "sigma";
    if (key === "lindo") key = "gostoso";
    if (key === "bobo" || key === "qi") key = "burro";

    const config = MEDIDORES[key] || { title: `📊 Teste de ${rawCmd}`, emoji: "🎯" };
    const pct = getSeedPercentage(target.id, key);

    await sendReact?.(config.emoji);

    const filled = Math.round((pct / 100) * 10);
    const barra = `${"🟩".repeat(filled)}${"⬛".repeat(10 - filled)}`;

    const embed = new EmbedBuilder()
      .setColor(pct > 50 ? "#FF007F" : "#3498DB")
      .setTitle(`${config.emoji} ${config.title}`)
      .setDescription(
        `O nível de **${target.username}** é:\n\n` +
        `📊 **${pct}%**\n` +
        `${barra}\n\n` +
        `_${pct > 80 ? "🚨 Nível extremo detectado!" : pct > 40 ? "⚖️ Nível equilibrado." : "🕊️ Quase nada por hoje!"}_`
      )
      .setFooter({ text: "Natasha • Medidor Diário" });

    await message.reply({ embeds: [embed] });
  },
};
