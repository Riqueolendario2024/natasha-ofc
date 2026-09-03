import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { publicGameUrl, getLocalIpAddress, PORT } from "../../services/arcadeServer.js";

export default {
  name: "plataforma",
  description: "Jogue o Pirate Adventure a 60 FPS no PC ou Celular!",
  category: "games",
  emoji: "🏴‍☠️",
  commands: ["plataforma", "pirata", "fase1", "mario"],
  usage: `${PREFIX}plataforma`,
  handle: async ({ message, reply, sendReact }) => {
    const userId = message.author.id;
    await sendReact?.("🏴‍☠️");

    const localIp = getLocalIpAddress();
    const primaryUrl = `${publicGameUrl}/plataforma?userId=${userId}`;
    const localFallbackUrl = `http://${localIp}:${PORT}/plataforma?userId=${userId}`;

    const embed = new EmbedBuilder()
      .setColor("#00F2FE")
      .setTitle("🏴‍☠️ PIRATE ADVENTURE — FASE 1")
      .setDescription(
        `Salve <@${userId}>!\n\n` +
        `O jogo de **Plataforma do Pirata** está liberado a 60 FPS!\n\n` +
        `🎮 **Como Jogar:**\n` +
        `• No PC: Use **A / D** ou Setas para andar e **ESPAÇO** para Pulo Duplo.\n` +
        `• No Celular: Use os botões direcionais e o botão de Pulo na tela.\n\n` +
        `🏆 Pule na cabeça dos inimigos para eliminá-los e colete itens para ganhar **NatashaCoins** e **XP**!`
      )
      .setImage("https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80")
      .setFooter({ text: "Natasha Arcade • Platformer Engine" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("▶️ Jogar Pirate Adventure (Global)")
        .setStyle(ButtonStyle.Link)
        .setURL(primaryUrl)
        .setEmoji("🏴‍☠️"),
      new ButtonBuilder()
        .setLabel("📶 Link Local (Wi-Fi)")
        .setStyle(ButtonStyle.Link)
        .setURL(localFallbackUrl)
        .setEmoji("🌐")
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
