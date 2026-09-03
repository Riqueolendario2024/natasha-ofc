import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, updateUser, addCoins } from "../../utils/usersManager.js";
import { getRPGPlayer, saveRPGPlayer, applyExp } from "../../tools/rpgEngine.js";

const PEIXES = [
  { name: "Tilápia Comum", price: 25, exp: 10, emoji: "🐟" },
  { name: "Salmão Dourado", price: 65, exp: 25, emoji: "🐠" },
  { name: "Baiacu Venenoso", price: 120, exp: 40, emoji: "🐡" },
  { name: "Tubarão Martelo", price: 300, exp: 90, emoji: "🦈" },
  { name: "Leviatã das Profundezas (Lendário)", price: 800, exp: 250, emoji: "🐉" },
  { name: "Bota Velha Furada", price: 2, exp: 2, emoji: "👢" }
];

export default {
  name: "pesca",
  description: "Lance sua linha na água para fisgar peixes raros e tesouros",
  category: "games",
  commands: ["pescar", "fish", "fishing"],
  usage: `${PREFIX}pesca`,
  handle: async ({ message, reply, sendReact }) => {
    const userId = message.author.id;
    const user = getUser(userId);
    const now = Date.now();
    const cooldown = 15 * 60 * 1000; // 15 minutos

    if (now - (user.lastFish || 0) < cooldown) {
      const rest = cooldown - (now - user.lastFish);
      const min = Math.ceil(rest / (1000 * 60));
      return await reply(`🎣 A água está calma! Aguarde mais \`${min} minuto(s)\` para jogar a isca novamente.`);
    }

    await sendReact?.("🎣");
    user.lastFish = now;
    updateUser(userId, user);

    const roll = Math.random();
    let fisgado;

    if (roll < 0.04) fisgado = PEIXES[4]; // 4% Leviatã
    else if (roll < 0.12) fisgado = PEIXES[3]; // 8% Tubarão
    else if (roll < 0.25) fisgado = PEIXES[2]; // 13% Baiacu
    else if (roll < 0.55) fisgado = PEIXES[1]; // 30% Salmão
    else if (roll < 0.85) fisgado = PEIXES[0]; // 30% Tilápia
    else fisgado = PEIXES[5]; // 15% Bota velha

    addCoins(userId, fisgado.price);

    const rpgP = getRPGPlayer(userId, message.author.username);
    const up = applyExp(rpgP, fisgado.exp);
    saveRPGPlayer(userId, rpgP);

    const embed = new EmbedBuilder()
      .setColor("#3498DB")
      .setTitle("🎣 PESCARIA DA NATASHA!")
      .setDescription(
        `A boia afundou e você puxou a vara com toda a força!\n\n` +
        `✨ **Você fisgou:** ${fisgado.emoji} **${fisgado.name}**\n` +
        `💰 **Vendido por:** \`🪙 +${fisgado.price} NatashaCoins\`\n` +
        `🌟 **EXP:** \`+${fisgado.exp} EXP\`\n` +
        (up ? `\n🎉 **LEVEL UP!** Você subiu para o Nível **${rpgP.level}**!` : "")
      )
      .setFooter({ text: "Natasha Fishing Engine" });

    await message.reply({ embeds: [embed] });
  },
};
