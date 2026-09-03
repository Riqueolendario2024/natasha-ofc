import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

export default {
  name: "enquete",
  description: "Cria uma votação rápida com opções entre aspas",
  commands: ["poll", "votacao"],
  usage: `${PREFIX}enquete "Pergunta" "Opção 1" "Opção 2"`,
  handle: async ({ message, reply, fullArgs }) => {
    const matches = fullArgs.match(/"(.*?)"/g);
    if (!matches || matches.length < 3) {
      return await reply(`Formato incorreto!\n*Exemplo:* \`${PREFIX}enquete "Qual a melhor engine?" "Godot" "Unity" "GameMaker"\``);
    }

    const argsFormatados = matches.map((m) => m.slice(1, -1));
    const pergunta = argsFormatados.shift();
    const opcoes = argsFormatados.slice(0, 9);

    let textoOpcoes = "";
    opcoes.forEach((opt, i) => {
      textoOpcoes += `${emojis[i]} — **${opt}**\n\n`;
    });

    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(`📊 Enquete: ${pergunta}`)
      .setDescription(textoOpcoes)
      .setFooter({ text: `Criada por ${message.author.username} • Reaja para votar!` })
      .setTimestamp();

    const enqueteMsg = await message.channel.send({ embeds: [embed] });

    for (let i = 0; i < opcoes.length; i++) {
      await enqueteMsg.react(emojis[i]).catch(() => null);
    }
  },
};
