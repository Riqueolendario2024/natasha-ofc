import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const missoes = [
  { desc: "Trocar 20 mensagens no chat geral e enviar 1 comando de Game Dev", meta: 20, reward: 150 },
  { desc: "Jogar uma partida de Jogo da Velha (!velha) com outro membro", meta: 1, reward: 100 },
  { desc: "Fazer uma pergunta sobre programação para a Natasha", meta: 1, reward: 80 },
];

export default {
  name: "missao",
  description: "Exibe a missão comunitária diária do servidor",
  commands: ["missoes", "dailyquest", "quest"],
  usage: `${PREFIX}missao`,
  handle: async ({ reply, sendReact }) => {
    await sendReact("🎯");

    const missaoHoje = missoes[new Date().getDay() % missoes.length];

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("🎯 Missão Comunitária do Dia")
      .setDescription(
        `📋 **Objetivo:**\n${missaoHoje.desc}\n\n` +
        `🪙 **Recompensa:** \`+${missaoHoje.reward} NatashaCoins\`\n` +
        `⏳ **Status:** 🟢 Aberta para todos os membros!`
      )
      .setFooter({ text: "Natasha • Complete para ganhar moedas" });

    await reply({ embeds: [embed] });
  },
};
