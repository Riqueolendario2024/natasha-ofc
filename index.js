import {
  Client,
  GatewayIntentBits,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import cfonts from "cfonts";
import chalk from "chalk";
import {
  DISCORD_TOKEN,
  PREFIX,
  OWNER_IDS,
  DEBUG,
} from "./src/config.js";
import { loadCommands, dispatchCommand } from "./src/utils/dynamicCommand.js";
import { loadCommonFunctions } from "./src/utils/loadCommonFunctions.js";
import { askAI } from "./src/services/aiService.js";
import { textToAudioBuffer } from "./src/services/voiceService.js";
import { processChatXp } from "./src/utils/usersManager.js";
import { getCustomResponse } from "./src/utils/autoResponderManager.js";
import { getBlockedWords } from "./src/utils/adminManager.js";
import { logErrorToFile, logger } from "./src/utils/logger.js";
import { runAutoUpdateCheck } from "./src/services/autoUpdateNotifier.js";
import { isAFK, getAFK, removeAFK, formatTimePassed } from "./src/utils/afkManager.js";
import { startArcadeServer } from "./src/services/arcadeServer.js";

const startTime = Date.now();

process.on("unhandledRejection", (reason) => {
  logErrorToFile("UNHANDLED_REJECTION", reason);
  if (DEBUG) console.error(chalk.red("[UNHANDLED REJECTION]"), reason);
});

process.on("uncaughtException", (error) => {
  logErrorToFile("UNCAUGHT_EXCEPTION", error);
  if (DEBUG) console.error(chalk.red("[UNCAUGHT EXCEPTION]"), error);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

async function registerSlashCommands() {
  const commands = [
    new SlashCommandBuilder().setName("natasha").setDescription("Converse com a Natasha").addStringOption((opt) => opt.setName("mensagem").setDescription("O que deseja dizer?").setRequired(true)),
    new SlashCommandBuilder().setName("rank").setDescription("Exibe o seu cartão de nível e XP"),
    new SlashCommandBuilder().setName("topxp").setDescription("Exibe o Top 10 membros do servidor"),
    new SlashCommandBuilder().setName("banco").setDescription("Consulta seu saldo e cofre bancário"),
    new SlashCommandBuilder().setName("menu").setDescription("Exibe a lista de comandos da Natasha"),
  ].map((c) => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    logger.success("Slash Commands sincronizados!");
  } catch (err) {
    logErrorToFile("SLASH_REGISTER", err);
  }
}

client.on("clientReady", async () => {
  const startupSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(chalk.bold.hex("#FF007F")("\n╔════════════════════════════════════════════════════════╗"));
  console.log(chalk.bold.hex("#FF007F")("║             🟢 SISTEMA ONLINE & PRONTO                 ║"));
  console.log(chalk.bold.hex("#FF007F")("╠════════════════════════════════════════════════════════╣"));
  console.log(chalk.white(`║  🤖 Tag:              ${chalk.green(client.user.tag.padEnd(30))} ║`));
  console.log(chalk.white(`║  📌 Prefixo:          ${chalk.cyan(PREFIX.padEnd(30))} ║`));
  console.log(chalk.white(`║  👑 Donos:            ${chalk.yellow(`${OWNER_IDS.length} conta(s)`.padEnd(30))} ║`));
  console.log(chalk.white(`║  ⏱ Tempo de Boot:     ${chalk.magenta(`${startupSeconds}s`.padEnd(30))} ║`));
  console.log(chalk.bold.hex("#FF007F")("╚════════════════════════════════════════════════════════╝\n"));

  await registerSlashCommands();

  // Inicia o servidor Web do Arcade/Plataforma local
  startArcadeServer();

  setTimeout(async () => {
    await runAutoUpdateCheck(client);
  }, 2500);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    const helpers = loadCommonFunctions({ message: interaction });

    if (["rank", "topxp", "banco", "menu"].includes(commandName)) {
      const context = { client, message: interaction, args: [], fullArgs: "", ...helpers };
      return await dispatchCommand({ commandName, context });
    }

    if (commandName === "natasha") {
      await interaction.deferReply();
      const prompt = interaction.options.getString("mensagem");
      try {
        const aiReply = await askAI({ prompt, userId: interaction.user.id });
        await interaction.editReply({ content: aiReply });
      } catch {
        await interaction.editReply("Tive uma pequena oscilação aqui. Poderia repetir?");
      }
    }
  }

  if (interaction.isButton() && interaction.customId === "audio_tts_trigger") {
    await interaction.deferReply({ ephemeral: true });
    try {
      const textToSpeak = interaction.message.content || "";
      if (!textToSpeak) return await interaction.editReply("Não há texto para reproduzir.");

      const audioBuf = await textToAudioBuffer(textToSpeak);
      if (audioBuf) {
        const file = new AttachmentBuilder(audioBuf, { name: "natasha-voz.mp3" });
        return await interaction.editReply({ files: [file] });
      }
      await interaction.editReply("Não consegui gerar o áudio no momento.");
    } catch {
      await interaction.editReply("Erro ao sintetizar áudio.");
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const isOwner = OWNER_IDS.includes(message.author.id);
  const isAdmin = message.member?.permissions.has("Administrator") || isOwner;

  // Auto-Mod
  const blocked = getBlockedWords();
  const lowerMsg = message.content.toLowerCase();
  if (!isAdmin && blocked.some((word) => lowerMsg.includes(word))) {
    await message.delete().catch(() => null);
    return;
  }

  // Desativa AFK do autor
  if (isAFK(message.author.id) && !message.content.startsWith(`${PREFIX}afk`)) {
    const previousAFK = removeAFK(message.author.id);
    const tempoAusente = formatTimePassed(previousAFK.timestamp);
    message.channel.send(`👋 Bem-vindo(a) de volta <@${message.author.id}>! Removi seu status de ausência (você ficou ausente por \`${tempoAusente}\`).`).then((m) => setTimeout(() => m.delete().catch(() => null), 8000));
  }

  // Avisa se alguém marcou usuário AFK
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach((mentionedUser) => {
      if (mentionedUser.id !== message.author.id && isAFK(mentionedUser.id)) {
        const afkInfo = getAFK(mentionedUser.id);
        const tempo = formatTimePassed(afkInfo.timestamp);

        const afkEmbed = new EmbedBuilder()
          .setColor("#3498DB")
          .setDescription(`💤 **<@${mentionedUser.id}> está ausente (AFK há \`${tempo}\`)**\n📝 **Motivo:** *${afkInfo.reason}*`);

        message.reply({ embeds: [afkEmbed] });
      }
    });
  }

  processChatXp(message.author.id, message.author.username);

  const helpers = loadCommonFunctions({ message });
  const body = message.content.trim();

  const autoCustom = getCustomResponse(body);
  if (autoCustom) return await helpers.reply(autoCustom);

  // Comandos por Prefixo
  if (body.startsWith(PREFIX)) {
    const args = body.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const context = {
      client,
      message,
      args,
      fullArgs: args.join(" "),
      fullMessage: body,
      isOwner,
      isAdmin,
      ...helpers,
    };

    return await dispatchCommand({ commandName, context });
  }

  // Interação Conversacional e Áudio
  const lowerBody = body.toLowerCase();
  const botMentioned = message.mentions.has(client.user.id);
  const botCalledByName = lowerBody.includes("natasha");
  const isDM = !message.guild;
  const firstAttachment = message.attachments.first();

  const isAudioMessage = firstAttachment && (
    firstAttachment.contentType?.includes("audio") ||
    firstAttachment.name?.endsWith(".ogg") ||
    firstAttachment.name?.endsWith(".mp3") ||
    firstAttachment.name?.endsWith(".wav") ||
    firstAttachment.name?.endsWith(".m4a")
  );

  if (isAudioMessage || botMentioned || botCalledByName || isDM) {
    await message.channel.sendTyping();

    let promptClean = body
      .replace(new RegExp(`<@!?${client.user.id}>`, "gi"), "")
      .replace(/natasha/gi, "")
      .trim();

    if (isAudioMessage && !promptClean) {
      promptClean = "Ouça este áudio e responda diretamente ao que foi falado:";
    }

    try {
      const mediaData = firstAttachment
        ? {
            url: firstAttachment.url,
            contentType: firstAttachment.contentType || "audio/ogg",
          }
        : null;

      const aiReply = await askAI({
        prompt: promptClean || "Oi!",
        userId: message.author.id,
        attachment: mediaData,
      });

      if (isAudioMessage || lowerBody.includes("audio") || lowerBody.includes("voz") || lowerBody.includes("fala")) {
        const audioBuf = await textToAudioBuffer(aiReply);
        if (audioBuf) {
          const audioAttachment = new AttachmentBuilder(audioBuf, { name: "natasha-resposta.mp3" });
          return await message.reply({ content: aiReply, files: [audioAttachment] });
        }
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("audio_tts_trigger").setLabel("Ouvir").setEmoji("🎙️").setStyle(ButtonStyle.Secondary)
      );

      await message.reply({ content: aiReply, components: [row] });
    } catch (err) {
      logErrorToFile("CONVERSATION_HANDLER", err);
      await helpers.reply("Não consegui entender sua mensagem agora. Pode mandar de novo?");
    }
  }
});

console.clear();
cfonts.say("NATASHA", {
  font: "block",
  align: "center",
  colors: ["magenta", "red"],
  background: "transparent",
  letterSpacing: 1,
  lineHeight: 1,
  space: true,
});

cfonts.say("DISCORD AI ASSISTANT • CRIADA POR RIQUEFLA", {
  font: "console",
  align: "center",
  colors: ["yellow"],
});

await loadCommands();
client.login(DISCORD_TOKEN);