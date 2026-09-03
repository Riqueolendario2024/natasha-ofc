import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const CANTADAS = [
  "Você não é a Godot 4, mas quando olho pra você meu coração compila na hora! 💘",
  "Você é Wi-Fi? Porque estou sentindo uma conexão incrível aqui. ✨",
  "Me chama de tabela do banco de dados e me dá um relacionamento 1 pra 1! 💻",
  "Se beleza fosse linha de código, você seria o projeto inteiro. 😍",
];

const RESPOSTAS_VIDENTE = [
  "🔮 As cartas dizem que com certeza sim!",
  "🔮 Não conte muito com isso hoje...",
  "🔮 É melhor você não saber agora...",
  "🔮 O destino indica que o sucesso virá em breve!",
  "🔮 100% de certeza!",
];

export default {
  name: "cantada",
  description: "Comandos sociais variados (Cantada, Vidente, Fofoca, PPP)",
  category: "games",
  commands: ["vidente", "fofoca", "ppp", "chance"],
  usage: `${PREFIX}cantada [@membro] ou ${PREFIX}vidente <pergunta>`,
  handle: async ({ message, args, fullArgs, reply, sendReact }) => {
    const rawCmd = message.content.slice(PREFIX.length).trim().split(/ +/)[0].toLowerCase();

    if (rawCmd === "cantada") {
      await sendReact?.("💘");
      const target = message.mentions?.users?.first();
      const cantada = CANTADAS[Math.floor(Math.random() * CANTADAS.length)];
      if (target) {
        return await message.reply({ content: `<@${target.id}>`, embeds: [new EmbedBuilder().setColor("#FF69B4").setDescription(`😏 ${cantada}`)] });
      }
      return await reply(`😏 ${cantada}`);
    }

    if (rawCmd === "vidente" || rawCmd === "chance") {
      await sendReact?.("🔮");
      if (!fullArgs) return await reply("Faça sua pergunta para a bola de cristal da Natasha!");
      const r = RESPOSTAS_VIDENTE[Math.floor(Math.random() * RESPOSTAS_VIDENTE.length)];
      return await message.reply(`🔮 **Pergunta:** _"${fullArgs}"_\n✨ **Vidente Natasha:** **${r}**`);
    }

    if (rawCmd === "fofoca") {
      await sendReact?.("🤫");
      const members = (await message.guild.members.fetch()).filter((m) => !m.user.bot);
      const m1 = members.random()?.user;
      const m2 = members.random()?.user;
      return await message.reply(`🤫 **FOFOCA DO DIA:** Ficaram sabendo que <@${m1?.id}> foi visto(a) de papinho escondido com <@${m2?.id}> na madrugada? 👀`);
    }

    if (rawCmd === "ppp") {
      await sendReact?.("💋");
      const members = (await message.guild.members.fetch()).filter((m) => !m.user.bot);
      const p1 = members.random()?.user;
      const p2 = members.random()?.user;
      const p3 = members.random()?.user;

      const embed = new EmbedBuilder()
        .setColor("#FF007F")
        .setTitle("💋 Pegar, Pensar ou Passar?")
        .setDescription(
          `1. <@${p1?.id}> — 💋 **Pega?**\n` +
          `2. <@${p2?.id}> — 🤔 **Pensa?**\n` +
          `3. <@${p3?.id}> — 🚪 **Passa?**\n\n` +
          `_Responda com sinceridade no chat!_`
        );
      return await message.reply({ embeds: [embed] });
    }
  },
};
