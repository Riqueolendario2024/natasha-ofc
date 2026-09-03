import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { gemini } from "../../services/spider-x-api.js";

export default {
  name: "doc",
  description: "Explicação de Nós, Classes e Métodos de Game Engines",
  commands: ["doc", "gamedoc", "helpdev"],
  usage: `${PREFIX}doc <engine> <termo>`,
  handle: async ({ message, fullArgs }) => {
    if (!fullArgs) {
      return message.reply(
        `Informe o conceito/classe e a engine!\nExemplo: \`${PREFIX}doc Godot CharacterBody2D\``
      );
    }

    await message.channel.sendTyping();

    const prompt = `Você é a NATASHA, especialista em desenvolvimento de jogos criada pelo lendário Riquefla. Explique de forma didática e direta o seguinte termo/classe: **${fullArgs}**.`;

    try {
      let explicacao = await gemini(prompt);
      if (explicacao.length > 4000) {
        explicacao = explicacao.slice(0, 3990) + "...";
      }

      const embed = new EmbedBuilder()
        .setColor("#FF007F")
        .setTitle(`📚 Documentação: ${fullArgs.slice(0, 200)}`)
        .setDescription(explicacao)
        .setFooter({ 
          text: "Natasha Bot • Criada pelo lendário Riquefla", 
          iconURL: message.client.user.displayAvatarURL({ forceStatic: true }) 
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await message.reply("❌ Erro ao consultar a documentação.");
    }
  },
};
