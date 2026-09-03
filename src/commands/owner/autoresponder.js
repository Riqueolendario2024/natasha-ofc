import { PREFIX } from "../../config.js";
import {
  isAutoResponderActive,
  setAutoResponderState,
  addResponse,
} from "../../utils/autoResponderManager.js";

export default {
  name: "autoresponder",
  description: "Configura e ensina respostas automáticas à Natasha (Exclusivo Dono)",
  commands: ["ar", "ensinar"],
  usage: `${PREFIX}autoresponder <ligar | desligar | ensinar gatilho : resposta>`,
  handle: async ({ args, fullArgs, reply, sendReact }) => {
    const acao = args[0]?.toLowerCase();

    if (acao === "on" || acao === "ligar" || acao === "1") {
      setAutoResponderState(true);
      await sendReact("💡");
      return await reply("✅ O sistema de Auto-Responder da Natasha foi **ATIVADO**!");
    }

    if (acao === "off" || acao === "desligar" || acao === "0") {
      setAutoResponderState(false);
      await sendReact("🅾️");
      return await reply("🅾️ O sistema de Auto-Responder foi **DESATIVADO**.");
    }

    if (acao === "ensinar") {
      const conteudo = fullArgs.replace(/^autoresponder\s+ensinar\s+/i, "").replace(/^ar\s+ensinar\s+/i, "").replace(/^ensinar\s+/i, "");
      if (!conteudo.includes(":")) {
        return await reply(`Formato incorreto!\nUse: \`${PREFIX}autoresponder ensinar [frase gatilho] : [resposta]\`\n*Exemplo:* \`${PREFIX}autoresponder ensinar quem é o brabo? : É o lendário Riquefla!\``);
      }

      const [gatilho, ...respostaPartes] = conteudo.split(":");
      const resposta = respostaPartes.join(":").trim();

      if (!gatilho.trim() || !resposta) {
        return await reply("Você precisa definir um gatilho e uma resposta válidos!");
      }

      addResponse(gatilho.trim(), resposta);
      await sendReact("✍️");
      return await reply(`✅ Aprendido com sucesso!\nQuando alguém disser **"${gatilho.trim()}"**, responderei com **"${resposta}"**.`);
    }

    const status = isAutoResponderActive() ? "🟢 **ATIVADO**" : "🅾️ **DESATIVADO**";
    await reply(
      `⚙️ **Painel do Auto-Responder**\n\n` +
      `• **Status Atual:** ${status}\n\n` +
      `• \`${PREFIX}ar ligar\` (ativa)\n` +
      `• \`${PREFIX}ar desligar\` (desativa)\n` +
      `• \`${PREFIX}ar ensinar [gatilho] : [resposta]\` (cria nova resposta)`
    );
  },
};
