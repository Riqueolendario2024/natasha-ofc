import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { publicGameUrl, getLocalIpAddress, PORT } from "../../services/arcadeServer.js";

export default {
  name: "flappy",
  description: "Jogue o clássico Sky Hop Deluxe a 60 FPS!",
  category: "games",
  emoji: "🐥",
  commands: ["skyhop", "flappybird", "bird"],
  usage: `${PREFIX}flappy`,
  handle: async ({ message, reply, sendReact }) => {
    const userId = message.author.id;
    await sendReact?.("🐥");

    const localIp = getLocalIpAddress();
    const primaryUrl = `${publicGameUrl}/?userId=${userId}`;
    const localFallbackUrl = `http://${localIp}:${PORT}/?userId=${userId}`;

    const embed = new EmbedBuilder()
      .setColor("#00F5D4")
      .setTitle("🐥 SKY HOP DELUXE — NATASHA ARCADE")
      .setDescription(
        `Salve <@${userId}>!\n\n` +
        `O **Sky Hop Deluxe** está rodando a 60 FPS com física em tempo real!\n\n` +
        `🎮 **Como Jogar:**\n` +
        `• Clique no botão abaixo para abrir direto no celular ou PC.\n` +
        `• Toque na tela ou aperte **ESPAÇO** para bater asas!\n\n` +
        `🏆 **Recompensa:** 🪙 **+20 NatashaCoins** e ⭐ **+15 XP** por cano superado!`
      )
      .setImage("https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80")
      .setFooter({ text: "Natasha Arcade • Servidor Global Online" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("▶️ Jogar Sky Hop (Global)")
        .setStyle(ButtonStyle.Link)
        .setURL(primaryUrl)
        .setEmoji("🐥"),
      new ButtonBuilder()
        .setLabel("🌐 Link Local (Wi-Fi)")
        .setStyle(ButtonStyle.Link)
        .setURL(localFallbackUrl)
        .setEmoji("📶")
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
