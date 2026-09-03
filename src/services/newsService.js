import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const RSS_FEEDS = {
  brasil: "https://g1.globo.com/rss/g1/brasil/",
  mundo: "https://g1.globo.com/rss/g1/mundo/",
  tecnologia: "https://g1.globo.com/rss/g1/tecnologia/",
  esportes: "https://ge.globo.com/rss/ge/",
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export async function fetchNews(category = "brasil") {
  const feedUrl = RSS_FEEDS[category.toLowerCase()] || RSS_FEEDS.brasil;

  try {
    const response = await axios.get(feedUrl, {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    const parsed = parser.parse(response.data);
    const items = parsed?.rss?.channel?.item;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return null;
    }

    const topNoticias = items.slice(0, 3).map((item) => {
      let desc = (item.description || "").replace(/<[^>]*>?/gm, "").trim();
      if (desc.length > 120) desc = desc.slice(0, 117) + "...";

      return {
        titulo: item.title,
        link: item.link,
        resumo: desc || "Clique no link para ler a matéria completa.",
        data: item.pubDate ? new Date(item.pubDate).toLocaleDateString("pt-BR") : "Hoje",
      };
    });

    return topNoticias;
  } catch (err) {
    console.error("[News Error]:", err.message);
    return null;
  }
}

export function buildNewsPayload(category, noticias) {
  const catNome = category.charAt(0).toUpperCase() + category.slice(1);
  const embed = new EmbedBuilder()
    .setColor("#E74C3C")
    .setTitle(`📰 Principais Notícias — ${catNome}`)
    .setDescription("Aqui estão os destaques em tempo real:")
    .setTimestamp()
    .setFooter({ text: "Natasha • Notícias em Tempo Real" });

  let ttsText = `Principais notícias de ${catNome}: `;

  noticias.forEach((n, i) => {
    embed.addFields({
      name: `${i + 1}. ${n.titulo}`,
      value: `${n.resumo}\n📅 *${n.data}* • [Ler Notícia Completa](${n.link})`,
    });
    ttsText += `Notícia ${i + 1}: ${n.titulo}. `;
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`news_refresh_${category}`)
      .setLabel("Atualizar")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("audio_tts_trigger")
      .setLabel("Ouvir Resumo")
      .setEmoji("🎙️")
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, row, ttsText: ttsText.slice(0, 200) };
}
