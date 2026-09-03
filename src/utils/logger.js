import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { DEBUG } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, "..", "..", "logs");

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const ERROR_LOG_PATH = path.join(LOGS_DIR, "command-errors.log");

export function logErrorToFile(contextName, error) {
  const timestamp = new Date().toISOString();
  const errorDetails = `[${timestamp}] [${contextName}] ${error.stack || error.message || error}\n\n`;
  fs.appendFileSync(ERROR_LOG_PATH, errorDetails, "utf-8");
}

export const logger = {
  info: (msg) => console.log(chalk.cyan("ℹ ") + chalk.white(msg)),
  success: (msg) => console.log(chalk.green("✓ ") + chalk.white(msg)),
  warn: (msg) => console.log(chalk.yellow("⚠ ") + chalk.yellow(msg)),
  error: (msg) => console.log(chalk.red("✗ ") + chalk.red(msg)),
  debug: (msg) => {
    if (DEBUG) console.log(chalk.gray(`[DEBUG] ${msg}`));
  },
};
