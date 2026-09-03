import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX, OWNER_IDS } from "../../config.js";
import { commandsRegistry, loadedCategories } from "../../utils/dynamicCommand.js";

export default {
  name: "natashastatus",
  description: "Exibe o perfil oficial da Natasha, tecnologias, status e contagem de comandos",
  category: "utilities",
  commands: ["natasha-perfil", "sobre-natasha", "botinfo", "stats"],
  usage: `${PREFIX}natashastatus`,
  handle: async ({ message, client, reply, sendReact }) => {
    await sendReact?.("🤖");

    const uniqueCmds = Array.from(new Set(commandsRegistry.values()));
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    const memoryMb = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const avatarUrl = client.user.displayAvatarURL({ forceStatic: true, size: 512 });

    const embed = new EmbedBuilder()
      .setColor("#FF007F")
      .setTitle("🤖 PERFIL OFICIAL — NATASHA BOT")
      .setDescription(
        `Olá! Eu sou a **Natasha**, sua parceira gamer, desenvolvedora e assistente inteligente criada pelo lendário **Riquefla**.\n\n` +
        `Fui construída com arquitetura nativa em **Discord.js**, inteligência artificial via **Gemini AI**, motor de voz **TTS**, renderizador de imagens **Canvas Pixel Art** e um ecossistema completo de economia e RPG!`
      )
      .addFields(
        {
          name: "📊 Estatísticas Gerais",
          value:
            `• 📦 **Total de Comandos:** \`${uniqueCmds.length} comandos\`\n` +
            `• 🎮 **Mini-Games & Jogos:** \`${loadedCategories.get("games")?.length || 0} jogos\`\n` +
            `• 🪙 **Módulos de Economia:** \`${loadedCategories.get("economy")?.length || 0} ferramentas\`\n` +
            `• 🧠 **Módulos de IA & Dev:** \`${loadedCategories.get("ia")?.length || 0} comandos\``,
          inline: true,
        },
        {
          name: "⚙️ Sistema & Performance",
          value:
            `• 🟢 **Status:** \`Online (Pronta para Jogar)\`\n` +
            `• ⏱️ **Uptime:** \`${hours}h ${minutes}m\`\n` +
            `• 📡 **Ping da API:** \`${client.ws.ping}ms\`\n` +
            `• 💾 **Consumo de Memória:** \`${memoryMb} MB\``,
          inline: true,
        },
        {
          name: "👑 Criação & Tecnologia",
          value:
            `• 💻 **Linguagem:** \`JavaScript (Node.js ESM)\`\n` +
            `• 🎨 **Renderizador:** \`@napi-rs/canvas (Pixel Art / HUD)\`\n` +
            `• 🚀 **Criador:** <@${OWNER_IDS[0] || "Riquefla"}>`,
          inline: false,
        }
      )
      .setThumbnail(avatarUrl)
      .setFooter({ text: `Natasha v2.0 • Use ${PREFIX}menu para ver todos os comandos` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_home").setLabel("Abrir Menu Completo").setEmoji("📖").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("rpg_quick_start").setLabel("Jogar RPG").setEmoji("⚔️").setStyle(ButtonStyle.Danger)
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
