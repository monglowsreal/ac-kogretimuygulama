import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const STANDALONE_SRC = path.join(ROOT_DIR, ".next", "standalone");
const RELEASE_DIR = path.join(ROOT_DIR, "dist-release");
const STAGE_NAME = "AOF-Akilli-Calisma-Kocu";
const STAGE_DIR = path.join(RELEASE_DIR, STAGE_NAME);
const ZIP_PATH = path.join(RELEASE_DIR, "AOF-Akilli-Calisma-Kocu-Hazir-Paket.zip");

if (!fs.existsSync(path.join(STANDALONE_SRC, "server.js"))) {
  console.error(
    "HATA: .next/standalone/server.js bulunamadı. Önce 'npm run desktop:prepare' çalıştırın."
  );
  process.exit(1);
}

fs.rmSync(STAGE_DIR, { recursive: true, force: true });
fs.mkdirSync(STAGE_DIR, { recursive: true });

const SENSITIVE_BASENAMES = new Set([
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  "coach-data.json",
  "config.json",
]);

function copySafeFilter(src) {
  const base = path.basename(src);
  return !SENSITIVE_BASENAMES.has(base);
}

// 1. Önceden derlenmiş Next.js standalone sunucusu (node_modules dahil)
fs.cpSync(STANDALONE_SRC, path.join(STAGE_DIR, ".next", "standalone"), {
  recursive: true,
  force: true,
  dereference: true,
  filter: copySafeFilter,
});

// 2. Başlatıcı betikler ve simge
fs.mkdirSync(path.join(STAGE_DIR, "scripts"), { recursive: true });
for (const name of ["launch-app.mjs", "create-shortcut.mjs"]) {
  fs.copyFileSync(
    path.join(ROOT_DIR, "scripts", name),
    path.join(STAGE_DIR, "scripts", name)
  );
}

const iconSrc = path.join(ROOT_DIR, "build", "icon.ico");
if (fs.existsSync(iconSrc)) {
  fs.mkdirSync(path.join(STAGE_DIR, "build"), { recursive: true });
  fs.copyFileSync(iconSrc, path.join(STAGE_DIR, "build", "icon.ico"));
}

// 3. Kök kullanım dosyaları
for (const file of [
  "BASLAT.cmd",
  "Masaustu_Kisayolu_Olustur.cmd",
  ".env.example",
  "README.md",
  "LICENSE",
]) {
  const src = path.join(ROOT_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(STAGE_DIR, file));
  }
}

// 4. ZIP arşivi oluştur
fs.rmSync(ZIP_PATH, { force: true });
if (process.platform === "win32") {
  execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${STAGE_DIR}\\*' -DestinationPath '${ZIP_PATH}' -CompressionLevel Optimal`,
    ],
    { stdio: "inherit" }
  );
} else {
  execFileSync("zip", ["-rq", ZIP_PATH, "."], { cwd: STAGE_DIR, stdio: "inherit" });
}

console.log(`Hazır Release paketi oluşturuldu: ${ZIP_PATH}`);
