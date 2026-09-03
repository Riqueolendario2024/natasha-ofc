import { PREFIX } from "../../config.js";
import { askAI } from "../../services/aiService.js";

export default {
  name: "gemini",
  description: "Pesquisa na internet em tempo real e tira dúvidas com a IA",
  category: "ia",
  commands: ["ia", "pesquisar", "busca", "google"],
  usage: `${PREFIX}gemini <pergunta sobre fatos, notícias ou eventos>`,
  handle: async ({ message, fullArgs, reply, sendReact }) => {
    if (!fullArgs) {
      return await reply(`Faça sua pergunta!\n*Exemplo:* \`${PREFIX}gemini que horas é o eclipse lunar em imperatriz ma?\``);
    }

    await sendReact?.("🔍");
    await message.channel.sendTyping();

    const firstAttachment = message.attachments.first();
    const media = firstAttachment ? { url: firstAttachment.url, contentType: firstAttachment.contentType } : null;

    const resposta = await askAI({
      prompt: fullArgs,
      userId: message.author.id,
      attachment: media,
    });

    await message.reply(resposta);
  },
};
