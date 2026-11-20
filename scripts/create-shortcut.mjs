import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

if (process.platform !== "win32") {
  console.log("Masaüstü kısayolu oluşturma yalnızca Windows için geçerlidir.");
  process.exit(0);
}

const launchScript = path.join(ROOT_DIR, "scripts", "launch-app.mjs");
const iconPath = path.join(ROOT_DIR, "build", "icon.ico");
const nodeExe = process.execPath;

const psScript = `
$desk = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desk 'AÖF Akıllı Çalışma Koçu.lnk'
$sh = New-Object -ComObject WScript.Shell
$sc = $sh.CreateShortcut($lnkPath)
$sc.TargetPath = ${JSON.stringify(nodeExe)}
$sc.Arguments = ${JSON.stringify(`"${launchScript}"`)}
$sc.WorkingDirectory = ${JSON.stringify(ROOT_DIR)}
${fs.existsSync(iconPath) ? `$sc.IconLocation = ${JSON.stringify(iconPath)}` : ""}
$sc.WindowStyle = 7
$sc.Description = 'AÖF Akıllı Çalışma Koçu'
$sc.Save()
Write-Host "Masaüstü kısayolu oluşturuldu:" $lnkPath
`;

execFileSync(
  "powershell.exe",
  ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript],
  { stdio: "inherit" }
);
