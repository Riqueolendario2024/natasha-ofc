import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, updateUser, addCoins, removeCoins } from "../../utils/usersManager.js";

export default {
  name: "crime",
  description: "Execute uma ação arriscada no submundo: lucre alto ou pague fiança",
  category: "economy",
  commands: ["delito", "golpe", "hack"],
  usage: `${PREFIX}crime`,
  handle: async ({ message, reply, sendReact }) => {
    const userId = message.author.id;
    const user = getUser(userId);
    const now = Date.now();
    const cooldown = 45 * 60 * 1000; // 45 minutos

    if (now - (user.lastCrime || 0) < cooldown) {
      const rest = cooldown - (now - user.lastCrime);
      const min = Math.ceil(rest / (1000 * 60));
      return await reply(`🚨 A polícia ainda está rondando a área! Aguarde mais \`${min} minuto(s)\` para agir nas sombras.`);
    }

    await sendReact?.("🕶️");
    user.lastCrime = now;
    updateUser(userId, user);

    const roll = Math.random();

    if (roll < 0.55) {
      // Sucesso no crime (55% de chance)
      const loot = Math.floor(Math.random() * 400) + 250;
      addCoins(userId, loot);

      const embed = new EmbedBuilder()
        .setColor("#F1C40F")
        .setTitle("💰 GOLPE BEM-SUCEDIDO NO SUBMUNDO!")
        .setDescription(
          `🏴‍☠️ Você invadiu o servidor de uma corporação rival e descriptografou uma carteira de criptos!\n\n` +
          `💵 **Lucro do Golpe:** \`🪙 +${loot} NatashaCoins\`\n` +
          `📊 **Novo Saldo:** \`🪙 ${user.coins + loot} coins\``
        );

      await message.reply({ embeds: [embed] });
    } else {
      // Falha (45% de chance)
      const fine = 200;
      removeCoins(userId, fine);

      const embed = new EmbedBuilder()
        .setColor("#C0392B")
        .setTitle("🚓 TEVE FLAGRANTE POLICIAL!")
        .setDescription(
          `👮‍♂️ O alarme disparou antes de você concluir a invasão e você precisou pagar fiança imediata!\n\n` +
          `💸 **Prejuízo da Fiança:** \`🪙 -${fine} NatashaCoins\`\n` +
          `📊 **Saldo Restante:** \`🪙 ${Math.max(0, user.coins - fine)} coins\``
        );

      await message.reply({ embeds: [embed] });
    }
  },
};
