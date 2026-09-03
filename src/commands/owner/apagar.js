import { PREFIX } from "../../config.js";

export default {
  name: "apagar",
  description: "Apaga a mensagem que você responder com o comando (Exclusivo Dono)",
  commands: ["del", "delete"],
  usage: `${PREFIX}apagar (respondendo a uma mensagem)`,
  handle: async ({ message, reply, sendReact }) => {
    if (!message.reference?.messageId) {
      return await reply("⚠️ Você precisa **responder** à mensagem que deseja apagar!");
    }

    try {
      const targetMessage = await message.channel.messages.fetch(message.reference.messageId);
      await message.delete().catch(() => null);
      await targetMessage.delete().catch(() => null);
    } catch (err) {
      console.error("[APAGAR ERROR]", err);
      await reply("❌ Não consegui apagar a mensagem. Verifique se tenho permissão de gerenciar mensagens.");
    }
  },
};
