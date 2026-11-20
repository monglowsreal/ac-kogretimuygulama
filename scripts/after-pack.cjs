const fs = require("node:fs");
const path = require("node:path");

/**
 * electron-builder varsayılan olarak extraResources içindeki node_modules klasörünü
 * atladığı için, Next.js standalone sunucusunun izlenmiş (traced) node_modules
 * bağımlılıklarını paket çıktı klasörüne doğrudan kopyalar.
 */
exports.default = async function afterPack(context) {
  const sourceNodeModules = path.resolve(
    process.cwd(),
    ".next",
    "standalone",
    "node_modules"
  );
  const targetStandaloneDir = path.join(
    context.appOutDir,
    "resources",
    "standalone"
  );
  const targetNodeModules = path.join(targetStandaloneDir, "node_modules");

  if (!fs.existsSync(sourceNodeModules)) {
    throw new Error(
      `Standalone node_modules bulunamadı: ${sourceNodeModules}`
    );
  }

  fs.mkdirSync(targetStandaloneDir, { recursive: true });
  fs.rmSync(targetNodeModules, { recursive: true, force: true });
  fs.cpSync(sourceNodeModules, targetNodeModules, {
    recursive: true,
    dereference: true,
  });

  console.log(
    `afterPack: standalone node_modules kopyalandı -> ${targetNodeModules}`
  );
};
