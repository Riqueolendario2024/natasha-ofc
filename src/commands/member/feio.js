import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const FEIO_IMAGES = [
  "https://images.uncyc.org/pt/thumb/2/29/Feio_da_porra.jpg/300px-Feio_da_porra.jpg",
  "https://i.pinimg.com/736x/8f/c9/28/8fc928efad97162fa92c554b73b5bbd4.jpg",
  "https://i.pinimg.com/736x/e4/2c/31/e42c314ae2d733cb5352c1e7a06652a9.jpg",
  "https://i.pinimg.com/originals/a0/02/76/a00276a6cfd77eeec50438cf181829e3.jpg",
  "https://i.pinimg.com/736x/d6/04/b9/d604b9e4a8335f60633c7f1aebbb7d90.jpg"
];

function getBar(pct) {
  const filled = Math.round(pct / 10);
  const empty = 10 - filled;
  return `[${"🟩".repeat(filled)}${"⬛".repeat(empty)}] **${pct}%**`;
}

export default {
  name: "feio",
  description: "Descubra o nível real de feiura com análise facial e foto da ficha",
  category: "games",
  emoji: "🧟",
  commands: ["feiometro", "beleza", "feioso", "bonito"],
  usage: `${PREFIX}feio [@membro]`,
  handle: async ({ message, reply, sendReact }) => {
    const target = message.mentions?.users?.first() || message.author;
    await sendReact?.("🧟");

    const percent = Math.floor(Math.random() * 101);
    const memeImg = FEIO_IMAGES[Math.floor(Math.random() * FEIO_IMAGES.length)];

    let status = "";
    let comentario = "";

    if (percent < 20) {
      status = "✨ Nível: Modelo de Passarela";
      comentario = "Passou longe da feiura! Rosto simétrico, pele de bebê e digno de capa de revista. 😎";
    } else if (percent < 50) {
      status = "🙂 Nível: Dá pro Gasto";
      comentario = "Com uma luz ambiente e um ângulo favorável de 45 graus, até que engana bem! 😂";
    } else if (percent < 80) {
      status = "🧅 Nível: Horta de Cebola";
      comentario = "Se beleza fosse flor, você seria uma horta de cebola picada fazendo todo mundo chorar! 🧅";
    } else {
      status = "💀 Nível: Alerta Biológico Máximo";
      comentario = "A câmera frontal fecha sozinha por medida de segurança! Espelho em casa é item proibido! 👻";
    }

    const embed = new EmbedBuilder()
      .setColor(percent > 60 ? "#8B0000" : "#2ECC71")
      .setTitle("🧟 ANALISANDO O NÍVEL DE FEIURA 🧟")
      .setDescription(
        `👤 **Cobaia:** <@${target.id}>\n` +
        `📊 **Porcentagem:** ${percent}%\n\n` +
        `${getBar(percent)}\n\n` +
        `🏷️ **Diagnóstico:** \`${status}\`\n` +
        `💬 *"${comentario}"*`
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage(memeImg)
      .setFooter({ text: `Natasha • Escaneamento Estético • ${message.author.username}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
