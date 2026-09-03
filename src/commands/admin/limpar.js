import { PREFIX } from "../../config.js";

export default {
  name: "limpar",
  description: "Apaga mensagens recentes do canal",
  commands: ["clear", "purge", "clean"],
  usage: `${PREFIX}limpar <quantidade 1-100>`,
  handle: async ({ message, args, reply }) => {
    const quantidade = parseInt(args[0], 10);
    if (isNaN(quantidade) || quantidade < 1 || quantidade > 100) {
      return await reply("❌ Informe um número de mensagens entre 1 e 100.");
    }

    try {
      await message.delete().catch(() => null);
      const deleted = await message.channel.bulkDelete(quantidade, true);
      const msgConfirm = await message.channel.send(`🧹 **${deleted.size}** mensagens foram apagadas com sucesso!`);
      setTimeout(() => msgConfirm.delete().catch(() => null), 4000);
    } catch (error) {
      console.error(error);
      await reply("❌ Ocorreu um erro ao tentar apagar as mensagens.");
    }
  },
};
