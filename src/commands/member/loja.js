import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, updateUser, removeCoins } from "../../utils/usersManager.js";
import { getRPGPlayer, saveRPGPlayer } from "../../tools/rpgEngine.js";

const ITENS = [
  { id: "pocao", name: "Poção de Cura (+40 HP)", price: 60, emoji: "🧪", desc: "Item essencial para as batalhas de RPG" },
  { id: "espada_ferro", name: "Espada de Ferro (+10 Dano)", price: 400, emoji: "⚔️", desc: "Aumenta seu poder no RPG Natasha Battle" },
  { id: "vara_pro", name: "Vara de Pesca de Fibra", price: 300, emoji: "🎣", desc: "Aumenta a chance de fisgar peixes lendários" },
  { id: "anel_ouro", name: "Aliança de Ouro Real", price: 1000, emoji: "💍", desc: "Item de luxo para casamentos no servidor" },
];

export default {
  name: "loja",
  description: "Loja oficial de itens, consumíveis de RPG e equipamentos",
  category: "economy",
  commands: ["shop", "mercado", "comprar"],
  usage: `${PREFIX}loja [comprar <id>]`,
  handle: async ({ message, args, reply, sendReact }) => {
    const userId = message.author.id;
    const user = getUser(userId);

    if (args[0]?.toLowerCase() === "comprar") {
      const itemId = args[1]?.toLowerCase();
      const item = ITENS.find((i) => i.id === itemId);

      if (!item) return await reply(`Item não encontrado! Confira a lista com \`${PREFIX}loja\`.`);
      if (user.coins < item.price) return await reply(`❌ Saldo insuficiente! Você precisa de \`🪙 ${item.price} coins\`.`);

      removeCoins(userId, item.price);

      // Aplicação do item no RPG/Perfil
      if (item.id === "pocao") {
        const rpg = getRPGPlayer(userId, message.author.username);
        rpg.potions = (rpg.potions || 0) + 1;
        saveRPGPlayer(userId, rpg);
      } else if (item.id === "espada_ferro") {
        const rpg = getRPGPlayer(userId, message.author.username);
        rpg.equippedWeapon = "Espada de Ferro (+10)";
        rpg.weaponBonus = 10;
        saveRPGPlayer(userId, rpg);
      } else {
        user.inventory = user.inventory || [];
        user.inventory.push(item.name);
        updateUser(userId, user);
      }

      await sendReact?.("🛍️");
      return await reply(`🎉 **Compra realizada com sucesso!** Você adquiriu **${item.emoji} ${item.name}**.`);
    }

    await sendReact?.("🏪");

    let desc = "Bem-vindo(a) ao mercado central! Para comprar, use: `!loja comprar <id>`\n\n";
    ITENS.forEach((item) => {
      desc += `${item.emoji} **${item.name}** — \`🪙 ${item.price} coins\`\n`;
      desc += `   └── *${item.desc}* • ID: \`${item.id}\`\n\n`;
    });

    const embed = new EmbedBuilder()
      .setColor("#E67E22")
      .setTitle("🏪 MERCADO RETRÔ DA NATASHA")
      .setDescription(desc)
      .setFooter({ text: `Seu Saldo Atual: 🪙 ${user.coins} coins` });

    await message.reply({ embeds: [embed] });
  },
};
