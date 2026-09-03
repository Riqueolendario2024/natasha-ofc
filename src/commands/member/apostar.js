import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getCoins, addCoins, removeCoins } from "../../utils/usersManager.js";

const settings = {
  minBet: 10,
  maxBet: 5000,
  cooldownSeconds: 8,
  symbols: [
    { emoji: "🍊", name: "Laranja", payout: 3, weight: 15 },
    { emoji: "🍇", name: "Uva", payout: 3, weight: 15 },
    { emoji: "🔔", name: "Sino", payout: 5, weight: 10 },
    { emoji: "🍫", name: "Barra", payout: 10, weight: 6 },
    { emoji: "💎", name: "Diamante", payout: 25, weight: 3 },
  ],
  wildSymbol: { emoji: "🐯", name: "Tigre" },
  jackpotMultiplier: 100,
};

const userCooldowns = new Map();

const createWeightedPool = () => {
  const pool = [];
  for (const symbol of settings.symbols) {
    for (let i = 0; i < symbol.weight; i++) {
      pool.push(symbol);
    }
  }
  const tigerWeight = Math.ceil(pool.length / 25);
  for (let i = 0; i < tigerWeight; i++) {
    pool.push(settings.wildSymbol);
  }
  return pool;
};

const weightedPool = createWeightedPool();
const spin = () => weightedPool[Math.floor(Math.random() * weightedPool.length)];

const calculateWinnings = (reels, bet) => {
  const [r1, r2, r3] = reels;
  const wild = settings.wildSymbol.emoji;

  if (r1.emoji === wild && r2.emoji === wild && r3.emoji === wild) {
    return { winnings: bet * settings.jackpotMultiplier, message: "🐯💰 JACKPOT LENDÁRIO DO TIGRINHO!!! 💰🐯" };
  }

  const effectiveReels = reels.map((r) => r.emoji);
  const symbolsToCheck = settings.symbols.map((s) => s.emoji);

  for (const symbol of symbolsToCheck) {
    const count = effectiveReels.filter((e) => e === symbol).length;
    const wildCount = effectiveReels.filter((e) => e === wild).length;

    if (count + wildCount === 3) {
      const symbolData = settings.symbols.find((s) => s.emoji === symbol);
      return { winnings: bet * symbolData.payout, message: `🎉 Boa! Trinca de ${symbolData.name}!` };
    }
  }

  return { winnings: 0, message: "Não foi dessa vez... Mais sorte no próximo giro!" };
};

export default {
  name: "apostar",
  description: "Aposte suas NatashaCoins na roleta do Tigrinho",
  commands: ["tigrinho", "cassino", "bet", "roleta"],
  usage: `${PREFIX}apostar <quantidade | tudo>`,
  handle: async ({ message, args, reply, sendReact }) => {
    const sender = message.author.id;

    if (userCooldowns.has(sender)) {
      const diff = (Date.now() - userCooldowns.get(sender)) / 1000;
      if (diff < settings.cooldownSeconds) {
        const timeLeft = Math.ceil(settings.cooldownSeconds - diff);
        return await reply(`Calma, <@${sender}>! ✋ Espere mais \`${timeLeft}s\` para girar o Tigrinho novamente.`);
      }
    }

    const betAmountStr = args[0]?.toLowerCase();
    const currentBalance = getCoins(sender);
    let betAmount = parseInt(betAmountStr, 10);

    if (betAmountStr === "tudo" || betAmountStr === "all") {
      betAmount = currentBalance;
    }

    if (!betAmountStr || isNaN(betAmount) || betAmount <= 0) {
      return await reply(
        `Informe o valor da aposta!\n*Exemplo:* \`${PREFIX}apostar 100\` ou \`${PREFIX}apostar tudo\`\n• Aposta mínima: \`🪙 ${settings.minBet} coins\`\n• Aposta máxima: \`🪙 ${settings.maxBet} coins\``
      );
    }

    if (betAmount < settings.minBet) {
      return await reply(`❌ A aposta mínima é de \`🪙 ${settings.minBet} coins\`.`);
    }
    if (betAmount > settings.maxBet) {
      return await reply(`❌ A aposta máxima permitida é de \`🪙 ${settings.maxBet} coins\`.`);
    }
    if (currentBalance < betAmount) {
      return await reply(`❌ Saldo insuficiente! Você possui apenas \`🪙 ${currentBalance} coins\`.`);
    }

    await sendReact("🎰");
    removeCoins(sender, betAmount);
    userCooldowns.set(sender, Date.now());

    const initialEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle("🐯 Roleta do Tigrinho da Natasha")
      .setDescription(`🎰 **Aposta:** \`🪙 ${betAmount} coins\`\n\n🔄 **Girando os rolos:** \`[ ❓ | ❓ | ❓ ]\`\n\n_Torcendo pelos 3 Tigres..._`)
      .setFooter({ text: `Apostador: ${message.author.username}` });

    const msg = await message.reply({ embeds: [initialEmbed] });

    setTimeout(async () => {
      const reels = [spin(), spin(), spin()];
      const result = calculateWinnings(reels, betAmount);

      let finalEmbed;
      if (result.winnings > 0) {
        addCoins(sender, result.winnings);
        const newBalance = getCoins(sender);

        finalEmbed = new EmbedBuilder()
          .setColor("#2ECC71")
          .setTitle("🐯 Vitória na Roleta do Tigrinho!")
          .setDescription(
            `🎰 **Resultado:** \`[ ${reels[0].emoji} | ${reels[1].emoji} | ${reels[2].emoji} ]\`\n\n` +
            `✨ **${result.message}**\n\n` +
            `💸 **Você ganhou:** \`🪙 +${result.winnings} coins\`\n` +
            `📊 **Novo Saldo:** \`🪙 ${newBalance} coins\``
          );
      } else {
        const newBalance = getCoins(sender);
        finalEmbed = new EmbedBuilder()
          .setColor("#E74C3C")
          .setTitle("🐯 Derrota no Tigrinho!")
          .setDescription(
            `🎰 **Resultado:** \`[ ${reels[0].emoji} | ${reels[1].emoji} | ${reels[2].emoji} ]\`\n\n` +
            `😢 **${result.message}**\n\n` +
            `📉 **Você perdeu:** \`🪙 -${betAmount} coins\`\n` +
            `📊 **Saldo Atual:** \`🪙 ${newBalance} coins\``
          );
      }

      await msg.edit({ embeds: [finalEmbed] }).catch(() => null);
    }, 2000);
  },
};
