import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getCoins, addCoins, removeCoins } from "../../utils/usersManager.js";

const CORES = {
  vermelho: { mult: 2, nums: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36], emoji: "🔴" },
  preto: { mult: 2, nums: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35], emoji: "⚫" },
  verde: { mult: 14, nums: [0], emoji: "🟢" },
};

export default {
  name: "cassino-roleta",
  description: "Aposte suas moedas na Roleta Europeia do Cassino",
  category: "games",
  commands: ["roleta-cassino", "roulette", "girarroleta"],
  usage: `${PREFIX}cassino-roleta <vermelho | preto | verde | número 0-36> <aposta>`,
  handle: async ({ message, args, reply, sendReact }) => {
    const escolha = args[0]?.toLowerCase();
    const aposta = parseInt(args[1], 10);
    const userId = message.author.id;
    const saldo = getCoins(userId);

    if (!escolha || isNaN(aposta) || aposta <= 0) {
      return await reply(
        `Como jogar:\n` +
        `\`${PREFIX}cassino-roleta vermelho 100\` (Ganhe 2x)\n` +
        `\`${PREFIX}cassino-roleta preto 100\` (Ganhe 2x)\n` +
        `\`${PREFIX}cassino-roleta verde 50\` (Ganhe 14x)\n` +
        `\`${PREFIX}cassino-roleta 17 50\` (Ganhe 36x no número exato!)`
      );
    }

    if (saldo < aposta) return await reply(`❌ Saldo insuficiente! Você possui apenas \`🪙 ${saldo} coins\`.`);

    await sendReact?.("🎰");
    removeCoins(userId, aposta);

    const msg = await message.reply("🎡 **Girando a roleta do cassino...** A bolinha de marfim está pulando nas casas!");

    setTimeout(async () => {
      const numeroSorteado = Math.floor(Math.random() * 37); // 0 a 36
      let corSorteada = "preto";
      if (numeroSorteado === 0) corSorteada = "verde";
      else if (CORES.vermelho.nums.includes(numeroSorteado)) corSorteada = "vermelho";

      const emojiCor = CORES[corSorteada].emoji;
      let ganhou = false;
      let premio = 0;

      if (escolha === corSorteada) {
        ganhou = true;
        premio = aposta * CORES[corSorteada].mult;
      } else if (parseInt(escolha, 10) === numeroSorteado) {
        ganhou = true;
        premio = aposta * 36;
      }

      if (ganhou) {
        addCoins(userId, premio);
        const winEmbed = new EmbedBuilder()
          .setColor("#2ECC71")
          .setTitle("🎉 VITÓRIA NA ROLETA DO CASSINO!")
          .setDescription(
            `🎡 **Resultado:** ${emojiCor} Número **${numeroSorteado}** (${corSorteada.toUpperCase()})\n\n` +
            `💰 **Você apostou:** \`🪙 ${aposta} coins\`\n` +
            `💸 **Você ganhou:** \`🪙 +${premio.toLocaleString("pt-BR")} coins\`!\n` +
            `📊 **Novo Saldo:** \`🪙 ${getCoins(userId)} coins\``
          );
        await msg.edit({ content: null, embeds: [winEmbed] });
      } else {
        const loseEmbed = new EmbedBuilder()
          .setColor("#C0392B")
          .setTitle("😢 NÃO FOI DESSA VEZ!")
          .setDescription(
            `🎡 **Resultado:** ${emojiCor} Número **${numeroSorteado}** (${corSorteada.toUpperCase()})\n\n` +
            `📉 **Você perdeu:** \`🪙 -${aposta} coins\`\n` +
            `📊 **Saldo Atual:** \`🪙 ${getCoins(userId)} coins\``
          );
        await msg.edit({ content: null, embeds: [loseEmbed] });
      }
    }, 2500);
  },
};
