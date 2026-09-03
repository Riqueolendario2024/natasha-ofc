import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { PREFIX } from "../../config.js";

export default {
  name: "menu",
  description: "Exibe o menu principal no estilo bot de WhatsApp",
  commands: ["menu", "ajuda", "help", "comandos"],
  usage: `${PREFIX}menu`,
  async handle({ message }) {
    const totalEngines = "10";
    const dataHora = new Date().toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    // Layout clássico de Bot de WhatsApp com caixas ASCII
    const textoMenuWhatsApp = [
      `╭═══「 🎮 **TAKESHI DEV BOT** 」═══⊷`,
      `│ 👤 **Usuário:** ${message.author.username}`,
      `│ 🏷️ **Prefixo:** \`${PREFIX}\``,
      `│ 📅 **Data:** ${dataHora}`,
      `│ 🛠️ **Engines:** ${totalEngines} suportadas`,
      `╰═════════════════════════════⊷`,
      ``,
      `╭═══「 🧠 **MENTORIA & IA** 」═══⊷`,
      `│ ✦ \`${PREFIX}godot <dúvida>\``,
      `│   └ Tira dúvidas e gera códigos GDScript`,
      `│ ✦ \`${PREFIX}doc <engine> <termo>\``,
      `│   └ Explica nós, classes e funções`,
      `│ ✦ \`${PREFIX}exercicio <facil|medio|dificil>\``,
      `│   └ Gera desafios práticos de lógica`,
      `╰═════════════════════════════⊷`,
      ``,
      `╭═══「 🚀 **CURSOS & ENGINES** 」═══⊷`,
      `│ ✦ \`${PREFIX}curso <tema>\``,
      `│   └ Aulas e tutoriais no YouTube`,
      `│ ✦ \`${PREFIX}tutorial <curso> <aula>\``,
      `│   └ Acessa o índice completo do canal`,
      `│ ✦ \`${PREFIX}engine <nome>\``,
      `│   └ Informações rápidas sobre a engine`,
      `╰═════════════════════════════⊷`,
      ``,
      `╭═══「 ⚙️ **UTILITÁRIOS** 」═══⊷`,
      `│ ✦ \`${PREFIX}boasvindas\``,
      `│   └ Gera o card de boas-vindas`,
      `│ ✦ \`${PREFIX}menu\``,
      `│   └ Abre este painel de comandos`,
      `╰═════════════════════════════⊷`,
      ``,
      `💡 _Selecione uma categoria abaixo ou use os botões rápidos!_`,
    ].join("\n");

    const embed = new EmbedBuilder()
      .setColor("#00FF66") // Verde estilo WhatsApp / Terminal
      .setDescription(textoMenuWhatsApp)
      .setFooter({
        text: `Takeshi • Solicitado por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ forceStatic: true }),
      })
      .setTimestamp();

    // Menu dropdown público
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("menu_whatsapp_select")
      .setPlaceholder("📂 Escolha uma categoria para ver detalhes...")
      .addOptions([
        {
          label: "Início / Menu Completo",
          description: "Retorna ao menu geral",
          value: "menu_home",
          emoji: "📱",
        },
        {
          label: "Mentoria & Inteligência Artificial",
          description: "Comandos de GDScript, Docs e Exercícios",
          value: "menu_ia",
          emoji: "🧠",
        },
        {
          label: "Cursos, Aulas & Engines",
          description: "Tutoriais do canal e guias de engines",
          value: "menu_cursos",
          emoji: "🎬",
        },
        {
          label: "Engines Suportadas",
          description: "Lista de todas as game engines cadastradas",
          value: "menu_engines_lista",
          emoji: "🛠️",
        },
      ]);

    // Botões de Atalho
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("btn_desafio_facil")
        .setLabel("Desafio Fácil")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🎯"),
      new ButtonBuilder()
        .setCustomId("btn_info_engines")
        .setLabel("Lista de Engines")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🕹️"),
      new ButtonBuilder()
        .setLabel("Docs Godot")
        .setStyle(ButtonStyle.Link)
        .setURL("https://docs.godotengine.org/")
        .setEmoji("📖")
    );

    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

    const menuMsg = await message.reply({
      embeds: [embed],
      components: [rowSelect, buttons],
    });

    // Coletor público (sem filtro de author.id para QUALQUER um usar)
    const collector = menuMsg.createMessageComponentCollector({
      time: 180000, // 3 minutos ativo
    });

    collector.on("collect", async (interaction) => {
      // 1. Ações do Select Menu
      if (interaction.isStringSelectMenu()) {
        const valor = interaction.values[0];

        if (valor === "menu_home") {
          return interaction.update({ embeds: [embed] });
        }

        if (valor === "menu_ia") {
          const textoIA = [
            `╭═══「 🧠 **MENTORIA & IA (DETALHES)** 」═══⊷`,
            `│`,
            `│ 📌 **${PREFIX}godot <pergunta>**`,
            `│ └ Exemplo: \`${PREFIX}godot como mover personagem 2D?\``,
            `│ └ Explica com código GDScript formatado.`,
            `│`,
            `│ 📌 **${PREFIX}doc <engine> <termo>**`,
            `│ └ Exemplo: \`${PREFIX}doc Godot CharacterBody2D\``,
            `│ └ Exemplo: \`${PREFIX}doc Unity Rigidbody\``,
            `│`,
            `│ 📌 **${PREFIX}exercicio [nível]**`,
            `│ └ Exemplo: \`${PREFIX}exercicio facil\``,
            `│ └ Níveis: \`facil\`, \`medio\`, \`dificil\``,
            `│`,
            `╰══════════════════════════════════════⊷`,
          ].join("\n");

          const embedIA = new EmbedBuilder()
            .setColor("#9B59B6")
            .setDescription(textoIA)
            .setFooter({ text: "Takeshi • Mentor IA" });

          return interaction.update({ embeds: [embedIA] });
        }

        if (valor === "menu_cursos") {
          const textoCursos = [
            `╭═══「 🚀 **CURSOS & TUTORIAIS (DETALHES)** 」═══⊷`,
            `│`,
            `│ 📌 **${PREFIX}curso <tema>**`,
            `│ └ Exemplo: \`${PREFIX}curso inventario godot\``,
            `│ └ Busca vídeos recomendados no YouTube.`,
            `│`,
            `│ 📌 **${PREFIX}tutorial <curso> <aula>**`,
            `│ └ Exemplo: \`${PREFIX}tutorial fazenda 1\``,
            `│ └ Exemplo: \`${PREFIX}tutorial fazenda\``,
            `│ └ Traz link direto e capa em HD da aula.`,
            `│`,
            `╰══════════════════════════════════════════⊷`,
          ].join("\n");

          const embedCursos = new EmbedBuilder()
            .setColor("#3498DB")
            .setDescription(textoCursos)
            .setFooter({ text: "Takeshi • Cursos e Tutoriais" });

          return interaction.update({ embeds: [embedCursos] });
        }

        if (valor === "menu_engines_lista") {
          const textoEngines = [
            `╭═══「 🛠️ **ENGINES SUPORTADAS** 」═══⊷`,
            `│ ✦ \`godot\` — 2D/3D leve (GDScript, C#)`,
            `│ ✦ \`unity\` — Indústria & Mobile (C#)`,
            `│ ✦ \`unreal\` — Gráficos 3D AAA (C++, Blueprints)`,
            `│ ✦ \`gamemaker\` — 2D Especializado (GML)`,
            `│ ✦ \`rpgmaker\` — RPGs Clássicos (JS)`,
            `│ ✦ \`construct\` — Lógica Visual & Web`,
            `│ ✦ \`gdevelop\` — No-Code Multiplataforma`,
            `│ ✦ \`roblox\` — Multiplayer 3D (Luau)`,
            `│ ✦ \`defold\` — Super Leve 2D (Lua)`,
            `│ ✦ \`phaser\` — Jogos Web HTML5 (JS/TS)`,
            `│`,
            `│ 📌 Use: \`${PREFIX}engine <nome-da-engine>\``,
            `╰══════════════════════════════════⊷`,
          ].join("\n");

          const embedEngines = new EmbedBuilder()
            .setColor("#F39C12")
            .setDescription(textoEngines)
            .setFooter({ text: "Takeshi • Game Engines" });

          return interaction.update({ embeds: [embedEngines] });
        }
      }

      // 2. Ações dos Botões
      if (interaction.isButton()) {
        if (interaction.customId === "btn_desafio_facil") {
          await interaction.reply({
            content: `🎯 **Dica:** Para gerar seu desafio agora, digite no chat:\n\`${PREFIX}exercicio facil\``,
            ephemeral: true,
          });
        }

        if (interaction.customId === "btn_info_engines") {
          await interaction.reply({
            content: `🛠️ Escolha uma engine e digite:\n\`${PREFIX}engine godot\` ou \`${PREFIX}engine gamemaker\``,
            ephemeral: true,
          });
        }
      }
    });

    // Desativa botões após o tempo sem travar a memória do Termux
    collector.on("end", async () => {
      const disabledSelect = ActionRowBuilder.from(rowSelect);
      const disabledButtons = ActionRowBuilder.from(buttons);

      disabledSelect.components.forEach((c) => c.setDisabled(true));
      disabledButtons.components.forEach((c) => {
        if (c.data.style !== ButtonStyle.Link) c.setDisabled(true);
      });

      await menuMsg.edit({ components: [disabledSelect, disabledButtons] }).catch(() => null);
    });
  },
};