import { PREFIX } from "../../config.js";
import { addCoins, removeCoins, getCoins } from "../../utils/usersManager.js";

export default {
  name: "admincoins",
  description: "Adiciona ou remove NatashaCoins de qualquer membro (Exclusivo Dono)",
  commands: ["coinsadm", "setcoins", "moneyadm"],
  usage: `${PREFIX}admincoins <dar | tirar> <quantidade> <@membro>`,
  handle: async ({ args, reply, sendReact, message }) => {
    const acao = args[0]?.toLowerCase();
    const quantia = parseInt(args[1], 10);
    const userMention = message.mentions.users.first();

    if (!userMention || isNaN(quantia) || quantia <= 0 || !["dar", "add", "tirar", "remover"].includes(acao)) {
      return await reply(
        `Formato incorreto!\nUse:\n• \`${PREFIX}admincoins dar 500 @membro\`\n• \`${PREFIX}admincoins tirar 200 @membro\``
      );
    }

    if (acao === "dar" || acao === "add") {
      const novoSaldo = addCoins(userMention.id, quantia);
      await sendReact("💰");
      return await reply(`✅ Foram adicionadas **🪙 ${quantia} NatashaCoins** para <@${userMention.id}>.\n📊 **Novo Saldo:** \`${novoSaldo} coins\``);
    }

    if (acao === "tirar" || acao === "remover") {
      const sucesso = removeCoins(userMention.id, quantia);
      if (sucesso) {
        const novoSaldo = getCoins(userMention.id);
        await sendReact("🔪");
        return await reply(`✅ Foram removidas **🪙 ${quantia} NatashaCoins** de <@${userMention.id}>.\n📊 **Novo Saldo:** \`${novoSaldo} coins\``);
      } else {
        const saldoAtual = getCoins(userMention.id);
        await sendReact("❌");
        return await reply(`❌ Não foi possível remover ${quantia} coins. O usuário tem apenas \`${saldoAtual} coins\`.`);
      }
    }
  },
};
