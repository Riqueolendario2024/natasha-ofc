import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

export default {
  name: "correio-anonimo",
  description: "Envia uma mensagem secreta e anônima na DM de um membro do servidor",
  category: "utilities",
  emoji: "💌",
  commands: ["anonimo", "correio", "secretmsg"],
  usage: `${PREFIX}correio-anonimo <@membro | ID> <sua mensagem>`,
  handle: async ({ message, args, reply, sendReact }) => {
    // Apaga a mensagem do autor no canal público para garantir total sigilo
    await message.delete().catch(() => null);

    const targetUser = message.mentions?.users?.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    
    if (!targetUser) {
      return await message.author.send(`⚠️ **Uso correto:** \`${PREFIX}correio-anonimo @usuario Sua mensagem secreta aqui\`\nVocê precisa marcar alguém do servidor!`).catch(() => null);
    }

    if (targetUser.id === message.author.id) {
      return await message.author.send("⚠️ Você não pode enviar um correio anônimo para si mesmo!").catch(() => null);
    }

    if (targetUser.bot) {
      return await message.author.send("⚠️ Você não pode enviar correio anônimo para outros bots!").catch(() => null);
    }

    const secretText = args.slice(1).join(" ").trim();
    if (!secretText) {
      return await message.author.send("⚠️ Escreva a mensagem que deseja enviar junto ao comando!").catch(() => null);
    }

    const embedDM = new EmbedBuilder()
      .setColor("#FF007F")
      .setTitle("💌 VOCÊ RECEBEU UM CORREIO ANÔNIMO!")
      .setDescription(
        `Alguém especial da comunidade **${message.guild ? message.guild.name : "Discord"}** te mandou esta mensagem em segredo:\n\n` +
        `📝 *"${secretText}"*\n\n` +
        `🤫 *A identidade do remetente está 100% protegida pela Natasha.*`
      )
      .setFooter({ text: "Natasha • Sistema de Mensagens Secretas" })
      .setTimestamp();

    try {
      await targetUser.send({ embeds: [embedDM] });
      await message.author.send(`✅ **Correio enviado com sucesso!** Sua mensagem foi entregue na DM de **${targetUser.username}** de forma anônima.`);
    } catch {
      await message.author.send(`❌ Não foi possível entregar a mensagem para **${targetUser.username}**. A DM dessa pessoa pode estar fechada para mensagens diretas.`);
    }
  },
};
