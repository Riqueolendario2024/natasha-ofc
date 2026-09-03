import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { searchYouTube } from "../../services/youtubeService.js";
import { PREFIX } from "../../config.js";

export default {
  name: "play",
  description: "Busca e reproduz músicas com player interativo no Discord",
  commands: ["musica", "tocar", "som", "mp3"],
  usage: `${PREFIX}play <nome da música>`,
  handle: async ({ reply, sendReact, fullArgs, message }) => {
    if (!fullArgs) {
      return await reply(`🎵 Qual música você quer ouvir hoje?\n*Exemplo:* \`${PREFIX}play MC Hariel\` ou \`${PREFIX}play Lofi Hip Hop\``);
    }

    await sendReact("🎧");
    await message.channel.sendTyping();

    try {
      const videos = await searchYouTube(fullArgs, 1);

      if (!videos || videos.length === 0) {
        return await reply(`😥 Não encontrei a música "${fullArgs}". Tente outro termo!`);
      }

      const musica = videos[0];
      const musicUrl = `https://music.youtube.com/watch?v=${musica.id}`;

      const embed = new EmbedBuilder()
        .setColor("#FF007F")
        .setTitle(`🎧 ${musica.title}`)
        .setURL(musica.url)
        .setDescription(
          `🎤 **Artista/Canal:** ${musica.author}\n` +
          `⏱️ **Duração:** \`${musica.duration}\` • 👁️ **Views:** \`${musica.views}\`\n\n` +
          `🎶 _Clique nos botões abaixo para tocar a música agora mesmo!_`
        )
        .setImage(musica.thumbnail)
        .setFooter({ text: "Natasha • Player Musical Oficial" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Ouvir no YouTube")
          .setStyle(ButtonStyle.Link)
          .setURL(musica.url)
          .setEmoji("▶️"),
        new ButtonBuilder()
          .setLabel("YouTube Music")
          .setStyle(ButtonStyle.Link)
          .setURL(musicUrl)
          .setEmoji("🎵")
      );

      await message.reply({ embeds: [embed], components: [row] });
    } catch (erro) {
      console.error("[PLAY ERROR]", erro.message);
      await reply("❌ Ocorreu um erro ao buscar a faixa musical.");
    }
  },
};
