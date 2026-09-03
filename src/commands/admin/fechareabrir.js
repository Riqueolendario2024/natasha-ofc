import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

export default {
  name: "fechar-grupo",
  description: "Tranca ou destranca o canal atual para envio de mensagens",
  category: "admin",
  commands: ["fechar", "fechar-canal", "lock", "abrir", "abrir-canal", "unlock"],
  usage: `${PREFIX}fechar ou ${PREFIX}abrir`,
  handle: async ({ message, reply, sendReact }) => {
    const isLock = message.content.toLowerCase().includes("fechar") || message.content.toLowerCase().includes("lock");
    const channel = message.channel;

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        [PermissionFlagsBits.SendMessages]: !isLock,
      });

      await sendReact?.(isLock ? "🔒" : "🔓");

      const embed = new EmbedBuilder()
        .setColor(isLock ? "#E74C3C" : "#2ECC71")
        .setTitle(isLock ? "🔒 Canal Trancado!" : "🔓 Canal Aberto!")
        .setDescription(
          isLock
            ? `O canal <#${channel.id}> foi fechado para mensagens por <@${message.author.id}>.`
            : `O canal <#${channel.id}> foi liberado novamente para conversas por <@${message.author.id}>.`
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (err) {
      await reply("❌ Falha ao alterar as permissões do canal. Verifique minha hierarquia de cargos.");
    }
  },
};
