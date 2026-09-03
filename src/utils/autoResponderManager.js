import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AR_PATH = path.join(__dirname, "..", "database", "autoresponder.json");

function loadAR() {
  if (!fs.existsSync(AR_PATH)) {
    fs.writeFileSync(AR_PATH, JSON.stringify({ active: true, responses: {} }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(AR_PATH, "utf-8"));
  } catch {
    return { active: true, responses: {} };
  }
}

function saveAR(data) {
  fs.writeFileSync(AR_PATH, JSON.stringify(data, null, 2));
}

export function isAutoResponderActive() {
  return loadAR().active ?? true;
}

export function setAutoResponderState(state) {
  const ar = loadAR();
  ar.active = state;
  saveAR(ar);
}

export function addResponse(trigger, response) {
  const ar = loadAR();
  ar.responses[trigger.toLowerCase().trim()] = response;
  saveAR(ar);
}

export function getCustomResponse(messageText) {
  const ar = loadAR();
  if (!ar.active) return null;
  return ar.responses[messageText.toLowerCase().trim()] || null;
}
