import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const STANDALONE_DIR = path.join(ROOT_DIR, ".next", "standalone");
const SERVER_ENTRY = path.join(STANDALONE_DIR, "server.js");

const PORT = 45678;
const HOST = "127.0.0.1";
const APP_URL = `http://${HOST}:${PORT}`;

function parseEnvFile(filePath) {
  const result = {};
  try {
    if (!fs.existsSync(filePath)) return result;
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key) result[key] = val;
    }
  } catch {
    // Yoksay
  }
  return result;
}

function readDesktopConfig() {
  try {
    const appData =
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    const cfgPath = path.join(appData, "aof-akilli-calisma-kocu", "config.json");
    if (!fs.existsSync(cfgPath)) return {};
    const parsed = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function isServerHealthy() {
  try {
    const res = await fetch(`${APP_URL}/api/health`, {
      signal: AbortSignal.timeout(1200),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureServerRunning() {
  if (await isServerHealthy()) {
    return;
  }

  if (!fs.existsSync(SERVER_ENTRY)) {
    throw new Error(
      `Standalone sunucu bulunamadı: ${SERVER_ENTRY}. Önce "npm run desktop:prepare" çalıştırın.`
    );
  }

  const envMap = {
    ...parseEnvFile(path.join(STANDALONE_DIR, ".env.local")),
    ...parseEnvFile(path.join(ROOT_DIR, ".env.local")),
  };
  const cfg = readDesktopConfig();

  const childEnv = {
    ...process.env,
    ...envMap,
    APP_ROOT_DIR: ROOT_DIR,
    PORT: String(PORT),
    HOSTNAME: HOST,
    NODE_ENV: "production",
    ...(typeof cfg.geminiApiKey === "string" && cfg.geminiApiKey.trim()
      ? { GEMINI_API_KEY: cfg.geminiApiKey.trim() }
      : {}),
    ...(typeof cfg.evrenApiKey === "string" && cfg.evrenApiKey.trim()
      ? { EVREN_API_KEY: cfg.evrenApiKey.trim() }
      : {}),
    ...(typeof cfg.evrenModel === "string" && cfg.evrenModel.trim()
      ? { EVREN_MODEL: cfg.evrenModel.trim() }
      : {}),
    ...(typeof cfg.aiProvider === "string" && cfg.aiProvider.trim()
      ? { AI_PROVIDER: cfg.aiProvider.trim() }
      : {}),
    ...(typeof cfg.customAiProvider === "string" && cfg.customAiProvider.trim()
      ? { CUSTOM_AI_PROVIDER: cfg.customAiProvider.trim() }
      : {}),
    ...(typeof cfg.customAiApiKey === "string" && cfg.customAiApiKey.trim()
      ? { CUSTOM_AI_API_KEY: cfg.customAiApiKey.trim() }
      : {}),
    ...(typeof cfg.customAiBaseUrl === "string" && cfg.customAiBaseUrl.trim()
      ? { CUSTOM_AI_BASE_URL: cfg.customAiBaseUrl.trim() }
      : {}),
    ...(typeof cfg.customAiModel === "string" && cfg.customAiModel.trim()
      ? { CUSTOM_AI_MODEL: cfg.customAiModel.trim() }
      : {}),
  };

  const serverProc = spawn(process.execPath, [SERVER_ENTRY], {
    cwd: STANDALONE_DIR,
    env: childEnv,
    detached: true,
    windowsHide: true,
    stdio: "ignore",
  });
  serverProc.unref();

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await isServerHealthy()) return;
    await new Promise((r) => setTimeout(r, 250));
  }

  throw new Error("Yerel sunucu 15 saniye içinde yanıt vermedi.");
}

function findSignedBrowserExe() {
  const candidates = [
    path.join(
      process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
      "Microsoft\\Edge\\Application\\msedge.exe"
    ),
    path.join(
      process.env.ProgramFiles || "C:\\Program Files",
      "Microsoft\\Edge\\Application\\msedge.exe"
    ),
    path.join(
      process.env.LOCALAPPDATA || "",
      "Microsoft\\Edge\\Application\\msedge.exe"
    ),
    path.join(
      process.env.ProgramFiles || "C:\\Program Files",
      "Google\\Chrome\\Application\\chrome.exe"
    ),
    path.join(
      process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
      "Google\\Chrome\\Application\\chrome.exe"
    ),
  ];
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

function openAppWindow() {
  const browserExe = findSignedBrowserExe();
  if (browserExe) {
    const browserProc = spawn(browserExe, [`--app=${APP_URL}`], {
      detached: true,
      stdio: "ignore",
    });
    browserProc.unref();
    return;
  }

  const fallback = spawn("cmd.exe", ["/c", "start", "", APP_URL], {
    detached: true,
    windowsHide: true,
    stdio: "ignore",
  });
  fallback.unref();
}

async function main() {
  await ensureServerRunning();
  openAppWindow();
}

main().catch((err) => {
  console.error("Başlatma hatası:", err);
  process.exit(1);
});
