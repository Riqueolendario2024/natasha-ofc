import { EmbedBuilder } from "discord.js";
import { PREFIX, OWNER_ID } from "../../config.js";
import { addWarn, removeWarn, getWarns } from "../../utils/adminManager.js";

export default {
  name: "adverter",
  description: "Gerencia o sistema de advertências do servidor",
  category: "admin",
  commands: ["adv", "warn", "remover-adv", "advertencias", "lista-advertencias"],
  usage: `${PREFIX}adverter <@membro> [motivo]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const userMention = message.mentions?.users?.first();
    const commandText = message.content.toLowerCase();

    // Consulta de Advertências
    if (commandText.includes("advertencias") || commandText.includes("lista-adv")) {
      const target = userMention || message.author;
      const warns = getWarns(message.guild.id, target.id);

      if (warns.length === 0) {
        return await reply(`✅ <@${target.id}> não possui nenhuma advertência registrada.`);
      }

      const lista = warns.map((w, i) => `**${i + 1}.** ${w.reason} _(${w.date})_`).join("\n");
      const embed = new EmbedBuilder()
        .setColor("#F1C40F")
        .setTitle(`📋 Advertências de ${target.username}`)
        .setDescription(lista)
        .setFooter({ text: `Total: ${warns.length} advertência(s)` });

      return await message.reply({ embeds: [embed] });
    }

    if (!userMention) {
      return await reply(`Você precisa marcar o membro!\n*Exemplo:* \`${PREFIX}adverter @usuario Desrespeito\``);
    }

    if (userMention.id === OWNER_ID) return await reply("❌ Não é permitido advertir o criador!");

    // Remover Advertência
    if (commandText.includes("remover-adv")) {
      const remaining = removeWarn(message.guild.id, userMention.id);
      await sendReact?.("🗑️");
      return await reply(`✅ Uma advertência foi removida de <@${userMention.id}>. Total atual: \`${remaining}\`.`);
    }

    // Aplicar Advertência
    const motivo = args.slice(1).join(" ") || "Violação das regras do servidor";
    const totalWarns = addWarn(message.guild.id, userMention.id, motivo);

    await sendReact?.("⚠️");

    const embed = new EmbedBuilder()
      .setColor("#E67E22")
      .setTitle("⚠️ MEMBRO ADVERTIDO!")
      .setDescription(
        `👤 **Membro:** <@${userMention.id}>\n` +
        `🛡️ **Moderador:** <@${message.author.id}>\n` +
        `📝 **Motivo:** ${motivo}\n\n` +
        `📊 **Total de Advertências:** \`${totalWarns}/3\``
      )
      .setTimestamp();

    if (totalWarns >= 3) {
      embed.setFooter({ text: "Limite de 3 advertências atingido! Avalie a aplicação de banimento." });
    }

    await message.reply({ embeds: [embed] });
  },
};
