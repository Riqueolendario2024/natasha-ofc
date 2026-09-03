import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const CORNO_IMAGES = [
  "https://i.pinimg.com/736x/8b/6e/b9/8b6eb9e51c8e19c3b885be997fc28dfc.jpg",
  "https://i.pinimg.com/736x/2b/43/d8/2b43d84fcfbd1be6f59df29c2ef3aa8d.jpg",
  "https://i.pinimg.com/736x/77/65/59/7765596495df02517eb48a609d8164bc.jpg",
  "https://i.pinimg.com/736x/3a/0c/fc/3a0cfc4b7ecb8fcf67f6a73a388b14e0.jpg"
];

function getBar(pct) {
  const filled = Math.round(pct / 10);
  const empty = 10 - filled;
  return `[${"🟫".repeat(filled)}${"⬜".repeat(empty)}] **${pct}%**`;
}

export default {
  name: "corno",
  description: "Pesquisa a ficha de chifre no radar bovino oficial com foto",
  category: "games",
  emoji: "🐂",
  commands: ["cornometro", "chifre", "gado-master", "touro"],
  usage: `${PREFIX}corno [@membro]`,
  handle: async ({ message, reply, sendReact }) => {
    const target = message.mentions?.users?.first() || message.author;
    await sendReact?.("🐂");

    const percent = Math.floor(Math.random() * 101);
    const memeImg = CORNO_IMAGES[Math.floor(Math.random() * CORNO_IMAGES.length)];

    let frase = "";
    if (percent === 0) {
      frase = "Limpíssimo! Nem sinal de chifre por enquanto. 😇";
    } else if (percent < 30) {
      frase = "Humm... Tá na média, mas já tem um chifre brilhando aí! 😅";
    } else if (percent < 70) {
      frase = "Eita! O chapéu já tá caindo de lado, não passa mais em porta baixa! 👀";
    } else if (percent < 95) {
      frase = "Já tá tomando cerveja no balcão escutando modão sertanejo! O berrante tocou! 🐂🍺";
    } else {
      frase = "🏆 CORNO SUPREMO! Presidente mundial do sindicato dos bois de raça! 👑📯";
    }

    const embed = new EmbedBuilder()
      .setColor("#8B4513")
      .setTitle("🐂 O QUANTO TU É CORNO? 🐂")
      .setDescription(
        `👤 **Alvo:** <@${target.id}>\n` +
        `📊 **Grau de Chifre:** ${percent}%\n\n` +
        `${getBar(percent)}\n\n` +
        `💬 *"${frase}"*`
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage(memeImg)
      .setFooter({ text: "Natasha • Ficha do Departamento Bovino" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
