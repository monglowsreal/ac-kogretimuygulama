const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

const isDevMode =
  process.argv.includes("--dev") || process.env.ELECTRON_DEV === "1";
const PREFERRED_PORT = 45678;

let mainWindow = null;
let serverProcess = null;
let activeServerUrl = null;
let activePort = null;
let isQuitting = false;

// Tek örnek (single-instance) kilidi
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

function getConfigPath() {
  return path.join(app.getPath("userData"), "config.json");
}

function getDataFilePath() {
  return path.join(app.getPath("userData"), "coach-data.json");
}

function getIconPath() {
  const candidates = [
    path.join(process.resourcesPath || "", "build", "icon.ico"),
    path.join(__dirname, "..", "build", "icon.ico"),
    path.join(__dirname, "..", "build", "icon.png"),
  ];
  return candidates.find((p) => p && fs.existsSync(p));
}

function parseEnvMap(filePath) {
  const result = {};
  try {
    if (!fs.existsSync(filePath)) return result;
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (key) result[key] = value;
    }
  } catch {
    // Yoksay
  }
  return result;
}

function readUserConfig() {
  try {
    const cfgPath = getConfigPath();
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch {
    // Yoksay
  }
  return {};
}

function readEnvLocalMap() {
  if (!app.isPackaged) {
    return parseEnvMap(path.resolve(__dirname, "..", ".env.local"));
  }
  return parseEnvMap(path.join(path.dirname(process.execPath), ".env.local"));
}

function resolveAiConfig() {
  const cfg = readUserConfig();
  const envFile = readEnvLocalMap();

  const pick = (cfgVal, envKey, fallback = "") => {
    if (typeof cfgVal === "string" && cfgVal.trim()) return cfgVal.trim();
    if (typeof envFile[envKey] === "string" && envFile[envKey].trim()) {
      return envFile[envKey].trim();
    }
    if (typeof process.env[envKey] === "string" && process.env[envKey].trim()) {
      return process.env[envKey].trim();
    }
    return fallback;
  };

  return {
    geminiApiKey: pick(cfg.geminiApiKey, "GEMINI_API_KEY", ""),
    evrenApiKey: pick(cfg.evrenApiKey, "EVREN_API_KEY", ""),
    evrenModel: pick(cfg.evrenModel, "EVREN_MODEL", "deepseek-v4.1-flash"),
    aiProvider: pick(cfg.aiProvider, "AI_PROVIDER", "auto"),
    customAiProvider: pick(cfg.customAiProvider, "CUSTOM_AI_PROVIDER", ""),
    customAiApiKey: pick(cfg.customAiApiKey, "CUSTOM_AI_API_KEY", ""),
    customAiBaseUrl: pick(cfg.customAiBaseUrl, "CUSTOM_AI_BASE_URL", ""),
    customAiModel: pick(cfg.customAiModel, "CUSTOM_AI_MODEL", ""),
  };
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.close(() => resolve(true));
      })
      .listen(port, "127.0.0.1");
  });
}

async function pickPort(preferred = PREFERRED_PORT) {
  if (await isPortFree(preferred)) return preferred;
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const chosen = typeof addr === "object" && addr ? addr.port : 45679;
      srv.close(() => resolve(chosen));
    });
  });
}

function checkHealth(url) {
  return new Promise((resolve) => {
    const req = http.get(`${url}/api/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await checkHealth(url)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

function stopEmbeddedServer() {
  return new Promise((resolve) => {
    if (!serverProcess) {
      resolve();
      return;
    }
    const proc = serverProcess;
    serverProcess = null;
    if (proc.exitCode !== null || proc.killed) {
      resolve();
      return;
    }
    const timeout = setTimeout(() => {
      try {
        proc.kill("SIGKILL");
      } catch {
        // Yoksay
      }
      resolve();
    }, 2500);

    proc.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });

    try {
      proc.kill();
    } catch {
      clearTimeout(timeout);
      resolve();
    }
  });
}

function getStandaloneDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "standalone");
  }
  return path.resolve(__dirname, "..", ".next", "standalone");
}

async function startEmbeddedProductionServer() {
  const standaloneDir = getStandaloneDir();
  const serverEntry = path.join(standaloneDir, "server.js");

  if (!fs.existsSync(serverEntry)) {
    throw new Error(
      `Masaüstü sunucu dosyası bulunamadı: ${serverEntry}. Önce 'npm run desktop:prepare' çalıştırın.`
    );
  }

  const port = await pickPort(activePort || PREFERRED_PORT);
  const url = `http://127.0.0.1:${port}`;
  const aiConfig = resolveAiConfig();

  const proc = spawn(process.execPath, [serverEntry], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      GEMINI_API_KEY: aiConfig.geminiApiKey,
      EVREN_API_KEY: aiConfig.evrenApiKey,
      EVREN_MODEL: aiConfig.evrenModel,
      AI_PROVIDER: aiConfig.aiProvider,
      CUSTOM_AI_PROVIDER: aiConfig.customAiProvider,
      CUSTOM_AI_API_KEY: aiConfig.customAiApiKey,
      CUSTOM_AI_BASE_URL: aiConfig.customAiBaseUrl,
      CUSTOM_AI_MODEL: aiConfig.customAiModel,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  serverProcess = proc;
  activePort = port;
  activeServerUrl = url;

  let stderrBuf = "";
  proc.stderr?.on("data", (chunk) => {
    stderrBuf += chunk.toString();
  });

  const ready = await waitForServer(url, 20000);
  if (!ready) {
    throw new Error(
      `Yerel Next.js sunucusu başlatılamadı.${stderrBuf ? ` Detay: ${stderrBuf.slice(0, 400)}` : ""}`
    );
  }

  return url;
}

async function ensureDevServer() {
  const devUrl = "http://localhost:3000";
  if (await checkHealth(devUrl)) {
    activeServerUrl = devUrl;
    return devUrl;
  }

  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const proc = spawn(npmCmd, ["run", "dev"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env },
    stdio: "ignore",
    windowsHide: true,
    shell: process.platform === "win32",
  });
  serverProcess = proc;
  activeServerUrl = devUrl;

  const ready = await waitForServer(devUrl, 30000);
  if (!ready) {
    throw new Error("Next.js geliştirme sunucusu (http://localhost:3000) yanıt vermedi.");
  }
  return devUrl;
}

function getSplashHtml(title, subtitle) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; }
  .card { text-align: center; padding: 32px 40px; border-radius: 20px; background: #0f172a; border: 1px solid #1e293b; max-width: 420px; box-shadow: 0 20px 50px rgba(0,0,0,0.45); }
  .badge { width: 52px; height: 52px; margin: 0 auto 16px; border-radius: 14px; background: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 24px; }
  h1 { margin: 0 0 8px; font-size: 18px; font-weight: 700; }
  p { margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5; }
  .bar { margin: 20px auto 0; width: 180px; height: 4px; background: #1e293b; border-radius: 99px; overflow: hidden; }
  .bar > div { width: 45%; height: 100%; background: #6366f1; border-radius: 99px; animation: slide 1.1s infinite ease-in-out; }
  @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(260%); } }
</style>
</head>
<body>
  <div class="card">
    <div class="badge">🎓</div>
    <h1>${title}</h1>
    <p>${subtitle}</p>
    <div class="bar"><div></div></div>
  </div>
</body>
</html>`)}`;
}

function createApplicationMenu() {
  const template = [
    {
      label: "Uygulama",
      submenu: [
        {
          label: "Yenile",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.reload(),
        },
        {
          label: "Geliştirici Araçları",
          accelerator: "F12",
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
        { type: "separator" },
        {
          label: "Çıkış",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Görünüm",
      submenu: [
        { role: "resetZoom", label: "Varsayılan Yakınlaştırma" },
        { role: "zoomIn", label: "Yakınlaştır" },
        { role: "zoomOut", label: "Uzaklaştır" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Tam Ekran" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createMainWindow() {
  createApplicationMenu();

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 960,
    minHeight: 680,
    title: "AÖF Akıllı Çalışma Koçu",
    backgroundColor: "#020617",
    autoHideMenuBar: true,
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  await mainWindow.loadURL(
    getSplashHtml(
      "AÖF Akıllı Çalışma Koçu",
      "Çalışma ortamınız ve yerel AI sunucusu başlatılıyor..."
    )
  );

  try {
    const targetUrl = isDevMode
      ? await ensureDevServer()
      : await startEmbeddedProductionServer();
    if (!isQuitting && mainWindow && !mainWindow.isDestroyed()) {
      await mainWindow.loadURL(targetUrl);
    }
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Bilinmeyen başlatma hatası.";
    if (mainWindow && !mainWindow.isDestroyed()) {
      await mainWindow.loadURL(
        getSplashHtml("Başlatma Hatası", msg.replace(/</g, "&lt;"))
      );
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC İşleyicileri
ipcMain.handle("desktop:get-info", () => {
  const cfg = resolveAiConfig();
  const hasGemini = Boolean(
    cfg.geminiApiKey &&
      cfg.geminiApiKey !== "buraya_gemini_api_anahtarinizi_yazin" &&
      cfg.geminiApiKey.length > 10
  );
  const hasEvren = Boolean(cfg.evrenApiKey && cfg.evrenApiKey.length > 10);
  return {
    isDesktop: true,
    version: app.getVersion(),
    userDataPath: app.getPath("userData"),
    hasCustomApiKey: hasGemini || hasEvren,
    hasGeminiApiKey: hasGemini,
    hasEvrenApiKey: hasEvren,
    evrenModel: cfg.evrenModel,
    aiProvider: cfg.aiProvider,
  };
});

ipcMain.handle("desktop:read-state", () => {
  try {
    const file = getDataFilePath();
    if (!fs.existsSync(file)) return null;
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
});

ipcMain.handle("desktop:write-state", (_event, stateJson) => {
  try {
    if (typeof stateJson !== "string") return false;
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.writeFileSync(getDataFilePath(), stateJson, "utf8");
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle("desktop:save-api-key", async (_event, rawPayload) => {
  try {
    const existing = readUserConfig();
    const nextConfig = { ...existing };

    if (typeof rawPayload === "string") {
      nextConfig.geminiApiKey = rawPayload.trim();
    } else if (rawPayload && typeof rawPayload === "object") {
      if (typeof rawPayload.geminiApiKey === "string" && rawPayload.geminiApiKey.trim()) {
        nextConfig.geminiApiKey = rawPayload.geminiApiKey.trim();
      }
      if (typeof rawPayload.evrenApiKey === "string" && rawPayload.evrenApiKey.trim()) {
        nextConfig.evrenApiKey = rawPayload.evrenApiKey.trim();
      }
      if (typeof rawPayload.evrenModel === "string" && rawPayload.evrenModel.trim()) {
        nextConfig.evrenModel = rawPayload.evrenModel.trim();
      }
      if (typeof rawPayload.universalApiKey === "string" && rawPayload.universalApiKey.trim()) {
        const uKey = rawPayload.universalApiKey.trim();
        const uProv = typeof rawPayload.universalProvider === "string" ? rawPayload.universalProvider.trim().toLowerCase() : "auto";
        if (uProv === "gemini" || (uProv === "auto" && (uKey.startsWith("AIza") || uKey.startsWith("AQ.")))) {
          nextConfig.geminiApiKey = uKey;
        } else if (uProv === "evren" || (uProv === "auto" && uKey.startsWith("evren_llm_"))) {
          nextConfig.evrenApiKey = uKey;
          if (rawPayload.universalModel) nextConfig.evrenModel = String(rawPayload.universalModel).trim();
        } else {
          nextConfig.customAiApiKey = uKey;
          nextConfig.customAiProvider = uProv !== "auto" ? uProv : "custom";
          if (rawPayload.universalModel) nextConfig.customAiModel = String(rawPayload.universalModel).trim();
          if (rawPayload.universalBaseUrl) nextConfig.customAiBaseUrl = String(rawPayload.universalBaseUrl).trim();
          nextConfig.aiProvider = nextConfig.customAiProvider;
        }
      } else if (rawPayload.universalProvider === "ollama") {
        nextConfig.customAiProvider = "ollama";
        nextConfig.customAiBaseUrl = String(rawPayload.universalBaseUrl || "http://127.0.0.1:11434/v1").trim();
        nextConfig.customAiModel = String(rawPayload.universalModel || "llama3.1").trim();
        nextConfig.aiProvider = "ollama";
      }
      if (typeof rawPayload.aiProvider === "string" && rawPayload.aiProvider.trim()) {
        if (!rawPayload.universalApiKey && rawPayload.universalProvider !== "ollama") {
          nextConfig.aiProvider = rawPayload.aiProvider.trim();
        }
      }
    }

    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.writeFileSync(
      getConfigPath(),
      JSON.stringify(nextConfig, null, 2),
      "utf8"
    );

    if (!isDevMode) {
      await stopEmbeddedServer();
      await startEmbeddedProductionServer();
      if (mainWindow && !mainWindow.isDestroyed() && activeServerUrl) {
        await mainWindow.loadURL(activeServerUrl);
      }
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "API ayarları kaydedilemedi.",
    };
  }
});

ipcMain.handle("desktop:open-external", (_event, url) => {
  if (typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"))) {
    void shell.openExternal(url);
    return true;
  }
  return false;
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  void createMainWindow();
});

app.on("before-quit", async (event) => {
  if (serverProcess && !isQuitting) {
    event.preventDefault();
    isQuitting = true;
    await stopEmbeddedServer();
    app.quit();
    return;
  }
  isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
