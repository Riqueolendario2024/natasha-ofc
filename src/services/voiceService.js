import { EdgeTTS } from "node-edge-tts";

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

      const tts = new EdgeTTS({ voice });
      const buffer = await tts.synthesizeBuffer(textToSpeak);
      audioBuffers.push(buffer);
    }

    return Buffer.concat(audioBuffers);
  } catch (error) {
    console.error("Erro ao gerar áudio de podcast com Edge-TTS:", error);
    return null;
  }
}