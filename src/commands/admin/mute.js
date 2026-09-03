import { EmbedBuilder } from "discord.js";
import { PREFIX, OWNER_ID } from "../../config.js";

export default {
  name: "mute",
  description: "Aplica timeout / silenciamento temporário a um membro",
  category: "admin",
  commands: ["silenciar", "desmute", "unmute"],
  usage: `${PREFIX}mute <@membro> [minutos]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const userMention = message.mentions?.users?.first();
    if (!userMention) return await reply(`Marque o usuário!\n*Exemplo:* \`${PREFIX}mute @membro 10\``);

    if (userMention.id === OWNER_ID) return await reply("❌ O criador não pode ser silenciado.");

    const member = message.guild?.members.cache.get(userMention.id);
    if (!member) return await reply("Membro não encontrado no servidor.");

    const isUnmute = message.content.toLowerCase().includes("desmute") || message.content.toLowerCase().includes("unmute");

    if (isUnmute) {
      await member.timeout(null);
      await sendReact?.("🔊");
      return await reply(`🔊 <@${userMention.id}> foi desmutado com sucesso!`);
    }

    const minutes = parseInt(args[1], 10) || 5;
    const durationMs = minutes * 60 * 1000;

    try {
      await member.timeout(durationMs, `Silenciado por ${message.author.tag}`);
      await sendReact?.("🔇");

      const embed = new EmbedBuilder()
        .setColor("#E74C3C")
        .setTitle("🔇 Membro Silenciado!")
        .setDescription(`👤 **Membro:** <@${userMention.id}>\n⏳ **Duração:** \`${minutes} minuto(s)\`\n🛡️ **Por:** <@${message.author.id}>`);

      await message.reply({ embeds: [embed] });
    } catch {
      await reply("❌ Falha ao aplicar timeout. O cargo do membro pode ser superior ao meu.");
    }
  },
};
