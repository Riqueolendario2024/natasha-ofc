import { EdgeTTS } from "node-edge-tts";
import fs from "fs";
import path from "path";
import os from "os";

export async function textToAudioBuffer(text, voice = "pt-BR-FranciscaNeural") {
  const tmpFile = path.join(os.tmpdir(), `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);
  try {
    const tts = new EdgeTTS({ voice, lang: "pt-BR", outputFormat: "audio-24khz-96kbps-mono-mp3" });
    await tts.toFile(tmpFile, text);
    
    if (fs.existsSync(tmpFile)) {
      const buffer = fs.readFileSync(tmpFile);
      fs.unlinkSync(tmpFile);
      return buffer;
    }
    return null;
  } catch (error) {
    console.error("Erro no textToAudioBuffer:", error);
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    return null;
  }
}

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

      const buffer = await textToAudioBuffer(textToSpeak, voice);
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