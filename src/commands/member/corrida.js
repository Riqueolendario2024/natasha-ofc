import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import {
  activeRaceRooms,
  createRaceRoom,
  renderTrack,
  VEHICLES,
  TRACK_LENGTH,
  getPilot,
  savePilot,
  getAllPilots,
} from "../../tools/raceEngine.js";
import { getCoins, addCoins, removeCoins } from "../../utils/usersManager.js";
import { getRPGPlayer, saveRPGPlayer, applyExp } from "../../tools/rpgEngine.js";

export default {
  name: "corrida",
  description: "Cria ou entra em uma corrida multiplayer (Natasha Race)",
  commands: ["race", "correr", "kart", "rankcorrida"],
  usage: `${PREFIX}corrida [aposta | rank]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const channelId = message.channel.id;
    const author = message.author || message.user;

    // Leaderboard de Pilotos
    if (args[0]?.toLowerCase() === "rank" || args[0]?.toLowerCase() === "top") {
      const pilots = getAllPilots()
        .sort((a, b) => b.wins - a.wins || b.bestStreak - a.bestStreak)
        .slice(0, 10);

      if (pilots.length === 0) {
        return await reply("🏁 Ainda não há pilotos registrados no ranking de corridas.");
      }

      let lista = "";
      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
      pilots.forEach((p, i) => {
        lista += `${medals[i]} **${p.name}** — 🏆 Vitórias: \`${p.wins}\` | 🔥 Maior Sequência: \`${p.bestStreak}\`\n`;
      });

      const embed = new EmbedBuilder()
        .setColor("#E74C3C")
        .setTitle("🏆 Hall da Fama — Natasha Race")
        .setDescription(lista)
        .setFooter({ text: "Natasha Race • Vença corridas para subir no ranking!" });

      return await message.reply({ embeds: [embed] });
    }

    if (activeRaceRooms.has(channelId)) {
      return await reply("⚠️ Já existe uma corrida acontecendo ou um lobby aberto neste canal!");
    }

    let bet = parseInt(args[0], 10);
    if (isNaN(bet) || bet < 0) bet = 0;

    if (bet > 0) {
      const saldo = getCoins(author.id);
      if (saldo < bet) {
        return await reply(`❌ Você não tem saldo para criar uma corrida de \`🪙 ${bet} coins\`. Seu saldo: \`🪙 ${saldo} coins\`.`);
      }
      removeCoins(author.id, bet);
    }

    await sendReact?.("🏎️");

    const room = createRaceRoom(channelId, author, bet);

    const buildLobbyEmbed = () => {
      const lista = room.players.map((p, i) => `**${i + 1}.** ${p.vehicle.emoji} **${p.name}**`).join("\n");
      return new EmbedBuilder()
        .setColor("#E74C3C")
        .setTitle("🏁 NATASHA RACE — GRID DE LARGADA")
        .setDescription(
          `A corrida começará em instantes!\n\n` +
          `💰 **Aposta por Piloto:** \`${room.bet > 0 ? `🪙 ${room.bet} coins` : "Gratuita"}\`\n` +
          `👥 **Pilotos Confirmados (${room.players.length}/5):**\n${lista}\n\n` +
          `_Clique no botão abaixo para acelerar junto!_`
        )
        .setFooter({ text: "Natasha Race • Fechamento automático em 20 segundos" });
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("race_join")
        .setLabel("Entrar na Corrida")
        .setEmoji("🏎️")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("race_start")
        .setLabel("Largada Imediata")
        .setEmoji("🚦")
        .setStyle(ButtonStyle.Primary)
    );

    const lobbyMsg = await message.reply({ embeds: [buildLobbyEmbed()], components: [row] });

    const collector = lobbyMsg.createMessageComponentCollector({
      filter: (i) => ["race_join", "race_start"].includes(i.customId),
      time: 20000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "race_join") {
        if (room.players.some((p) => p.id === i.user.id)) {
          return await i.reply({ content: "Você já está no grid!", ephemeral: true });
        }
        if (room.players.length >= 5) {
          return await i.reply({ content: "O grid de largada já está lotado (máx 5 pilotos)!", ephemeral: true });
        }
        if (room.bet > 0) {
          const saldo = getCoins(i.user.id);
          if (saldo < room.bet) {
            return await i.reply({ content: `Você precisa de 🪙 ${room.bet} coins para apostar nesta corrida!`, ephemeral: true });
          }
          removeCoins(i.user.id, room.bet);
        }

        const vehicle = VEHICLES[room.players.length % VEHICLES.length];
        room.players.push({
          id: i.user.id,
          name: i.user.username,
          vehicle,
          progress: 0,
        });

        await i.update({ embeds: [buildLobbyEmbed()] });
      }

      if (i.customId === "race_start") {
        if (i.user.id !== room.hostId) {
          return await i.reply({ content: "Apenas o criador da sala pode forçar a largada!", ephemeral: true });
        }
        collector.stop("manual_start");
      }
    });

    collector.on("end", async () => {
      room.status = "running";
      await lobbyMsg.edit({ components: [] }).catch(() => null);
      startRaceSimulation(room, message.channel, lobbyMsg);
    });
  },
};

async function startRaceSimulation(room, channel, mainMsg) {
  let finished = false;
  let winner = null;

  const renderRaceScreen = () => {
    let pista = "";
    room.players.forEach((p) => {
      pista += `**${p.name}**\n${renderTrack(p.progress, p.vehicle.emoji)}\n\n`;
    });

    return new EmbedBuilder()
      .setColor("#E74C3C")
      .setTitle(`🏁 NATASHA RACE — VOLTA ${room.round}`)
      .setDescription(`${pista}📢 **Acontecimentos da Pista:**\n${room.log}`)
      .setFooter({ text: "Simulação por turnos em tempo real • Natasha Race Engine" });
  };

  const interval = setInterval(async () => {
    room.round += 1;
    let roundLogs = [];

    // Processamento do avanço dos pilotos
    for (const player of room.players) {
      let speed = Math.floor(Math.random() * 4) + 2; // Avanço base 2 a 5

      // 30% de chance de evento especial na rodada
      if (Math.random() < 0.3) {
        const eventsList = [
          { msg: `🚀 ${player.name} ativou o NITRO! (+3)`, val: 3 },
          { msg: `⚡ ${player.name} pegou o vácuo perfeito! (+2)`, val: 2 },
          { msg: `🛢️ ${player.name} rodou no óleo! (-2)`, val: -2 },
          { msg: `💥 ${player.name} tocou na barreira! (-3)`, val: -3 }
        ];
        const ev = eventsList[Math.floor(Math.random() * eventsList.length)];
        speed += ev.val;
        roundLogs.push(ev.msg);
      }

      player.progress = Math.max(0, player.progress + speed);

      if (player.progress >= TRACK_LENGTH && !winner) {
        winner = player;
        finished = true;
      }
    }

    room.log = roundLogs.length > 0 ? roundLogs.join("\n") : "🏎️ Todos os pilotos acelerando ao máximo!";

    if (finished) {
      clearInterval(interval);
      activeRaceRooms.delete(room.channelId);

      // Recompensas
      const totalPool = room.bet * room.players.length;
      const prizeCoins = totalPool > 0 ? totalPool : 50;
      const expGain = 40;

      // Atualiza Piloto e Economia
      for (const p of room.players) {
        const pilot = getPilot(p.id, p.name);
        pilot.races += 1;

        if (p.id === winner.id) {
          pilot.wins += 1;
          pilot.streak += 1;
          if (pilot.streak > pilot.bestStreak) pilot.bestStreak = pilot.streak;
          addCoins(p.id, prizeCoins);

          const rpgP = getRPGPlayer(p.id, p.name);
          applyExp(rpgP, expGain);
          saveRPGPlayer(p.id, rpgP);
        } else {
          pilot.streak = 0;
        }
        savePilot(p.id, pilot);
      }

      const finalEmbed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle("🏆 BANDEIRADA FINAL — TEMOS UM CAMPEÃO!")
        .setDescription(
          `🥇 **1º Lugar:** ${winner.vehicle.emoji} <@${winner.id}>\n\n` +
          `💰 **Prêmio:** \`🪙 +${prizeCoins} NatashaCoins\`\n` +
          `🌟 **XP de Aventureiro:** \`+${expGain} EXP\`\n\n` +
          `🏁 **Classificação Geral:**\n` +
          room.players
            .sort((a, b) => b.progress - a.progress)
            .map((p, i) => `${i + 1}º - ${p.vehicle.emoji} **${p.name}** (${p.progress}/${TRACK_LENGTH})`)
            .join("\n")
        );

      await mainMsg.edit({ embeds: [finalEmbed] }).catch(() => null);
      return;
    }

    await mainMsg.edit({ embeds: [renderRaceScreen()] }).catch(() => null);
  }, 3000);
}
