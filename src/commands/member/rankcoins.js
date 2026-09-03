import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getAllUsers } from "../../utils/usersManager.js";

export default {
  name: "rankcoins",
  description: "Exibe o Top 10 membros mais ricos do servidor",
  commands: ["ricacos", "topcoins", "baltop"],
  usage: `${PREFIX}rankcoins`,
  handle: async ({ message, reply, sendReact }) => {
    await sendReact("💰");
    const users = getAllUsers();
    const userEntries = Object.entries(users);

    if (userEntries.length === 0) {
      return await reply("Ainda não há dados suficientes no ranking.");
    }

    const sortedUsers = userEntries
      .map(([id, data]) => ({ id, coins: data.coins || 0 }))
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 10);

    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    let lista = "";

    sortedUsers.forEach((u, i) => {
      lista += `${medals[i]} <@${u.id}>\n   └── 🪙 Fortuna: **${u.coins.toLocaleString("pt-BR")} coins**\n\n`;
    });

    const embed = new EmbedBuilder()
      .setColor("#F1C40F")
      .setTitle("💰 Top 10 Membros Mais Ricos do Servidor")
      .setDescription(lista)
      .setFooter({ text: "Natasha • Economia do Servidor" });

    await message.reply({ embeds: [embed] });
  },
};
