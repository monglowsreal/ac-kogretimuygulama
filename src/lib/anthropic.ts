import { extractJsonObject } from "@/lib/ai-utils";

export interface AnthropicCallOptions {
  baseUrl?: string;
  apiKey: string;
  model: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  systemInstruction: string;
  prompt: string;
  temperature: number;
}

interface AnthropicResponse {
  model?: string;
  content?: Array<{
    type?: string;
    text?: string;
    name?: string;
    input?: unknown;
  }>;
  error?: {
    message?: string;
    type?: string;
  };
}

export async function callAnthropicStructuredJson<T>(
  opts: AnthropicCallOptions
): Promise<{ data: T; model: string }> {
  const base = (opts.baseUrl?.trim() || "https://api.anthropic.com").replace(
    /\/+$/,
    ""
  );
  const endpoint = base.endsWith("/v1")
    ? `${base}/messages`
    : `${base}/v1/messages`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.apiKey.trim(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 16384,
      temperature: opts.temperature,
      system: opts.systemInstruction,
      messages: [{ role: "user", content: opts.prompt }],
      tools: [
        {
          name: opts.schemaName,
          description:
            "İstenen yapılandırılmış çalışma rehberi veya quiz JSON çıktısını döndür.",
          input_schema: opts.jsonSchema,
        },
      ],
      tool_choice: { type: "tool", name: opts.schemaName },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  const text = await res.text();
  let parsed: AnthropicResponse = {};
  try {
    parsed = JSON.parse(text) as AnthropicResponse;
  } catch {
    // ham hata kullanılacak
  }

  if (!res.ok) {
    const errMsg = parsed.error?.message || text.slice(0, 300) || res.statusText;
    throw new Error(`HTTP ${res.status}: ${errMsg}`);
  }

  const toolUse = parsed.content?.find(
    (b) => b.type === "tool_use" && b.input !== undefined
  );
  if (toolUse?.input && typeof toolUse.input === "object") {
    return {
      data: toolUse.input as T,
      model: parsed.model || opts.model,
    };
  }

  const textBlock = parsed.content?.find(
    (b) => b.type === "text" && typeof b.text === "string"
  );
  if (textBlock?.text) {
    return {
      data: extractJsonObject<T>(textBlock.text),
      model: parsed.model || opts.model,
    };
  }

  throw new Error("Claude API yapılandırılmış çıktı döndürmedi.");
}
