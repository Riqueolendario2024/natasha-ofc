import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { initGame, drawSolitaireBoard } from "../../tools/solitaireEngine.js";
import { addCoins } from "../../utils/usersManager.js";
import { getRPGPlayer, saveRPGPlayer, applyExp } from "../../tools/rpgEngine.js";

const activeGames = new Map();

function checkVictory(game) {
  let total = 0;
  for (const n in game.foundations) {
    total += game.foundations[n].length;
  }
  return total === 52;
}

export default {
  name: "paciencia",
  description: "Jogue o clássico Paciência (Solitaire) estilo Windows XP com cartas reais em PNG",
  category: "games",
  commands: ["solitaire", "klondike", "cartas"],
  usage: `${PREFIX}paciencia [comprar | mover <origem> <destino> | base <origem> | auto | reiniciar]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const userId = message.author.id;
    const action = args[0]?.toLowerCase();

    // 1. Iniciar ou Reiniciar Partida
    if (!activeGames.has(userId) || action === "reiniciar" || action === "novo") {
      await sendReact?.("🃏");
      const game = initGame();
      activeGames.set(userId, game);

      const buffer = await drawSolitaireBoard(game);
      const attachment = new AttachmentBuilder(buffer, { name: "paciencia.png" });

      const embed = new EmbedBuilder()
        .setColor("#0E6B2C")
        .setTitle("🃏 PACIÊNCIA RETRÔ — WINDOWS SOLITAIRE (PNG)")
        .setImage("attachment://paciencia.png")
        .setDescription(
          `Jogo iniciado para <@${userId}> com o baralho oficial em PNG!\n\n` +
          `• \`${PREFIX}paciencia c\` — Puxa carta do monte de compras\n` +
          `• \`${PREFIX}paciencia m <col1> <col2>\` — Move cartas entre colunas (ex: \`${PREFIX}paciencia m 1 2\`)\n` +
          `• \`${PREFIX}paciencia m d <col>\` — Move carta do descarte para uma coluna (ex: \`${PREFIX}paciencia m d 3\`)\n` +
          `• \`${PREFIX}paciencia b <col | d>\` — Envia carta para a Base/Fundação\n` +
          `• \`${PREFIX}paciencia auto\` — Envia automaticamente cartas elegíveis para as bases`
        )
        .setFooter({ text: "Natasha Solitaire Engine • Texturas Oficiais" });

      return await message.reply({ embeds: [embed], files: [attachment] });
    }

    const game = activeGames.get(userId);

    // 2. Ação: Comprar (Puxar carta do monte)
    if (action === "c" || action === "comprar" || action === "monte") {
      if (game.stock.length > 0) {
        const card = game.stock.pop();
        card.faceUp = true;
        game.waste.push(card);
      } else {
        game.stock = game.waste.reverse().map((c) => {
          c.faceUp = false;
          return c;
        });
        game.waste = [];
      }
      game.moves++;
    }

    // 3. Ação: Mover para a Base / Fundação (b <col | d>)
    else if (action === "b" || action === "base") {
      const from = args[1]?.toLowerCase();
      let cardToMove = null;
      let fromCol = null;

      if (from === "d" || from === "descarte") {
        if (game.waste.length > 0) cardToMove = game.waste[game.waste.length - 1];
      } else {
        const colIdx = parseInt(from, 10) - 1;
        if (colIdx >= 0 && colIdx < 7 && game.tableau[colIdx].length > 0) {
          fromCol = colIdx;
          cardToMove = game.tableau[colIdx][game.tableau[colIdx].length - 1];
        }
      }

      if (!cardToMove || !cardToMove.faceUp) return await reply("Nenhuma carta válida aberta para enviar para a base!");

      const foundationPile = game.foundations[cardToMove.naipeCode];
      const targetVal = foundationPile.length + 1;

      if (cardToMove.valNum === targetVal) {
        if (fromCol !== null) {
          game.tableau[fromCol].pop();
          if (game.tableau[fromCol].length > 0) {
            game.tableau[fromCol][game.tableau[fromCol].length - 1].faceUp = true;
          }
        } else {
          game.waste.pop();
        }
        foundationPile.push(cardToMove);
        game.moves++;
      } else {
        return await reply(`A carta **${cardToMove.valStr}${cardToMove.naipe}** não encaixa na base agora (esperado: valor ${targetVal})!`);
      }
    }

    // 4. Ação: Mover entre Colunas (m <de> <para>)
    else if (action === "m" || action === "mover") {
      const from = args[1]?.toLowerCase();
      const to = parseInt(args[2], 10) - 1;

      if (isNaN(to) || to < 0 || to >= 7) {
        return await reply(`Coluna de destino inválida! Escolha de 1 a 7.`);
      }

      const targetCol = game.tableau[to];
      const targetTop = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;

      // Mover do Descarte para Coluna
      if (from === "d" || from === "descarte") {
        if (game.waste.length === 0) return await reply("O descarte está vazio!");
        const wasteCard = game.waste[game.waste.length - 1];

        const canPlace =
          (!targetTop && wasteCard.valNum === 13) ||
          (targetTop && targetTop.color !== wasteCard.color && targetTop.valNum === wasteCard.valNum + 1);

        if (canPlace) {
          targetCol.push(game.waste.pop());
          game.moves++;
        } else {
          return await reply("Movimento inválido! As cores devem alternar e o valor ser 1 menor (Reis vão em colunas vazias).");
        }
      } else {
        // Mover de Coluna para Coluna
        const fromColIdx = parseInt(from, 10) - 1;
        if (isNaN(fromColIdx) || fromColIdx < 0 || fromColIdx >= 7 || fromColIdx === to) {
          return await reply("Coluna de origem inválida!");
        }

        const sourceCol = game.tableau[fromColIdx];
        const openIdx = sourceCol.findIndex((c) => c.faceUp);
        if (openIdx === -1) return await reply("Nenhuma carta aberta nessa coluna!");

        let splitIdx = -1;
        for (let i = openIdx; i < sourceCol.length; i++) {
          const card = sourceCol[i];
          const canPlace =
            (!targetTop && card.valNum === 13) ||
            (targetTop && targetTop.color !== card.color && targetTop.valNum === card.valNum + 1);
          if (canPlace) {
            splitIdx = i;
            break;
          }
        }

        if (splitIdx !== -1) {
          const movingCards = sourceCol.splice(splitIdx);
          targetCol.push(...movingCards);
          if (sourceCol.length > 0) sourceCol[sourceCol.length - 1].faceUp = true;
          game.moves++;
        } else {
          return await reply("Nenhuma carta dessa coluna encaixa na coluna de destino!");
        }
      }
    }

    // 5. Ação: Auto
    else if (action === "auto") {
      let movedAny = false;
      let changed = true;

      while (changed) {
        changed = false;
        if (game.waste.length > 0) {
          const wc = game.waste[game.waste.length - 1];
          if (wc.valNum === game.foundations[wc.naipeCode].length + 1) {
            game.foundations[wc.naipeCode].push(game.waste.pop());
            changed = true;
            movedAny = true;
            game.moves++;
          }
        }
        for (let c = 0; c < 7; c++) {
          const col = game.tableau[c];
          if (col.length > 0) {
            const tc = col[col.length - 1];
            if (tc.faceUp && tc.valNum === game.foundations[tc.naipeCode].length + 1) {
              game.foundations[tc.naipeCode].push(col.pop());
              if (col.length > 0) col[col.length - 1].faceUp = true;
              changed = true;
              movedAny = true;
              game.moves++;
            }
          }
        }
      }

      if (!movedAny) return await reply("Nenhuma carta pode ser enviada para as bases no momento.");
    } else {
      return await reply(
        `📌 **Comandos do Paciência:**\n` +
        `• \`${PREFIX}paciencia c\` (Compra carta)\n` +
        `• \`${PREFIX}paciencia m 1 2\` (Move da Coluna 1 para a 2)\n` +
        `• \`${PREFIX}paciencia m d 4\` (Move do Descarte para a Coluna 4)\n` +
        `• \`${PREFIX}paciencia b 3\` (Envia da Coluna 3 para a Base)\n` +
        `• \`${PREFIX}paciencia auto\` (Auto-completar cartas nas bases)\n` +
        `• \`${PREFIX}paciencia reiniciar\` (Começa um novo jogo)`
      );
    }

    // Verifica Vitória
    if (checkVictory(game)) {
      activeGames.delete(userId);
      const rewardCoins = 600;
      const rewardExp = 350;

      addCoins(userId, rewardCoins);
      const rpg = getRPGPlayer(userId, message.author.username);
      const up = applyExp(rpg, rewardExp);
      saveRPGPlayer(userId, rpg);

      const buffer = await drawSolitaireBoard(game);
      const attachment = new AttachmentBuilder(buffer, { name: "vitoria.png" });

      const winEmbed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("🎉🎉 VITÓRIA ESPETACULAR NO PACIÊNCIA! 🎉🎉")
        .setImage("attachment://vitoria.png")
        .setDescription(
          `🏆 Você organizou todas as cartas de Ás a Rei e zerou a mesa!\n\n` +
          `👟 **Total de Movimentos:** \`${game.moves}\`\n` +
          `💰 **Recompensa:** \`🪙 +${rewardCoins} NatashaCoins\`\n` +
          `🌟 **EXP:** \`+${rewardExp} EXP\`\n` +
          (up ? `\n🎉 **LEVEL UP NO RPG!** Nível **${rpg.level}** alcançado!` : "")
        );

      return await message.reply({ embeds: [winEmbed], files: [attachment] });
    }

    // Renderiza Mesa com os PNGs reais
    const buffer = await drawSolitaireBoard(game);
    const attachment = new AttachmentBuilder(buffer, { name: "paciencia.png" });

    const embed = new EmbedBuilder()
      .setColor("#0E6B2C")
      .setTitle("🃏 PACIÊNCIA RETRÔ — MESA ATUALIZADA")
      .setImage("attachment://paciencia.png")
      .setFooter({ text: `Movimentos: ${game.moves} • Use !paciencia para jogar` });

    await message.reply({ embeds: [embed], files: [attachment] });
  },
};
