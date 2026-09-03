import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import {
  activeBombs,
  DIFFICULTIES,
  generatePuzzle,
  buildBombEmbed,
  saveBombRecord,
  getBombRecords,
} from "../../tools/bombEngine.js";
import { addCoins } from "../../utils/usersManager.js";
import { getRPGPlayer, saveRPGPlayer, applyExp } from "../../tools/rpgEngine.js";

export default {
  name: "bomba",
  description: "Enfrente um enigma de lógica contra o tempo no Desarme a Bomba",
  commands: ["desarmar", "bomb", "desarmarbomba", "rankbomba"],
  usage: `${PREFIX}bomba [facil | medio | dificil | insano | rank]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const author = message.author || message.user;
    const userId = author.id;

    // Leaderboard dos Melhores Tempos
    if (args[0]?.toLowerCase() === "rank" || args[0]?.toLowerCase() === "top") {
      const records = getBombRecords();
      if (records.length === 0) {
        return await reply("💣 Ainda não há recordes registrados no Desarme a Bomba.");
      }

      let lista = "";
      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
      records.forEach((r, i) => {
        lista += `${medals[i]} **${r.name}** — ⏱️ \`${r.timeSpent}s\` | 🎯 ${r.diffName}\n`;
      });

      const embed = new EmbedBuilder()
        .setColor("#F1C40F")
        .setTitle("🏆 Recordes de Desarme — Natasha Bomb")
        .setDescription(lista)
        .setFooter({ text: "Natasha Games • Seja rápido para entrar no Hall da Fama!" });

      return await message.reply({ embeds: [embed] });
    }

    if (activeBombs.has(userId)) {
      return await reply("⚠️ Você já tem uma bomba armada em andamento! Desarme-a antes de iniciar outra.");
    }

    const diffKey = args[0]?.toLowerCase() || "medio";
    const diff = DIFFICULTIES[diffKey] || DIFFICULTIES.medio;

    await sendReact?.("💣");

    const puzzle = generatePuzzle(diffKey);
    const startTime = Date.now();

    const bombState = {
      userId,
      diff,
      puzzle,
      timeLeft: diff.timeSec,
      startTime,
      resolved: false,
    };

    activeBombs.set(userId, bombState);

    const initialPayload = buildBombEmbed(bombState);
    const bombMsg = await message.reply({ embeds: [initialPayload.embed], components: initialPayload.components });

    // Atualização regressiva a cada 5 segundos
    const timerInterval = setInterval(async () => {
      if (bombState.resolved) {
        clearInterval(timerInterval);
        return;
      }

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      bombState.timeLeft = Math.max(0, diff.timeSec - elapsed);

      if (bombState.timeLeft <= 0) {
        bombState.resolved = true;
        clearInterval(timerInterval);
        activeBombs.delete(userId);

        const explodeEmbed = new EmbedBuilder()
          .setColor("#000000")
          .setTitle("💥💥💥 BOOOOOOM! 💥💥💥")
          .setDescription(
            `💀 **O TEMPO ESGOTOU!**\n\n` +
            `A bomba detonou violentamente espalhando destroços por todo o canal!\n` +
            `O fio correto era: **${puzzle.correctWireId.toUpperCase()}**.`
          );

        return await bombMsg.edit({ embeds: [explodeEmbed], components: [] }).catch(() => null);
      }
    }, 5000);

    const collector = bombMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === userId && i.customId.startsWith("bomb_"),
      time: diff.timeSec * 1000,
      max: 1,
    });

    collector.on("collect", async (i) => {
      bombState.resolved = true;
      clearInterval(timerInterval);
      activeBombs.delete(userId);

      const chosenWire = i.customId.replace("bomb_", "");
      const timeSpent = ((Date.now() - startTime) / 1000).toFixed(1);

      if (chosenWire === puzzle.correctWireId) {
        // Vitória
        addCoins(userId, diff.coins);
        const rpgPlayer = getRPGPlayer(userId, author.username);
        const up = applyExp(rpgPlayer, diff.exp);
        saveRPGPlayer(userId, rpgPlayer);

        saveBombRecord({
          name: author.username,
          timeSpent: parseFloat(timeSpent),
          diffName: diff.name,
        });

        const winEmbed = new EmbedBuilder()
          .setColor("#2ECC71")
          .setTitle("🎉 BOMBA DESARMADA COM SUCESSO! 🎉")
          .setDescription(
            `✂️ Você cortou o fio exato e neutralizou o detonador a tempo!\n\n` +
            `⏱️ **Tempo de Reação:** \`${timeSpent} segundos\`\n` +
            `🪙 **Recompensa:** \`+${diff.coins} NatashaCoins\`\n` +
            `🌟 **XP de Aventureiro:** \`+${diff.exp} EXP\`\n` +
            (up ? `\n🎉 **LEVEL UP NO RPG!** Você subiu para o nível **${rpgPlayer.level}**!` : "")
          );

        await i.update({ embeds: [winEmbed], components: [] });
      } else {
        // Explosão por fio errado
        const failEmbed = new EmbedBuilder()
          .setColor("#C0392B")
          .setTitle("💥💥💥 BOOOOOOM! VOCÊ CORTOU O FIO ERRADO! 💥💥💥")
          .setDescription(
            `⚡ Um arco elétrico disparou o gatilho e a bomba explodiu na sua cara!\n\n` +
            `✂️ **Seu corte:** \`${chosenWire.toUpperCase()}\`\n` +
            `🎯 **Fio Seguro:** \`${puzzle.correctWireId.toUpperCase()}\`\n\n` +
            `_Mais sorte e atenção na próxima missão!_`
          );

        await i.update({ embeds: [failEmbed], components: [] });
      }
    });
  },
};
