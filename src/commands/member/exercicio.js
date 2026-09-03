import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { gemini } from "../../services/spider-x-api.js";

export default {
  name: "exercicio",
  description: "Gera um desafio prático de GDScript",
  commands: ["exercicio", "desafio", "treino"],
  usage: `${PREFIX}exercicio [facil | medio | dificil]`,
  handle: async ({ message, fullArgs }) => {
    const nivel = fullArgs.toLowerCase().trim() || "facil";

    await message.channel.sendTyping();

    const prompt = `Você é a NATASHA, mentora criada pelo lendário Riquefla. Crie um desafio prático de GDScript focado na Godot 4 no nível: **${nivel}**.`;

    try {
      let desafio = await gemini(prompt);
      if (desafio.length > 4000) {
        desafio = desafio.slice(0, 3990) + "...";
      }

      const embed = new EmbedBuilder()
        .setColor("#FF007F")
        .setTitle(`🎯 Desafio GDScript (${nivel.toUpperCase()})`)
        .setDescription(desafio)
        .setFooter({ 
          text: "Natasha Bot • Bons estudos!", 
          iconURL: message.client.user.displayAvatarURL({ forceStatic: true }) 
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await message.reply("❌ Erro ao gerar o desafio.");
    }
  },
};
