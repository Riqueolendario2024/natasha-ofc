import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import {
  createBattle,
  activeBattles,
  buildBattlePayload,
  saveRPGPlayer,
  applyExp,
  getAllRPGPlayers,
} from "../../tools/rpgEngine.js";
import { addCoins } from "../../utils/usersManager.js";

export default {
  name: "batalha",
  description: "Entra no mundo de Natasha Battle (RPG por turnos)",
  commands: ["battle", "lutar", "rpg", "monstro", "rankrpg"],
  usage: `${PREFIX}batalha [rank]`,
  handle: async ({ message, args, reply }) => {
    const userId = message.author.id;

    // Leaderboard do RPG
    if (args[0]?.toLowerCase() === "rank" || args[0]?.toLowerCase() === "top") {
      const players = getAllRPGPlayers()
        .sort((a, b) => b.level - a.level || b.wins - a.wins)
        .slice(0, 10);

      if (players.length === 0) {
        return await reply("🏆 Ainda não há aventureiros no ranking do RPG.");
      }

      let lista = "";
      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

      players.forEach((p, i) => {
        lista += `${medals[i]} **${p.name}** — 🌟 Nível: \`${p.level}\` | ⚔️ Vitórias: \`${p.wins}\`\n`;
      });

      const rankEmbed = new EmbedBuilder()
        .setColor("#F1C40F")
        .setTitle("🏆 Hall da Fama — Natasha Battle")
        .setDescription(lista)
        .setFooter({ text: "Natasha RPG • Vença batalhas para subir de nível!" });

      return await message.reply({ embeds: [rankEmbed] });
    }

    if (activeBattles.has(userId)) {
      return await reply("⚠️ Você já está em uma batalha! Conclua o seu combate atual antes de iniciar outro.");
    }

    const battle = createBattle(userId, message.author.username);
    const payload = buildBattlePayload(battle);

    const battleMsg = await message.reply({ embeds: [payload.embed], components: payload.components });

    const collector = battleMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === userId && i.customId.startsWith("rpg_"),
      time: 180000,
    });

    collector.on("collect", async (interaction) => {
      // Previne spam de cliques simultâneos
      if (battle.isLocked) {
        return await interaction.reply({ content: "⏳ Aguarde o término da sua ação anterior!", ephemeral: true });
      }
      battle.isLocked = true;

      const action = interaction.customId.split("_")[1];
      const { player, monster } = battle;
      let actionLog = "";

      // --- TURNO DO JOGADOR ---
      if (action === "attack") {
        const playerDmg = Math.floor(Math.random() * 10) + 12 + player.weaponBonus;
        monster.currentHp = Math.max(0, monster.currentHp - playerDmg);
        actionLog = `🗡️ Você desferiu um ataque ágil causando **${playerDmg}** de dano!`;
      } else if (action === "skill") {
        if (player.energy >= 15) {
          player.energy -= 15;
          const skillDmg = Math.floor(Math.random() * 18) + 24 + player.weaponBonus * 2;
          monster.currentHp = Math.max(0, monster.currentHp - skillDmg);
          actionLog = `🔥 Você concentrou seu poder e acertou um **Golpe Flamejante** causando devastadores **${skillDmg}** de dano!`;
        }
      } else if (action === "defend") {
        battle.defending = true;
        player.energy = Math.min(player.maxEnergy, player.energy + 10);
        actionLog = `🛡️ Você assumiu uma postura defensiva rígida e recuperou **10 de energia**!`;
      } else if (action === "potion") {
        if (player.potions > 0) {
          player.potions -= 1;
          const heal = 40;
          player.hp = Math.min(player.maxHp, player.hp + heal);
          actionLog = `🧪 Você bebeu uma poção de vida e regenerou **+${heal} HP**!`;
        }
      }

      // --- VERIFICA VITÓRIA ---
      if (monster.currentHp <= 0) {
        collector.stop("win");
        activeBattles.delete(userId);

        player.wins += 1;
        const leveledUp = applyExp(player, monster.exp);
        addCoins(userId, monster.coins);
        saveRPGPlayer(userId, player);

        const winEmbed = new EmbedBuilder()
          .setColor("#2ECC71")
          .setTitle("🏆 VITÓRIA GLORIOSA!")
          .setDescription(
            `⚔️ Você derrotou o **${monster.name}**!\n\n` +
            `✨ **Recompensas Recebidas:**\n` +
            `🌟 **XP Ganho:** \`+${monster.exp} EXP\`\n` +
            `🪙 **NatashaCoins:** \`+${monster.coins} moedas\`\n` +
            (leveledUp ? `\n🎉 **LEVEL UP!** Você alcançou o **Nível ${player.level}**! Seu HP e dano aumentaram!` : "")
          );

        battle.isLocked = false;
        return await interaction.update({ embeds: [winEmbed], components: [] });
      }

      // --- TURNO DO INIMIGO ---
      let rawMonsterDmg = Math.floor(Math.random() * (monster.atkMax - monster.atkMin + 1)) + monster.atkMin;
      if (battle.defending) {
        rawMonsterDmg = Math.floor(rawMonsterDmg * 0.4); // Reduz dano em 60%
        battle.defending = false;
      }

      player.hp = Math.max(0, player.hp - rawMonsterDmg);
      actionLog += `\n${monster.emoji} O **${monster.name}** revidou e te causou **${rawMonsterDmg}** de dano!`;

      // --- VERIFICA DERROTA ---
      if (player.hp <= 0) {
        collector.stop("lose");
        activeBattles.delete(userId);

        player.losses += 1;
        saveRPGPlayer(userId, player);

        const loseEmbed = new EmbedBuilder()
          .setColor("#C0392B")
          .setTitle("💀 VOCÊ FOI DERROTADO...")
          .setDescription(
            `O **${monster.name}** foi forte demais para você desta vez.\n` +
            `Descanse, recupere suas forças e tente novamente!`
          );

        battle.isLocked = false;
        return await interaction.update({ embeds: [loseEmbed], components: [] });
      }

      // Próximo turno
      battle.turn += 1;
      battle.combatLog = actionLog;
      const updatedPayload = buildBattlePayload(battle);

      battle.isLocked = false;
      await interaction.update({ embeds: [updatedPayload.embed], components: updatedPayload.components });
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        activeBattles.delete(userId);
        await battleMsg.edit({ content: "⏰ A batalha foi abandonada por inatividade!", components: [] }).catch(() => null);
      }
    });
  },
};
