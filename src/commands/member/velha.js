import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";

export const activeTicTacToeGames = new Map();

function buildBoardRows(board, disabled = false) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder();
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const cell = board[idx];
      const btn = new ButtonBuilder()
        .setCustomId(`tictactoe_${idx}`)
        .setStyle(cell === "❌" ? ButtonStyle.Danger : cell === "⭕" ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setLabel(cell === " " ? "⠀" : cell)
        .setDisabled(disabled || cell !== " ");
      row.addComponents(btn);
    }
    rows.push(row);
  }
  return rows;
}

function checkWinner(b, p) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some((combo) => combo.every((i) => b[i] === p));
}

export default {
  name: "velha",
  description: "Desafie um amigo para uma partida de Jogo da Velha com botões",
  commands: ["tictactoe", "jogodavelha"],
  usage: `${PREFIX}velha <@membro>`,
  handle: async ({ message, reply, sendReact }) => {
    const opponent = message.mentions.users.first();
    if (!opponent) return await reply(`Marque alguém para jogar!\n*Exemplo:* \`${PREFIX}velha @amigo\``);
    if (opponent.id === message.author.id) return await reply("Você não pode jogar contra você mesmo!");

    await sendReact("🎲");

    const game = {
      board: Array(9).fill(" "),
      turn: "❌",
      p1: message.author,
      p2: opponent,
    };

    const embed = new EmbedBuilder()
      .setColor("#FF007F")
      .setTitle("🎮 Jogo da Velha: Desafio Aceito!")
      .setDescription(`❌ **${game.p1.username}** vs ⭕ **${game.p2.username}**\n\n👉 **Vez de:** <@${game.p1.id}> (❌)`)
      .setFooter({ text: "Clique nos botões abaixo para jogar!" });

    const rows = buildBoardRows(game.board);
    const msg = await message.reply({ embeds: [embed], components: rows });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.customId.startsWith("tictactoe_") && [game.p1.id, game.p2.id].includes(i.user.id),
      time: 90000,
    });

    collector.on("collect", async (i) => {
      const currentExpected = game.turn === "❌" ? game.p1.id : game.p2.id;
      if (i.user.id !== currentExpected) {
        return await i.reply({ content: "⏳ Espere sua vez de jogar!", ephemeral: true });
      }

      const idx = parseInt(i.customId.split("_")[1], 10);
      game.board[idx] = game.turn;

      if (checkWinner(game.board, game.turn)) {
        collector.stop("win");
        const winner = game.turn === "❌" ? game.p1 : game.p2;
        const winEmbed = new EmbedBuilder()
          .setColor("#2ECC71")
          .setTitle("🎉 Vitória no Jogo da Velha!")
          .setDescription(`🏆 Parabéns <@${winner.id}> (${game.turn}), você venceu a partida!`);
        return await i.update({ embeds: [winEmbed], components: buildBoardRows(game.board, true) });
      }

      if (!game.board.includes(" ")) {
        collector.stop("draw");
        const drawEmbed = new EmbedBuilder()
          .setColor("#F1C40F")
          .setTitle("🤝 Empate (Deu Velha)!")
          .setDescription("Nenhum dos jogadores conseguiu a trinca.");
        return await i.update({ embeds: [drawEmbed], components: buildBoardRows(game.board, true) });
      }

      game.turn = game.turn === "❌" ? "⭕" : "❌";
      const nextUser = game.turn === "❌" ? game.p1 : game.p2;

      embed.setDescription(`❌ **${game.p1.username}** vs ⭕ **${game.p2.username}**\n\n👉 **Vez de:** <@${nextUser.id}> (${game.turn})`);
      await i.update({ embeds: [embed], components: buildBoardRows(game.board) });
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        await msg.edit({ content: "⏰ Tempo limite da partida esgotado!", components: buildBoardRows(game.board, true) }).catch(() => null);
      }
    });
  },
};
