import { PREFIX } from "../../config.js";
import { gemini, search } from "../../services/spider-x-api.js";

export default {
  name: "curso",
  description: "Busca aulas e cursos de Godot 4 no YouTube",
  commands: ["curso", "aulas"],
  usage: `${PREFIX}curso <tema>`,
  handle: async ({ message, fullArgs }) => {
    if (!fullArgs) {
      return message.reply(`Informe o tema do curso! Exemplo: \`${PREFIX}curso movimentacao 2d\``);
    }

    await message.channel.sendTyping();

    try {
      const termo = `Godot 4 ${fullArgs} tutorial portugues`;
      const resultadosYT = await search("youtube", termo).catch(() => null);

      let recomendacoes = "";
      if (Array.isArray(resultadosYT) && resultadosYT.length > 0) {
        recomendacoes = "\n\n📌 **Aulas encontradas no YouTube:**\n";
        resultadosYT.slice(0, 3).forEach((video, index) => {
          const titulo = video.title || video.nome || "Aula Godot 4";
          const url = video.url || video.link || "";
          recomendacoes += `${index + 1}. **${titulo}**\n🔗 ${url}\n`;
        });
      }

      const prompt = `Você é o TAKESHI. Dê uma recomendação curta de estudo para: "${fullArgs}".`;
      const guia = (await gemini(prompt)) || "Aqui está a recomendação de estudo:";

      const respostaFinal = `${guia}${recomendacoes}`;
      
      // Garante que não estoure o limite de mensagem do Discord
      if (respostaFinal.length > 2000) {
        return message.reply(respostaFinal.slice(0, 1990) + "...");
      }

      await message.reply(respostaFinal);
    } catch (error) {
      console.error(error);
      await message.reply("❌ Ocorreu um erro ao buscar os cursos.");
    }
  },
};