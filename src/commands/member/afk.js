import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { setAFK } from "../../utils/afkManager.js";

export default {
  name: "afk",
  description: "Define seu status como ausente e avisa quem marcar você no chat",
  category: "utilities",
  emoji: "💤",
  commands: ["ausente", "brb"],
  usage: `${PREFIX}afk [motivo da ausência]`,
  handle: async ({ message, fullArgs, sendReact }) => {
    const userId = message.author.id;
    const reason = fullArgs || "Sem motivo informado";

    setAFK(userId, reason);
    await sendReact?.("💤");

    const embed = new EmbedBuilder()
      .setColor("#3498DB")
      .setTitle("💤 STATUS AFK ATIVADO")
      .setDescription(
        `Salve <@${userId}>! Você agora está marcado como **Ausente (AFK)**.\n\n` +
        `📝 **Motivo:** \`${reason}\`\n\n` +
        `*Sempre que alguém te marcar, eu vou avisar. Quando você mandar qualquer mensagem no chat, o status será removido automaticamente!*`
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
