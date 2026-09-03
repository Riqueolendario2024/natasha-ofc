import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { PREFIX } from "../../config.js";
import { TRUTH_QUESTIONS, DARE_CHALLENGES } from "../../utils/truthOrDareData.js";
import { askAI } from "../../services/aiService.js";
import { addCoins } from "../../utils/usersManager.js";

// Controle de sessões ativas para evitar conflito entre jogadores
export const activeVdGames = new Map();

function buildProgressBar(remaining, total) {
  const percentage = Math.max(0, Math.min(1, remaining / total));
  const filled = Math.round(percentage * 12);
  const empty = 12 - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] \`${remaining}s\``;
}

export default {
  name: "verdadedesafio",
  description: "Jogue o clássico Verdade ou Desafio interativo com a Natasha!",
  category: "games",
  emoji: "🎭",
  commands: ["vd", "verdade", "desafio"],
  usage: `${PREFIX}vd [verdade | desafio]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const userId = message.author.id;
    const channelId = message.channel.id;
    const sessionKey = `${channelId}_${userId}`;

    if (activeVdGames.has(sessionKey)) {
      return await reply("⚠️ Você já tem uma rodada de Verdade ou Desafio em andamento neste canal!");
    }

    await sendReact?.("🎭");

    let directChoice = args[0]?.toLowerCase();
    if (message.content.toLowerCase().startsWith(`${PREFIX}verdade`)) directChoice = "verdade";
    if (message.content.toLowerCase().startsWith(`${PREFIX}desafio`)) directChoice = "desafio";

    // Se o usuário especificou direto no comando:
    if (directChoice === "verdade" || directChoice === "v") {
      return await startTruthRound({ message, userId, sessionKey });
    }
    if (directChoice === "desafio" || directChoice === "d") {
      return await startDareRound({ message, userId, sessionKey });
    }

    // Caso contrário, renderiza o Menu Interativo inicial
    const embed = new EmbedBuilder()
      .setColor("#FF007F")
      .setTitle("🎭 VERDADE OU DESAFIO")
      .setDescription(
        `Salve <@${userId}>! O que você tem coragem de encarar agora?\n\n` +
        `🟢 **Verdade:** Uma pergunta sincera onde a Natasha vai avaliar sua resposta.\n` +
        `🔴 **Desafio:** Uma missão criativa (código contra o relógio, prints, fotos ou texto).\n\n` +
        `*Escolha uma das opções abaixo:*`
      )
      .setFooter({ text: "Natasha • Verdade ou Desafio Interativo" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("vd_btn_truth").setLabel("Verdade").setEmoji("🟢").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("vd_btn_dare").setLabel("Desafio").setEmoji("🔴").setStyle(ButtonStyle.Danger)
    );

    const gameMsg = await message.reply({ embeds: [embed], components: [row] });
    activeVdGames.set(sessionKey, { status: "choosing", messageId: gameMsg.id });

    const collector = gameMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === userId && ["vd_btn_truth", "vd_btn_dare"].includes(i.customId),
      time: 45000,
      max: 1,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      if (i.customId === "vd_btn_truth") {
        await startTruthRound({ message, userId, sessionKey, targetMessage: gameMsg });
      } else {
        await startDareRound({ message, userId, sessionKey, targetMessage: gameMsg });
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time" && activeVdGames.get(sessionKey)?.status === "choosing") {
        activeVdGames.delete(sessionKey);
        gameMsg.edit({ content: "⏳ Tempo de escolha esgotado! Digite `!vd` para jogar de novo.", components: [], embeds: [] }).catch(() => null);
      }
    });
  },
};

// ==========================================
// 🟢 MODO VERDADE (COM COLETA E REAÇÃO DE IA)
// ==========================================
async function startTruthRound({ message, userId, sessionKey, targetMessage = null }) {
  activeVdGames.set(sessionKey, { status: "awaiting_truth_response" });

  const question = TRUTH_QUESTIONS[Math.floor(Math.random() * TRUTH_QUESTIONS.length)];

  const truthEmbed = new EmbedBuilder()
    .setColor("#2ECC71")
    .setTitle("🟢 HORA DA VERDADE!")
    .setDescription(
      `👤 **Vez de:** <@${userId}>\n\n` +
      `❓ **Pergunta:**\n` +
      `> **"${question}"**\n\n` +
      `💬 *Digite sua resposta diretamente aqui no chat! A Natasha está de olho...*`
    )
    .setFooter({ text: "Responda com sinceridade em até 60 segundos" });

  if (targetMessage) {
    await targetMessage.edit({ embeds: [truthEmbed], components: [] });
  } else {
    targetMessage = await message.reply({ embeds: [truthEmbed] });
  }

  const msgCollector = message.channel.createMessageCollector({
    filter: (m) => m.author.id === userId && !m.content.startsWith(PREFIX),
    time: 60000,
    max: 1,
  });

  msgCollector.on("collect", async (userMsg) => {
    activeVdGames.delete(sessionKey);
    await message.channel.sendTyping();

    const promptIa = `
O usuário respondeu a uma rodada de "Verdade ou Desafio" no Discord.
Pergunta feita: "${question}"
Resposta do usuário: "${userMsg.content}"

Instruções para você (Natasha):
- Reaja diretamente ao que o usuário respondeu com seu humor característico, inteligência e naturalidade.
- Se for uma desculpa, zoe de leve (ex: detetive de rede social, emocionado, gado, desculpa esfarrapada).
- Responda em 1 ou 2 frases no máximo, mantendo o tom divertido sem ofensas reais.
    `.trim();

    try {
      const iaReaction = await askAI({ prompt: promptIa, userId });
      await userMsg.reply({
        content: `🎭 **Análise da Natasha:**\n${iaReaction}`,
      });
      addCoins(userId, 50);
    } catch {
      await userMsg.reply("KKKK essa resposta me pegou de surpresa! Boa sinceridade. 😂 (+50 moedas)");
    }
  });

  msgCollector.on("end", (collected, reason) => {
    if (reason === "time" && activeVdGames.has(sessionKey)) {
      activeVdGames.delete(sessionKey);
      message.channel.send(`⏰ <@${userId}> demorou demais para responder a verdade! Pipocou na rodada! 🐔`);
    }
  });
}

// ==============================================================
// 🔴 MODO DESAFIO (COM CRONÔMETRO REAL E ANÁLISE DE PRINTS/CÓDIGO)
// ==============================================================
async function startDareRound({ message, userId, sessionKey, targetMessage = null }) {
  const challenge = DARE_CHALLENGES[Math.floor(Math.random() * DARE_CHALLENGES.length)];
  const duration = challenge.duration;

  let remaining = duration;
  activeVdGames.set(sessionKey, { status: "in_challenge", challenge });

  const getDareEmbed = (rem) =>
    new EmbedBuilder()
      .setColor("#E74C3C")
      .setTitle(`🔴 DESAFIO: ${challenge.title}`)
      .setDescription(
        `👤 **Desafiado:** <@${userId}>\n\n` +
        `🎯 **Missão:**\n${challenge.text}\n\n` +
        `⏱️ **Cronômetro:**\n${buildProgressBar(rem, duration)}\n\n` +
        (challenge.requiresImage
          ? `📸 **Atenção:** Envie o **PRINT/IMAGEM** anexado aqui no canal antes ou logo após o tempo zerar!`
          : `💬 **Atenção:** Cumpra o desafio enviando a mensagem no chat!`)
      )
      .setFooter({ text: `Recompensa: +🪙 ${challenge.rewardCoins} moedas e +⭐ ${challenge.rewardXp} XP` });

  if (targetMessage) {
    await targetMessage.edit({ embeds: [getDareEmbed(remaining)], components: [] });
  } else {
    targetMessage = await message.reply({ embeds: [getDareEmbed(remaining)] });
  }

  // Cronômetro em tempo real atualizando o mesmo Embed a cada 5s
  const timerInterval = setInterval(async () => {
    remaining -= 5;
    if (remaining > 0) {
      targetMessage.edit({ embeds: [getDareEmbed(remaining)] }).catch(() => null);
    } else {
      clearInterval(timerInterval);
      const finishEmbed = new EmbedBuilder()
        .setColor("#F39C12")
        .setTitle("🏁 TEMPO ESGOTADO DO DESAFIO!")
        .setDescription(
          `⏱️ Acabou o tempo de criação, <@${userId}>!\n\n` +
          (challenge.requiresImage
            ? `📸 **Estou aguardando seu print/imagem agora!** Envie o anexo aqui no chat para eu avaliar o que você fez.`
            : `💬 Mande sua conclusão aqui no chat para avaliação!`)
        );
      targetMessage.edit({ embeds: [finishEmbed] }).catch(() => null);
    }
  }, 5000);

  // Coletor de resposta (Texto ou Imagem/Print)
  const dareCollector = message.channel.createMessageCollector({
    filter: (m) => m.author.id === userId && !m.content.startsWith(PREFIX),
    time: (duration + 60) * 1000,
    max: 1,
  });

  dareCollector.on("collect", async (userMsg) => {
    clearInterval(timerInterval);
    activeVdGames.delete(sessionKey);

    const attachment = userMsg.attachments.first();

    // 1. Desafio com Print / Imagem Real
    if (challenge.requiresImage) {
      if (!attachment || !attachment.contentType?.startsWith("image/")) {
        return await userMsg.reply("⚠️ Você mandou apenas texto! O desafio exigia o **PRINT/FOTO** da tela. Desafio não computado! 😅");
      }

      await message.channel.sendTyping();

      const promptAnalise = `
Você é a Natasha avaliando o PRINT que o usuário mandou no desafio "${challenge.title}".
Analise a imagem enviada com seus olhos de IA:
- Se houver código/editor aberto: identifique a linguagem, o que o código faz, comente se parece funcional ou se faltou algo.
- Se for setup/ambiente: elogie ou faça uma zoeira saudável com a arrumação.
- Dê uma classificação final (Ex: "🏆 EXCELENTE", "🔥 MANDOU MUITO BEM", "🟡 QUASE LÁ").
- Seja natural, divertida e honesta sobre o que realmente dá para ver no print. Em 2 a 4 frases.
      `.trim();

      try {
        const iaReview = await askAI({
          prompt: promptAnalise,
          userId,
          attachment: { url: attachment.url, contentType: attachment.contentType },
        });

        addCoins(userId, challenge.rewardCoins);

        const resultEmbed = new EmbedBuilder()
          .setColor("#2ECC71")
          .setTitle("📸 AVALIAÇÃO DE DESAFIO CONCLUÍDA!")
          .setDescription(`${iaReview}\n\n🎉 **Recompensas Recebidas:**\n🪙 \`+${challenge.rewardCoins} NatashaCoins\`\n⭐ \`+${challenge.rewardXp} XP\``)
          .setThumbnail(attachment.url);

        await userMsg.reply({ embeds: [resultEmbed] });
      } catch (err) {
        await userMsg.reply(`🔥 Vi seu print aqui! Mandou bem demais na correria do tempo! (+${challenge.rewardCoins} moedas entregues)`);
      }
      return;
    }

    // 2. Desafio Textual / Voz
    await message.channel.sendTyping();
    const promptText = `
O usuário tentou cumprir o desafio: "${challenge.text}".
Ele enviou: "${userMsg.content}".
Analise se ele cumpriu a regra e responda com humor e personalidade em 2 frases.
    `.trim();

    try {
      const iaReply = await askAI({ prompt: promptText, userId });
      addCoins(userId, challenge.rewardCoins);
      await userMsg.reply(`🎉 **Resultado:**\n${iaReply}\n\n🪙 \`+${challenge.rewardCoins} moedas\` adicionadas!`);
    } catch {
      await userMsg.reply(`Boa! Desafio concluído com sucesso! (+${challenge.rewardCoins} moedas)`);
    }
  });

  dareCollector.on("end", (collected, reason) => {
    clearInterval(timerInterval);
    if (reason === "time" && activeVdGames.has(sessionKey)) {
      activeVdGames.delete(sessionKey);
      message.channel.send(`⏰ <@${userId}> não enviou a comprovação do desafio a tempo! Ficou com medo? 😂`);
    }
  });
}
