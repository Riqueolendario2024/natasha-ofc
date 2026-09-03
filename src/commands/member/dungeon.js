import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { addCoins } from "../../utils/usersManager.js";
import { getRPGPlayer, saveRPGPlayer, applyExp } from "../../tools/rpgEngine.js";

const DUNGEON_ROOMS = [
  { type: "chest", desc: "🎁 Você encontrou um Baú Ancestral!", coins: 180, exp: 60 },
  { type: "trap", desc: "⚠️ Você pisou em uma placa de pressão e tomou dano!", coins: 0, exp: 20 },
  { type: "fountain", desc: "⛲ Uma fonte luminosa restaurou sua vitalidade!", coins: 50, exp: 40 },
  { type: "boss", desc: "👹 Um Guardião de Pedra bloqueou o corredor final!", coins: 350, exp: 150 },
];

export default {
  name: "dungeon",
  description: "Explore salas misteriosas da masmorra em busca de relíquias e tesouros",
  category: "games",
  commands: ["masmorra", "explorar"],
  usage: `${PREFIX}dungeon`,
  handle: async ({ message, reply, sendReact }) => {
    const userId = message.author.id;
    await sendReact?.("🏰");

    let roomStep = 1;
    let totalCoins = 0;
    let totalExp = 0;

    const buildEmbed = (room, isEnd = false) => {
      return new EmbedBuilder()
        .setColor(isEnd ? "#2ECC71" : "#8E44AD")
        .setTitle(`🏰 MASMORRA DAS SOMBRAS — SALA ${roomStep}/3`)
        .setDescription(
          `${room.desc}\n\n` +
          `🪙 **Recompensa da Sala:** \`+${room.coins} coins\`\n` +
          `🌟 **EXP Acumulada:** \`+${room.exp} EXP\`\n\n` +
          (isEnd ? `🎉 **Masmorra concluída com sucesso!**` : `_Escolha seu próximo passo no painel abaixo:_`)
        );
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("dg_left").setLabel("Porta Esquerda").setEmoji("🚪").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("dg_right").setLabel("Porta Direita").setEmoji("🚪").setStyle(ButtonStyle.Primary)
    );

    let currentRoom = DUNGEON_ROOMS[Math.floor(Math.random() * (DUNGEON_ROOMS.length - 1))];
    totalCoins += currentRoom.coins;
    totalExp += currentRoom.exp;

    const msg = await message.reply({ embeds: [buildEmbed(currentRoom)], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === userId && ["dg_left", "dg_right"].includes(i.customId),
      time: 60000,
    });

    collector.on("collect", async (i) => {
      roomStep++;

      if (roomStep >= 3) {
        currentRoom = DUNGEON_ROOMS[3]; // Boss final
        totalCoins += currentRoom.coins;
        totalExp += currentRoom.exp;

        addCoins(userId, totalCoins);
        const rpgP = getRPGPlayer(userId, message.author.username);
        const up = applyExp(rpgP, totalExp);
        saveRPGPlayer(userId, rpgP);

        collector.stop("finish");
        const finalEmbed = buildEmbed(currentRoom, true).setDescription(
          `🏆 **Você derrotou o Guardião Final e escapou da masmorra!**\n\n` +
          `💰 **Total de Moedas Conquistadas:** \`🪙 +${totalCoins} NatashaCoins\`\n` +
          `🌟 **Total de EXP Ganho:** \`+${totalExp} EXP\`\n` +
          (up ? `\n🎉 **LEVEL UP!** Você subiu para o Nível **${rpgP.level}**!` : "")
        );
        return await i.update({ embeds: [finalEmbed], components: [] });
      }

      currentRoom = DUNGEON_ROOMS[Math.floor(Math.random() * (DUNGEON_ROOMS.length - 1))];
      totalCoins += currentRoom.coins;
      totalExp += currentRoom.exp;

      await i.update({ embeds: [buildEmbed(currentRoom)], components: [row] });
    });
  },
};
