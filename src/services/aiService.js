import axios from "axios";
import { spawn } from "child_process";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { OWNER_IDS } from "../config.js";
dotenv.config();

const userConversations = new Map();

const apiKey = process.env.GEMINI_API_KEY || "";
let aiClient = null;

if (apiKey && apiKey !== "SUA_CHAVE_AQUI") {
  aiClient = new GoogleGenAI({ apiKey });
}

// Converte Ogg/Opus do Discord para WAV via ffmpeg
function convertToWav(inputBuffer) {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", "pipe:0",
      "-f", "wav",
      "-ac", "1",
      "-ar", "16000",
      "pipe:1"
    ]);

    const chunks = [];
    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.on("close", (code) => {
      if (code === 0 && chunks.length > 0) resolve(Buffer.concat(chunks));
      else resolve(inputBuffer);
    });
    ffmpeg.on("error", () => resolve(inputBuffer));

    ffmpeg.stdin.write(inputBuffer);
    ffmpeg.stdin.end();
  });
}

async function fetchMediaPart(url, mimeType) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 25000 });
    let buffer = Buffer.from(response.data);
    let finalMime = "audio/wav";

    if (mimeType?.includes("audio") || mimeType?.includes("ogg") || mimeType?.includes("opus")) {
      buffer = await convertToWav(buffer);
      finalMime = "audio/wav";
    } else if (mimeType?.includes("image")) {
      finalMime = mimeType.split(";")[0].trim();
    }

    return {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: finalMime,
      },
    };
  } catch (err) {
    console.error("[ERRO DOWNLOAD MIDIA]:", err.message);
    return null;
  }
}

export async function askAI({ prompt, userId = "default", attachment = null }) {
  const agoraBrasil = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const isOwner = OWNER_IDS.includes(userId);

  const isPodcastRequest = prompt.toLowerCase().includes("podcast") || prompt.toLowerCase().includes("roteiro");

  const SYSTEM_INSTRUCTION = isPodcastRequest
    ? `Você é um gerador de roteiros para podcast em áudio. Escreva um diálogo divertido entre duas pessoas (Alex e Sam) comentando os assuntos solicitados.`
    : `Você é a Natasha, assistente virtual e gamer brasileira do Discord.
${isOwner ? "Seu interlocutor é seu criador e parceiro (Riquefla / Adryan Henrique)." : "Seu interlocutor é um membro da comunidade."}
Horário de Brasília: ${agoraBrasil}.

Diretrizes Obrigatórias:
- Tom: Espontânea, inteligente, amigável e natural.
- Respostas Curtas: 1 a 3 frases no máximo, direto ao ponto.
- AÇÃO DIRETA: Se pedirem piada, história ou explicação, ENTREGUE O CONTEÚDO IMEDIATAMENTE no mesmo turno.
- Se receber um áudio, transcreva/entenda o que foi dito e responda naturally.`.trim();

  if (aiClient) {
    const modelsToTry = ["gemini-2.5-flash", "gemini-3.6-flash"];

    for (const modelName of modelsToTry) {
      try {
        let history = userConversations.get(userId) || [];
        const parts = [];

        if (attachment && attachment.url) {
          const mediaPart = await fetchMediaPart(attachment.url, attachment.contentType);
          if (mediaPart) parts.push(mediaPart);
        }

        const promptCompleto = isPodcastRequest 
          ? `${SYSTEM_INSTRUCTION}\n\nPedido do usuário: ${prompt}`
          : `${SYSTEM_INSTRUCTION}\n\nHistórico:\n${history.slice(-4).join("\n")}\n\nUsuário: ${prompt}\nNatasha:`;

        parts.push({ text: promptCompleto });

        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: parts }],
        });

        const text = response?.text?.trim();
        if (text) {
          const cleanText = text.replace(/^(Natasha:\s*)/i, "");
          if (!isPodcastRequest) {
            history.push(`Usuário: ${prompt}`);
            history.push(`Natasha: ${cleanText}`);
            if (history.length > 8) history = history.slice(-8);
            userConversations.set(userId, history);
          }
          return cleanText;
        }
      } catch (err) {
        console.error(`[ERRO ${modelName}]:`, err?.message || err);
        continue;
      }
    }
  }

  return isOwner
    ? "Fala chefe! Deu uma oscilada rápida na API, manda a mensagem de novo!"
    : "Tive uma oscilação de conexão rápida. Pode repetir?";
}

// Geração de Áudio nativa com Gemini 2.5 Flash TTS via REST API
export async function generatePodcastAudio(script) {
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Leia o seguinte roteiro no formato de podcast com entonação natural de apresentação de áudio:\n\n${script}`
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Puck"
            }
          }
        }
      }
    };

    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" }
    });

    const candidates = response.data?.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return Buffer.from(part.inlineData.data, "base64");
        }
      }
    }

    return null;
  } catch (err) {
    console.error("[ERRO GEMINI REST AUDIO]:", err?.response?.data || err?.message || err);
    return null;
  }
}