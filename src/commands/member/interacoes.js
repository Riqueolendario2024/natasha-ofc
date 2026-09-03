import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const ACOES = {
  abraco: {
    text: (a, b) => `🤗 **${a}** deu um abraço apertado e quentinho em **${b}**!`,
    gif: "https://media.giphy.com/media/l2QDM9Jnim1YV5bxC/giphy.gif",
    emoji: "🤗",
  },
  cafune: {
    text: (a, b) => `💆 **${a}** fez um cafuné gostoso em **${b}**!`,
    gif: "https://media.giphy.com/media/ye7OTQgwmVuNTY22QC/giphy.gif",
    emoji: "💆",
  },
  chute: {
    text: (a, b) => `🦵 **${a}** deu uma voadora cinematográfica em **${b}**!`,
    gif: "https://media.giphy.com/media/wOly8pa4s4W88/giphy.gif",
    emoji: "💥",
  },
  soco: {
    text: (a, b) => `👊 **${a}** acertou um soco direto no queixo de **${b}**!`,
    gif: "https://media.giphy.com/media/10gZ28k7689xXW/giphy.gif",
    emoji: "👊",
  },
  tapa: {
    text: (a, b) => `👋 **${a}** deu um estalo de tapa na cara de **${b}**!`,
    gif: "https://media.giphy.com/media/jLeyZWgtwWP2U/giphy.gif",
    emoji: "👋",
  },
  morder: {
    text: (a, b) => `🦷 **${a}** deu uma mordidinha carinhosa em **${b}**!`,
    gif: "https://media.giphy.com/media/OqJ92TjIusVD2/giphy.gif",
    emoji: "🦷",
  },
  matar: {
    text: (a, b) => `⚰️ **${a}** eliminou **${b}** com um golpe fatal!`,
    gif: "https://media.giphy.com/media/3o7TKr3nzbh5WgCFxe/giphy.gif",
    emoji: "💀",
  },
};

export default {
  name: "abraco",
  description: "Executa interações e ações animadas entre membros",
  category: "games",
  commands: ["cafune", "chute", "soco", "tapa", "morder", "matar", "bater"],
  usage: `${PREFIX}<acao> <@membro>`,
  handle: async ({ message, reply, sendReact }) => {
    const rawCmd = message.content.slice(PREFIX.length).trim().split(/ +/)[0].toLowerCase();
    const target = message.mentions?.users?.first();

    if (!target) return await reply("Você precisa marcar alguém para essa ação!");
    if (target.id === message.author.id) return await reply("Você não pode fazer isso consigo mesmo!");

    const acaoKey = rawCmd === "bater" ? "soco" : rawCmd;
    const acao = ACOES[acaoKey] || ACOES.abraco;

    await sendReact?.(acao.emoji);

    const embed = new EmbedBuilder()
      .setColor("#FF1493")
      .setDescription(acao.text(message.author.username, target.username))
      .setImage(acao.gif)
      .setFooter({ text: "Natasha • Interações" });

    await message.reply({ content: `<@${target.id}>`, embeds: [embed] });
  },
};
