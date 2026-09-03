import http from "http";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { addCoins, getUser, updateUser } from "../utils/usersManager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "web");

let server = null;
export const PORT = 3456;
export let publicGameUrl = `http://localhost:${PORT}`;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};

export function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "localhost";
}

export function startArcadeServer() {
  if (server) return;

  server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    const decodedUrl = decodeURIComponent(req.url || "/");
    const cleanPath = decodedUrl.split("?")[0].replace(/\/+$/, "");

    // Endpoint de Recompensa de Moedas e XP
    if (req.method === "POST" && cleanPath === "/api/score") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const { userId, score } = JSON.parse(body);
          if (userId && score > 0) {
            const coinsEarned = score * 20;
            const xpEarned = score * 15;
            addCoins(userId, coinsEarned);
            const user = getUser(userId);
            user.xp = (user.xp || 0) + xpEarned;
            updateUser(userId, user);
            console.log(`[ARCADE] 🪙 +${coinsEarned} moedas creditadas para <@${userId}>`);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }

    // Roteamento Direto das Telas
    let filePath;
    if (cleanPath === "" || cleanPath === "/" || cleanPath === "/flappy") {
      filePath = path.join(PUBLIC_DIR, "flappy", "index.html");
    } else if (cleanPath === "/galaxy") {
      filePath = path.join(PUBLIC_DIR, "galaxy", "index.html");
    } else if (cleanPath === "/plataforma") {
      filePath = path.join(PUBLIC_DIR, "plataforma", "index.html");
    } else {
      filePath = path.join(PUBLIC_DIR, cleanPath.replace(/^\//, ""));
    }

    // Se for diretório, busca index.html dentro dele
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Arquivo não encontrado");
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    const localIp = getLocalIpAddress();
    publicGameUrl = `http://${localIp}:${PORT}`;
    console.log(`🎮 [ARCADE WEB] Servidor rodando em: http://${localIp}:${PORT}`);

    try {
      const tunnel = spawn("cloudflared", ["tunnel", "--url", `http://localhost:${PORT}`]);
      tunnel.stderr.on("data", (data) => {
        const match = data.toString().match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match) {
          publicGameUrl = match[0];
          console.log(`🚀 [CLOUDFLARE ONLINE] Link Global: ${publicGameUrl}`);
        }
      });
    } catch (e) {}
  });
}
