import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, updateUser } from "../../utils/usersManager.js";

export default {
  name: "namorar",
  description: "Peça alguém especial em namoro ou casamento no servidor",
  category: "economy",
  commands: ["casar", "marry", "divorciar"],
  usage: `${PREFIX}namorar <@membro>`,
  handle: async ({ message, args, reply, sendReact }) => {
    const authorId = message.author.id;
    const authorData = getUser(authorId);

    if (args[0]?.toLowerCase() === "divorciar") {
      if (!authorData.relationship) return await reply("Você não está em um relacionamento!");
      const exId = authorData.relationship;
      const exData = getUser(exId);

      authorData.relationship = null;
      authorData.relationshipSince = null;
      exData.relationship = null;
      exData.relationshipSince = null;

      updateUser(authorId, authorData);
      updateUser(exId, exData);

      return await reply("💔 O relacionamento chegou ao fim. Vocês estão solteiros novamente.");
    }

    const target = message.mentions?.users?.first();
    if (!target) return await reply(`Marque a pessoa que você deseja pedir em namoro! Ex: \`${PREFIX}namorar @pessoa\``);
    if (target.id === authorId) return await reply("Você não pode namorar a si mesmo(a)!");
    if (authorData.relationship) return await reply("Você já está em um relacionamento! Use `!namorar divorciar` primeiro.");

    const targetData = getUser(target.id);
    if (targetData.relationship) return await reply("Essa pessoa já está em um relacionamento!");

    await sendReact?.("💍");

    const embed = new EmbedBuilder()
      .setColor("#FF007F")
      .setTitle("💍 PEDIDO DE CASAMENTO / NAMORO!")
      .setDescription(`<@${authorId}> pediu a mão de <@${target.id}>!\n\n<@${target.id}>, você aceita?`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("marry_yes").setLabel("Aceito! ❤️").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("marry_no").setLabel("Recusar 💔").setStyle(ButtonStyle.Danger)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === target.id && ["marry_yes", "marry_no"].includes(i.customId),
      time: 60000,
      max: 1,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "marry_no") {
        return await i.update({ content: `💔 <@${target.id}> recusou o pedido... Força guerreiro(a)!`, embeds: [], components: [] });
      }

      const now = Date.now();
      authorData.relationship = target.id;
      authorData.relationshipSince = now;
      targetData.relationship = authorId;
      targetData.relationshipSince = now;

      updateUser(authorId, authorData);
      updateUser(target.id, targetData);

      const winEmbed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle("🎉 VIVAM OS NOIVOS! 🎉")
        .setDescription(`💖 <@${authorId}> e <@${target.id}> agora estão oficialmente juntos! Felicidades ao casal!`);

      await i.update({ embeds: [winEmbed], components: [] });
    });
  },
};
