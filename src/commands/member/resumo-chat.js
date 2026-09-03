import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { askAI } from "../../services/aiService.js";

export default {
  name: "resumo-chat",
  description: "Lê as últimas mensagens do canal e gera um resumo inteligente dos assuntos",
  category: "utilities",
  emoji: "📋",
  commands: ["resumo", "tldr", "resumir"],
  usage: `${PREFIX}resumo-chat [quantidade de mensagens: 10 a 50]`,
  handle: async ({ message, args, reply, sendReact }) => {
    let limit = parseInt(args[0]) || 35;
    if (limit > 60) limit = 60;
    if (limit < 10) limit = 10;

    await sendReact?.("📜");
    await message.channel.sendTyping();

    // Busca as mensagens anteriores no canal
    const fetched = await message.channel.messages.fetch({ limit: limit + 1 });
    const messagesArray = Array.from(fetched.values())
      .filter((m) => !m.author.bot && m.id !== message.id && m.content.trim().length > 0)
      .reverse();

    if (messagesArray.length < 3) {
      return await reply("Não há mensagens suficientes no canal para gerar um resumo!");
    }

    const chatLog = messagesArray
      .map((m) => `${m.author.username}: ${m.content.slice(0, 150)}`)
      .join("\n");

    const prompt = `
Você é a Natasha. Faça um resumo inteligente, direto e bem estruturado em tópicos do que a galera conversou recentemente neste canal do Discord:

Histórico das mensagens:
${chatLog}

Regras:
1. Resuma em 3 a 5 tópicos principais com marcadores (•).
2. Destaque os temas centrais, piadas ou decisões tomadas pela galera.
3. Seja concisa, natural e bem-humorada.
    `.trim();

    try {
      const summary = await askAI({ prompt, userId: message.author.id });

      const embed = new EmbedBuilder()
        .setColor("#F1C40F")
        .setTitle("📋 RESUMO DO QUE ROLOU NO CHAT")
        .setDescription(summary)
        .setFooter({ text: `Análise baseada nas últimas ${messagesArray.length} mensagens reais • Natasha` })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch {
      await reply("⚠️ Tive um problema ao processar o resumo do chat agora. Tente de novo!");
    }
  },
};
