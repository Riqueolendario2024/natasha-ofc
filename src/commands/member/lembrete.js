import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === "s") return val * 1000;
  if (unit === "m") return val * 60 * 1000;
  if (unit === "h") return val * 60 * 60 * 1000;
  if (unit === "d") return val * 24 * 60 * 60 * 1000;
  return null;
}

export default {
  name: "lembrete",
  description: "Agenda um lembrete com temporizador e marca você quando o tempo acabar",
  category: "utilities",
  emoji: "⏰",
  commands: ["timer", "remind", "lembretes"],
  usage: `${PREFIX}lembrete <tempo: 30s | 15m | 2h> <mensagem do lembrete>`,
  handle: async ({ message, args, reply, sendReact }) => {
    const timeArg = args[0];
    if (!timeArg) {
      return await reply(
        `⏰ **Como usar:**\n` +
        `• \`${PREFIX}lembrete 30s tirar a pizza do forno\`\n` +
        `• \`${PREFIX}lembrete 15m reunião da call\`\n` +
        `• \`${PREFIX}lembrete 2h tomar água e descansar\``
      );
    }

    const durationMs = parseDuration(timeArg);
    if (!durationMs || durationMs < 5000 || durationMs > 24 * 60 * 60 * 1000) {
      return await reply("⚠️ Formato de tempo inválido! Use: `30s`, `15m` ou `2h` (mínimo 5s, máximo 24h).");
    }

    const reminderText = args.slice(1).join(" ").trim() || "Seu tempo acabou!";
    await sendReact?.("⏰");

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("⏰ LEMBRETE AGENDADO!")
      .setDescription(
        `Pode deixar, <@${message.author.id}>! Eu vou te avisar assim que o tempo acabar.\n\n` +
        `⏳ **Tempo:** \`${timeArg}\`\n` +
        `📝 **Lembrete:** *"${reminderText}"*`
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    // Temporizador assíncrono
    setTimeout(async () => {
      try {
        const alertEmbed = new EmbedBuilder()
          .setColor("#E74C3C")
          .setTitle("🔔 OPA! HORA DO SEU LEMBRETE!")
          .setDescription(
            `⏰ <@${message.author.id}>, o tempo de **${timeArg}** acabou!\n\n` +
            `📌 **Seu Lembrete:**\n> **${reminderText}**`
          )
          .setTimestamp();

        await message.channel.send({
          content: `🔔 <@${message.author.id}>`,
          embeds: [alertEmbed],
        });
      } catch {}
    }, durationMs);
  },
};
