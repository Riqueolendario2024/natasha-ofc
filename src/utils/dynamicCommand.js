import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../config.js";
import { logger, logErrorToFile } from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, "..", "commands");

export const commandsRegistry = new Map();

// Algoritmo de distância para sugerir comandos parecidos (Estilo Luna WhatsApp)
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findSimilarCommands(inputName) {
  const allNames = Array.from(new Set(Array.from(commandsRegistry.keys())));
  const scored = allNames
    .map((name) => ({
      name,
      distance: levenshteinDistance(inputName.toLowerCase(), name.toLowerCase()),
    }))
    .filter((item) => item.distance <= 3) // Tolerância de erro
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map((item) => item.name);

  return scored;
}

export async function loadCommands() {
  commandsRegistry.clear();
  if (!fs.existsSync(COMMANDS_DIR)) return;

  const categories = fs.readdirSync(COMMANDS_DIR);
  for (const cat of categories) {
    const catPath = path.join(COMMANDS_DIR, cat);
    if (!fs.statSync(catPath).isDirectory()) continue;

    const files = fs.readdirSync(catPath).filter((f) => f.endsWith(".js"));
    for (const file of files) {
      const filePath = path.join(catPath, file);
      try {
        const fileUrl = pathToFileURL(filePath).href;
        const imported = await import(fileUrl);
        const cmd = imported.default || imported;

        if (cmd && cmd.name) {
          commandsRegistry.set(cmd.name.toLowerCase(), cmd);
          if (Array.isArray(cmd.commands)) {
            cmd.commands.forEach((alias) => commandsRegistry.set(alias.toLowerCase(), cmd));
          }
        }
      } catch (err) {
        logErrorToFile("COMMAND_LOADER", `Falha no arquivo: ${file} - ${err.message}`);
      }
    }
  }
  logger.success(`Total de ${commandsRegistry.size} gatilhos de comandos carregados.`);
}

export async function dispatchCommand({ commandName, context }) {
  const cmd = commandsRegistry.get(commandName.toLowerCase());

  // 1. Comando Encontrado -> Executa normalmente
  if (cmd && typeof cmd.handle === "function") {
    try {
      return await cmd.handle(context);
    } catch (err) {
      logErrorToFile("COMMAND_EXECUTION", `Erro em ${commandName}: ${err.message}`);
      return await context.reply("⚠️ Ocorreu um erro ao executar esse comando.");
    }
  }

  // 2. Comando Não Encontrado -> Exibe o formato igual ao bot Luna do WhatsApp
  const suggestions = findSimilarCommands(commandName);
  const authorName = context.message?.author?.username || context.message?.user?.username || "Membro";
  const authorMention = context.message?.author?.id ? `<@${context.message.author.id}>` : `@${authorName}`;

  let desc = `❌ **Comando não encontrado** ❌\n\n`;
  desc += `👤 Olá ${authorMention}\n`;
  desc += `🔎 Você digitou: \`${PREFIX}${commandName}\`\n\n`;

  if (suggestions.length > 0) {
    desc += `💡 **Comandos Sugeridos:**\n\n`;
    suggestions.forEach((sug) => {
      desc += `• \`${PREFIX}${sug}\`\n`;
    });
    desc += `\n`;
  }

  desc += `📍 Use \`${PREFIX}menu\` para ver todos os comandos.`;

  const notFoundEmbed = new EmbedBuilder()
    .setColor("#E74C3C")
    .setDescription(desc)
    .setFooter({ text: "Natasha Assistant • Sistema de Ajuda Rápida" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("menu_home")
      .setLabel("Ver Menu Completo")
      .setEmoji("📖")
      .setStyle(ButtonStyle.Primary)
  );

  return await context.message.reply({ embeds: [notFoundEmbed], components: [row] });
}
