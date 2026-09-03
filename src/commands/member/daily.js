import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, updateUser, addCoins } from "../../utils/usersManager.js";

export default {
  name: "daily",
  description: "Resgate sua recompensa diária em NatashaCoins",
  category: "economy",
  commands: ["diario", "recompensa"],
  usage: `${PREFIX}daily`,
  handle: async ({ message, reply, sendReact }) => {
    const userId = message.author.id;
    const user = getUser(userId);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - (user.lastDaily || 0) < cooldown) {
      const rest = cooldown - (now - user.lastDaily);
      const horas = Math.floor(rest / (1000 * 60 * 60));
      const minutos = Math.ceil((rest % (1000 * 60 * 60)) / (1000 * 60));
      return await reply(`⏳ Você já resgatou seu prêmio diário! Volte em \`${horas}h ${minutos}m\`.`);
    }

    await sendReact?.("🎁");
    const prize = Math.floor(Math.random() * 300) + 200;
    user.lastDaily = now;
    updateUser(userId, user);
    addCoins(userId, prize);

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("🎁 RECOMPENSA DIÁRIA RESGATADA!")
      .setDescription(`Você recebeu **🪙 ${prize} NatashaCoins** hoje!\nVolte amanhã para resgatar mais.`);

    await message.reply({ embeds: [embed] });
  },
};
