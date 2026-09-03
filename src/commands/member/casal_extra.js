import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, updateUser } from "../../utils/usersManager.js";

export default {
  name: "trair",
  description: "Tente um romance proibido ou calcule o shipp entre duas pessoas",
  category: "economy",
  commands: ["shipp", "casal-extra", "amante"],
  usage: `${PREFIX}trair <@amante> ou ${PREFIX}shipp <@p1> [@p2]`,
  handle: async ({ message, reply, sendReact }) => {
    const rawCmd = message.content.slice(PREFIX.length).trim().split(/ +/)[0].toLowerCase();
    const mentions = message.mentions?.users;

    // Comando Shipp
    if (rawCmd === "shipp") {
      const p1 = mentions?.first() || message.author;
      const p2 = mentions?.size > 1 ? mentions.at(1) : (mentions?.first() !== message.author ? message.author : null);

      if (!p2) return await reply(`Marque duas pessoas ou apenas uma para calcular o shipp com você!`);

      const pct = Math.floor(Math.random() * 101);
      const shipName = p1.username.slice(0, Math.ceil(p1.username.length / 2)) + p2.username.slice(Math.floor(p2.username.length / 2));

      const embed = new EmbedBuilder()
        .setColor(pct > 60 ? "#FF1493" : "#7F8C8D")
        .setTitle("💘 MÁQUINA DO SHIPP")
        .setDescription(
          `👩‍❤️‍👨 **Casal:** <@${p1.id}> + <@${p2.id}>\n` +
          `✨ **Nome do Shipp:** **${shipName}**\n\n` +
          `🔥 **Compatibilidade:** \`${pct}%\`\n` +
          `${"💖".repeat(Math.floor(pct / 10))}${"🖤".repeat(10 - Math.floor(pct / 10))}\n\n` +
          `_${pct > 80 ? "💍 Casamento à vista!" : pct > 40 ? "👀 Tem clima aí..." : "🥀 Amizade eterna."}_`
        );

      return await message.reply({ embeds: [embed] });
    }

    // Comando Trair
    const amante = mentions?.first();
    if (!amante) return await reply("Marque quem você deseja propor uma traição!");
    if (amante.id === message.author.id) return await reply("Você não pode trair consigo mesmo!");

    const user = getUser(message.author.id);
    if (!user.relationship) return await reply("Você nem está em um relacionamento para poder trair! 🤡");

    await sendReact?.("👀");

    const embed = new EmbedBuilder()
      .setColor("#8E44AD")
      .setTitle("🤫 PROPOSTA INDECENTE!")
      .setDescription(
        `🚨 <@${message.author.id}> está comprometido(a), mas chamou <@${amante.id}> para ser o(a) **amante**!\n\n` +
        `Como você reage, <@${amante.id}>?`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("trair_sim").setLabel("Aceitar Traição 😈").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("trair_fiel").setLabel("Expor ao Parceiro(a) 📢").setStyle(ButtonStyle.Success)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === amante.id,
      time: 60000,
      max: 1,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "trair_sim") {
        await i.update({
          content: `😈 **CLIMA PESADO!** <@${amante.id}> aceitou o convite de <@${message.author.id}>! O(A) parceiro(a) oficial que se cuide!`,
          embeds: [],
          components: [],
        });
      } else {
        await i.update({
          content: `📢 **CASA CAIU!** <@${amante.id}> recusou e expôs <@${message.author.id}> para todo o servidor! Fiel até o fim! 🛡️`,
          embeds: [],
          components: [],
        });
      }
    });
  },
};
