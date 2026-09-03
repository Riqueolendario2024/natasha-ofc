import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { addCoins } from "../../utils/usersManager.js";

const activeBingos = new Map();

function generateCard() {
  const numbers = new Set();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 30) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

export default {
  name: "bingo",
  description: "Inicia uma rodada comunitária de Bingo no servidor",
  category: "games",
  commands: ["jogarbingo"],
  usage: `${PREFIX}bingo`,
  handle: async ({ message, reply, sendReact }) => {
    const channelId = message.channel.id;

    if (activeBingos.has(channelId)) {
      return await reply("⚠️ Já existe um Bingo em andamento neste canal!");
    }

    await sendReact?.("🎱");

    const game = {
      players: new Map(), // userId -> { name, card: [nums], marked: Set() }
      drawnNumbers: new Set(),
      status: "lobby",
      prize: 200,
    };

    activeBingos.set(channelId, game);

    const lobbyEmbed = () => {
      const pList = Array.from(game.players.values()).map((p, i) => `**${i + 1}.** 🎟️ ${p.name}`).join("\n");
      return new EmbedBuilder()
        .setColor("#9B59B6")
        .setTitle("🎱 BINGO DA NATASHA — LOBBY ABERTO")
        .setDescription(
          `Prêmio: **🪙 ${game.prize} NatashaCoins**!\n` +
          `Cada jogador receberá uma cartela de 5 números.\n\n` +
          `👥 **Jogadores Inscritos (${game.players.size}):**\n${pList || "_Nenhum jogador ainda..._"}\n\n` +
          `_Clique no botão abaixo para pegar sua cartela gratuita!_`
        );
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("bingo_join").setLabel("Pegar Cartela").setEmoji("🎟️").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("bingo_start").setLabel("Iniciar Sorteio").setEmoji("🎱").setStyle(ButtonStyle.Primary)
    );

    const mainMsg = await message.reply({ embeds: [lobbyEmbed()], components: [row] });

    const collector = mainMsg.createMessageComponentCollector({
      filter: (i) => ["bingo_join", "bingo_start"].includes(i.customId),
      time: 25000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "bingo_join") {
        if (game.players.has(i.user.id)) return await i.reply({ content: "Você já pegou sua cartela!", ephemeral: true });

        const card = generateCard();
        game.players.set(i.user.id, { name: i.user.username, card, marked: new Set() });
        await i.reply({ content: `🎟️ **Sua Cartela Gerada:** \`[ ${card.join(" - ")} ]\``, ephemeral: true });
        await mainMsg.edit({ embeds: [lobbyEmbed()] });
      }

      if (i.customId === "bingo_start") {
        if (game.players.size < 1) return await i.reply({ content: "É necessário ao menos 1 jogador!", ephemeral: true });
        collector.stop("start");
      }
    });

    collector.on("end", async () => {
      if (game.players.size === 0) {
        activeBingos.delete(channelId);
        return await mainMsg.edit({ content: "⏰ Bingo cancelado por falta de participantes!", components: [] });
      }

      await mainMsg.edit({ components: [] });
      startBingoDrawing(game, message.channel, mainMsg);
    });
  },
};

async function startBingoDrawing(game, channel, mainMsg) {
  let winner = null;

  const interval = setInterval(async () => {
    // Sorteia número entre 1 e 30
    let num;
    do {
      num = Math.floor(Math.random() * 30) + 1;
    } while (game.drawnNumbers.has(num) && game.drawnNumbers.size < 30);

    game.drawnNumbers.add(num);

    // Marca cartelas dos participantes
    for (const [id, player] of game.players.entries()) {
      if (player.card.includes(num)) {
        player.marked.add(num);
      }
      if (player.marked.size === player.card.length) {
        winner = { id, ...player };
        break;
      }
    }

    const embed = new EmbedBuilder()
      .setColor("#9B59B6")
      .setTitle("🎱 BINGO DA NATASHA — GLOBO GIRANDO!")
      .setDescription(
        `💥 **ÚLTIMA PEDRA SORTEADA:** 🔴 \`[ ${num} ]\` 🔴\n\n` +
        `📜 **Pedras já sorteadas:** ${Array.from(game.drawnNumbers).join(", ")}\n\n` +
        `_Verificando cartelas dos participantes..._`
      );

    if (winner) {
      clearInterval(interval);
      activeBingos.delete(channel.id);
      addCoins(winner.id, game.prize);

      const winEmbed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle("🎉🎉 BIIINGO! TEMOS UM VENCEDOR! 🎉🎉")
        .setDescription(
          `🏆 **Ganhador(a):** <@${winner.id}>\n` +
          `🎟️ **Cartela Completa:** \`[ ${winner.card.join(" - ")} ]\`\n` +
          `💰 **Prêmio:** \`🪙 +${game.prize} NatashaCoins\`!`
        );

      return await mainMsg.edit({ embeds: [winEmbed] }).catch(() => null);
    }

    await mainMsg.edit({ embeds: [embed] }).catch(() => null);
  }, 3500);
}
