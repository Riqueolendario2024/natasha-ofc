import axios from "axios";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { EmbedBuilder, AttachmentBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

// Função que baixa o áudio do YouTube em MP3 usando yt-dlp e ffmpeg
function downloadYouTubeMp3(query) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(os.tmpdir(), `song_${Date.now()}.mp3`);
    
    // yt-dlp busca no YouTube, pega o melhor áudio e converte via ffmpeg para MP3
    const ytdl = spawn("yt-dlp", [
      `ytsearch1:${query}`,
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "128K",
      "-o", tempFile,
      "--no-playlist",
      "--max-filesize", "25M",
    ]);

    ytdl.on("close", (code) => {
      if (code === 0 && fs.existsSync(tempFile)) {
        const buffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile); // Limpa o arquivo temporário
        resolve(buffer);
      } else {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        resolve(null);
      }
    });

    ytdl.on("error", (err) => {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      resolve(null);
    });
  });
}

export default {
  name: "letra",
  description: "Busca informações oficiais da música e envia o arquivo MP3 direto no chat para ouvir",
  category: "utilities",
  emoji: "🎵",
  commands: ["musica", "play-mp3", "som", "ouvir"],
  usage: `${PREFIX}letra <nome da música>`,
  handle: async ({ message, fullArgs, reply, sendReact }) => {
    if (!fullArgs) {
      return await reply(`Digite o nome da música!\n*Exemplo:* \`${PREFIX}letra Rosa Embriagada\``);
    }

    await sendReact?.("🎵");
    await message.channel.sendTyping();

    try {
      // 1. Pega dados oficiais no iTunes API
      let songTitle = fullArgs;
      let artistName = "Artista";
      let releaseYear = "2021";
      let genre = "Música";
      let artwork = null;

      try {
        const itunesRes = await axios.get(
          `https://itunes.apple.com/search?term=${encodeURIComponent(fullArgs)}&entity=song&limit=1`,
          { timeout: 8000 }
        );
        const track = itunesRes.data?.results?.[0];
        if (track) {
          songTitle = track.trackName;
          artistName = track.artistName;
          releaseYear = track.releaseDate ? new Date(track.releaseDate).getFullYear() : "2021";
          genre = track.primaryGenreName || "Música";
          artwork = track.artworkUrl100 ? track.artworkUrl100.replace("100x100bb", "600x600bb") : null;
        }
      } catch {}

      const embed = new EmbedBuilder()
        .setColor("#FF007F")
        .setTitle(`🎵 ${songTitle}`)
        .setDescription(`🎶 **Baixando o arquivo MP3 para você ouvir aqui no Discord...**`)
        .addFields(
          { name: "🎤 Artista", value: `**${artistName}**`, inline: true },
          { name: "📅 Ano", value: `\`${releaseYear}\``, inline: true },
          { name: "🏷️ Gênero", value: genre, inline: true }
        );

      if (artwork) embed.setThumbnail(artwork);
      embed.setFooter({ text: `Solicitado por ${message.author.username} • Natasha Player` }).setTimestamp();

      const loadingMsg = await message.reply({ embeds: [embed] });

      // 2. Baixa o MP3 real do YouTube usando yt-dlp
      const searchQuery = `${artistName} ${songTitle}`;
      const audioBuffer = await downloadYouTubeMp3(searchQuery);

      if (audioBuffer) {
        const safeName = `${songTitle.replace(/[^a-zA-Z0-9]/g, "_")}.mp3`;
        const audioAttachment = new AttachmentBuilder(audioBuffer, { name: safeName });

        embed.setDescription(`✅ **Aqui está sua música! Pode dar o play e ouvir direto no chat:**`);

        await loadingMsg.edit({
          embeds: [embed],
          files: [audioAttachment],
        });
      } else {
        embed.setDescription(`⚠️ Não consegui gerar o arquivo MP3 no momento, mas você pode pesquisar por **${artistName} - ${songTitle}**.`);
        await loadingMsg.edit({ embeds: [embed] });
      }
    } catch (err) {
      console.error("[ERRO MP3 MUSICA]:", err.message);
      await reply("⚠️ Ocorreu um erro ao processar o áudio. Tente novamente.");
    }
  },
};
