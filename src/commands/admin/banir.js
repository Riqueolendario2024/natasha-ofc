import { PermissionFlagsBits } from "discord.js";
import { PREFIX, OWNER_ID } from "../../config.js";

export default {
  name: "banir",
  description: "Bane um membro do servidor",
  commands: ["ban", "kickar"],
  usage: `${PREFIX}banir <@membro> [motivo]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const userMention = message.mentions.users.first();
    if (!userMention) {
      return await reply(`Você precisa marcar quem deseja banir!\nExemplo: \`${PREFIX}banir @usuario Spam\``);
    }

    if (userMention.id === OWNER_ID) {
      return await reply("❌ Eu jamais baniria o meu criador, o lendário Riquefla! 👑");
    }

    if (userMention.id === message.author.id) {
      return await reply("❌ Você não pode banir a si mesmo.");
    }

    const memberTarget = message.guild?.members.cache.get(userMention.id);
    if (!memberTarget) {
      return await reply("❌ Membro não encontrado no servidor.");
    }

    if (!memberTarget.bannable) {
      return await reply("❌ Não posso banir esse membro. O cargo dele pode ser superior ao meu.");
    }

    const motivo = args.slice(1).join(" ") || "Não informado";

    try {
      await memberTarget.ban({ reason: `${motivo} (Banido por ${message.author.tag})` });
      await sendReact("🔨");
      await reply(`✅ O usuário **${userMention.tag}** foi banido com sucesso!\n📝 **Motivo:** ${motivo}`);
    } catch (err) {
      console.error("[BAN ERROR]", err);
      await reply("❌ Ocorreu um erro ao tentar banir o membro.");
    }
  },
};
