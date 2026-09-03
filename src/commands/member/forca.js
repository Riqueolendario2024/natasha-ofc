import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/jogos_data.json"), "utf-8"));
export const activeForcaGames = new Map();

export default {
  name: "forca",
  description: "Jogo da Forca clássico no Discord",
  commands: ["hangman"],
  usage: `${PREFIX}forca [parar]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const channelId = message.channel.id;

    if (args[0]?.toLowerCase() === "parar") {
      if (!activeForcaGames.has(channelId)) return await reply("Não há nenhum jogo da forca em andamento neste canal.");
      activeForcaGames.delete(channelId);
      return await reply("🛑 Jogo da Forca cancelado!");
    }

    if (activeForcaGames.has(channelId)) {
      return await reply(`Já tem um jogo da Forca rolando neste canal! Use \`${PREFIX}forca parar\` para cancelar.`);
    }

    await sendReact("🪓");

    const sorted = data.forca[Math.floor(Math.random() * data.forca.length)];
    const palavra = sorted.palavra.toUpperCase();

    const game = {
      palavra,
      dica: sorted.dica,
      letrasDescobertas: Array(palavra.length).fill("＿"),
      tentativasRestantes: 6,
      letrasUsadas: new Set(),
      authorId: message.author.id,
    };

    activeForcaGames.set(channelId, game);

    const embed = new EmbedBuilder()
      .setColor("#E67E22")
      .setTitle("🎮 Jogo da Forca Iniciado!")
      .setDescription(
        `📝 **Palavra:** \`${game.letrasDescobertas.join(" ")}\`\n` +
        `💡 **Dica:** *${game.dica}*\n` +
        `❤️ **Vidas:** ${"❤️".repeat(game.tentativasRestantes)}\n\n` +
        `_Envie uma letra avulsa no chat para arriscar!_`
      )
      .setFooter({ text: `Iniciado por ${message.author.username}` });

    await message.reply({ embeds: [embed] });
  },
};
