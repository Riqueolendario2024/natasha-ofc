import { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, depositBank, withdrawBank, getCoins, getBank } from "../../utils/usersManager.js";
import { drawPixelBankCard } from "../../tools/canvasEngine.js";

export default {
  name: "banco",
  description: "Exibe seu cartão de crédito pixel art e gerencia depósitos/saques",
  category: "economy",
  commands: ["bank", "depositar", "sacar", "dep", "with"],
  usage: `${PREFIX}banco [depositar | sacar] [quantia]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const rawCmd = message.content.slice(PREFIX.length).trim().split(/ +/)[0].toLowerCase();
    const userId = message.author.id;
    const user = getUser(userId);

    // Operação: Depositar
    if (rawCmd === "depositar" || rawCmd === "dep" || args[0] === "depositar") {
      const valStr = rawCmd === "depositar" || rawCmd === "dep" ? args[0] : args[1];
      let amount = parseInt(valStr, 10);
      if (valStr?.toLowerCase() === "tudo" || valStr?.toLowerCase() === "all") amount = user.coins;

      if (isNaN(amount) || amount <= 0) return await reply(`Informe um valor válido! Ex: \`${PREFIX}depositar 500\` ou \`${PREFIX}depositar tudo\`.`);
      if (depositBank(userId, amount)) {
        await sendReact?.("🏦");
        return await reply(`✅ Você depositou **🪙 ${amount.toLocaleString("pt-BR")} coins** no cofre do banco! Moedas seguras contra roubos.`);
      }
      return await reply("❌ Saldo insuficiente na carteira para realizar esse depósito.");
    }

    // Operação: Sacar
    if (rawCmd === "sacar" || rawCmd === "with" || args[0] === "sacar") {
      const valStr = rawCmd === "sacar" || rawCmd === "with" ? args[0] : args[1];
      let amount = parseInt(valStr, 10);
      if (valStr?.toLowerCase() === "tudo" || valStr?.toLowerCase() === "all") amount = user.bank;

      if (isNaN(amount) || amount <= 0) return await reply(`Informe um valor válido! Ex: \`${PREFIX}sacar 300\` ou \`${PREFIX}sacar tudo\`.`);
      if (withdrawBank(userId, amount)) {
        await sendReact?.("💸");
        return await reply(`✅ Você sacou **🪙 ${amount.toLocaleString("pt-BR")} coins** do banco para a sua carteira.`);
      }
      return await reply("❌ Saldo bancário insuficiente para sacar esse valor.");
    }

    // Renderização do Cartão Pixel Art
    await sendReact?.("💳");
    const avatarUrl = message.author.displayAvatarURL({ extension: "png", size: 256, forceStatic: true });
    const buffer = await drawPixelBankCard({
      username: message.author.username,
      avatarUrl,
      coins: user.coins || 0,
      bank: user.bank || 0,
      job: user.job || "Gamer / Dev",
    });

    const attachment = new AttachmentBuilder(buffer, { name: "bank-card.png" });
    const embed = new EmbedBuilder()
      .setColor("#FF007F")
      .setTitle(`💳 Cartão Oficial — ${message.author.username}`)
      .setImage("attachment://bank-card.png")
      .setDescription(`💡 *Use \`${PREFIX}depositar tudo\` para proteger seu dinheiro contra assaltos ou \`${PREFIX}sacar <valor>\` para gastar!*`);

    await message.reply({ embeds: [embed], files: [attachment] });
  },
};
