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

// Converte Ogg/Opus do Discord para WAV via ffmpeg (formato mais estável e universal para IA)
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

  const SYSTEM_INSTRUCTION = `
Você é a Natasha, assistente virtual e gamer brasileira do Discord.
${isOwner ? "Seu interlocutor é seu criador e parceiro (Riquefla / Adryan Henrique)." : "Seu interlocutor é um membro da comunidade."}
Horário de Brasília: ${agoraBrasil}.

Diretrizes Obrigatórias:
- Tom: Espontânea, inteligente, amigável e natural.
- Respostas Curtas: 1 a 3 frases no máximo, direto ao ponto.
- AÇÃO DIRETA: Se pedirem piada, história ou explicação, ENTREGUE O CONTEÚDO IMEDIATAMENTE no mesmo turno. Jamais diga que vai procurar sem contar a piada.
- Se receber um áudio, transcreva/entenda o que foi dito e responda naturalmente.
`.trim();

  if (aiClient) {
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash"];

    for (const modelName of modelsToTry) {
      try {
        let history = userConversations.get(userId) || [];
        const promptCompleto = `${SYSTEM_INSTRUCTION}\n\nHistórico:\n${history.slice(-4).join("\n")}\n\nUsuário: ${prompt}\nNatasha:`;

        const parts = [];

        if (attachment && attachment.url) {
          const mediaPart = await fetchMediaPart(attachment.url, attachment.contentType);
          if (mediaPart) parts.push(mediaPart);
        }

        parts.push({ text: promptCompleto });

        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: parts }],
        });

        const text = response?.text?.trim();
        if (text) {
          const cleanText = text.replace(/^(Natasha:\s*)/i, "");
          history.push(`Usuário: ${prompt}`);
          history.push(`Natasha: ${cleanText}`);
          if (history.length > 8) history = history.slice(-8);
          userConversations.set(userId, history);
          return cleanText;
        }
      } catch (err) {
        console.error(`[ERRO ${modelName}]:`, err?.message || err);
        continue;
      }
    }
  }

  // Fallback inteligente caso a API falhe
  if (prompt.toLowerCase().includes("piada")) {
    const piadas = [
      "Por que o livro de matemática se suicidou? Porque tinha muitos problemas! 😂",
      "Qual é o café favorito do desenvolvedor? O Java! ☕",
      "O que o pato falou para a pata? Vem Quá! 🦆"
    ];
    return piadas[Math.floor(Math.random() * piadas.length)];
  }

  return isOwner
    ? "Fala chefe! Deu uma oscilada rápida na resposta, manda de novo aí!"
    : "Tive uma oscilação de conexão rápida. Pode repetir?";
}
