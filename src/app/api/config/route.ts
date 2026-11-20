import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  detectProviderFromKey,
  getProviderPreset,
  isValidAiProviderId,
} from "@/lib/ai-providers";
import { isLocalDiskSyncAllowed } from "@/lib/local-guard";

function resolveEnvLocalPath(): string {
  const rootDir = process.env.APP_ROOT_DIR?.trim() || process.cwd();
  return path.join(rootDir, ".env.local");
}

function parseEnvLines(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) map.set(key, val);
  }
  return map;
}

export async function POST(req: NextRequest) {
  if (!isLocalDiskSyncAllowed(req)) {
    return NextResponse.json(
      { error: "Yerel API yapılandırması yalnızca kendi bilgisayarınızda kullanılabilir." },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as {
      geminiApiKey?: string;
      evrenApiKey?: string;
      evrenModel?: string;
      aiProvider?: string;
      universalApiKey?: string;
      universalProvider?: string;
      universalModel?: string;
      universalBaseUrl?: string;
    };

    const envPath = resolveEnvLocalPath();
    let existingRaw = "";
    try {
      existingRaw = await fs.readFile(envPath, "utf8");
    } catch {
      existingRaw = "";
    }

    const envMap = parseEnvLines(existingRaw);
    const setVar = (k: string, v: string) => {
      envMap.set(k, v);
      process.env[k] = v;
    };

    // 1. Evrensel anahtar alanı doldurulduysa (veya Ollama seçildiyse) sağlayıcıyı otomatik bağla
    const uKey = body.universalApiKey?.trim() ?? "";
    const uProvRaw = body.universalProvider?.trim().toLowerCase() ?? "auto";
    if (uKey || uProvRaw === "ollama") {
      const resolvedId =
        uProvRaw !== "auto" && isValidAiProviderId(uProvRaw)
          ? uProvRaw
          : detectProviderFromKey(uKey).provider;
      const preset = getProviderPreset(resolvedId);

      if (resolvedId === "gemini") {
        if (uKey) setVar("GEMINI_API_KEY", uKey);
        if (body.universalModel?.trim()) {
          setVar("GEMINI_MODEL", body.universalModel.trim());
        }
      } else if (resolvedId === "evren") {
        if (uKey) setVar("EVREN_API_KEY", uKey);
        setVar("EVREN_MODEL", body.universalModel?.trim() || preset.defaultModel);
      } else {
        setVar("CUSTOM_AI_PROVIDER", resolvedId);
        if (uKey) setVar("CUSTOM_AI_API_KEY", uKey);
        setVar(
          "CUSTOM_AI_MODEL",
          body.universalModel?.trim() || preset.defaultModel
        );
        const targetUrl = body.universalBaseUrl?.trim() || preset.defaultBaseUrl;
        if (targetUrl) {
          setVar("CUSTOM_AI_BASE_URL", targetUrl);
        }
      }

      if (!body.aiProvider || body.aiProvider === "auto") {
        setVar("AI_PROVIDER", resolvedId);
      }
    }

    // 2. Doğrudan alanlar (geriye dönük uyumluluk / yedek anahtarlar)
    if (typeof body.geminiApiKey === "string" && body.geminiApiKey.trim()) {
      setVar("GEMINI_API_KEY", body.geminiApiKey.trim());
    }
    if (typeof body.evrenApiKey === "string" && body.evrenApiKey.trim()) {
      setVar("EVREN_API_KEY", body.evrenApiKey.trim());
    }
    if (typeof body.evrenModel === "string" && body.evrenModel.trim()) {
      setVar("EVREN_MODEL", body.evrenModel.trim());
    }
    if (body.aiProvider === "auto" || isValidAiProviderId(body.aiProvider)) {
      if (!uKey && uProvRaw !== "ollama") {
        setVar("AI_PROVIDER", body.aiProvider);
      }
    }

    const serialized = Array.from(envMap.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("\n")
      .concat("\n");

    await fs.writeFile(envPath, serialized, "utf8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("API yapılandırması kaydedilemedi:", err);
    return NextResponse.json(
      { error: "API anahtarı .env.local dosyasına yazılamadı." },
      { status: 500 }
    );
  }
}
