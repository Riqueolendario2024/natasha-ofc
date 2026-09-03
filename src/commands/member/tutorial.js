import { EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PREFIX } from "../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.join(__dirname, "..", "..", "cursos.json");

// Cache em memória para evitar leitura síncrona repetida do disco
let cachedCursos = null;
function getCursosData() {
  if (!cachedCursos && fs.existsSync(jsonPath)) {
    try {
      cachedCursos = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    } catch (err) {
      console.error("Erro ao ler cursos.json:", err);
    }
  }
  return cachedCursos;
}

function extractYouTubeId(url = "") {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default {
  name: "tutorial",
  description: "Acessa as aulas e tutoriais do canal",
  commands: ["tutorial", "aula", "fazenda"],
  usage: `${PREFIX}tutorial <curso> <numero_aula>`,
  handle: async ({ message, args }) => {
    let nomeCurso = args[0]?.toLowerCase();
    let numeroAula = args[1];

    if (nomeCurso && !isNaN(nomeCurso)) {
      numeroAula = nomeCurso;
      nomeCurso = "fazenda";
    }

    const cursosData = getCursosData();
    if (!cursosData) {
      return message.reply("❌ O arquivo de cursos não foi encontrado ou está inválido!");
    }

    if (!nomeCurso || !cursosData[nomeCurso]) {
      const listaCursos = Object.keys(cursosData)
        .map((c) => `• \`${PREFIX}tutorial ${c}\` ou \`${PREFIX}tutorial ${c} 1\``)
        .join("\n");

      const embed = new EmbedBuilder()
        .setColor("#478cbf")
        .setTitle("📖 Cursos e Tutoriais Disponíveis")
        .setDescription(
          `Escolha um curso abaixo para ver a lista de aulas:\n\n${listaCursos}\n\nExemplo: \`${PREFIX}tutorial fazenda 1\``
        )
        .setFooter({ text: "Takeshi-Godot • Dev Community" });

      return message.reply({ embeds: [embed] });
    }

    const curso = cursosData[nomeCurso];

    if (!numeroAula || !curso[numeroAula]) {
      const listaAulas = Object.keys(curso)
        .slice(0, 20)
        .map((num) => `\`#${num.padStart(2, "0")}\` [${curso[num].titulo}](${curso[num].url})`)
        .join("\n");

      const totalAulas = Object.keys(curso).length;
      const embedLista = new EmbedBuilder()
        .setColor("#ff9900")
        .setTitle(`🚜 Curso de Criar Jogo de Fazenda na Godot`)
        .setDescription(
          `Para acessar uma aula direta, use: \`${PREFIX}tutorial ${nomeCurso} <número>\`\n\n**Aulas (Total: ${totalAulas}):**\n${listaAulas}`
        )
        .setFooter({ 
          text: "Takeshi-Godot • Bons estudos!", 
          iconURL: message.client.user.displayAvatarURL({ forceStatic: true }) 
        });

      return message.reply({ embeds: [embedLista] });
    }

    const aula = curso[numeroAula];
    const videoId = extractYouTubeId(aula.url);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

    const embedAula = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle(`🎥 Aula ${numeroAula}: ${aula.titulo}`)
      .setURL(aula.url)
      .setDescription(`🎬 **[Clique aqui para assistir a aula no YouTube](${aula.url})**`)
      .setFooter({ 
        text: "Takeshi-Godot • Dev Community", 
        iconURL: message.client.user.displayAvatarURL({ forceStatic: true }) 
      })
      .setTimestamp();

    if (thumbnailUrl) {
      embedAula.setImage(thumbnailUrl);
    }

    await message.reply({ embeds: [embedAula] });
  },
};