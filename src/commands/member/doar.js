import { EmbedBuilder } from "discord.js";
import { PREFIX, OWNER_ID } from "../../config.js";
import { transferCoins, addCoins } from "../../utils/usersManager.js";

export default {
  name: "doar",
  description: "Transfere NatashaCoins para outro membro ou dá moedas se for o Dono",
  category: "economy",
  commands: ["pay", "pagar", "transferir", "pix"],
  usage: `${PREFIX}doar <quantidade> <@membro>`,
  handle: async ({ message, args, reply, sendReact }) => {
    const amountStr = args[0];
    const amount = parseInt(amountStr, 10);
    const userMention = message.mentions?.users?.first();

    if (!userMention || isNaN(amount) || amount <= 0) {
      return await reply(`Formato incorreto!\n*Uso:* \`${PREFIX}doar 150 @membro\``);
    }

    if (userMention.id === message.author.id) {
      return await reply("Você não pode doar moedas para si mesmo!");
    }

    // Se o doador for o Dono (Riquefla), ele cria moedas como presente real
    if (OWNER_ID && message.author.id === OWNER_ID) {
      const novoSaldo = addCoins(userMention.id, amount);
      await sendReact?.("👑");
      const embed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("👑 Presente Real do Criador!")
        .setDescription(
          `✨ O lendário <@${message.author.id}> concedeu um presente real de **🪙 ${amount} coins** para <@${userMention.id}>!\n\n` +
          `📊 **Novo Saldo de <@${userMention.id}>:** \`🪙 ${novoSaldo} coins\``
        );
      return await message.reply({ embeds: [embed] });
    }

    const res = transferCoins(message.author.id, userMention.id, amount);

    if (res.success) {
      await sendReact?.("💸");
      const embed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle("💸 Transferência Concluída!")
        .setDescription(
          `✅ <@${message.author.id}> transferiu **🪙 ${amount} coins** para <@${userMention.id}> com sucesso!\n\n` +
          `📊 **Seu Saldo:** \`🪙 ${res.fromBalance} coins\`\n` +
          `📊 **Saldo de ${userMention.username}:** \`🪙 ${res.toBalance} coins\``
        );
      await message.reply({ embeds: [embed] });
    } else {
      await sendReact?.("❌");
      await reply(res.message);
    }
  },
};
