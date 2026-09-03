import { PREFIX } from "../../config.js";

export default {
  name: "boasvindas_toggle",
  description: "Ativa ou desativa as mensagens automáticas de boas-vindas",
  commands: ["bv", "welcome_toggle"],
  usage: `${PREFIX}bv <ativar | desativar>`,
  handle: async ({ args, reply, sendReact }) => {
    const acao = args[0]?.toLowerCase();

    if (acao === "ativar" || acao === "on") {
      await sendReact("✅");
      return await reply("✅ As mensagens automáticas de boas-vindas estão **ATIVADAS**!");
    }

    if (acao === "desativar" || acao === "off") {
      await sendReact("❌");
      return await reply("❌ As mensagens de boas-vindas foram **DESATIVADAS**.");
    }

    await reply(`Uso correto:\n• \`${PREFIX}bv ativar\`\n• \`${PREFIX}bv desativar\``);
  },
};
