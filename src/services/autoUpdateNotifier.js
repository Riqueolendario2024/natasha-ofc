import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";
import { UPDATE_CHANNEL_ID, UPDATE_BANNER_URL, BOT_VERSION, PREFIX } from "../config.js";
import {
  isFirstRun,
  markFirstRunComplete,
  getKnownCommands,
  saveAnnouncedUpdates,
  getCategoryEmoji,
} from "../database/updatesManager.js";
import { commandsRegistry } from "../utils/dynamicCommand.js";
import { logErrorToFile, logger } from "../utils/logger.js";
import chalk from "chalk";

export async function runAutoUpdateCheck(client) {
  // Coleta comandos válidos e registrados
  const validCommandsMap = new Map();
  for (const [key, cmd] of commandsRegistry.entries()) {
    if (cmd && cmd.name && !validCommandsMap.has(cmd.name.toLowerCase())) {
      validCommandsMap.set(cmd.name.toLowerCase(), cmd);
    }
  }

  const currentCommandNames = Array.from(validCommandsMap.keys());

  // Primeira execução: registra o estado base sem disparar spam
  if (isFirstRun()) {
    markFirstRunComplete(currentCommandNames);
    console.log(chalk.gray("   ✓ Base de comandos conhecida sincronizada na primeira execução."));
    return;
  }

  const known = getKnownCommands();
  const newNames = currentCommandNames.filter((name) => !known.includes(name));

  if (newNames.length === 0) {
    console.log(chalk.gray("   ✓ Nenhuma novidade pendente. Sistema 100% atualizado."));
    return;
  }

  console.log(chalk.bold.yellow(`\n   🚀 Detectado(s) ${newNames.length} novo(s) comando(s) funcional(is): ${newNames.join(", ")}`));

  const newItems = newNames.map((name) => {
    const cmd = validCommandsMap.get(name);
    return {
      name: cmd.name,
      category: cmd.category || "utilities",
      description: cmd.description || `Novo comando ${cmd.name} disponível no servidor.`,
      emoji: cmd.emoji || getCategoryEmoji(cmd.category),
    };
  });

  if (!UPDATE_CHANNEL_ID) {
    console.log(chalk.yellow("   ⚠️ UPDATE_CHANNEL_ID não configurado no .env. Anúncio suspenso até a definição do canal."));
    return;
  }

  const channel = client.channels.cache.get(UPDATE_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) {
    console.log(chalk.red(`   ⚠️ Canal de atualizações ID [${UPDATE_CHANNEL_ID}] não foi encontrado ou não é de texto.`));
    return;
  }

  const permissions = channel.permissionsFor(client.user);
  if (permissions && !permissions.has(PermissionFlagsBits.SendMessages)) {
    console.log(chalk.red(`   ⚠️ O bot não tem permissão para enviar mensagens no canal #${channel.name}.`));
    return;
  }

  // Agrupamento por categorias
  const grouped = {};
  newItems.forEach((item) => {
    const cat = item.category || "utilities";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const categoryTitles = {
    games: "🎮 Novos Mini-Games & Jogos",
    ia: "🧠 Novas Funções de IA",
    economy: "🪙 Nova Economia & Social",
    utilities: "🛠️ Novas Ferramentas & Utilidades",
    information: "📰 Notícias & Tempo",
    admin: "👑 Comandos Administrativos",
  };

  const embed = new EmbedBuilder()
    .setColor("#FF007F")
    .setTitle(
      newItems.length === 1
        ? `🚀 NOVIDADE NA NATASHA: ${newItems[0].emoji} ${newItems[0].name.toUpperCase()}`
        : `🚀 PACOTE DE NOVIDADES — NATASHA v${BOT_VERSION}`
    )
    .setDescription("Galera, tem novidade quentinha no meu sistema! Dá uma olhada no que acabou de entrar:\n\n");

  for (const [cat, items] of Object.entries(grouped)) {
    const title = categoryTitles[cat] || "✨ Novas Funcionalidades";
    let body = "";
    items.forEach((it) => {
      body += `• **${it.emoji} \`${PREFIX}${it.name}\`**\n`;
      body += `   └── *${it.description}*\n`;
    });
    embed.addFields({ name: title, value: body, inline: false });
  }

  embed.addFields({
    name: "💡 Como testar?",
    value: `Experimente agora mesmo digitando os comandos acima ou \`${PREFIX}menu\` no chat!`,
  });

  if (UPDATE_BANNER_URL) {
    embed.setImage(UPDATE_BANNER_URL);
  }

  embed.setFooter({ text: `Natasha Assistant • Atualização Automática v${BOT_VERSION}` }).setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("menu_home").setLabel("Ver Menu Completo").setEmoji("📖").setStyle(ButtonStyle.Primary)
  );

  try {
    await channel.send({ embeds: [embed], components: [row] });
    saveAnnouncedUpdates(newItems, BOT_VERSION);
    console.log(chalk.bold.green(`   ✓ Anúncio publicado com sucesso no canal #${channel.name}!\n`));
  } catch (err) {
    logErrorToFile("AUTO_UPDATE_NOTIFIER", err);
    console.error(chalk.red(`   ❌ Falha ao enviar anúncio no canal #${channel.name}:`), err.message);
  }
}
