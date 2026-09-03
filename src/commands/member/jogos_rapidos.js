import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { PREFIX } from "../../config.js";
import { addCoins, removeCoins } from "../../utils/usersManager.js";

export default {
  name: "jokenpo",
  description: "Mini-jogos rápidos de sorte e habilidade (Jokenpô, Pênalti e Roleta Russa)",
  category: "games",
  commands: ["penalti", "roleta-russa", "ppt", "chute-gol"],
  usage: `${PREFIX}jokenpo | ${PREFIX}penalti | ${PREFIX}roleta-russa`,
  handle: async ({ message, reply, sendReact }) => {
    const rawCmd = message.content.slice(PREFIX.length).trim().split(/ +/)[0].toLowerCase();

    // 1. Jokenpô
    if (rawCmd === "jokenpo" || rawCmd === "ppt") {
      await sendReact?.("✂️");
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("jkp_pedra").setLabel("Pedra").setEmoji("🪨").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("jkp_papel").setLabel("Papel").setEmoji("📄").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("jkp_tesoura").setLabel("Tesoura").setEmoji("✂️").setStyle(ButtonStyle.Primary)
      );

      const embed = new EmbedBuilder()
        .setColor("#3498DB")
        .setTitle("✊ ✋ ✌️ Pedra, Papel ou Tesoura?")
        .setDescription("Faça a sua jogada contra a Natasha!");

      const msg = await message.reply({ embeds: [embed], components: [row] });
      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 20000,
        max: 1,
      });

      collector.on("collect", async (i) => {
        const botChoices = ["pedra", "papel", "tesoura"];
        const botChoice = botChoices[Math.floor(Math.random() * 3)];
        const userChoice = i.customId.replace("jkp_", "");

        let res = "🤝 Empate!";
        if (
          (userChoice === "pedra" && botChoice === "tesoura") ||
          (userChoice === "papel" && botChoice === "pedra") ||
          (userChoice === "tesoura" && botChoice === "papel")
        ) {
          res = "🎉 Você Ganhou! (+20 coins)";
          addCoins(message.author.id, 20);
        } else if (userChoice !== botChoice) {
          res = "🤖 A Natasha Venceu!";
        }

        await i.update({
          content: `Você jogou **${userChoice}** e a Natasha jogou **${botChoice}**!\n**Resultado:** ${res}`,
          embeds: [],
          components: [],
        });
      });
      return;
    }

    // 2. Pênalti
    if (rawCmd === "penalti" || rawCmd === "chute-gol") {
      await sendReact?.("⚽");
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pen_esq").setLabel("Canto Esquerdo").setEmoji("⬅️").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("pen_meio").setLabel("No Meio").setEmoji("⬆️").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("pen_dir").setLabel("Canto Direito").setEmoji("➡️").setStyle(ButtonStyle.Success)
      );

      const embed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle("⚽ COBRANÇA DE PÊNALTI!")
        .setDescription("A Natasha foi pro gol! Escolha onde vai chutar a bola:");

      const msg = await message.reply({ embeds: [embed], components: [row] });
      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 20000,
        max: 1,
      });

      collector.on("collect", async (i) => {
        const cantos = ["pen_esq", "pen_meio", "pen_dir"];
        const defesa = cantos[Math.floor(Math.random() * 3)];

        if (i.customId === defesa) {
          await i.update({
            content: `🧤 **DEFENDEU!** A Natasha pulou certo e pegou o seu pênalti!`,
            embeds: [],
            components: [],
          });
        } else {
          addCoins(message.author.id, 35);
          await i.update({
            content: `⚽🥅 **GOOOOOOOL!** Bola de um lado, goleira do outro! Ganhou **+35 NatashaCoins**!`,
            embeds: [],
            components: [],
          });
        }
      });
      return;
    }

    // 3. Roleta Russa
    if (rawCmd === "roleta-russa") {
      await sendReact?.("🔫");
      const tiro = Math.floor(Math.random() * 6) === 0;

      if (tiro) {
        removeCoins(message.author.id, 50);
        return await reply("💥 **POW!** A bala estava na câmara! Você tomou o tiro e perdeu 50 moedas para o hospital.");
      } else {
        addCoins(message.author.id, 25);
        return await reply("*Click!* 💨 Câmara vazia! Você sobreviveu e faturou **+25 NatashaCoins**.");
      }
    }
  },
};
