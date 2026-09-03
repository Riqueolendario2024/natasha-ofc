import { AttachmentBuilder } from "discord.js";
import { WELCOME_CHANNEL_ID } from "../../config.js";
import { welcome } from "../../services/spider-x-api.js";

export default {
  name: "boasvindas",
  description: "Envia o cartão de boas-vindas no canal oficial",
  commands: ["boasvindas", "welcome"],
  usage: "!boasvindas",
  handle: async ({ message }) => {
    const channel = message.guild?.channels?.cache?.get(WELCOME_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      return message.reply("❌ Canal de boas-vindas não encontrado ou inválido.");
    }

    try {
      const avatar = message.author.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
      const imageUrl = welcome("BEM-VINDO(A)!", message.author.username, avatar);
      const attachment = new AttachmentBuilder(imageUrl, { name: "welcome.png" });

      await channel.send({
        content: `👋 Salve ${message.author}! Seja muito bem-vindo(a) ao **${message.guild.name}**!`,
        files: [attachment],
      });
    } catch (error) {
      console.error(error);
      await message.reply("❌ Erro ao gerar o cartão de boas-vindas.");
    }
  },
};