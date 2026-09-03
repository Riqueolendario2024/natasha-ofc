import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { askAI } from "../../services/aiService.js";

export const activeGeniusGames = new Map();

export default {
  name: "genio",
  description: "Akinator IA: A Natasha tenta adivinhar o personagem que você pensou",
  commands: ["akinator", "adivinhar"],
  usage: `${PREFIX}genio [parar]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const channelId = message.channel.id;

    if (args[0]?.toLowerCase() === "parar") {
      if (!activeGeniusGames.has(channelId)) return await reply("Nenhum jogo do Gênio ativo no momento.");
      activeGeniusGames.delete(channelId);
      return await reply("🛑 Jogo do Gênio encerrado.");
    }

    if (activeGeniusGames.has(channelId)) {
      return await reply(`Já existe um jogo do Gênio ativo neste canal! Responda às perguntas ou use \`${PREFIX}genio parar\`.`);
    }

    await sendReact("🧞");

    const game = {
      facts: [],
      questionsCount: 0,
      lastQuestion: "O seu personagem é homem?",
      isGuessing: false,
      authorId: message.author.id,
    };

    activeGeniusGames.set(channelId, game);

    const embed = new EmbedBuilder()
      .setColor("#8E44AD")
      .setTitle("🧞 Natasha Akinator — Gênio Adivinho!")
      .setDescription(
        `Pense em um personagem (real, anime, game ou fictício).\nEu farei perguntas para tentar adivinhar!\n\n` +
        `❓ **Pergunta 1:**\n**${game.lastQuestion}**`
      )
      .setFooter({ text: "Use os botões para responder!" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("genio_sim").setLabel("Sim").setStyle(ButtonStyle.Success).setEmoji("✅"),
      new ButtonBuilder().setCustomId("genio_nao").setLabel("Não").setStyle(ButtonStyle.Danger).setEmoji("❌")
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      const answer = i.customId === "genio_sim" ? "Sim" : "Não";

      if (game.isGuessing) {
        if (answer === "Sim") {
          collector.stop("win");
          return await i.update({
            content: "🧞✨ **EU SABIA!** Sou a melhor gênio do Discord, acertei de novo! 😎",
            embeds: [],
            components: [],
          });
        } else {
          collector.stop("lost");
          return await i.update({
            content: "😭 Droga! Você me venceu dessa vez... Quem era o personagem?",
            embeds: [],
            components: [],
          });
        }
      }

      game.facts.push(`${game.lastQuestion}: ${answer}`);
      game.questionsCount++;

      // Tenta adivinhar na 4ª pergunta
      if (game.questionsCount >= 4) {
        const promptGuess = `Baseado nestes fatos: [${game.facts.join(", ")}], qual é o seu único palpite de personagem? Diga apenas: "Eu acho que é o(a) [Nome do Personagem]".`;
        const guessText = await askAI({ prompt: promptGuess });
        game.isGuessing = true;

        const guessEmbed = new EmbedBuilder()
          .setColor("#E91E63")
          .setTitle("🧞 JÁ SEI QUEM É!")
          .setDescription(`**${guessText}**\n\nEu acertei?`);

        return await i.update({ embeds: [guessEmbed], components: [row] });
      }

      // Pergunta seguinte gerada pela IA
      const promptNext = `Estamos jogando Akinator. Fatos conhecidos: [${game.facts.join(", ")}]. Faça a próxima pergunta curta e direta de "Sim" ou "Não" para descobrir o personagem. Retorne APENAS a pergunta.`;
      const nextQ = await askAI({ prompt: promptNext });
      game.lastQuestion = nextQ;

      embed.setDescription(
        `Pense no personagem...\n\n❓ **Pergunta ${game.questionsCount + 1}:**\n**${game.lastQuestion}**`
      );

      await i.update({ embeds: [embed], components: [row] });
    });

    collector.on("end", () => {
      activeGeniusGames.delete(channelId);
    });
  },
};
