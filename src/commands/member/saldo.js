import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser } from "../../utils/usersManager.js";

export default {
  name: "saldo",
  description: "Exibe o seu saldo atual de NatashaCoins e informações de carteira",
  commands: ["coins", "carteira", "atm", "money"],
  usage: `${PREFIX}saldo [@membro]`,
  handle: async ({ message, reply, sendReact }) => {
    await sendReact("🪙");

    const targetUser = message.mentions.users.first() || message.author;
    const userData = getUser(targetUser.id);
    const saldo = userData.coins || 0;

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle(`🪙 Carteira de ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ forceStatic: true }))
      .setDescription(
        `💰 **Saldo em Conta:** \`🪙 ${saldo.toLocaleString("pt-BR")} NatashaCoins\`\n` +
        `💬 **Mensagens Enviadas:** \`${userData.messageCount || 0}\`\n` +
        `🎁 **Itens no Inventário:** \`${userData.inventory?.length || 0} itens\``
      )
      .setFooter({ text: `Natasha • Use ${PREFIX}daily para pegar moedas grátis todo dia!` });

    await message.reply({ embeds: [embed] });
  },
};
