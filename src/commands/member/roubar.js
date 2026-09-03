import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getCoins, addCoins, removeCoins } from "../../utils/usersManager.js";

const settings = {
  successChance: 0.6,
  minCoinsToSteal: 50,
  stealPercentageMin: 0.05,
  stealPercentageMax: 0.15,
  failureFine: 30,
  cooldownMinutes: 3,
};

const userCooldowns = new Map();
const randomInRange = (min, max) => Math.random() * (max - min) + min;

export default {
  name: "roubar",
  description: "Tente assaltar as moedas de outro membro com risco de tomar multa policial",
  commands: ["rob", "assaltar", "crime"],
  usage: `${PREFIX}roubar <@membro>`,
  handle: async ({ message, reply, sendReact }) => {
    const thiefJid = message.author.id;
    const userMention = message.mentions.users.first();

    if (!userMention) {
      return await reply(`Você precisa marcar quem deseja roubar! 🕵️‍♂️\nExemplo: \`${PREFIX}roubar @membro\``);
    }

    const victimJid = userMention.id;

    if (thiefJid === victimJid) {
      return await reply("Você não pode roubar a si mesmo, seu doido! 😂");
    }

    if (userCooldowns.has(thiefJid)) {
      const diffSeconds = (Date.now() - userCooldowns.get(thiefJid)) / 1000;
      const totalCooldown = settings.cooldownMinutes * 60;

      if (diffSeconds < totalCooldown) {
        const timeLeft = Math.ceil((totalCooldown - diffSeconds) / 60);
        return await reply(`👮‍♂️ A polícia está de olho! Espere mais \`${timeLeft} minuto(s)\` para tentar outro roubo.`);
      }
    }

    const thiefBalance = getCoins(thiefJid);
    const victimBalance = getCoins(victimJid);

    if (thiefBalance < settings.failureFine) {
      return await reply(`❌ Você precisa de pelo menos \`🪙 ${settings.failureFine} coins\` para cobrir a fiança caso seja pego.`);
    }

    if (victimBalance < settings.minCoinsToSteal) {
      return await reply(`❌ A vítima é muito pobre! Ela precisa ter pelo menos \`🪙 ${settings.minCoinsToSteal} coins\`.`);
    }

    await sendReact("👀");
    userCooldowns.set(thiefJid, Date.now());

    const suspenseEmbed = new EmbedBuilder()
      .setColor("#34495E")
      .setTitle("🕵️ Planejando Assalto...")
      .setDescription(`<@${thiefJid}> está se aproximando de <@${victimJid}> nas sombras...`);

    const msg = await message.reply({ embeds: [suspenseEmbed] });

    setTimeout(async () => {
      const roll = Math.random();

      if (roll < settings.successChance) {
        const pct = randomInRange(settings.stealPercentageMin, settings.stealPercentageMax);
        let stolen = Math.floor(victimBalance * pct);
        if (stolen < 1) stolen = 1;

        removeCoins(victimJid, stolen);
        addCoins(thiefJid, stolen);

        const successEmbed = new EmbedBuilder()
          .setColor("#2ECC71")
          .setTitle("💰 ASSALTO BEM SUCEDIDO!")
          .setDescription(
            `💥 **Boa malandragem!** <@${thiefJid}> afanou **🪙 ${stolen} coins** de <@${victimJid}>!\n\n` +
            `📊 **Seu novo saldo:** \`🪙 ${getCoins(thiefJid)} coins\``
          );

        await msg.edit({ embeds: [successEmbed] }).catch(() => null);
      } else {
        removeCoins(thiefJid, settings.failureFine);

        const failEmbed = new EmbedBuilder()
          .setColor("#E74C3C")
          .setTitle("🚓 TEVE FLAGRANTE!")
          .setDescription(
            `👮‍♂️ **A casa caiu!** A polícia pegou <@${thiefJid}> tentando roubar <@${victimJid}>.\n` +
            `💸 **Multa paga:** \`🪙 -${settings.failureFine} coins\`\n\n` +
            `📊 **Seu novo saldo:** \`🪙 ${getCoins(thiefJid)} coins\``
          );

        await msg.edit({ embeds: [failEmbed] }).catch(() => null);
      }
    }, 2000);
  },
};
