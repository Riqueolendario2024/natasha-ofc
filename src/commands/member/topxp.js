import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getAllUsers } from "../../utils/usersManager.js";

export default {
  name: "topxp",
  description: "Exibe o Top 10 membros com mais nível e XP no servidor",
  category: "economy",
  commands: ["toplevel", "ranklevel", "leaderboard"],
  usage: `${PREFIX}topxp`,
  handle: async ({ message, reply, sendReact }) => {
    await sendReact?.("🏆");

    const all = getAllUsers();
    const userEntries = Object.entries(all);

    if (userEntries.length === 0) {
      return await reply("Ainda não há dados suficientes para o ranking de níveis.");
    }

    const sorted = userEntries
      .map(([id, data]) => ({
        id,
        name: data.name || "Aventureiro",
        level: data.level || 1,
        xp: data.xp || 0,
        messages: data.messageCount || 0,
      }))
      .sort((a, b) => b.level - a.level || b.xp - a.xp)
      .slice(0, 10);

    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    let desc = "Estes são os membros mais ativos na comunidade:\n\n";

    sorted.forEach((u, i) => {
      desc += `${medals[i]} <@${u.id}> — 🌟 **Nível ${u.level}**\n`;
      desc += `   └── ⚡ XP: \`${u.xp.toLocaleString("pt-BR")}\` • 💬 Mensagens: \`${u.messages}\`\n\n`;
    });

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("🏆 HALL DA FAMA — TOP NÍVEIS DO SERVIDOR")
      .setDescription(desc)
      .setFooter({ text: "Natasha • Sistema de Atividade e Recompensas" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
