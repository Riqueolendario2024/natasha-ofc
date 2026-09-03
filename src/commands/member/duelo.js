import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { getCoins, addCoins, removeCoins } from "../../utils/usersManager.js";

const activeDuels = new Map();

export default {
  name: "duelo",
  description: "Desafie outro membro para um confronto 1v1 com apostas",
  category: "games",
  commands: ["pvp", "luta1v1", "x1"],
  usage: `${PREFIX}duelo <@membro> [aposta]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const p1 = message.author;
    const p2 = message.mentions?.users?.first();
    const aposta = parseInt(args[1], 10) || 50;

    if (!p2) return await reply(`Marque quem você quer desafiar!\n*Exemplo:* \`${PREFIX}duelo @amigo 100\``);
    if (p2.id === p1.id) return await reply("Você não pode duelar contra você mesmo!");

    const saldoP1 = getCoins(p1.id);
    const saldoP2 = getCoins(p2.id);

    if (saldoP1 < aposta) return await reply(`Você não tem 🪙 ${aposta} coins para apostar neste duelo!`);
    if (saldoP2 < aposta) return await reply(`O oponente <@${p2.id}> não possui moedas suficientes!`);

    await sendReact?.("⚔️");

    const embed = new EmbedBuilder()
      .setColor("#E74C3C")
      .setTitle("⚔️ DESAFIO DE DUELO 1v1!")
      .setDescription(
        `<@${p1.id}> desafiou <@${p2.id}> para um duelo de honra!\n\n` +
        `💰 **Aposta em Jogo:** \`🪙 ${aposta} coins\` de cada lado (Total: \`🪙 ${aposta * 2}\`)\n\n` +
        `<@${p2.id}>, você aceita o combate?`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("duel_accept").setLabel("Aceitar Duelo").setEmoji("⚔️").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("duel_refuse").setLabel("Arregar").setEmoji("🏳️").setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === p2.id && ["duel_accept", "duel_refuse"].includes(i.customId),
      time: 40000,
      max: 1,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "duel_refuse") {
        return await i.update({ content: `🏳️ <@${p2.id}> fugiu do duelo com medo de perder as moedas!`, embeds: [], components: [] });
      }

      removeCoins(p1.id, aposta);
      removeCoins(p2.id, aposta);

      const winner = Math.random() < 0.5 ? p1 : p2;
      const loser = winner.id === p1.id ? p2 : p1;
      const totalPrize = aposta * 2;

      addCoins(winner.id, totalPrize);

      const winEmbed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle("🏆 FIM DO DUELO — TEMOS UM VENCEDOR!")
        .setDescription(
          `⚔️ O confronto foi sangrento e a lâmina de <@${winner.id}> superou a de <@${loser.id}>!\n\n` +
          `👑 **Vencedor(a):** <@${winner.id}>\n` +
          `💰 **Prêmio Total Conquistado:** \`🪙 +${totalPrize} NatashaCoins\`!`
        );

      await i.update({ embeds: [winEmbed], components: [] });
    });
  },
};
