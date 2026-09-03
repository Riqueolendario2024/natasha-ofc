import { generatePodcastAudio as generateGeminiPodcast } from "./aiService.js";

export async function textToAudioBuffer() {
  return null;
}

export async function generatePodcastAudio(script) {
  try {
    return await generateGeminiPodcast(script);
  } catch (error) {
    console.error("Erro no generatePodcastAudio:", error);
    return null;
  }
}