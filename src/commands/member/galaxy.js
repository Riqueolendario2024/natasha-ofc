import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { publicGameUrl, getLocalIpAddress, PORT } from "../../services/arcadeServer.js";

export default {
  name: "galaxy",
  description: "Jogue o Cyber Galaxy Space Shooter a 60 FPS no PC ou Celular!",
  category: "games",
  emoji: "🚀",
  commands: ["nave", "navinha", "space"],
  usage: `${PREFIX}galaxy`,
  handle: async ({ message, reply, sendReact }) => {
    const userId = message.author.id;
    await sendReact?.("🚀");

    const localIp = getLocalIpAddress();
    const primaryUrl = `${publicGameUrl}/galaxy?userId=${userId}`;
    const localFallbackUrl = `http://${localIp}:${PORT}/galaxy?userId=${userId}`;

    const embed = new EmbedBuilder()
      .setColor("#00F2FE")
      .setTitle("🚀 CYBER GALAXY — NATASHA ARCADE")
      .setDescription(
        `Salve <@${userId}>!\n\n` +
        `O **Space Shooter de Navinha** está pronto em 60 FPS com lasers e naves inimigas!\n\n` +
        `🎮 **Como Jogar:**\n` +
        `• Clique no botão **[ ▶️ Jogar Cyber Galaxy ]** abaixo para abrir no celular ou PC.\n` +
        `• No PC: Use **WASD** ou Setas + **ESPAÇO** para atirar.\n` +
        `• No Celular: Use o controle virtual na tela e o botão **DISPARAR ⚡**.\n\n` +
        `🏆 Cada abate rende **NatashaCoins** e **XP** automaticamente!`
      )
      .setImage("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80")
      .setFooter({ text: "Natasha Arcade • Space Shooter Engine" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("▶️ Jogar Cyber Galaxy (Global)")
        .setStyle(ButtonStyle.Link)
        .setURL(primaryUrl)
        .setEmoji("🚀"),
      new ButtonBuilder()
        .setLabel("🌐 Link Local (Wi-Fi)", )
        .setStyle(ButtonStyle.Link)
        .setURL(localFallbackUrl)
        .setEmoji("📶")
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
