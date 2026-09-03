import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser } from "../../utils/usersManager.js";
import { drawGamerProfileCard } from "../../tools/canvasEngine.js";

export default {
  name: "perfil-card",
  description: "Renderiza seu cartão gamer completo em Canvas com todas as estatísticas",
  category: "economy",
  commands: ["card", "perfilcard", "idgamer"],
  usage: `${PREFIX}perfil-card [@membro]`,
  handle: async ({ message, reply, sendReact, client }) => {
    const target = message.mentions?.users?.first() || message.author;
    const userData = getUser(target.id);

    await sendReact?.("💳");

    let partnerName = null;
    if (userData.relationship) {
      const partnerUser = client.users.cache.get(userData.relationship);
      partnerName = partnerUser ? partnerUser.username : "Amor Oculto";
    }

    const avatarUrl = target.displayAvatarURL({ extension: "png", size: 256, forceStatic: true });
    const buffer = await drawGamerProfileCard({
      username: target.username,
      avatarUrl,
      level: userData.level || 1,
      coins: userData.coins || 0,
      bank: userData.bank || 0,
      job: userData.job || "Gamer / Dev",
      partner: partnerName,
      messages: userData.messageCount || 0,
    });

    const attachment = new AttachmentBuilder(buffer, { name: "gamer-card.png" });
    const embed = new EmbedBuilder()
      .setColor("#FF007F")
      .setTitle(`🎮 Cartão Gamer Oficial — ${target.username}`)
      .setImage("attachment://gamer-card.png")
      .setFooter({ text: "Natasha Gamer ID" });

    await message.reply({ embeds: [embed], files: [attachment] });
  },
};
