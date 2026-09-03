import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";
import { getUser, updateUser, addCoins, removeCoins } from "../../utils/usersManager.js";

const ACOES = [
  { id: "gdt", name: "Godot Engine Corp", basePrice: 120 },
  { id: "flm", name: "Flamengo Token", basePrice: 250 },
  { id: "pix", name: "PixelArt Studios", basePrice: 80 },
  { id: "ai", name: "Natasha Intelligence", basePrice: 350 },
];

function getStockPrice(base) {
  const hour = new Date().getHours();
  const day = new Date().getDate();
  const seed = (hour * 31 + day * 7) % 100;
  const variation = (seed - 50) / 100; // -50% a +50%
  return Math.max(10, Math.floor(base * (1 + variation)));
}

export default {
  name: "bolsa",
  description: "Invista e negocie ações no mercado financeiro da comunidade",
  category: "economy",
  commands: ["acoes", "investir", "stock"],
  usage: `${PREFIX}bolsa [comprar | vender] <id> <quantia>`,
  handle: async ({ message, args, reply, sendReact }) => {
    const userId = message.author.id;
    const user = getUser(userId);
    user.stocks = user.stocks || {};

    const acao = args[0]?.toLowerCase();
    const stockId = args[1]?.toLowerCase();
    const qty = parseInt(args[2], 10) || 1;

    // Compra de Ações
    if (acao === "comprar") {
      const targetStock = ACOES.find((s) => s.id === stockId);
      if (!targetStock) return await reply("Ação não encontrada! Use `!bolsa` para ver o mercado.");

      const currentPrice = getStockPrice(targetStock.basePrice);
      const totalCost = currentPrice * qty;

      if (user.coins < totalCost) {
        return await reply(`❌ Saldo insuficiente! Comprar ${qty}x ${targetStock.name} custa \`🪙 ${totalCost} coins\`.`);
      }

      removeCoins(userId, totalCost);
      user.stocks[stockId] = (user.stocks[stockId] || 0) + qty;
      updateUser(userId, user);

      await sendReact?.("📈");
      return await reply(`📈 Você comprou **${qty}x ação(ões) da ${targetStock.name}** por \`🪙 ${totalCost} coins\`!`);
    }

    // Venda de Ações
    if (acao === "vender") {
      const targetStock = ACOES.find((s) => s.id === stockId);
      if (!targetStock) return await reply("Ação não encontrada!");

      const userShares = user.stocks[stockId] || 0;
      if (userShares < qty) return await reply(`Você só possui ${userShares} ações dessa empresa para vender!`);

      const currentPrice = getStockPrice(targetStock.basePrice);
      const totalPayout = currentPrice * qty;

      user.stocks[stockId] -= qty;
      addCoins(userId, totalPayout);
      updateUser(userId, user);

      await sendReact?.("📉");
      return await reply(`📉 Você vendeu **${qty}x ação(ões) da ${targetStock.name}** por \`🪙 +${totalPayout} coins\`!`);
    }

    // Painel do Mercado de Ações
    await sendReact?.("📊");

    let desc = "Acompanhe as cotações em tempo real. Os valores flutuam a cada hora!\n\n";
    ACOES.forEach((s) => {
      const preco = getStockPrice(s.basePrice);
      const userHas = user.stocks[s.id] || 0;
      const variacao = preco >= s.basePrice ? "🟢 Alta" : "🔴 Baixa";

      desc += `🏢 **${s.name}** (\`${s.id.toUpperCase()}\`)\n`;
      desc += `   └── 💵 Cotação: \`🪙 ${preco} coins\` (${variacao})\n`;
      desc += `   └── 📦 Você possui: \`${userHas} ações\`\n\n`;
    });

    desc += `💡 *Para operar use:* \`${PREFIX}bolsa comprar <id> <quantia>\` ou \`${PREFIX}bolsa vender <id> <quantia>\``;

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("📊 BOLSA DE VALORES DA NATASHA")
      .setDescription(desc)
      .setFooter({ text: `Seu Saldo em Mãos: 🪙 ${user.coins} coins` });

    await message.reply({ embeds: [embed] });
  },
};
