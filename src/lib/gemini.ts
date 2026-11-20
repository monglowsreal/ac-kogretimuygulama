import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash";

const PLACEHOLDER_KEYS = new Set([
  "",
  "buraya_gemini_api_anahtarinizi_yazin",
  "buraya_kendi_gemini_api_anahtarinizi_yazin",
  "your_google_gemini_api_key_here",
]);

export function getConfiguredGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || GEMINI_MODEL;
}

/**
 * Ortam değişkeninde geçerli bir GEMINI_API_KEY tanımlı olup olmadığını kontrol eder.
 */
export function isGeminiKeyConfigured(overrideKey?: string): boolean {
  const key = (overrideKey ?? process.env.GEMINI_API_KEY ?? "").trim();
  return key.length > 10 && !PLACEHOLDER_KEYS.has(key);
}

/**
 * Yapılandırılmış GoogleGenAI istemcisini döndürür.
 * Anahtar eksikse anlaşılır Türkçe hata fırlatır.
 */
export function getGeminiClient(options?: {
  maxAttempts?: number;
  apiKey?: string;
}): GoogleGenAI {
  const effectiveKey = (options?.apiKey ?? process.env.GEMINI_API_KEY ?? "").trim();
  if (!isGeminiKeyConfigured(effectiveKey)) {
    throw new Error(
      "GEMINI_API_KEY tanımlanmamış. Lütfen API Ayarları ekranından geçerli bir Google Gemini API anahtarı ekleyin."
    );
  }
  return new GoogleGenAI({
    apiKey: effectiveKey,
    // JSON mode ve responseSchema desteği için v1beta kullan
    apiVersion: "v1beta",
    httpOptions: {
      timeout: 120000,
      ...(options?.maxAttempts
        ? { retryOptions: { attempts: options.maxAttempts } }
        : {}),
    },
  });
}
