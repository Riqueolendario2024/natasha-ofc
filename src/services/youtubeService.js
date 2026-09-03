import yts from "yt-search";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

// Cache em memória para histórico de pesquisas recentes por canal/usuário
export const youtubeSearchHistory = new Map();

export async function searchYouTube(query, limit = 3) {
  try {
    const res = await yts(query);
    if (!res || !res.videos || res.videos.length === 0) return null;

    const videos = res.videos.slice(0, limit).map((v) => ({
      id: v.videoId,
      url: v.url,
      title: v.title,
      description: v.description ? v.description.slice(0, 120) + "..." : "Sem descrição.",
      duration: v.timestamp || "Duração não informada",
      views: v.views ? Number(v.views).toLocaleString("pt-BR") : "N/A",
      author: v.author?.name || "Canal desconhecido",
      thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
      ago: v.ago || "Recentemente",
    }));

    return videos;
  } catch (err) {
    console.error("[YouTube Search Error]:", err);
    return null;
  }
}

export function buildYouTubePayload(videos, query, userTag = "") {
  if (!videos || videos.length === 0) return null;

  const top = videos[0];

  const embed = new EmbedBuilder()
    .setColor("#FF0000")
    .setTitle(`🎬 ${top.title}`)
    .setURL(top.url)
    .setDescription(
      `📺 **Canal:** ${top.author}\n⏱️ **Duração:** \`${top.duration}\` • 👁️ **Views:** \`${top.views}\`\n📅 **Publicado:** ${top.ago}\n\n📝 ${top.description}`
    )
    .setImage(top.thumbnail)
    .setFooter({ text: `Natasha • Busca: "${query}"` });

  // Lista de outros vídeos encontrados caso haja mais de 1
  if (videos.length > 1) {
    let outros = "";
    videos.slice(1).forEach((v, i) => {
      outros += `**${i + 2}.** [${v.title}](${v.url}) • \`${v.duration}\` (${v.author})\n`;
    });
    embed.addFields({ name: "📌 Outras opções encontradas:", value: outros });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Assistir no YouTube")
      .setStyle(ButtonStyle.Link)
      .setURL(top.url)
      .setEmoji("▶️"),
    new ButtonBuilder()
      .setCustomId("audio_tts_trigger")
      .setLabel("Ouvir Resumo")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🎙️")
  );

  const ttsText = `Encontrei o vídeo ${top.title} do canal ${top.author}, com duração de ${top.duration}.`;

  return { embed, row, ttsText, videos };
}
