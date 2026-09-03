import { getAudioBuffer } from "google-tts-api";

export async function textToAudioBuffer(text, lang = "pt") {
  try {
    // Limita o texto para evitar estourar o limite de caracteres por requisição
    const cleanText = text.substring(0, 200);
    const buffer = await getAudioBuffer(cleanText, {
      lang: lang,
      slow: false,
      host: "https://translate.google.com",
      timeout: 10000,
    });
    return buffer;
  } catch (error) {
    console.error("Erro no textToAudioBuffer:", error);
    return null;
  }
}

export async function generatePodcastAudio(script) {
  try {
    const lines = script.split("\n").filter((line) => line.trim().length > 0);
    const audioBuffers = [];

    for (const line of lines) {
      let textToSpeak = line;

      // Limpa os marcadores de voz da fala
      if (line.toLowerCase().startsWith("alex:")) {
        textToSpeak = line.replace(/alex:/i, "").trim();
      } else if (line.toLowerCase().startsWith("sam:")) {
        textToSpeak = line.replace(/sam:/i, "").trim();
      } else {
        textToSpeak = line.replace(/^[a-zA-Z0-9_]+:/, "").trim();
      }

      if (!textToSpeak) continue;

      const buffer = await textToAudioBuffer(textToSpeak, "pt");
      if (buffer) {
        audioBuffers.push(buffer);
      }
    }

    if (audioBuffers.length === 0) return null;
    return Buffer.concat(audioBuffers);
  } catch (error) {
    console.error("Erro no generatePodcastAudio:", error);
    return null;
  }
}