import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, getAllUsers } from "../../utils/usersManager.js";
import { drawRankCard } from "../../tools/canvasEngine.js";

export default {
  name: "rank",
  description: "Exibe o seu cartão de nível, XP e posição no ranking",
  category: "economy",
  commands: ["level", "xp", "nivel"],
  usage: `${PREFIX}rank [@membro]`,
  handle: async ({ message, reply, sendReact }) => {
    const target = message.mentions?.users?.first() || message.author;
    const userData = getUser(target.id);

    await sendReact?.("🌟");

    // Calcula a posição no ranking geral de níveis
    const all = getAllUsers();
    const sorted = Object.entries(all)
      .map(([id, data]) => ({ id, level: data.level || 1, xp: data.xp || 0 }))
      .sort((a, b) => b.level - a.level || b.xp - a.xp);

    const rankPos = sorted.findIndex((u) => u.id === target.id) + 1 || sorted.length;

    const avatarUrl = target.displayAvatarURL({ extension: "png", size: 256, forceStatic: true });
    const buffer = await drawRankCard({
      username: target.username,
      avatarUrl,
      level: userData.level || 1,
      currentXp: userData.xp || 0,
      maxXp: userData.maxXp || 100,
      rankPos,
    });

    const attachment = new AttachmentBuilder(buffer, { name: "rank-card.png" });
    const embed = new EmbedBuilder()
      .setColor("#FF007F")
      .setTitle(`🌟 Progresso de Atividade — ${target.username}`)
      .setImage("attachment://rank-card.png")
      .setDescription(`💬 *Converse no chat para ganhar mais XP e subir de nível!*`);

    await message.reply({ embeds: [embed], files: [attachment] });
  },
};
