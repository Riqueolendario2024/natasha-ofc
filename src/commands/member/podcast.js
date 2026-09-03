import { AttachmentBuilder } from "discord.js";
import { askAI, generatePodcastAudio } from "../../services/aiService.js";

export const name = "podcast";
export const commands = ["pod", "resumo"];
export const description = "Gera um podcast em áudio com Alex e Sam comentando as conversas do grupo!";

export async function handle({ message, reply }) {
  if (message.deferReply) {
    await message.deferReply();
  } else if (message.channel?.sendTyping) {
    await message.channel.sendTyping();
  }

  try {
    const channel = message.channel;
    const fetchedMessages = await channel.messages.fetch({ limit: 40 });
    
    const chatHistory = fetchedMessages
      .filter((m) => !m.author.bot && m.content.length > 0)
      .map((m) => `${m.author.username}: ${m.content}`)
      .reverse()
      .join("\n");

    if (!chatHistory) {
      return await reply("Não achei conversas suficientes no chat para gerar o podcast!");
    }

    const promptPodcast = `
Você é o roteirista de um podcast curto e divertido sobre fofocas e resumo de chat de Discord.
Analise o histórico de mensagens e crie um diálogo natural entre dois apresentadores: Alex (homem) e Sam (mulher).

Regras obrigatórias:
1. Formato estrito para cada linha:
Alex: [fala do Alex]
Sam: [fala da Sam]
2. Crie no máximo 6 a 8 falas no total (curto e objetivo).
3. Eles devem usar gírias leves, fazer piadas sobre o que os membros falaram e comentar as conversas recentes de forma engraçada.
4. Não use emojis nem marcações especiais no texto das falas.

Histórico de mensagens:
${chatHistory}
`;

    const script = await askAI({ prompt: promptPodcast, userId: message.author?.id || message.user?.id });

    if (!script) {
      return await reply("Não consegui criar o roteiro do podcast no momento.");
    }

    const audioBuf = await generatePodcastAudio(script);

    if (audioBuf) {
      const file = new AttachmentBuilder(audioBuf, { name: "podcast-natasha.mp3" });
      const payload = {
        content: `🎙️ **Podcast do Grupo: Alex & Sam**\n\n📜 **Roteiro:**\n${script}`,
        files: [file],
      };

      if (message.editReply) return await message.editReply(payload);
      return await reply(payload);
    }

    const textPayload = `🎙️ **Roteiro do Podcast:**\n\n${script}\n\n*(Não foi possível sintetizar o áudio)*`;
    if (message.editReply) return await message.editReply(textPayload);
    return await reply(textPayload);
  } catch (err) {
    console.error("Erro no comando podcast:", err);
    if (message.editReply) return await message.editReply("Ocorreu um erro ao gerar o podcast.");
    return await reply("Ocorreu um erro ao gerar o podcast.");
  }
}

export default { name, commands, description, handle };