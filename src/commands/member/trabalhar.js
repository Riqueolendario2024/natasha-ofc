import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, updateUser, addCoins } from "../../utils/usersManager.js";
import { getRPGPlayer, saveRPGPlayer, applyExp } from "../../tools/rpgEngine.js";

const TRABALHOS = [
  { job: "Desenvolvedor Godot 4", min: 180, max: 320, frase: "compilou uma mecânica de combate 2D sem erros no GDScript" },
  { job: "Pixel Artist", min: 150, max: 280, frase: "desenhou um pacote de sprites e animações retrô incríveis" },
  { job: "Level Designer", min: 140, max: 260, frase: "criou um mapa de masmorra cheio de puzzles e passagens secretas" },
  { job: "Programador de Shaders", min: 200, max: 380, frase: "otimizou os efeitos de iluminação e reflexo do jogo" },
  { job: "Streamer de Jogos Indie", min: 120, max: 300, frase: "fez uma live épica jogando com a galera da comunidade" }
];

export default {
  name: "trabalhar",
  description: "Trabalhe em funções de Game Dev para receber seu salário em NatashaCoins e EXP",
  category: "economy",
  commands: ["work", "trampar", "job"],
  usage: `${PREFIX}trabalhar`,
  handle: async ({ message, reply, sendReact }) => {
    const userId = message.author.id;
    const user = getUser(userId);
    const now = Date.now();
    const cooldown = 30 * 60 * 1000; // 30 minutos

    if (now - (user.lastWork || 0) < cooldown) {
      const rest = cooldown - (now - user.lastWork);
      const min = Math.ceil(rest / (1000 * 60));
      return await reply(`⏳ Você já concluiu seu expediente! Descanse mais \`${min} minuto(s)\` para trabalhar novamente.`);
    }

    await sendReact?.("💼");

    const t = TRABALHOS[Math.floor(Math.random() * TRABALHOS.length)];
    const salary = Math.floor(Math.random() * (t.max - t.min + 1)) + t.min;
    const expGain = 35;

    user.lastWork = now;
    user.job = t.job;
    updateUser(userId, user);

    addCoins(userId, salary);

    const rpgP = getRPGPlayer(userId, message.author.username);
    const up = applyExp(rpgP, expGain);
    saveRPGPlayer(userId, rpgP);

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("💼 EXPEDIENTE CONCLUÍDO!")
      .setDescription(
        `👨‍💻 **Profissão:** \`${t.job}\`\n` +
        `🛠️ **Ação:** Você ${t.frase}!\n\n` +
        `💰 **Salário Recebido:** \`🪙 +${salary} NatashaCoins\`\n` +
        `🌟 **EXP de Aventureiro:** \`+${expGain} EXP\`\n` +
        (up ? `\n🎉 **LEVEL UP!** Você subiu para o Nível **${rpgP.level}**!` : "")
      )
      .setFooter({ text: "Natasha • Carreira Profissional" });

    await message.reply({ embeds: [embed] });
  },
};
