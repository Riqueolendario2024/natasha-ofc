import dotenv from "dotenv";
dotenv.config();

export const BOT_NAME = process.env.BOT_NAME || "Natasha";
export const BOT_VERSION = process.env.BOT_VERSION || "2.5.0";
export const PREFIX = process.env.PREFIX || "!";
export const DEFAULT_PREFIX = PREFIX;
export const BOT_EMOJI = process.env.BOT_EMOJI || "🤖";

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const SPIDER_API_TOKEN = process.env.SPIDER_API_TOKEN || "XDoJfLLOJ94K1uXT5Nrw";
export const SPIDER_API_BASE_URL = process.env.SPIDER_API_BASE_URL || "https://api.spiderx.com.br/api";

const rawOwners = process.env.OWNER_IDS || process.env.OWNER_ID || "";
export const OWNER_IDS = rawOwners
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

// Export compatível singular
export const OWNER_ID = OWNER_IDS[0] || "";

export const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || "";
export const UPDATE_CHANNEL_ID = process.env.UPDATE_CHANNEL_ID || "";
export const UPDATE_BANNER_URL = process.env.UPDATE_BANNER_URL || "";
export const SUPPORT_URL = process.env.SUPPORT_URL || "https://discord.gg/";
export const DONATE_KEYS = process.env.DONATE_KEYS || "pix@natasha.bot";

export const DEBUG = process.env.DEBUG === "true";

// Validação na inicialização
if (!DISCORD_TOKEN) {
  console.error("❌ ERRO CRÍTICO: DISCORD_TOKEN não foi configurado no arquivo .env!");
}
