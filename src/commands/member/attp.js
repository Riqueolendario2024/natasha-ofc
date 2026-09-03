import axios from "axios";
import { AttachmentBuilder } from "discord.js";
import { PREFIX, SPIDER_API_TOKEN, SPIDER_API_BASE_URL } from "../../config.js";

export default {
  name: "attp",
  description: "Cria figurinhas/GIFs com texto animado",
  commands: ["sticker", "fig", "ttp"],
  usage: `${PREFIX}attp <texto>`,
  handle: async ({ reply, sendReact, fullArgs, message }) => {
    if (!fullArgs) {
      return await reply(`✨ Qual texto você quer na figurinha?\n*Exemplo:* \`${PREFIX}attp Salve Riquefla\``);
    }
    if (fullArgs.length > 50) {
      return await reply("✋ Texto muito longo! Digite no máximo 50 caracteres.");
    }

    await sendReact("✍️");
    await message.channel.sendTyping();

    try {
      const apiUrl = `${SPIDER_API_BASE_URL}/stickers/attp?text=${encodeURIComponent(fullArgs)}&api_key=${SPIDER_API_TOKEN}`;
      const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 20000 });

      const attachment = new AttachmentBuilder(Buffer.from(response.data), { name: "attp.webp" });
      await message.reply({ files: [attachment] });
    } catch (erro) {
      console.error("[ATTP ERROR]", erro);
      await reply("❌ Falha ao conectar ao serviço de figurinhas.");
    }
  },
};
