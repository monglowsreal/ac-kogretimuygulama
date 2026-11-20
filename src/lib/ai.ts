import { Type, type Schema } from "@google/genai";
import {
  AI_PROVIDER_PRESETS,
  detectProviderFromKey,
  getProviderPreset,
  isValidAiProviderId,
} from "@/lib/ai-providers";
import { extractJsonObject } from "@/lib/ai-utils";
import { callAnthropicStructuredJson } from "@/lib/anthropic";
import {
  callEvrenStructuredJson,
  getConfiguredEvrenModel,
  isEvrenKeyConfigured,
} from "@/lib/evren";
import {
  getConfiguredGeminiModel,
  getGeminiClient,
  isGeminiKeyConfigured,
} from "@/lib/gemini";
import { callOpenAiCompatibleJson } from "@/lib/openai-compat";
import {
  AiGenerationMeta,
  AiProviderId,
  AiProviderPreference,
  AvailableProviderInfo,
  ClientAiOverride,
} from "@/types/coach";

export type JsonSchemaTypeName =
  | "object"
  | "array"
  | "string"
  | "number"
  | "integer"
  | "boolean";

export interface JsonSchemaNode {
  type: JsonSchemaTypeName;
  description?: string;
  enum?: string[];
  properties?: Record<string, JsonSchemaNode>;
  items?: JsonSchemaNode;
  required?: string[];
  additionalProperties?: boolean;
}

const GEMINI_TYPE_MAP: Record<JsonSchemaTypeName, Type> = {
  object: Type.OBJECT,
  array: Type.ARRAY,
  string: Type.STRING,
  number: Type.NUMBER,
  integer: Type.INTEGER,
  boolean: Type.BOOLEAN,
};

/**
 * Tek bir standart JSON Şeması tanımını @google/genai Schema yapısına dönüştürür.
 */
export function toGeminiSchema(node: JsonSchemaNode): Schema {
  const schema: Schema = {
    type: GEMINI_TYPE_MAP[node.type],
  };

  if (node.description) schema.description = node.description;
  if (node.enum) schema.enum = node.enum;
  if (node.required) schema.required = node.required;
  if (node.items) schema.items = toGeminiSchema(node.items);

  if (node.properties) {
    const convertedProps: Record<string, Schema> = {};
    for (const [key, propNode] of Object.entries(node.properties)) {
      convertedProps[key] = toGeminiSchema(propNode);
    }
    schema.properties = convertedProps;
  }

  return schema;
}

interface ResolvedProviderEntry {
  id: AiProviderId;
  label: string;
  protocol: "gemini" | "evren" | "anthropic" | "openai_compatible";
  apiKey: string;
  baseUrl: string;
  model: string;
}

const PLACEHOLDER_VALUE_RE = /^(buraya_|your_|gercek_|sk-your|AIzaSy\.\.\.)/i;

function cleanKey(val: string | undefined): string {
  const trimmed = val?.trim() ?? "";
  if (!trimmed || PLACEHOLDER_VALUE_RE.test(trimmed)) return "";
  return trimmed;
}

function isSafeExternalBaseUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const isCloud = Boolean(
      process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT || process.env.RENDER
    );
    if (isCloud) {
      if (u.protocol !== "https:") return false;
      const h = u.hostname.toLowerCase();
      if (
        h === "localhost" ||
        h === "127.0.0.1" ||
        h === "::1" ||
        h.startsWith("10.") ||
        h.startsWith("192.168.") ||
        h.startsWith("169.254.") ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(h)
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function buildEntry(
  id: AiProviderId,
  apiKey: string,
  baseUrlOverride?: string,
  modelOverride?: string
): ResolvedProviderEntry | null {
  const preset = getProviderPreset(id);
  const baseUrl = (baseUrlOverride?.trim() || preset.defaultBaseUrl).trim();
  const model = (modelOverride?.trim() || preset.defaultModel).trim();

  if (preset.protocol === "openai_compatible") {
    if (!baseUrl || !isSafeExternalBaseUrl(baseUrl)) return null;
    if (preset.requiresKey && apiKey.length < 4) return null;
  } else if (apiKey.length <= 10) {
    return null;
  }

  return {
    id,
    label: preset.label,
    protocol: preset.protocol,
    apiKey,
    baseUrl,
    model,
  };
}

function collectServerProviders(): ResolvedProviderEntry[] {
  const list: ResolvedProviderEntry[] = [];
  const seen = new Set<AiProviderId>();

  const pushEntry = (entry: ResolvedProviderEntry | null) => {
    if (!entry || seen.has(entry.id)) return;
    seen.add(entry.id);
    list.push(entry);
  };

  // 1. Özel/Evrensel yapılandırma (CUSTOM_AI_*)
  const customKey = cleanKey(process.env.CUSTOM_AI_API_KEY);
  const customPref = process.env.CUSTOM_AI_PROVIDER?.trim().toLowerCase();
  const customBaseUrl = process.env.CUSTOM_AI_BASE_URL?.trim();
  const customModel = process.env.CUSTOM_AI_MODEL?.trim();

  if (customKey || customPref === "ollama" || process.env.OLLAMA_BASE_URL?.trim()) {
    let resolvedId: AiProviderId;
    if (isValidAiProviderId(customPref)) {
      resolvedId = customPref;
    } else if (customKey) {
      resolvedId = detectProviderFromKey(customKey).provider;
    } else {
      resolvedId = "ollama";
    }
    pushEntry(
      buildEntry(
        resolvedId,
        customKey,
        customBaseUrl || process.env.OLLAMA_BASE_URL?.trim(),
        customModel
      )
    );
  }

  // 2. GEMINI_API_KEY (kullanıcı yanlışlıkla başka bir anahtar yapıştırdıysa bile tanı!)
  const geminiRaw = cleanKey(process.env.GEMINI_API_KEY);
  if (geminiRaw) {
    const detected = detectProviderFromKey(geminiRaw);
    if (detected.provider === "gemini" || !detected.confident) {
      if (isGeminiKeyConfigured(geminiRaw)) {
        pushEntry(buildEntry("gemini", geminiRaw, "", getConfiguredGeminiModel()));
      }
    } else {
      pushEntry(buildEntry(detected.provider, geminiRaw));
    }
  }

  // 3. EVREN_API_KEY
  if (isEvrenKeyConfigured()) {
    pushEntry(
      buildEntry(
        "evren",
        cleanKey(process.env.EVREN_API_KEY),
        process.env.EVREN_BASE_URL,
        getConfiguredEvrenModel()
      )
    );
  }

  // 4. Diğer standart env anahtarları (OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY vb.)
  for (const preset of AI_PROVIDER_PRESETS) {
    if (preset.id === "gemini" || preset.id === "evren" || preset.id === "custom" || preset.id === "ollama") {
      continue;
    }
    const envVal = cleanKey(process.env[preset.envKeyName]);
    if (envVal) {
      const modelEnv =
        process.env[`${preset.id.toUpperCase()}_MODEL`]?.trim() ||
        preset.defaultModel;
      pushEntry(buildEntry(preset.id, envVal, preset.defaultBaseUrl, modelEnv));
    }
  }

  return list;
}

function buildEntryFromClientOverride(
  override?: ClientAiOverride
): ResolvedProviderEntry | null {
  if (!override) return null;
  const key = cleanKey(override.apiKey);
  const rawProv = override.provider;
  if (!key && rawProv !== "ollama") return null;

  const resolvedId: AiProviderId =
    rawProv && rawProv !== "auto" && isValidAiProviderId(rawProv)
      ? rawProv
      : detectProviderFromKey(key).provider;

  return buildEntry(resolvedId, key, override.baseUrl, override.model);
}

export interface AiStatusSnapshot {
  configured: boolean;
  geminiConfigured: boolean;
  evrenConfigured: boolean;
  model: string;
  geminiModel: string;
  evrenModel: string;
  preferredProvider: AiProviderPreference;
  activeProvider: AiProviderId | null;
  availableProviders: AvailableProviderInfo[];
}

export function resolveProviderPreference(
  requested?: unknown
): AiProviderPreference {
  if (requested === "auto") return "auto";
  if (isValidAiProviderId(requested)) return requested;

  const envPref = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (envPref === "auto") return "auto";
  if (isValidAiProviderId(envPref)) return envPref;

  return "auto";
}

function sortProvidersForExecution(
  providers: ResolvedProviderEntry[],
  clientRequestedPref?: AiProviderPreference
): ResolvedProviderEntry[] {
  if (providers.length <= 1) return providers;

  // Eğer kullanıcı doğrudan belirli bir sağlayıcı seçtiyse (örn: Groq, EVREN, OpenAI)
  if (clientRequestedPref && clientRequestedPref !== "auto") {
    const primary = providers.find((p) => p.id === clientRequestedPref);
    if (!primary) return [];
    const rest = providers.filter((p) => p.id !== clientRequestedPref);
    return [primary, ...rest];
  }

  // "auto" modunda .env AI_PROVIDER önceliğini (varsa) başa al
  const envPref = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (isValidAiProviderId(envPref)) {
    const preferred = providers.find((p) => p.id === envPref);
    if (preferred) {
      return [preferred, ...providers.filter((p) => p.id !== envPref)];
    }
  }

  // Varsayılan öncelik sırası: custom -> gemini -> evren -> diğerleri
  const customPref = process.env.CUSTOM_AI_PROVIDER?.trim().toLowerCase();
  const priorityOrder = (p: ResolvedProviderEntry): number => {
    if (p.id !== "gemini" && p.id !== "evren" && isValidAiProviderId(customPref) && p.id === customPref) {
      return 0;
    }
    if (p.id === "gemini") return 1;
    if (p.id === "evren") return 2;
    return 3;
  };

  return [...providers].sort((a, b) => priorityOrder(a) - priorityOrder(b));
}

export function getAiStatusSnapshot(
  clientOverride?: ClientAiOverride
): AiStatusSnapshot {
  const serverProviders = collectServerProviders();
  const overrideEntry = buildEntryFromClientOverride(clientOverride);
  const combined = overrideEntry
    ? [
        overrideEntry,
        ...serverProviders.filter((p) => p.id !== overrideEntry.id),
      ]
    : serverProviders;

  const effectivePref = overrideEntry
    ? overrideEntry.id
    : resolveProviderPreference();
  const sorted = sortProvidersForExecution(combined, effectivePref);
  const geminiEntry = combined.find((p) => p.id === "gemini");
  const evrenEntry = combined.find((p) => p.id === "evren");
  const primary = sorted[0] ?? null;

  return {
    configured: combined.length > 0,
    geminiConfigured: Boolean(geminiEntry),
    evrenConfigured: Boolean(evrenEntry),
    model: primary?.model || getConfiguredGeminiModel(),
    geminiModel: geminiEntry?.model || getConfiguredGeminiModel(),
    evrenModel: evrenEntry?.model || getConfiguredEvrenModel(),
    preferredProvider: effectivePref,
    activeProvider: primary?.id ?? null,
    availableProviders: sorted.map((p) => ({
      id: p.id,
      label: p.label,
      model: p.model,
    })),
  };
}

function summarizeProviderError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "Bilinmeyen hata");
  const lower = raw.toLowerCase();

  if (
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  ) {
    return "Kota / hız sınırı doldu";
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("api key")) {
    return "API anahtarı veya yetki hatası";
  }
  if (lower.includes("timeout") || lower.includes("fetch failed")) {
    return "Bağlantı zaman aşımı";
  }
  return raw.length > 140 ? `${raw.slice(0, 140)}...` : raw;
}

export interface GenerateStructuredOptions {
  schemaName: string;
  jsonSchema: JsonSchemaNode;
  systemInstruction: string;
  prompt: string;
  temperature: number;
  preferredProvider?: AiProviderPreference;
  evrenModel?: string;
  thinkingBudget?: number;
  clientAiConfig?: ClientAiOverride;
}

export interface GenerateStructuredResult<T> {
  data: T;
  aiMeta: AiGenerationMeta;
}

async function runGeminiStructured<T>(
  entry: ResolvedProviderEntry,
  options: GenerateStructuredOptions,
  hasBackup: boolean
): Promise<{ data: T; model: string }> {
  const ai = getGeminiClient({
    apiKey: entry.apiKey,
    maxAttempts: hasBackup ? 1 : 2,
  });
  const response = await ai.models.generateContent({
    model: entry.model,
    contents: options.prompt,
    config: {
      systemInstruction: options.systemInstruction,
      temperature: options.temperature,
      maxOutputTokens: 32768,
      thinkingConfig: { thinkingBudget: options.thinkingBudget ?? 512 },
      responseMimeType: "application/json",
      responseSchema: toGeminiSchema(options.jsonSchema),
    },
  });

  const rawJson = response.text;
  if (!rawJson) {
    throw new Error("Gemini API boş yanıt döndürdü.");
  }

  return {
    data: extractJsonObject<T>(rawJson),
    model: entry.model,
  };
}

async function executeEntry<T>(
  entry: ResolvedProviderEntry,
  options: GenerateStructuredOptions,
  hasBackup: boolean
): Promise<{ data: T; model: string; remainingCr?: string }> {
  if (entry.protocol === "gemini") {
    return runGeminiStructured<T>(entry, options, hasBackup);
  }

  if (entry.protocol === "evren") {
    return callEvrenStructuredJson<T>({
      schemaName: options.schemaName,
      jsonSchema: options.jsonSchema as unknown as Record<string, unknown>,
      systemInstruction: options.systemInstruction,
      prompt: options.prompt,
      temperature: options.temperature,
      model: options.evrenModel || entry.model,
    });
  }

  if (entry.protocol === "anthropic") {
    return callAnthropicStructuredJson<T>({
      baseUrl: entry.baseUrl,
      apiKey: entry.apiKey,
      model: entry.model,
      schemaName: options.schemaName,
      jsonSchema: options.jsonSchema as unknown as Record<string, unknown>,
      systemInstruction: options.systemInstruction,
      prompt: options.prompt,
      temperature: options.temperature,
    });
  }

  return callOpenAiCompatibleJson<T>({
    baseUrl: entry.baseUrl,
    apiKey: entry.apiKey,
    model: entry.model,
    schemaName: options.schemaName,
    jsonSchema: options.jsonSchema as unknown as Record<string, unknown>,
    systemInstruction: options.systemInstruction,
    prompt: options.prompt,
    temperature: options.temperature,
  });
}

/**
 * Yapılandırılmış JSON yanıtı tanımlı AI sağlayıcısından (Gemini, OpenAI, Claude, Groq, OpenRouter,
 * DeepSeek, xAI, Mistral, Together, EVREN, Ollama veya özel URL) üretir;
 * birden fazla anahtar tanımlıysa hata/kota durumunda sıradaki yedeğe geçer.
 */
export async function generateStructuredJson<T>(
  options: GenerateStructuredOptions
): Promise<GenerateStructuredResult<T>> {
  const serverProviders = collectServerProviders();
  const overrideEntry = buildEntryFromClientOverride(options.clientAiConfig);
  const allProviders = overrideEntry
    ? [overrideEntry, ...serverProviders.filter((p) => p.id !== overrideEntry.id)]
    : serverProviders;

  if (allProviders.length === 0) {
    throw new Error(
      "Hiçbir AI API anahtarı yapılandırılmamış. Lütfen API Ayarları ekranından geçerli bir API anahtarı girin."
    );
  }

  const clientPref = overrideEntry
    ? overrideEntry.id
    : options.preferredProvider;
  const providers = sortProvidersForExecution(allProviders, clientPref);

  if (providers.length === 0) {
    throw new Error(
      "Seçili AI sağlayıcı için geçerli bir API anahtarı bulunamadı."
    );
  }

  let fallbackFrom: AiProviderId | undefined;
  let fallbackReason: string | undefined;
  const errors: string[] = [];

  for (let idx = 0; idx < providers.length; idx += 1) {
    const entry = providers[idx];
    const hasBackup = idx < providers.length - 1;
    try {
      const res = await executeEntry<T>(entry, options, hasBackup);
      return {
        data: res.data,
        aiMeta: {
          provider: entry.id,
          providerLabel: entry.label,
          model: res.model,
          ...(fallbackFrom ? { fallbackFrom, fallbackReason } : {}),
          ...(res.remainingCr ? { evrenRemainingCr: res.remainingCr } : {}),
        },
      };
    } catch (err) {
      const reason = summarizeProviderError(err);
      errors.push(`${entry.label}: ${reason}`);

      if (hasBackup) {
        console.warn(
          `[AI Fallback] ${entry.id} başarısız (${reason}), yedek sağlayıcıya geçiliyor...`
        );
        fallbackFrom = entry.id;
        fallbackReason = reason;
        continue;
      }
    }
  }

  throw new Error(errors.join(" | "));
}
