import { PREFIX } from "../../config.js";
import { gemini } from "../../services/spider-x-api.js";

export default {
  name: "godot",
  description: "Tira dúvidas de Godot 4 e GDScript com a Natasha",
  commands: ["godot", "ajuda-godot"],
  usage: `${PREFIX}godot <sua dúvida>`,
  handle: async ({ message, fullArgs }) => {
    if (!fullArgs) {
      return message.reply(`Digite sua dúvida! Exemplo: \`${PREFIX}godot como usar Area2D?\``);
    }

    await message.channel.sendTyping();

    const systemPrompt = `Você é a NATASHA, especialista em Godot 4.x e GDScript criada pelo lendário Riquefla.
Responda de forma clara e formate códigos com destaque de sintaxe GDScript do Discord:
\`\`\`gdscript
# código aqui
\`\`\``;

    try {
      const resposta = await gemini(`${systemPrompt}\n\nDúvida: ${fullArgs}`);
      
      if (resposta.length > 2000) {
        return message.reply(resposta.slice(0, 1990) + "...");
      }

      await message.reply(resposta);
    } catch (error) {
      console.error(error);
      await message.reply("❌ Erro ao consultar a Natasha. Tenta de novo!");
    }
  },
};
