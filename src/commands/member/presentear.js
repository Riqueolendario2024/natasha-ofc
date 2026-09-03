import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, updateUser } from "../../utils/usersManager.js";

const LOJA = {
  chocolate: { nome: "🍫 Caixa de Bombom", preco: 30, emoji: "🍫" },
  flores: { nome: "💐 Buquê de Rosas", preco: 50, emoji: "💐" },
  alianca: { nome: "💍 Aliança de Diamante", preco: 150, emoji: "💍", ring: "Diamante Raro" },
  urso: { nome: "🧸 Ursinho de Pelúcia", preco: 40, emoji: "🧸" },
};

export default {
  name: "presentear",
  description: "Envia presentes e alianças para a pessoa amada usando NatashaCoins",
  commands: ["presente", "loja", "dar"],
  usage: `${PREFIX}presentear @pessoa <chocolate|flores|alianca|urso>`,
  handle: async ({ message, args, reply, sendReact }) => {
    const userMention = message.mentions.users.first();
    const itemKey = args[1]?.toLowerCase() || args[0]?.toLowerCase();

    // Mostra o catálogo da loja
    if (!userMention || !LOJA[itemKey]) {
      const catalogo = Object.entries(LOJA)
        .map(([k, item]) => `• \`${PREFIX}presentear @pessoa ${k}\` — **${item.nome}** (\`🪙 ${item.preco} coins\`)`)
        .join("\n");

      const embed = new EmbedBuilder()
        .setColor("#FF69B4")
        .setTitle("🛍️ Loja de Presentes Românticos")
        .setDescription(`Compre mimos para o seu par usando suas NatashaCoins!\n\n${catalogo}`)
        .setFooter({ text: "Natasha • Sistema de Presentes" });

      return await message.reply({ embeds: [embed] });
    }

    const senderData = getUser(message.author.id);
    const item = LOJA[itemKey];

    if ((senderData.coins || 0) < item.preco) {
      return await reply(`❌ Você não tem moedas suficientes! Esse item custa **🪙 ${item.preco} coins** e você tem **🪙 ${senderData.coins || 0}**.`);
    }

    // Deduz moedas e entrega o presente
    updateUser(message.author.id, { coins: senderData.coins - item.preco });

    const targetData = getUser(userMention.id);
    const inventario = targetData.inventory || [];
    inventario.push(item.nome);

    const updateTarget = { inventory: inventario };
    if (item.ring) updateTarget.ring = item.ring;
    updateUser(userMention.id, updateTarget);

    await sendReact("🎁");

    const embed = new EmbedBuilder()
      .setColor("#32CD32")
      .setTitle("🎁 Presente Entregue com Amor!")
      .setDescription(
        `💖 <@${message.author.id}> deu um(a) **${item.nome}** para <@${userMention.id}>!\n\n` +
        `🪙 **Preço:** \`${item.preco} coins\`\n` +
        `✨ _O carinho subiu de nível!_`
      );

    await message.reply({ content: `<@${userMention.id}>`, embeds: [embed] });
  },
};
