import { PREFIX } from "../../config.js";
import { textToAudioBuffer } from "../../services/voiceService.js";

export default {
  name: "falar",
  description: "Faz a Natasha falar um texto em áudio",
  commands: ["falar", "voz", "tts", "audio"],
  usage: `${PREFIX}falar <texto>`,
  handle: async ({ reply, fullArgs, sendAudio, sendReact }) => {
    if (!fullArgs) {
      return await reply(`❌ Digite o que você quer que eu fale!\nExemplo: \`${PREFIX}falar Salve comunidade Dev!\``);
    }

    await sendReact("🎙️");

    const audioBuffer = await textToAudioBuffer(fullArgs);
    if (!audioBuffer) {
      return await reply("❌ Não consegui gerar o áudio agora.");
    }

    await sendAudio(audioBuffer, "natasha-voz.mp3");
  },
};
