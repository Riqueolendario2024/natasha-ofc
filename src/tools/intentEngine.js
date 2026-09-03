import axios from "axios";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { fetchNews, buildNewsPayload } from "../services/newsService.js";
import { searchYouTube, buildYouTubePayload, youtubeSearchHistory } from "../services/youtubeService.js";

// 1. Data e Hora
export function handleDateTime() {
  const agora = new Date();
  const options = { timeZone: "America/Sao_Paulo" };
  const hora = agora.toLocaleTimeString("pt-BR", { ...options, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const data = agora.toLocaleDateString("pt-BR", { ...options, weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const visual = new EmbedBuilder()
    .setColor("#FF007F")
    .setTitle("🕒 Data & Hora Oficial")
    .setDescription(`⏰ **Horário Atual:** \`${hora}\`\n📅 **Data:** ${data}\n📍 **Fuso:** Brasília (GMT-3)`)
    .setFooter({ text: "Natasha • Sistema Temporal" });

  const voz = `Agora são exatamente ${hora.slice(0, 5)} em Brasília.`;
  return { visual, voz };
}

// 2. Previsão do Tempo
export async function handleWeather(location = "Florianópolis") {
  try {
    const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
    const { data } = await axios.get(url, { timeout: 6000 });
    const current = data.current_condition[0];
    const desc = current.lang_pt ? current.lang_pt[0].value : current.weatherDesc[0].value;

    const visual = new EmbedBuilder()
      .setColor("#3498DB")
      .setTitle(`🌤️ Clima em ${location}`)
      .setDescription(`🌡️ **Temperatura:** ${current.temp_C}°C (Sensação: ${current.FeelsLikeC}°C)\n☁️ **Condição:** ${desc}\n💧 **Umidade:** ${current.humidity}%\n💨 **Vento:** ${current.windspeedKmph} km/h`)
      .setFooter({ text: "Natasha • Previsão do Tempo" });

    const voz = `Em ${location} está fazendo ${current.temp_C} graus com ${desc}.`;
    return { visual, voz };
  } catch {
    return null;
  }
}

// 3. YouTube Search Real
export async function handleYouTubeIntent(query, userId = "global") {
  const videos = await searchYouTube(query, 4);
  if (!videos || videos.length === 0) return null;

  youtubeSearchHistory.set(userId, videos);
  return buildYouTubePayload(videos, query);
}

// 4. Calculadora
export function handleCalculator(expr) {
  try {
    const sanitized = expr
      .replace(/x|vezes/gi, "*")
      .replace(/dividido por|dividido/gi, "/")
      .replace(/mais/gi, "+")
      .replace(/menos/gi, "-")
      .replace(/por cento de|% de/gi, "/100 *")
      .replace(/[^0-9+\-*/().\s]/g, "");

    const result = Function(`'use strict'; return (${sanitized})`)();
    if (isNaN(result) || !isFinite(result)) return null;

    const formatado = Number(result.toFixed(4)).toString();
    const visual = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("🧮 Calculadora Natasha")
      .setDescription(`📝 **Expressão:** \`${expr}\`\n🎯 **Resultado:** \`${formatado}\``);

    const voz = `O resultado do cálculo é ${formatado}.`;
    return { visual, voz };
  } catch {
    return null;
  }
}

// 5. Notícias
export async function handleNewsIntent(category = "brasil") {
  const noticias = await fetchNews(category);
  if (!noticias) return null;
  return buildNewsPayload(category, noticias);
}
