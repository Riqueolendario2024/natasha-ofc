import { EmbedBuilder } from "discord.js";
import { PREFIX } from "../../config.js";

const curiosidades = [
  "O primeiro videogame comercial da história foi 'Computer Space', lançado em 1971 por Nolan Bushnell.",
  "O coração de uma baleia-azul é tão grande que um ser humano adulto poderia nadar pelas suas artérias.",
  "O código-fonte original de 'Doom' foi disponibilizado publicamente por John Carmack em 1997.",
  "O cérebro humano gera cerca de 20 watts de eletricidade, o suficiente para acender uma lâmpada LED fraca.",
  "A linguagem Lua foi criada no Brasil na PUC-Rio e é uma das mais utilizadas no desenvolvimento de games.",
];

export default {
  name: "curiosidade",
  description: "Exibe uma curiosidade científica ou sobre tecnologia",
  commands: ["fato", "curiosidades"],
  usage: `${PREFIX}curiosidade`,
  handle: async ({ reply, sendReact }) => {
    await sendReact("🌟");
    const fato = curiosidades[Math.floor(Math.random() * curiosidades.length)];

    const embed = new EmbedBuilder()
      .setColor("#00C0FF")
      .setTitle("🌟 Curiosidade do Dia!")
      .setDescription(`"${fato}"`)
      .setFooter({ text: "Natasha • Conhecimento Nerd" });

    await reply({ embeds: [embed] });
  },
};
