import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const frasesPadrao = [
  "Eu nunca fingi que estava ocupado para não responder alguém.",
  "Eu nunca quebrei um código em produção numa sexta-feira 18h.",
  "Eu nunca passei a noite inteira jogando videogame em vez de dormir.",
  "Eu nunca mandei mensagem bêbado para o(a) ex.",
  "Eu nunca menti minha idade na internet.",
  "Eu nunca copiei código do StackOverflow sem entender como funciona.",
];

export default {
  name: "eununca",
  description: "Inicia uma rodada de Eu Nunca interativa",
  commands: ["never", "eununcajogo"],
  usage: `${PREFIX}eununca [frase personalizada]`,
  handle: async ({ reply, sendReact, fullArgs, message }) => {
    await sendReact("🤔");

    const frase = fullArgs.trim() || frasesPadrao[Math.floor(Math.random() * frasesPadrao.length)];

    const embed = new EmbedBuilder()
      .setColor("#9B59B6")
      .setTitle("🙈 Eu Nunca — Rodada Aberta!")
      .setDescription(
        `📌 **Frase da Rodada:**\n**"${frase}"**\n\n` +
        `Vote nas reações abaixo:\n` +
        `🙋‍♂️ — **Eu Já!**\n` +
        `🙅‍♀️ — **Eu Nunca!**`
      )
      .setFooter({ text: `Iniciado por ${message.author.username} • Reaja para votar!` })
      .setTimestamp();

    const enqueteMsg = await message.channel.send({ embeds: [embed] });
    await enqueteMsg.react("🙋‍♂️").catch(() => null);
    await enqueteMsg.react("🙅‍♀️").catch(() => null);
  },
};
