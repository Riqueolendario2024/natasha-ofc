import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getAllUsers } from "../../utils/usersManager.js";

export default {
  name: "ranking",
  description: "Exibe o Top 10 membros com mais NatashaCoins e atividade",
  commands: ["top", "leaderboard"],
  usage: `${PREFIX}ranking`,
  handle: async ({ message, reply, sendReact }) => {
    await sendReact("🏆");
    const users = getAllUsers();
    const userEntries = Object.entries(users);

    if (userEntries.length === 0) {
      return await reply("Ainda não há dados suficientes no ranking.");
    }

    const sortedUsers = userEntries
      .map(([id, data]) => ({ id, coins: data.coins || 0, msgs: data.messageCount || 0 }))
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 10);

    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    let lista = "";

    sortedUsers.forEach((u, i) => {
      lista += `${medals[i]} <@${u.id}>\n   └── 🪙 Coins: **${u.coins}** • 💬 Mensagens: **${u.msgs}**\n\n`;
    });

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("🏆 Ranking de NatashaCoins do Servidor")
      .setDescription(lista)
      .setFooter({ text: "Natasha • Placar Oficial" });

    await message.reply({ embeds: [embed] });
  },
};
