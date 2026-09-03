import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, updateUser, addCoins } from "../../utils/usersManager.js";
import { getRPGPlayer, saveRPGPlayer, applyExp } from "../../tools/rpgEngine.js";

const MINERIOS = [
  { name: "Carvão Mineral", price: 30, exp: 15, emoji: "⬛" },
  { name: "Minério de Ferro", price: 60, exp: 25, emoji: "⛓️" },
  { name: "Pepita de Ouro Puro", price: 140, exp: 45, emoji: "🪙" },
  { name: "Diamante Cintilante", price: 350, exp: 100, emoji: "💎" },
  { name: "Barra de Netherite Cósmico", price: 750, exp: 220, emoji: "🔮" },
];

export default {
  name: "mineracao",
  description: "Desça nas minas profundas para extrair minérios valiosos e EXP",
  category: "games",
  commands: ["minerar", "mine", "mina"],
  usage: `${PREFIX}mineracao`,
  handle: async ({ message, reply, sendReact }) => {
    const userId = message.author.id;
    const user = getUser(userId);
    const now = Date.now();
    const cooldown = 20 * 60 * 1000; // 20 minutos

    if (now - (user.lastMine || 0) < cooldown) {
      const rest = cooldown - (now - user.lastMine);
      const min = Math.ceil(rest / (1000 * 60));
      return await reply(`⛏️ Seus braços estão cansados da última escavação! Descanse mais \`${min} minuto(s)\`.`);
    }

    await sendReact?.("⛏️");
    user.lastMine = now;
    updateUser(userId, user);

    const roll = Math.random();
    let minerio;

    if (roll < 0.05) minerio = MINERIOS[4]; // 5% Netherite
    else if (roll < 0.15) minerio = MINERIOS[3]; // 10% Diamante
    else if (roll < 0.35) minerio = MINERIOS[2]; // 20% Ouro
    else if (roll < 0.65) minerio = MINERIOS[1]; // 30% Ferro
    else minerio = MINERIOS[0]; // 35% Carvão

    const qtd = Math.floor(Math.random() * 3) + 1;
    const totalEarnings = minerio.price * qtd;
    const totalExp = minerio.exp * qtd;

    addCoins(userId, totalEarnings);

    const rpgP = getRPGPlayer(userId, message.author.username);
    const up = applyExp(rpgP, totalExp);
    saveRPGPlayer(userId, rpgP);

    const embed = new EmbedBuilder()
      .setColor("#E67E22")
      .setTitle("⛏️ EXPEDIÇÃO NA MINA PROFUNDA!")
      .setDescription(
        `Você desceu aos túneis subterrâneos e picaretou a rocha com sucesso!\n\n` +
        `✨ **Minério Encontrado:** ${minerio.emoji} **${qtd}x ${minerio.name}**\n` +
        `💰 **Valor Vendido:** \`🪙 +${totalEarnings} NatashaCoins\`\n` +
        `🌟 **EXP de Mineração:** \`+${totalExp} EXP\`\n` +
        (up ? `\n🎉 **LEVEL UP!** Você subiu para o Nível **${rpgP.level}**!` : "")
      )
      .setFooter({ text: "Natasha Mining System" });

    await message.reply({ embeds: [embed] });
  },
};
