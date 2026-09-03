import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const RAINBOW_IMAGES = [
  "https://i.pinimg.com/736x/83/8f/6f/838f6f5984da63e3d3b6fe9b5a837c35.jpg",
  "https://i.pinimg.com/736x/21/f2/a9/21f2a969335a4b5e67ea692e2a3cf34b.jpg"
];

function getBar(pct) {
  const filled = Math.round(pct / 10);
  const empty = 10 - filled;
  return `[${"🌈".repeat(Math.max(1, Math.round(filled / 2)))}${"⬜".repeat(empty)}] **${pct}%**`;
}

export default {
  name: "gay",
  description: "Mede o brilho e a porcentagem no medidor de cores",
  category: "games",
  emoji: "🌈",
  commands: ["gayometro", "rainbow"],
  usage: `${PREFIX}gay [@membro]`,
  handle: async ({ message, reply, sendReact }) => {
    const target = message.mentions?.users?.first() || message.author;
    await sendReact?.("🌈");

    const percent = Math.floor(Math.random() * 101);
    const memeImg = RAINBOW_IMAGES[Math.floor(Math.random() * RAINBOW_IMAGES.length)];

    let comentario = "";
    if (percent < 20) comentario = "Nível básico de purpurina! ✨";
    else if (percent < 60) comentario = "O brilho tá radiante! Já pode desfilar com estilo! 💖";
    else if (percent < 90) comentario = "Arrasou! O arco-íris tomou conta de tudo! 🌈💃";
    else comentario = "👑 DIVA MÁXIMA! 100% puro glamour, brilho e atitude!";

    const embed = new EmbedBuilder()
      .setColor("#FF1493")
      .setTitle("🌈 GAYÔMETRO / MEDIDOR DE ORGULHO 🌈")
      .setDescription(
        `👤 **Alvo:** <@${target.id}>\n` +
        `📊 **Porcentagem:** ${percent}%\n\n` +
        `${getBar(percent)}\n\n` +
        `✨ *"${comentario}"*`
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage(memeImg)
      .setFooter({ text: "Natasha • Medidor de Brilho" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
