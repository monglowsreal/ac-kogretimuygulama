import {
  EVREN_CHAT_MODELS,
  EVREN_DEFAULT_MODEL,
  type EvrenModelSpec,
} from "@/data/evren-models";
import { extractJsonObject } from "@/lib/ai-utils";

export const EVREN_DEFAULT_BASE_URL = "https://evren-llmapi.ssyz.org.tr/v1";
export { EVREN_CHAT_MODELS, EVREN_DEFAULT_MODEL, type EvrenModelSpec };

const STREAM_IDLE_TIMEOUT_MS = 35_000;
const STREAM_TOTAL_TIMEOUT_MS = 120_000;

const PLACEHOLDER_EVREN_KEYS = new Set([
  "",
  "buraya_evren_api_anahtarinizi_yazin",
  "your_evren_api_key_here",
]);

export function getEvrenBaseUrl(): string {
  const raw = process.env.EVREN_BASE_URL?.trim();
  if (!raw) return EVREN_DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, "");
}

export function getConfiguredEvrenModel(overrideModel?: string): string {
  const candidate = overrideModel?.trim() || process.env.EVREN_MODEL?.trim();
  return candidate || EVREN_DEFAULT_MODEL;
}

export function getEvrenModelSpec(modelId: string): EvrenModelSpec {
  const found = EVREN_CHAT_MODELS.find((m) => m.id === modelId);
  if (found) return found;
  return {
    id: modelId,
    label: modelId,
    contextLength: 131072,
    maxContextChars: 180000,
    defaultMaxOutputTokens: 12288,
    supportsResponseFormat: true,
    supportsThinkingToggle: false,
  };
}

export function isEvrenKeyConfigured(): boolean {
  const key = process.env.EVREN_API_KEY?.trim() ?? "";
  return key.length > 10 && !PLACEHOLDER_EVREN_KEYS.has(key);
}

export interface EvrenJsonCallOptions {
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  systemInstruction: string;
  prompt: string;
  temperature: number;
  model?: string;
}

export interface EvrenJsonCallResult<T> {
  data: T;
  model: string;
  remainingCr?: string;
}

interface EvrenStreamUsage {
  evren?: {
    credits_remaining_cr?: string;
    routed_model?: string;
  };
}

interface EvrenChatResponse {
  model?: string;
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string | null;
      reasoning?: string | null;
    };
    delta?: {
      content?: string | null;
    };
  }>;
  usage?: EvrenStreamUsage;
  error?: {
    message?: string;
    code?: string;
  };
}

function buildEvrenRequestBody(
  spec: EvrenModelSpec,
  options: EvrenJsonCallOptions,
  responseMode: "json_schema" | "json_object" | "plain",
  disableThinking: boolean
): Record<string, unknown> {
  const trimmedPrompt = options.prompt.slice(0, spec.maxContextChars);
  const systemText =
    responseMode === "json_schema"
      ? options.systemInstruction
      : `${options.systemInstruction}\n\nÖNEMLİ ÇIKTI FORMATI: Yanıtını MUTLAKA aşağıda tanımlı JSON Şeması'na birebir uyan tek ve geçerli bir JSON nesnesi olarak döndür. Tüm zorunlu alanları doldur, Markdown \`\`\`json kod bloğu veya açıklama metni ekleme.\nBeklenen JSON Şeması:\n${JSON.stringify(
          options.jsonSchema
        )}`;

  const payload: Record<string, unknown> = {
    model: spec.id,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      { role: "system", content: systemText },
      { role: "user", content: trimmedPrompt },
    ],
    temperature: options.temperature,
    max_tokens: spec.defaultMaxOutputTokens,
  };

  if (disableThinking && spec.supportsThinkingToggle) {
    payload.thinking = false;
  }

  if (responseMode === "json_schema" && spec.supportsResponseFormat) {
    payload.response_format = {
      type: "json_schema",
      json_schema: {
        name: options.schemaName,
        strict: true,
        schema: options.jsonSchema,
      },
    };
  } else if (responseMode === "json_object" && spec.supportsResponseFormat) {
    payload.response_format = { type: "json_object" };
  }

  return payload;
}

async function readChunkWithIdleTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  idleMs: number
): Promise<ReadableStreamReadResult<Uint8Array>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error("EVREN akış yanıtı zaman aşımına uğradı (timeout)."));
        }, idleMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function readEvrenSseBody(
  res: Response,
  fallbackModelId: string
): Promise<{ content: string; model: string; remainingCr?: string }> {
  if (!res.body) {
    throw new Error("EVREN yanıt akışı boş geldi.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = "";
  let content = "";
  let model = fallbackModelId;
  let remainingCr: string | undefined;

  try {
    while (true) {
      const { value, done } = await readChunkWithIdleTimeout(
        reader,
        STREAM_IDLE_TIMEOUT_MS
      );
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split(/\r?\n/);
      sseBuffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        try {
          const event = JSON.parse(payload) as EvrenChatResponse;
          if (event.error?.message) {
            throw new Error(event.error.message);
          }
          if (event.model) model = event.model;
          const delta = event.choices?.[0]?.delta?.content;
          if (delta) content += delta;
          const legacyContent = event.choices?.[0]?.message?.content;
          if (!delta && legacyContent) content += legacyContent;
          if (event.usage?.evren?.credits_remaining_cr) {
            remainingCr = event.usage.evren.credits_remaining_cr;
          }
        } catch (err) {
          if (err instanceof Error && !err.message.includes("JSON")) {
            throw err;
          }
          // Yarım kalan SSE JSON parçası olabilir; bir sonraki satırda tamamlanır
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { content: content.trim(), model, remainingCr };
}

async function sendEvrenStreamingChat(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>,
  fallbackModelId: string
): Promise<
  | { ok: true; content: string; model: string; remainingCr?: string }
  | { ok: false; status: number; rawText: string }
> {
  const controller = new AbortController();
  const totalTimer = setTimeout(() => controller.abort(), STREAM_TOTAL_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const rawText = await res.text();
      return { ok: false, status: res.status, rawText };
    }

    const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType.includes("application/json")) {
      const rawJson = await res.text();
      const parsed = JSON.parse(rawJson) as EvrenChatResponse;
      return {
        ok: true,
        content: parsed.choices?.[0]?.message?.content?.trim() ?? "",
        model: parsed.model || fallbackModelId,
        remainingCr: parsed.usage?.evren?.credits_remaining_cr,
      };
    }

    const streamed = await readEvrenSseBody(res, fallbackModelId);
    return { ok: true, ...streamed };
  } finally {
    clearTimeout(totalTimer);
  }
}

function parseEvrenError(
  status: number,
  rawText: string
): {
  message: string;
  retryOtherModel: boolean;
} {
  try {
    const parsed = JSON.parse(rawText) as EvrenChatResponse;
    const code = parsed.error?.code;
    const msg = parsed.error?.message;
    if (code === "terms_not_accepted") {
      return {
        message:
          "EVREN LLM kullanım şartları henüz onaylanmamış. Lütfen evren.ssyz.org.tr panelinden şartları onaylayın.",
        retryOtherModel: false,
      };
    }
    if (status === 401 || status === 403) {
      return {
        message: `EVREN API yetkilendirme hatası (${status})${msg ? `: ${msg}` : "."}`,
        retryOtherModel: false,
      };
    }
    if (status === 429 || status === 503 || status === 502 || status === 504) {
      return {
        message: `EVREN geçici yoğunluk (${status})${msg ? `: ${msg}` : "."}`,
        retryOtherModel: true,
      };
    }
    if (msg) {
      return {
        message: `EVREN API hatası (${status}): ${msg}`,
        retryOtherModel: status >= 500,
      };
    }
  } catch {
    // Ham metne düş
  }
  return {
    message: `EVREN API hatası (${status}): ${rawText.slice(0, 220)}`,
    retryOtherModel: status >= 500 || status === 429,
  };
}

function buildEvrenCandidateModels(
  primaryModelId: string,
  promptLength: number
): string[] {
  const ordered = [primaryModelId];
  for (const m of EVREN_CHAT_MODELS) {
    if (!ordered.includes(m.id)) {
      ordered.push(m.id);
    }
  }
  // Çok uzun tam ünitelerde yalnızca prompt'u sığdırabilen modelleri öncele
  const fitting = ordered.filter(
    (id) => getEvrenModelSpec(id).maxContextChars >= promptLength
  );
  return fitting.length > 0 ? fitting : ordered;
}

async function runSingleEvrenModel<T>(
  baseUrl: string,
  apiKey: string,
  spec: EvrenModelSpec,
  options: EvrenJsonCallOptions
): Promise<{
  result?: EvrenJsonCallResult<T>;
  error?: string;
  tryNextModel: boolean;
}> {
  const attempts: Array<{
    mode: "json_schema" | "json_object" | "plain";
    disableThinking: boolean;
  }> = spec.supportsResponseFormat
    ? [
        { mode: "json_object", disableThinking: spec.supportsThinkingToggle },
        { mode: "json_schema", disableThinking: spec.supportsThinkingToggle },
        { mode: "plain", disableThinking: false },
      ]
    : [{ mode: "plain", disableThinking: false }];

  let lastError = `${spec.id} yanıt veremedi.`;

  for (let i = 0; i < attempts.length; i += 1) {
    const attempt = attempts[i];
    const body = buildEvrenRequestBody(
      spec,
      options,
      attempt.mode,
      attempt.disableThinking
    );

    try {
      const response = await sendEvrenStreamingChat(baseUrl, apiKey, body, spec.id);
      if (!response.ok) {
        const errInfo = parseEvrenError(response.status, response.rawText);
        lastError = errInfo.message;
        if (
          (response.status === 400 || response.status === 422) &&
          i < attempts.length - 1
        ) {
          continue;
        }
        return { error: lastError, tryNextModel: errInfo.retryOtherModel };
      }

      if (!response.content) {
        lastError = `${spec.id} boş yanıt döndürdü.`;
        if (i < attempts.length - 1) continue;
        return { error: lastError, tryNextModel: true };
      }

      const data = extractJsonObject<T>(response.content);
      return {
        result: {
          data,
          model: response.model,
          remainingCr: response.remainingCr,
        },
        tryNextModel: false,
      };
    } catch (err) {
      lastError =
        err instanceof Error ? err.message : `${spec.id} bağlantı hatası.`;
      const isTimeoutOrAbort =
        lastError.toLowerCase().includes("timeout") ||
        lastError.toLowerCase().includes("abort");
      if (i < attempts.length - 1 && !isTimeoutOrAbort) {
        continue;
      }
      return { error: lastError, tryNextModel: true };
    }
  }

  return { error: lastError, tryNextModel: true };
}

/**
 * EVREN OpenAI-uyumlu /v1/chat/completions üzerinden akışlı (streaming) ve katı JSON üretir.
 * Bir model geçici yoğunlukta (503/429) veya zaman aşımındaysa diğer EVREN modellerine geçer.
 */
export async function callEvrenStructuredJson<T>(
  options: EvrenJsonCallOptions
): Promise<EvrenJsonCallResult<T>> {
  if (!isEvrenKeyConfigured()) {
    throw new Error(
      "EVREN_API_KEY tanımlanmamış. Lütfen .env.local veya masaüstü ayarlarından geçerli bir EVREN API anahtarı girin."
    );
  }

  const apiKey = process.env.EVREN_API_KEY!.trim();
  const baseUrl = getEvrenBaseUrl();
  const requestedModelId = getConfiguredEvrenModel(options.model);
  const candidates = buildEvrenCandidateModels(
    requestedModelId,
    options.prompt.length
  );

  const errors: string[] = [];

  for (const modelId of candidates) {
    const spec = getEvrenModelSpec(modelId);
    const attempt = await runSingleEvrenModel<T>(baseUrl, apiKey, spec, options);
    if (attempt.result) {
      return attempt.result;
    }
    if (attempt.error) {
      errors.push(`${modelId}: ${attempt.error}`);
    }
    if (!attempt.tryNextModel) {
      throw new Error(errors.join(" | "));
    }
  }

  throw new Error(errors.join(" | ") || "EVREN API yanıt veremedi.");
}
