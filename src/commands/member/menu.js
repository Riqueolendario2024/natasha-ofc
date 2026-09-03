import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX, OWNER_ID } from "../../config.js";
import { commandsRegistry, loadedCategories } from "../../utils/dynamicCommand.js";

const CATEGORY_NAMES = {
  games: "🎮 Jogos & Mini-Games",
  ia: "🧠 Inteligência Artificial & Dev",
  information: "📰 Notícias & Previsão do Tempo",
  economy: "🪙 Economia & Social",
  utilities: "🛠️ Utilidades Gerais",
};

export default {
  name: "menu",
  description: "Exibe o painel interativo de comandos da Natasha",
  category: "utilities",
  commands: ["help", "ajuda", "comandos"],
  usage: `${PREFIX}menu`,
  handle: async ({ message, reply, client }) => {
    const user = message.author || message.user;
    const isOwner = OWNER_ID ? user.id === OWNER_ID : false;
    const avatarUrl = client?.user?.displayAvatarURL({ forceStatic: true }) || null;

    // Lista única de comandos registrados (sem aliases duplicados)
    const uniqueCommands = Array.from(new Set(commandsRegistry.values()))
      .filter((cmd) => (cmd.folder === "owner" ? isOwner : true));

    // 1. Tela Inicial do Menu
    const buildHomeEmbed = () => {
      return new EmbedBuilder()
        .setColor("#FF007F")
        .setTitle("🤖 NATASHA — ASSISTENTE VIRTUAL OFICIAL")
        .setDescription(
          `Olá, **${user.username}**! Eu sou a **Natasha**, assistente virtual e gamer desenvolvida pelo lendário **Riquefla**.\n\n` +
          `📌 **Prefixo:** \`${PREFIX}\` | ⚡ **Slash Commands:** \`/\` | 🗣️ **Linguagem Natural**\n\n` +
          `Escolha uma categoria nos botões abaixo para explorar todas as minhas capacidades:`
        )
        .addFields(
          { name: "🎮 Jogos", value: `\`${loadedCategories.get("games")?.length || 0}\` mini-games`, inline: true },
          { name: "🧠 IA & Dev", value: `\`${loadedCategories.get("ia")?.length || 0}\` comandos`, inline: true },
          { name: "📰 Informação", value: `\`${loadedCategories.get("information")?.length || 0}\` ferramentas`, inline: true },
          { name: "🪙 Economia", value: `\`${loadedCategories.get("economy")?.length || 0}\` comandos`, inline: true },
          { name: "🛠️ Utilidades", value: `\`${loadedCategories.get("utilities")?.length || 0}\` utilitários`, inline: true },
          { name: "📚 Total", value: `\`${uniqueCommands.length}\` comandos`, inline: true }
        )
        .setThumbnail(avatarUrl)
        .setFooter({ text: "Natasha Bot • Navegação Interativa" })
        .setTimestamp();
    };

    const buildCategoryEmbed = (catKey) => {
      const catCmds = uniqueCommands.filter((c) => c.category === catKey);
      const title = CATEGORY_NAMES[catKey] || catKey.toUpperCase();

      let desc = `Aqui estão os comandos da categoria **${title}**:\n\n`;
      catCmds.forEach((c) => {
        desc += `• \`${PREFIX}${c.name}\` — ${c.description || "Sem descrição."}\n`;
      });

      return new EmbedBuilder()
        .setColor("#FF007F")
        .setTitle(title)
        .setDescription(desc)
        .setThumbnail(avatarUrl)
        .setFooter({ text: "Clique em Voltar para retornar ao menu principal" });
    };

    const buildAllPageEmbed = (page = 0) => {
      const pageSize = 8;
      const totalPages = Math.ceil(uniqueCommands.length / pageSize) || 1;
      const start = page * pageSize;
      const pageItems = uniqueCommands.slice(start, start + pageSize);

      let desc = `📚 **Todos os Comandos — Página ${page + 1}/${totalPages}**\n\n`;
      pageItems.forEach((c) => {
        desc += `• \`${PREFIX}${c.name}\` (${c.category}) — ${c.description || "Comando Natasha"}\n`;
      });

      return {
        embed: new EmbedBuilder()
          .setColor("#3498DB")
          .setTitle("📚 Catálogo Geral de Comandos")
          .setDescription(desc)
          .setFooter({ text: `Página ${page + 1} de ${totalPages} • Use os botões de navegação` }),
        totalPages,
      };
    };

    // Linhas de Botões do Menu
    const homeRow1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_games").setLabel("Jogos").setEmoji("🎮").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("menu_ia").setLabel("IA & Dev").setEmoji("🧠").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("menu_info").setLabel("Notícias & Clima").setEmoji("📰").setStyle(ButtonStyle.Secondary)
    );

    const homeRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_econ").setLabel("Economia").setEmoji("🪙").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("menu_util").setLabel("Utilidades").setEmoji("🛠️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("menu_all_0").setLabel("Todos").setEmoji("📚").setStyle(ButtonStyle.Danger)
    );

    const backRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_home").setLabel("Voltar ao Início").setEmoji("🏠").setStyle(ButtonStyle.Primary)
    );

    let currentMsg;
    if (message.isRepliable && typeof message.isRepliable === "function" && message.isRepliable()) {
      if (message.replied || message.deferred) {
        currentMsg = await message.editReply({ embeds: [buildHomeEmbed()], components: [homeRow1, homeRow2] });
      } else {
        currentMsg = await message.reply({ embeds: [buildHomeEmbed()], components: [homeRow1, homeRow2] });
      }
    } else {
      currentMsg = await reply({ embeds: [buildHomeEmbed()], components: [homeRow1, homeRow2] });
    }

    const collector = currentMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === user.id && i.customId.startsWith("menu_"),
      time: 180000,
    });

    let currentPage = 0;

    collector.on("collect", async (interaction) => {
      const action = interaction.customId;

      if (action === "menu_home") {
        return await interaction.update({ embeds: [buildHomeEmbed()], components: [homeRow1, homeRow2] });
      }

      if (action === "menu_games") return await interaction.update({ embeds: [buildCategoryEmbed("games")], components: [backRow] });
      if (action === "menu_ia") return await interaction.update({ embeds: [buildCategoryEmbed("ia")], components: [backRow] });
      if (action === "menu_info") return await interaction.update({ embeds: [buildCategoryEmbed("information")], components: [backRow] });
      if (action === "menu_econ") return await interaction.update({ embeds: [buildCategoryEmbed("economy")], components: [backRow] });
      if (action === "menu_util") return await interaction.update({ embeds: [buildCategoryEmbed("utilities")], components: [backRow] });

      if (action.startsWith("menu_all_") || action.startsWith("page_")) {
        if (action.startsWith("page_next")) currentPage++;
        else if (action.startsWith("page_prev")) currentPage--;
        else currentPage = 0;

        const { embed, totalPages } = buildAllPageEmbed(currentPage);

        const pageRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("page_prev").setEmoji("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(currentPage <= 0),
          new ButtonBuilder().setCustomId("page_next").setEmoji("➡️").setStyle(ButtonStyle.Secondary).setDisabled(currentPage >= totalPages - 1),
          new ButtonBuilder().setCustomId("menu_home").setLabel("Início").setEmoji("🏠").setStyle(ButtonStyle.Primary)
        );

        return await interaction.update({ embeds: [embed], components: [pageRow] });
      }
    });

    collector.on("end", async () => {
      await currentMsg.edit({ components: [] }).catch(() => null);
    });
  },
};
