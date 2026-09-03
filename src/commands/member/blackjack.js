import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { getCoins, addCoins, removeCoins } from "../../utils/usersManager.js";

const activeBlackjack = new Map();

function drawCard() {
  const cards = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const suits = ["♠️", "♥️", "♦️", "♣️"];
  const card = cards[Math.floor(Math.random() * cards.length)];
  const suit = suits[Math.floor(Math.random() * suits.length)];
  return { card, suit, str: `${card}${suit}` };
}

function calculateHand(hand) {
  let score = 0;
  let aces = 0;

  for (const c of hand) {
    if (["J", "Q", "K"].includes(c.card)) score += 10;
    else if (c.card === "A") {
      score += 11;
      aces++;
    } else {
      score += parseInt(c.card, 10);
    }
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

export default {
  name: "blackjack",
  description: "Jogue 21 clássico contra a Natasha com botões interativos de Hit e Stand",
  category: "games",
  commands: ["21", "bj", "hit", "stand"],
  usage: `${PREFIX}blackjack <aposta>`,
  handle: async ({ message, args, reply, sendReact }) => {
    const userId = message.author.id;
    const aposta = parseInt(args[0], 10);
    const saldo = getCoins(userId);

    if (isNaN(aposta) || aposta <= 0) {
      return await reply(`Informe o valor da aposta!\n*Exemplo:* \`${PREFIX}blackjack 100\``);
    }

    if (saldo < aposta) return await reply(`❌ Saldo insuficiente! Você possui apenas \`🪙 ${saldo} coins\`.`);
    if (activeBlackjack.has(userId)) return await reply("⚠️ Você já está com uma mesa de 21 aberta!");

    await sendReact?.("🃏");
    removeCoins(userId, aposta);

    const playerHand = [drawCard(), drawCard()];
    const botHand = [drawCard(), drawCard()];

    const game = { userId, aposta, playerHand, botHand };
    activeBlackjack.set(userId, game);

    const renderTable = (showAll = false) => {
      const pScore = calculateHand(game.playerHand);
      const bScore = calculateHand(showAll ? game.botHand : [game.botHand[0]]);

      const pCards = game.playerHand.map((c) => `\`${c.str}\``).join(" ");
      const bCards = showAll
        ? game.botHand.map((c) => `\`${c.str}\``).join(" ")
        : `\`${game.botHand[0].str}\` \`🎴 [Oculta]\``;

      return new EmbedBuilder()
        .setColor("#2C3E50")
        .setTitle("🃏 MESA DE BLACKJACK (21) — NATASHA")
        .setDescription(
          `💰 **Aposta:** \`🪙 ${game.aposta} coins\`\n\n` +
          `🤖 **Mão da Natasha:** (${showAll ? bScore : "?"} pts)\n${bCards}\n\n` +
          `🧙 **Sua Mão:** (${pScore} pts)\n${pCards}\n\n` +
          `_Escolha pedir mais carta (Hit) ou parar (Stand)!_`
        );
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("bj_hit").setLabel("Hit (Pedir Carta)").setEmoji("🃏").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("bj_stand").setLabel("Stand (Parar)").setEmoji("🛑").setStyle(ButtonStyle.Danger)
    );

    const msg = await message.reply({ embeds: [renderTable(false)], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === userId && ["bj_hit", "bj_stand"].includes(i.customId),
      time: 60000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "bj_hit") {
        game.playerHand.push(drawCard());
        const pScore = calculateHand(game.playerHand);

        if (pScore > 21) {
          collector.stop("bust");
          activeBlackjack.delete(userId);
          const bustEmbed = renderTable(true)
            .setColor("#C0392B")
            .setTitle("💥 BUST! VOCÊ ESTOUROU OS 21 PONTOS!")
            .setDescription(`Você atingiu **${pScore} pontos** e perdeu a aposta de \`🪙 ${game.aposta} coins\`.`);
          return await i.update({ embeds: [bustEmbed], components: [] });
        }

        await i.update({ embeds: [renderTable(false)] });
      }

      if (i.customId === "bj_stand") {
        collector.stop("stand");
        activeBlackjack.delete(userId);

        // Turno da Natasha
        while (calculateHand(game.botHand) < 17) {
          game.botHand.push(drawCard());
        }

        const pScore = calculateHand(game.playerHand);
        const bScore = calculateHand(game.botHand);

        let finalEmbed;
        if (bScore > 21 || pScore > bScore) {
          const winAmount = game.aposta * 2;
          addCoins(userId, winAmount);
          finalEmbed = renderTable(true)
            .setColor("#2ECC71")
            .setTitle("🎉 VOCÊ VENCEU O 21!")
            .setDescription(`Sua mão: **${pScore}** vs Natasha: **${bScore}**.\nGanhou: \`🪙 +${winAmount} coins\`!`);
        } else if (pScore === bScore) {
          addCoins(userId, game.aposta);
          finalEmbed = renderTable(true)
            .setColor("#F1C40F")
            .setTitle("🤝 EMPATE (PUSH)!")
            .setDescription(`Ambos fizeram **${pScore} pontos**. Sua aposta de \`🪙 ${game.aposta} coins\` foi devolvida.`);
        } else {
          finalEmbed = renderTable(true)
            .setColor("#C0392B")
            .setTitle("😢 A NATASHA VENCEU A MESA!")
            .setDescription(`Natasha: **${bScore}** vs Você: **${pScore}**.\nVocê perdeu \`🪙 ${game.aposta} coins\`.`);
        }

        await i.update({ embeds: [finalEmbed], components: [] });
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        activeBlackjack.delete(userId);
        await msg.edit({ content: "⏰ Tempo esgotado na mesa de 21!", components: [] }).catch(() => null);
      }
    });
  },
};
