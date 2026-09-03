import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { addCoins } from "../../utils/usersManager.js";
import { getRPGPlayer, saveRPGPlayer, applyExp } from "../../tools/rpgEngine.js";

// Símbolos visuais do tabuleiro no Discord
const TILES = {
  FLOOR: "⬛",
  WALL: "🧱",
  PLAYER: "🧙",
  BOX: "📦",
  DEST: "🎯",
  BOX_ON_DEST: "✨",
  PLAYER_ON_DEST: "🧙",
};

// Mapas clássicos do Sokoban (W = Parede, P = Player, B = Caixa, D = Destino, _ = Chão)
const LEVELS = [
  {
    id: 1,
    title: "Nível 1: Primeiro Desafio",
    rewardCoins: 50,
    rewardExp: 30,
    grid: [
      ["W", "W", "W", "W", "W", "W"],
      ["W", "P", "_", "B", "D", "W"],
      ["W", "_", "_", "_", "_", "W"],
      ["W", "W", "W", "W", "W", "W"],
    ],
  },
  {
    id: 2,
    title: "Nível 2: Duas Caixas",
    rewardCoins: 100,
    rewardExp: 60,
    grid: [
      ["W", "W", "W", "W", "W", "W", "W"],
      ["W", "D", "_", "B", "_", "P", "W"],
      ["W", "D", "_", "B", "_", "_", "W"],
      ["W", "W", "W", "W", "W", "W", "W"],
    ],
  },
  {
    id: 3,
    title: "Nível 3: Labirinto Clássico",
    rewardCoins: 180,
    rewardExp: 100,
    grid: [
      ["W", "W", "W", "W", "W", "W", "W"],
      ["W", "_", "D", "W", "P", "_", "W"],
      ["W", "_", "B", "_", "B", "_", "W"],
      ["W", "_", "D", "_", "_", "_", "W"],
      ["W", "W", "W", "W", "W", "W", "W"],
    ],
  },
];

const activeSokoban = new Map();

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function findPlayer(grid) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === "P" || grid[y][x] === "PD") {
        return { x, y };
      }
    }
  }
  return null;
}

function checkVictory(grid, initialLevel) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (initialLevel.grid[y][x] === "D" && grid[y][x] !== "BD") {
        return false;
      }
    }
  }
  return true;
}

function renderBoard(grid, initialLevel) {
  let display = "";
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      const isInitialDest = initialLevel.grid[y][x] === "D";

      if (cell === "W") display += TILES.WALL;
      else if (cell === "P") display += TILES.PLAYER;
      else if (cell === "PD") display += TILES.PLAYER_ON_DEST;
      else if (cell === "B") display += TILES.BOX;
      else if (cell === "BD") display += TILES.BOX_ON_DEST;
      else if (isInitialDest) display += TILES.DEST;
      else display += TILES.FLOOR;
    }
    display += "\n";
  }
  return display;
}

function move(grid, initialLevel, dx, dy) {
  const p = findPlayer(grid);
  if (!p) return false;

  const targetX = p.x + dx;
  const targetY = p.y + dy;

  // Limites da matriz
  if (targetY < 0 || targetY >= grid.length || targetX < 0 || targetX >= grid[0].length) {
    return false;
  }

  const targetCell = grid[targetY][targetX];

  // Parede bloqueia
  if (targetCell === "W") return false;

  // Movimento para espaço vazio ou destino livre
  if (targetCell === "_" || targetCell === "D") {
    grid[p.y][p.x] = initialLevel.grid[p.y][p.x] === "D" ? "D" : "_";
    grid[targetY][targetX] = initialLevel.grid[targetY][targetX] === "D" ? "PD" : "P";
    return true;
  }

  // Empurrar caixa (B ou BD)
  if (targetCell === "B" || targetCell === "BD") {
    const boxTargetX = targetX + dx;
    const boxTargetY = targetY + dy;

    if (boxTargetY < 0 || boxTargetY >= grid.length || boxTargetX < 0 || boxTargetX >= grid[0].length) {
      return false;
    }

    const boxTargetCell = grid[boxTargetY][boxTargetX];
    if (boxTargetCell === "W" || boxTargetCell === "B" || boxTargetCell === "BD") {
      return false; // Não empurra duas caixas nem empurra na parede
    }

    // Move a caixa
    grid[boxTargetY][boxTargetX] = initialLevel.grid[boxTargetY][boxTargetX] === "D" ? "BD" : "B";

    // Move o player
    grid[p.y][p.x] = initialLevel.grid[p.y][p.x] === "D" ? "D" : "_";
    grid[targetY][targetX] = initialLevel.grid[targetY][targetX] === "D" ? "PD" : "P";
    return true;
  }

  return false;
}

export default {
  name: "sokoban",
  description: "Jogue o clássico quebra-cabeça Sokoban com botões direcionais no Discord",
  category: "games",
  commands: ["sokobot", "caixas", "empurrarcaixa"],
  usage: `${PREFIX}sokoban [nivel 1-3]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const userId = message.author.id;
    const levelIdx = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(args[0], 10) || 1) - 1));
    const selectedLevel = LEVELS[levelIdx];

    if (activeSokoban.has(userId)) {
      return await reply("⚠️ Você já está com uma partida de Sokoban em andamento neste canal!");
    }

    await sendReact?.("📦");

    const gameState = {
      level: selectedLevel,
      currentGrid: cloneGrid(selectedLevel.grid),
      moves: 0,
    };

    activeSokoban.set(userId, gameState);

    const buildEmbed = (isVictory = false) => {
      const boardStr = renderBoard(gameState.currentGrid, gameState.level);
      return new EmbedBuilder()
        .setColor(isVictory ? "#2ECC71" : "#FF007F")
        .setTitle(`📦 SOKOBAN — ${gameState.level.title}`)
        .setDescription(
          `${boardStr}\n` +
          `🧙 **Jogador:** <@${userId}> | 👟 **Passos:** \`${gameState.moves}\`\n\n` +
          `🎯 **Objetivo:** Empurre as caixas (\`📦\`) até os alvos (\`🎯\`)!\n` +
          (isVictory ? `\n🎉 **Fase concluída com perfeição!**` : "")
        )
        .setFooter({ text: "Use os botões abaixo para mover o personagem ou reiniciar" });
    };

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("soko_none").setLabel("⠀").setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId("soko_up").setEmoji("⬆️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("soko_reset").setEmoji("🔄").setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("soko_left").setEmoji("⬅️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("soko_down").setEmoji("⬇️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("soko_right").setEmoji("➡️").setStyle(ButtonStyle.Primary)
    );

    const gameMsg = await message.reply({ embeds: [buildEmbed(false)], components: [row1, row2] });

    const collector = gameMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === userId && i.customId.startsWith("soko_"),
      time: 120000,
    });

    collector.on("collect", async (i) => {
      const action = i.customId;

      if (action === "soko_reset") {
        gameState.currentGrid = cloneGrid(gameState.level.grid);
        gameState.moves = 0;
        return await i.update({ embeds: [buildEmbed(false)] });
      }

      let moved = false;
      if (action === "soko_up") moved = move(gameState.currentGrid, gameState.level, 0, -1);
      if (action === "soko_down") moved = move(gameState.currentGrid, gameState.level, 0, 1);
      if (action === "soko_left") moved = move(gameState.currentGrid, gameState.level, -1, 0);
      if (action === "soko_right") moved = move(gameState.currentGrid, gameState.level, 1, 0);

      if (moved) gameState.moves++;

      if (checkVictory(gameState.currentGrid, gameState.level)) {
        collector.stop("victory");
        activeSokoban.delete(userId);

        addCoins(userId, gameState.level.rewardCoins);
        const rpg = getRPGPlayer(userId, message.author.username);
        const up = applyExp(rpg, gameState.level.rewardExp);
        saveRPGPlayer(userId, rpg);

        const winEmbed = buildEmbed(true).setDescription(
          `${renderBoard(gameState.currentGrid, gameState.level)}\n` +
          `🏆 **PARABÉNS! VOCÊ DESVENDOU O SOKOBAN!**\n\n` +
          `👟 **Total de Movimentos:** \`${gameState.moves}\`\n` +
          `🪙 **Recompensa:** \`🪙 +${gameState.level.rewardCoins} NatashaCoins\`\n` +
          `🌟 **EXP:** \`+${gameState.level.rewardExp} EXP\`\n` +
          (up ? `\n🎉 **LEVEL UP!** Você subiu para o Nível **${rpg.level}**!` : "")
        );

        return await i.update({ embeds: [winEmbed], components: [] });
      }

      await i.update({ embeds: [buildEmbed(false)] });
    });

    collector.on("end", async (_, reason) => {
      activeSokoban.delete(userId);
      if (reason === "time") {
        await gameMsg.edit({ content: "⏰ Tempo limite esgotado no Sokoban!", components: [] }).catch(() => null);
      }
    });
  },
};
