import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const standaloneNextDir = path.join(standaloneDir, ".next");
const sourceStaticDir = path.join(root, ".next", "static");
const targetStaticDir = path.join(standaloneNextDir, "static");
const sourcePublicDir = path.join(root, "public");
const targetPublicDir = path.join(standaloneDir, "public");

if (!fs.existsSync(path.join(standaloneDir, "server.js"))) {
  console.error(
    "HATA: .next/standalone/server.js bulunamadı. Önce 'npm run build' çalıştırın."
  );
  process.exit(1);
}

// Statik varlıkları standalone çıktısına kopyala
if (fs.existsSync(sourceStaticDir)) {
  fs.rmSync(targetStaticDir, { recursive: true, force: true });
  fs.cpSync(sourceStaticDir, targetStaticDir, { recursive: true });
  console.log("Kopyalandı: .next/static -> .next/standalone/.next/static");
}

if (fs.existsSync(sourcePublicDir)) {
  fs.rmSync(targetPublicDir, { recursive: true, force: true });
  fs.cpSync(sourcePublicDir, targetPublicDir, { recursive: true });
  console.log("Kopyalandı: public -> .next/standalone/public");
}

// Paketlenecek çıktı içine yerel .env.local sızmaması için temizle
for (const envName of [".env", ".env.local", ".env.development", ".env.production"]) {
  const candidate = path.join(standaloneDir, envName);
  if (fs.existsSync(candidate)) {
    fs.rmSync(candidate, { force: true });
    console.log(`Güvenlik temizliği: ${envName} standalone çıktısından çıkarıldı.`);
  }
}

console.log("Standalone masaüstü sunucusu hazır!");
