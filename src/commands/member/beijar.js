import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

export default {
  name: "beijar",
  description: "Dá um beijo carinhoso em outro membro",
  commands: ["kiss", "beijo"],
  usage: `${PREFIX}beijar <@usuario>`,
  handle: async ({ message, reply, sendReact }) => {
    const userMention = message.mentions.users.first();
    if (!userMention) {
      return await reply("Para usar este comando, marque alguém do servidor!");
    }

    if (userMention.id === message.author.id) {
      return await reply("Você não pode beijar a si mesmo, seu narcisista! 😉");
    }

    await sendReact("😘");

    const embed = new EmbedBuilder()
      .setColor("#E91E63")
      .setDescription(`💋 **${message.author.username}** deu um beijo gostoso em **${userMention.username}**!`)
      .setImage("https://files.catbox.moe/og3xto.mp4");

    await message.reply({ content: `<@${userMention.id}>`, embeds: [embed] });
  },
};
