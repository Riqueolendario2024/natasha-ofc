import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

export default {
  name: "sorteio",
  description: "Realiza um sorteio rápido entre os membros online do servidor",
  category: "admin",
  commands: ["giveaway", "sortear"],
  usage: `${PREFIX}sorteio <prêmio>`,
  handle: async ({ message, fullArgs, reply, sendReact }) => {
    const premio = fullArgs || "Cargo VIP / Moedas";
    await sendReact?.("🎉");

    const members = await message.guild.members.fetch();
    const eligible = members.filter((m) => !m.user.bot);
    const winner = eligible.random()?.user;

    if (!winner) return await reply("Não há membros suficientes para sortear.");

    const embed = new EmbedBuilder()
      .setColor("#9B59B6")
      .setTitle("🎉 SORTEIO REALIZADO! 🎉")
      .setDescription(
        `🎁 **Prêmio:** \`${premio}\`\n\n` +
        `🏆 **Ganhador(a):** <@${winner.id}> (${winner.tag})\n\n` +
        `_Parabéns! Entre em contato com a moderação para resgatar._`
      )
      .setFooter({ text: `Sorteio iniciado por ${message.author.username}` })
      .setTimestamp();

    await message.channel.send({ content: `🎊 Parabéns <@${winner.id}>!`, embeds: [embed] });
  },
};
