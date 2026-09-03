import axios from "axios";
import { SPIDER_API_BASE_URL, SPIDER_API_TOKEN } from "../config.js";

// Gemini (IA)
export async function gemini(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const { data } = await axios.post(
    `${SPIDER_API_BASE_URL}/ai/gemini?api_key=${SPIDER_API_TOKEN}`,
    { text }
  );

  return data.response;
}

// Busca Spider X (YouTube / Outros)
export async function search(type, query) {
  if (!query) {
    throw new Error("Você precisa informar o parâmetro de pesquisa!");
  }

  const { data } = await axios.get(
    `${SPIDER_API_BASE_URL}/search/${type}?search=${encodeURIComponent(
      query
    )}&api_key=${SPIDER_API_TOKEN}`
  );

  return data;
}

// Canvas Boas-Vindas Spider X
export function welcome(title, description, imageURL) {
  if (!title || !description || !imageURL) {
    throw new Error("Você precisa informar o título, descrição e URL da imagem!");
  }

  return `${SPIDER_API_BASE_URL}/canvas/welcome?title=${encodeURIComponent(
    title
  )}&description=${encodeURIComponent(
    description
  )}&image_url=${encodeURIComponent(imageURL)}&api_key=${SPIDER_API_TOKEN}`;
}