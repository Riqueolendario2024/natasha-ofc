import { MsEdgeTTS, OUTPUT_FORMAT } from "edge-tts";

export async function generatePodcastAudio(script) {
  try {
    const lines = script.split("\n").filter((line) => line.trim().length > 0);
    const audioBuffers = [];

    for (const line of lines) {
      let voice = "pt-BR-FranciscaNeural";
      let textToSpeak = line;

      if (line.toLowerCase().startsWith("alex:")) {
        voice = "pt-BR-AntonioNeural";
        textToSpeak = line.replace(/alex:/i, "").trim();
      } else if (line.toLowerCase().startsWith("sam:")) {
        voice = "pt-BR-FranciscaNeural";
        textToSpeak = line.replace(/sam:/i, "").trim();
      } else {
        textToSpeak = line.replace(/^[a-zA-Z0-9_]+:/, "").trim();
      }

      if (!textToSpeak) continue;

      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBPS_MONO_MP3);
      
      const stream = tts.toStream(textToSpeak);
      const chunks = [];

      await new Promise((resolve, reject) => {
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve());
        stream.on("error", (err) => reject(err));
      });

      audioBuffers.push(Buffer.concat(chunks));
    }

    return Buffer.concat(audioBuffers);
  } catch (error) {
    console.error("Erro ao gerar áudio de podcast com Edge-TTS:", error);
    return null;
  }
}