import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser } from "../../utils/usersManager.js";

export default {
  name: "perfil",
  description: "Exibe o perfil completo do usuário com status de relacionamento e estatísticas",
  category: "economy",
  emoji: "👤",
  commands: ["profile", "p"],
  usage: `${PREFIX}perfil [@membro]`,
  handle: async ({ message, reply, sendReact }) => {
    const target = message.mentions?.users?.first() || message.author;
    const user = getUser(target.id);

    await sendReact?.("👤");

    // Status de relacionamento (Livre ou por menção)
    let statusRelacionamento = "Solteiro(a)";
    if (user.relationshipCustom) {
      statusRelacionamento = user.relationshipCustom;
    } else if (user.relationship) {
      statusRelacionamento = `Casado(a) com <@${user.relationship}>`;
    }

    const coins = (user.coins || 0).toLocaleString("pt-BR");
    const cargo = target.id === message.guild?.ownerId ? "Dono(a) do Servidor" : "Membro da Comunidade";

    // Estatísticas divertidas baseadas no ID do usuário
    const seed = parseInt(target.id.slice(-4)) || 50;
    const prog = (seed % 40) + 30;
    const job = ((seed * 2) % 30) + 15;
    const vagabundo = 100 - prog - job;

    const frases = [
      "Não tenha medo de falhar. Tenha medo de não tentar.",
      "Codando jogos e conquistando mundos.",
      "Mais um dia sobrevivendo com café e persistência.",
      "O segredo do sucesso é a disciplina constante."
    ];
    const fraseDia = frases[seed % frases.length];

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle(`👤 Perfil de ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ forceStatic: true, size: 256 }))
      .addFields(
        { name: "👑 Cargo", value: cargo, inline: true },
        { name: "❤️ Relacionamento", value: statusRelacionamento, inline: true },
        { name: "🪙 NatashaCoins", value: `${coins} moedas`, inline: true },
        {
          name: "🧠 Análise de Personalidade",
          value: `💻 **Programador(a):** ${prog}%\n💼 **Do Job:** ${job}%\n🌴 **Vagabundo(a):** ${vagabundo}%`,
          inline: false,
        },
        { name: "📌 Frase do Dia", value: `*"${fraseDia}"*`, inline: false }
      )
      .setFooter({ text: `Natasha • Sistema de Membros` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
