import { PREFIX } from "../../config.js";
import { handleNewsIntent } from "../../tools/intentEngine.js";

export default {
  name: "noticias",
  description: "Exibe as principais notícias em tempo real com botões interativos",
  commands: ["noticia", "news", "g1"],
  usage: `${PREFIX}noticias [brasil | mundo | tecnologia | esportes]`,
  handle: async ({ message, args, reply }) => {
    const categoria = args[0]?.toLowerCase() || "brasil";
    await message.channel.sendTyping();

    const payload = await handleNewsIntent(categoria);
    if (!payload) {
      return await reply("⚠️ Não consegui carregar as notícias no momento. Tente novamente em instantes.");
    }

    await message.reply({ embeds: [payload.embed], components: [payload.row] });
  },
};
