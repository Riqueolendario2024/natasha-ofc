import axios from "axios";
import { SPIDER_API_TOKEN, SPIDER_API_BASE_URL } from "../config.js";
import { logErrorToFile } from "../utils/logger.js";

/**
 * Sanitiza o texto para que o motor TTS soe como fala humana natural:
 * - Remove Markdown (*, _, ~, #, `)
 * - Remove emojis e símbolos visuais
 * - Remove links/URLs
 * - Normaliza risadas longas (ex: KKKKKKK -> "haha")
 */
export function cleanTextForTTS(rawText) {
  if (!rawText) return "";

  let text = rawText
    // Remove blocos de código e links
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/https?:\/\/\S+/gi, "")
    // Normaliza risadas de chat para fala natural
    .replace(/\b(k{3,}|h{3,}|rs{2,}|kkk+)\b/gi, "haha")
    // Remove tags de formatação Discord / Markdown
    .replace(/[*_~#>]/g, "")
    // Remove emojis Unicode
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, "")
    // Remove múltiplos espaços e quebras excessivas
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

export async function textToAudioBuffer(text) {
  const token = SPIDER_API_TOKEN || "XDoJfLLOJ94K1uXT5Nrw";
  const baseUrl = SPIDER_API_BASE_URL || "https://api.spiderx.com.br/api";
  const cleanSpokenText = cleanTextForTTS(text);

  if (!cleanSpokenText) return null;

  try {
    const url = `${baseUrl}/audio/tts?texto=${encodeURIComponent(cleanSpokenText)}&voz=pt-BR-FranciscaNeural&api_key=${token}`;
    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    return Buffer.from(response.data);
  } catch (err) {
    logErrorToFile("VOICE_TTS", err);
    return null;
  }
}
