import { EmbedBuilder } from "discord.js";

const enginesInfo = {
  godot: {
    title: "🚀 Godot Engine",
    color: 0x478cbf,
    description: "Engine open-source leve, excelente para jogos 2D e muito capaz no 3D.",
    language: "GDScript, C#, C++",
    focus: "2D & 3D Leve",
    docs: "https://docs.godotengine.org/",
  },
  unity: {
    title: "⚡ Unity",
    color: 0x000000,
    description: "Engine versátil e amplamente utilizada na indústria para jogos indie, 3D e mobile.",
    language: "C#",
    focus: "2D, 3D & Mobile",
    docs: "https://docs.unity.com/",
  },
  unreal: {
    title: "🔥 Unreal Engine",
    color: 0x111111,
    description: "Focada em gráficos ultrarrealistas e alta performance para projetos 3D complexos.",
    language: "C++, Blueprints",
    focus: "3D Avançado",
    docs: "https://dev.epicgames.com/documentation/unreal-engine",
  },
  gamemaker: {
    title: "🎮 GameMaker",
    color: 0x212529,
    description: "Uma das melhores opções para criação e prototipagem rápida de jogos 2D.",
    language: "GML (GameMaker Language)",
    focus: "2D Especializado",
    docs: "https://manual.gamemaker.io/",
  },
  rpgmaker: {
    title: "⚔️ RPG Maker (MV / MZ)",
    color: 0x8b0000,
    description: "Especializado na criação rápida de jogos de RPG clássicos em perspectiva 2D top-down.",
    language: "JavaScript (Plugins / Eventos)",
    focus: "RPGs 2D",
    docs: "https://www.rpgmakerweb.com/",
  },
  construct: {
    title: "🧩 Construct 3",
    color: 0x0072c6,
    description: "Engine baseada em navegador focada em lógica visual por eventos e desenvolvimento 2D ágil.",
    language: "Lógica Visual / Eventos, JavaScript",
    focus: "2D & Web",
    docs: "https://www.construct.net/en/make-games/manuals/construct-3",
  },
  gdevelop: {
    title: "🚀 GDevelop",
    color: 0x2d3250,
    description: "Engine open-source e no-code baseada em eventos, ideal para criar jogos 2D e 3D de forma rápida.",
    language: "Sistema de Eventos / JavaScript",
    focus: "2D/3D Multiplataforma",
    docs: "https://wiki.gdevelop.io/",
  },
  roblox: {
    title: "🧱 Roblox Studio",
    color: 0xe00000,
    description: "Plataforma e engine para criação, publicação e monetização de experiências multiplayer.",
    language: "Luau (derivado do Lua)",
    focus: "Multiplayer 3D & Social",
    docs: "https://create.roblox.com/docs",
  },
  defold: {
    title: "📦 Defold",
    color: 0x0f2027,
    description: "Engine leve e eficiente focada em jogos 2D para web e dispositivos móveis.",
    language: "Lua",
    focus: "2D Mobile & Web",
    docs: "https://defold.com/manuals/introduction/",
  },
  phaser: {
    title: "⚡ Phaser",
    color: 0x7c3aed,
    description: "Framework HTML5 popular para desenvolvimento de jogos 2D em navegadores.",
    language: "JavaScript / TypeScript",
    focus: "2D Web Games",
    docs: "https://phaser.io/learn",
  },
};

const aliases = {
  rpgmakermv: "rpgmaker",
  rpgmakermz: "rpgmaker",
  construct3: "construct",
  construct2: "construct",
  robloxstudio: "roblox",
};

export default {
  name: "Engine",
  commands: ["engine", "engines", "gamedev"],
  async handle({ message, args }) {
    const rawInput = args.join("").toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetKey = aliases[rawInput] || rawInput;

    if (enginesInfo[targetKey]) {
      const info = enginesInfo[targetKey];
      const embed = new EmbedBuilder()
        .setTitle(info.title)
        .setColor(info.color)
        .setDescription(info.description)
        .addFields(
          { name: "💻 Linguagens", value: info.language, inline: true },
          { name: "🎯 Foco", value: info.focus, inline: true },
          { name: "📚 Documentação", value: `[Acessar Manual](${info.docs})` }
        )
        .setFooter({ text: "Takeshi | Mentor de Game Dev" });

      return message.reply({ embeds: [embed] });
    }

    const embedGeral = new EmbedBuilder()
      .setTitle("🧠 Takeshi — Mentor de Game Dev")
      .setColor(0xff0033)
      .setDescription("Selecione qual engine você quer consultar para ver detalhes e orientações.")
      .addFields(
        { 
          name: "🛠️ Engines Suportadas", 
          value: "`godot`, `unity`, `unreal`, `gamemaker`, `rpgmaker`, `construct`, `gdevelop`, `roblox`, `defold`, `phaser`" 
        },
        { 
          name: "📌 Como Usar", 
          value: "Digite por exemplo: `!engine rpg maker mv`, `!engine construct 3` ou `!engine unity`" 
        },
        { 
          name: "💡 Orientação do Mestre", 
          value: "A engine é só uma ferramenta. A lógica e o game design funcionam de forma universal em qualquer uma delas!" 
        }
      )
      .setFooter({ text: "Digite !engine <nome-da-engine>" });

    return message.reply({ embeds: [embedGeral] });
  },
};