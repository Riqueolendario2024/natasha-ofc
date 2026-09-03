import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, updateUser } from "../../utils/usersManager.js";

export default {
  name: "relacionamento",
  description: "Defina seu status de relacionamento no perfil (estilo Facebook)",
  category: "economy",
  emoji: "💍",
  commands: ["status-relacionamento", "setrelacionamento", "estadocivil"],
  usage: `${PREFIX}relacionamento <solteiro | casado [nome] | namorando [nome] | noivo [nome] | enrolado [nome]>`,
  handle: async ({ message, args, reply, sendReact }) => {
    const userId = message.author.id;
    const user = getUser(userId);
    const tipo = args[0]?.toLowerCase();

    if (!tipo) {
      const embedAjuda = new EmbedBuilder()
        .setColor("#FF007F")
        .setTitle("💍 STATUS DE RELACIONAMENTO")
        .setDescription(
          `Configure o seu estado civil para exibir no \`${PREFIX}perfil\`:\n\n` +
          `• \`${PREFIX}relacionamento solteiro\` — Ficar solteiro(a)\n` +
          `• \`${PREFIX}relacionamento namorando [Nome ou @Pessoa]\` — Ex: \`${PREFIX}relacionamento namorando Maria\`\n` +
          `• \`${PREFIX}relacionamento casado [Nome ou @Pessoa]\` — Ex: \`${PREFIX}relacionamento casado Ana Clara\`\n` +
          `• \`${PREFIX}relacionamento noivo [Nome ou @Pessoa]\` — Ex: \`${PREFIX}relacionamento noivo Beatriz\`\n` +
          `• \`${PREFIX}relacionamento enrolado [Nome ou @Pessoa]\` — Em um rolo/enrolado(a)\n`
        )
        .setFooter({ text: "Não precisa que o parceiro esteja no Discord!" });

      return await message.reply({ embeds: [embedAjuda] });
    }

    if (["solteiro", "solteira", "livre", "clear"].includes(tipo)) {
      user.relationship = null;
      user.relationshipCustom = null;
      user.relationshipType = "Solteiro(a)";
      user.relationshipSince = null;
      updateUser(userId, user);

      await sendReact?.("💔");
      return await reply("💔 Seu status foi atualizado para: **Solteiro(a) no pedaço!**");
    }

    // Pega o nome do parceiro (pode ser menção @membro ou texto livre digitado)
    let partnerName = args.slice(1).join(" ").trim();
    if (message.mentions?.users?.first()) {
      partnerName = message.mentions.users.first().username;
    }

    if (!partnerName) {
      return await reply(`Faltou colocar o nome da pessoa! Exemplo: \`${PREFIX}relacionamento ${tipo} Nome Da Pessoa\``);
    }

    let statusFormatado = "Em um relacionamento";
    let emojiIcon = "❤️";

    if (["casado", "casada"].includes(tipo)) {
      statusFormatado = `Casado(a) com ${partnerName}`;
      emojiIcon = "💍";
    } else if (["namorando", "namoro"].includes(tipo)) {
      statusFormatado = `Namorando com ${partnerName}`;
      emojiIcon = "💖";
    } else if (["noivo", "noiva"].includes(tipo)) {
      statusFormatado = `Noivo(a) de ${partnerName}`;
      emojiIcon = "💎";
    } else if (["enrolado", "enrolada", "rolo"].includes(tipo)) {
      statusFormatado = `Enrolado(a) com ${partnerName}`;
      emojiIcon = "👀";
    } else {
      statusFormatado = `Com ${partnerName}`;
    }

    user.relationship = null;
    user.relationshipCustom = statusFormatado;
    user.relationshipType = tipo;
    user.relationshipSince = Date.now();
    updateUser(userId, user);

    await sendReact?.(emojiIcon);

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle(`${emojiIcon} STATUS ATUALIZADO!`)
      .setDescription(
        `✨ Parabéns <@${userId}>!\n\n` +
        `**Novo Status:** \`${statusFormatado}\`\n\n` +
        `Seu status agora é exibido oficialmente no seu comando \`${PREFIX}perfil\`!`
      );

    await message.reply({ embeds: [embed] });
  },
};
