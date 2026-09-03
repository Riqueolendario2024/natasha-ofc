import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import {
  UPDATE_CHANNEL_ID,
  UPDATE_BANNER_URL,
  UPDATE_TEST_MODE,
  BOT_VERSION,
  PREFIX,
  OWNER_IDS,
} from "../config.js";
import {
  getUpdatesState,
  isFirstRun,
  markFirstRunComplete,
  getKnownCommands,
  registerAnnouncedCommands,
  getCategoryEmoji,
} from "../database/updatesManager.js";
import { commandsRegistry } from "../utils/dynamicCommand.js";
import { logger, logErrorToFile } from "../utils/logger.js";

export function formatUpdateEmbed(updateData, isTest = false) {
  const { version, items, notes } = updateData;

  const grouped = {};
  items.forEach((item) => {
    const cat = item.category || "utilities";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const embed = new EmbedBuilder()
    .setColor("#FF007F")
    .setTitle(
      items.length === 1
        ? `🚀 NOVA ATUALIZAÇÃO: ${items[0].emoji} ${items[0].name.toUpperCase()}`
        : `🚀 PACOTE DE NOVIDADES — NATASHA v${version}`
    )
    .setDescription(
      isTest
        ? `⚠️ **MODO DE TESTE ATIVO** — Este anúncio é apenas uma prévia.\n\n`
        : `Ei! Acabei de receber novas funcionalidades no servidor! Dá uma olhada no que tem de novo:\n\n`
    );

  const categoryTitles = {
    games: "🎮 Mini-Games & Jogos",
    ia: "🧠 Inteligência Artificial & Dev",
    economy: "🪙 Economia & Social",
    utilities: "🛠️ Novas Ferramentas",
    information: "📰 Notícias & Tempo",
    admin: "👑 Funções Administrativas",
  };

  for (const [cat, cmdList] of Object.entries(grouped)) {
    const title = categoryTitles[cat] || `✨ Outras Novidades`;
    let catBody = "";
    cmdList.forEach((cmd) => {
      catBody += `• **${cmd.emoji} \`${PREFIX}${cmd.name}\`**\n`;
      catBody += `   └── *${cmd.description}*\n`;
    });
    embed.addFields({ name: title, value: catBody, inline: false });
  }

  if (notes) {
    embed.addFields({ name: "📝 Notas da Versão", value: notes, inline: false });
  }

  embed.addFields({
    name: "💡 Como experimentar?",
    value: `Digite \`${PREFIX}menu\` para ver todos os recursos ou utilize os comandos listados acima!`,
  });

  if (UPDATE_BANNER_URL) {
    embed.setImage(UPDATE_BANNER_URL);
  }

  embed.setFooter({ text: `Natasha Assistant • v${version}` }).setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("menu_home").setLabel("Abrir Menu").setEmoji("📖").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("updates_hist_btn").setLabel("Histórico").setEmoji("📜").setStyle(ButtonStyle.Secondary)
  );

  return { embed, row };
}

export async function detectAndBroadcastUpdates(client) {
  if (!client || !client.isReady()) return;

  const loadedMap = new Map();
  for (const [key, cmd] of commandsRegistry.entries()) {
    if (cmd.name && !loadedMap.has(cmd.name.toLowerCase())) {
      loadedMap.set(cmd.name.toLowerCase(), cmd);
    }
  }

  const loadedNames = Array.from(loadedMap.keys());

  // Na primeira inicialização, apenas sincroniza a base de comandos sem disparar spam
  if (isFirstRun()) {
    markFirstRunComplete(loadedNames);
    logger.info("Base de comandos conhecida sincronizada na primeira execução.");
    return;
  }

  const known = getKnownCommands();
  const newCommandNames = loadedNames.filter((name) => !known.includes(name));

  if (newCommandNames.length === 0) return;

  const newItems = newCommandNames.map((name) => {
    const cmd = loadedMap.get(name);
    return {
      name: cmd.name,
      category: cmd.category || "utilities",
      description: cmd.description || `Comando ${cmd.name} recém-adicionado.`,
      emoji: cmd.emoji || getCategoryEmoji(cmd.category),
    };
  });

  logger.info(`Detectado(s) ${newItems.length} novo(s) comando(s): ${newCommandNames.join(", ")}`);

  // Monta o objeto de anúncio
  const updatePayload = {
    version: BOT_VERSION,
    items: newItems,
  };

  const { embed, row } = formatUpdateEmbed(updatePayload, UPDATE_TEST_MODE);

  // Destino do envio
  let targetChannel = null;
  if (UPDATE_CHANNEL_ID) {
    targetChannel = client.channels.cache.get(UPDATE_CHANNEL_ID);
  }

  if (targetChannel && targetChannel.isTextBased()) {
    try {
      await targetChannel.send({ embeds: [embed], components: [row] });
      logger.success(`Anúncio de atualização publicado no canal #${targetChannel.name}!`);
      registerAnnouncedCommands(newItems, BOT_VERSION);
    } catch (err) {
      logErrorToFile("BROADCAST_UPDATES", err);
    }
  } else {
    // Se o canal não estiver configurado, envia na DM do primeiro Dono para testes
    if (OWNER_IDS.length > 0) {
      try {
        const ownerUser = await client.users.fetch(OWNER_IDS[0]);
        if (ownerUser) {
          await ownerUser.send({
            content: `📢 **[Aviso de Atualização Detectada]** Configure \`UPDATE_CHANNEL_ID\` no seu \`.env\` para postar no servidor:`,
            embeds: [embed],
            components: [row],
          });
          registerAnnouncedCommands(newItems, BOT_VERSION);
        }
      } catch {}
    }
  }
}
