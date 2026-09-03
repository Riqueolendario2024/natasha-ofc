import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { addBlockedWord, removeBlockedWord, getBlockedWords } from "../../utils/adminManager.js";

export default {
  name: "block-palavra",
  description: "Configura o filtro de palavras proibidas do servidor",
  category: "admin",
  commands: ["blockpalavra", "remover-palavra", "lista-palavras"],
  usage: `${PREFIX}block-palavra <palavra>`,
  handle: async ({ message, args, reply, sendReact }) => {
    const commandText = message.content.toLowerCase();

    if (commandText.includes("lista-palavras")) {
      const words = getBlockedWords();
      if (words.length === 0) return await reply("Nenhuma palavra proibida cadastrada no filtro.");
      return await reply(`🚫 **Palavras Bloqueadas:** \`${words.join("`, `")}\``);
    }

    const word = args[0]?.toLowerCase();
    if (!word) return await reply(`Informe a palavra!\n*Exemplo:* \`${PREFIX}block-palavra proibido\``);

    if (commandText.includes("remover-palavra")) {
      removeBlockedWord(word);
      await sendReact?.("✅");
      return await reply(`✅ A palavra \`${word}\` foi removida do filtro de segurança.`);
    }

    addBlockedWord(word);
    await sendReact?.("🛡️");
    await reply(`🛡️ A palavra \`${word}\` agora será automaticamente bloqueada e apagada das mensagens.`);
  },
};
