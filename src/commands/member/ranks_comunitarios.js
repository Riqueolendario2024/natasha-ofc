import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const RANKS = {
  "rank-corno": { title: "🦌 Top 10 Mais Cornos do Servidor", emoji: "💔" },
  "rank-gay": { title: "🌈 Top 10 Mais Gays / Fofos do Servidor", emoji: "🏳️‍🌈" },
  "rank-gostosas": { title: "🔥 Top 10 Mais Gostosos(as)", emoji: "✨" },
  "rank-noia": { title: "🤪 Top 10 Mais Noias / Malucos", emoji: "🌿" },
  "rank-otaku": { title: "🍙 Top 10 Mais Otakus / Nerds", emoji: "🌸" },
};

export default {
  name: "rank-corno",
  description: "Exibe placares zoados e divertidos da comunidade",
  category: "games",
  commands: ["rank-gay", "rank-gostosas", "rank-noia", "rank-otaku"],
  usage: `${PREFIX}<rank>`,
  handle: async ({ message, reply, sendReact }) => {
    const rawCmd = message.content.slice(PREFIX.length).trim().split(/ +/)[0].toLowerCase();
    const config = RANKS[rawCmd] || { title: `🏆 Placar de ${rawCmd}`, emoji: "🎯" };

    await sendReact?.(config.emoji);

    const members = (await message.guild.members.fetch()).filter((m) => !m.user.bot);
    const sorted = members.random(Math.min(10, members.size));

    let lista = "";
    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

    sorted.forEach((m, i) => {
      const pct = Math.floor(Math.random() * 40) + 60; // 60 a 99%
      lista += `${medals[i]} <@${m.user.id}> — **${pct}%** ${config.emoji}\n`;
    });

    const embed = new EmbedBuilder()
      .setColor("#9B59B6")
      .setTitle(config.title)
      .setDescription(lista || "Nenhum membro encontrado.")
      .setFooter({ text: "Natasha • Gerador Aleatório Diário" });

    await message.reply({ embeds: [embed] });
  },
};
