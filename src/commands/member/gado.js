import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const GADO_IMAGES = [
  "https://i.pinimg.com/736x/82/01/c6/8201c6407d57a26f6345d36e2f1f6305.jpg",
  "https://i.pinimg.com/736x/09/dc/d1/09dcd17b3a01a35560b4a243eec4b299.jpg",
  "https://i.pinimg.com/736x/a2/29/7c/a2297c65cbeea8d4ea547a4d3ec8ea28.jpg"
];

function getBar(pct) {
  const filled = Math.round(pct / 10);
  const empty = 10 - filled;
  return `[${"🌾".repeat(filled)}${"⬜".repeat(empty)}] **${pct}%**`;
}

export default {
  name: "gado",
  description: "Mede o quanto a pessoa é emocionada ou gado",
  category: "games",
  emoji: "🤠",
  commands: ["gadometro", "emocionado"],
  usage: `${PREFIX}gado [@membro]`,
  handle: async ({ message, reply, sendReact }) => {
    const target = message.mentions?.users?.first() || message.author;
    await sendReact?.("🤠");

    const percent = Math.floor(Math.random() * 101);
    const memeImg = GADO_IMAGES[Math.floor(Math.random() * GADO_IMAGES.length)];

    let frase = "";
    if (percent < 20) {
      frase = "Coração de pedra e gelo! Não responde stories nem por reza braba. 🧊";
    } else if (percent < 55) {
      frase = "Emocionado controlado. Manda um foguinho no direct uma vez por semana. 🔥";
    } else if (percent < 85) {
      frase = "Manda bom dia, pergunta se já tomou água e curte foto de 2018 na cara dura! 😂";
    } else {
      frase = "🚨 GADO SUPREMO! Já planejou os nomes dos três filhos no segundo dia de papo! 🤡💍";
    }

    const embed = new EmbedBuilder()
      .setColor("#E67E22")
      .setTitle("🤠 GADÔMETRO / RADAR EMOCIONADO 🤠")
      .setDescription(
        `👤 **Investigado:** <@${target.id}>\n` +
        `📊 **Nível Gado:** ${percent}%\n\n` +
        `${getBar(percent)}\n\n` +
        `💬 *"${frase}"*`
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage(memeImg)
      .setFooter({ text: "Natasha • Detector de Emocionados" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
