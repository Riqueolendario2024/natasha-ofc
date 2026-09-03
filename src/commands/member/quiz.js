import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { addCoins, removeCoins, getCoins } from "../../utils/usersManager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/jogos_data.json"), "utf-8"));

export default {
  name: "quiz",
  description: "Quiz de conhecimentos gerais com apostas de NatashaCoins",
  commands: ["trivia", "perguntas"],
  usage: `${PREFIX}quiz`,
  handle: async ({ message, reply, sendReact }) => {
    await sendReact("🧠");

    const item = data.quiz[Math.floor(Math.random() * data.quiz.length)];

    const embed = new EmbedBuilder()
      .setColor("#9B59B6")
      .setTitle("🧠 Natasha Quiz: Desafie sua Mente!")
      .setDescription(
        `📌 **Pergunta:**\n**${item.pergunta}**\n\n` +
        `🅰️ ${item.opcoes.a}\n` +
        `🅱️ ${item.opcoes.b}\n` +
        `🅲 ${item.opcoes.c}\n` +
        `🅳 ${item.opcoes.d}\n\n` +
        `💰 **Recompensa:** \`+30 NatashaCoins\`\n` +
        `📉 **Penalidade:** \`-10 NatashaCoins\``
      )
      .setFooter({ text: "Você tem 20 segundos para responder!" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("quiz_a").setLabel("A").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("quiz_b").setLabel("B").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("quiz_c").setLabel("C").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("quiz_d").setLabel("D").setStyle(ButtonStyle.Primary)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 20000,
      max: 1,
    });

    collector.on("collect", async (i) => {
      const choice = i.customId.replace("quiz_", "").toLowerCase();

      if (choice === item.correta) {
        addCoins(message.author.id, 30);
        const novoSaldo = getCoins(message.author.id);
        await i.update({
          content: `🎉 **ACERTOU EM CHEIO!** Resposta correta: **${item.correta.toUpperCase()}) ${item.opcoes[item.correta]}**.\n💰 Ganhou **30 NatashaCoins**! Saldo: \`🪙 ${novoSaldo} coins\`.`,
          embeds: [],
          components: [],
        });
      } else {
        removeCoins(message.author.id, 10);
        const novoSaldo = getCoins(message.author.id);
        await i.update({
          content: `❌ **ERROU!** A resposta correta era **${item.correta.toUpperCase()}) ${item.opcoes[item.correta]}**.\n📉 Perdeu **10 NatashaCoins**. Saldo: \`🪙 ${novoSaldo} coins\`.`,
          embeds: [],
          components: [],
        });
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time" && collected.size === 0) {
        await msg.edit({ content: "⏰ Tempo esgotado para responder o Quiz!", components: [] }).catch(() => null);
      }
    });
  },
};
