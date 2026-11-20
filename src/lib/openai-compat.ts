import { extractJsonObject } from "@/lib/ai-utils";

export interface OpenAiCompatOptions {
  baseUrl: string;
  apiKey?: string;
  model: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  systemInstruction: string;
  prompt: string;
  temperature: number;
}

interface OpenAiCompatResponse {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
    code?: string | number;
  };
}

async function sendOpenAiCompatRequest(
  opts: OpenAiCompatOptions,
  mode: "json_schema" | "json_object" | "plain"
): Promise<{ content: string; model: string }> {
  const endpoint = `${opts.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const schemaPromptSuffix = `\n\nÖNEMLİ ÇIKTI FORMATI: Yanıtını MUTLAKA aşağıda tanımlı JSON şemasına birebir uyan tek ve geçerli bir JSON nesnesi olarak döndür. Markdown kod bloğu veya açıklama metni ekleme.\nBeklenen JSON Şeması:\n${JSON.stringify(
    opts.jsonSchema
  )}`;

  const systemText =
    mode === "json_schema"
      ? opts.systemInstruction
      : `${opts.systemInstruction}${schemaPromptSuffix}`;

  const body: Record<string, unknown> = {
    model: opts.model,
    messages: [
      { role: "system", content: systemText },
      { role: "user", content: opts.prompt },
    ],
    temperature: opts.temperature,
    max_tokens: 16384,
  };

  if (mode === "json_schema") {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: opts.schemaName,
        strict: false,
        schema: opts.jsonSchema,
      },
    };
  } else if (mode === "json_object") {
    body.response_format = { type: "json_object" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.apiKey?.trim()) {
    headers.Authorization = `Bearer ${opts.apiKey.trim()}`;
  }
  if (opts.baseUrl.includes("openrouter.ai")) {
    headers["X-Title"] = "AOF Akilli Calisma Kocu";
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  const text = await res.text();
  let parsed: OpenAiCompatResponse = {};
  try {
    parsed = JSON.parse(text) as OpenAiCompatResponse;
  } catch {
    // ham metin hata olarak kullanılacak
  }

  if (!res.ok) {
    const errMsg = parsed.error?.message || text.slice(0, 300) || res.statusText;
    const err = new Error(`HTTP ${res.status}: ${errMsg}`) as Error & {
      httpStatus?: number;
    };
    err.httpStatus = res.status;
    throw err;
  }

  const content = parsed.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Model yanıtı boş döndü.");
  }

  return {
    content,
    model: parsed.model || opts.model,
  };
}

export async function callOpenAiCompatibleJson<T>(
  opts: OpenAiCompatOptions
): Promise<{ data: T; model: string }> {
  const modes: Array<"json_schema" | "json_object" | "plain"> = [
    "json_schema",
    "json_object",
    "plain",
  ];

  let lastErr: unknown;
  for (let i = 0; i < modes.length; i += 1) {
    try {
      const res = await sendOpenAiCompatRequest(opts, modes[i]);
      return {
        data: extractJsonObject<T>(res.content),
        model: res.model,
      };
    } catch (err) {
      lastErr = err;
      const status = (err as { httpStatus?: number } | null)?.httpStatus;
      // 400/422 hatasında (bazı modeller/sağlayıcılar json_schema desteklemez) daha esnek formata düş
      if ((status === 400 || status === 422) && i < modes.length - 1) {
        continue;
      }
      throw err;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error("OpenAI-uyumlu sağlayıcıdan yanıt alınamadı.");
}
