import { PREFIX } from "../../config.js";

export default {
  name: "marcar-todos",
  description: "Chama a atenção de todos os membros do canal",
  category: "admin",
  commands: ["hidetag", "marcartodos", "todos"],
  usage: `${PREFIX}marcar-todos <mensagem>`,
  handle: async ({ message, fullArgs }) => {
    const texto = fullArgs || "Atenção a este comunicado geral!";
    await message.delete().catch(() => null);
    await message.channel.send(`📢 **COMUNICADO:** ${texto}\n\n@everyone`);
  },
};
