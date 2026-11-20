import { AiProviderId } from "@/types/coach";

export type ProviderProtocol =
  | "gemini"
  | "evren"
  | "anthropic"
  | "openai_compatible";

export interface AiProviderPreset {
  id: AiProviderId;
  label: string;
  shortLabel: string;
  protocol: ProviderProtocol;
  defaultBaseUrl: string;
  defaultModel: string;
  envKeyName: string;
  requiresKey: boolean;
  keyHelpUrl: string;
  keyPlaceholder: string;
}

export const AI_PROVIDER_PRESETS: AiProviderPreset[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    shortLabel: "Gemini",
    protocol: "gemini",
    defaultBaseUrl: "",
    defaultModel: "gemini-2.5-flash",
    envKeyName: "GEMINI_API_KEY",
    requiresKey: true,
    keyHelpUrl: "https://aistudio.google.com/apikey",
    keyPlaceholder: "AIza... veya AQ....",
  },
  {
    id: "openai",
    label: "OpenAI (ChatGPT API)",
    shortLabel: "OpenAI",
    protocol: "openai_compatible",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4.1-mini",
    envKeyName: "OPENAI_API_KEY",
    requiresKey: true,
    keyHelpUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-proj-... veya sk-...",
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    shortLabel: "Claude",
    protocol: "anthropic",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-20250514",
    envKeyName: "ANTHROPIC_API_KEY",
    requiresKey: true,
    keyHelpUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-...",
  },
  {
    id: "groq",
    label: "Groq (Hızlı / Ücretsiz Katman)",
    shortLabel: "Groq",
    protocol: "openai_compatible",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    envKeyName: "GROQ_API_KEY",
    requiresKey: true,
    keyHelpUrl: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_...",
  },
  {
    id: "openrouter",
    label: "OpenRouter (Çoklu Model)",
    shortLabel: "OpenRouter",
    protocol: "openai_compatible",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    envKeyName: "OPENROUTER_API_KEY",
    requiresKey: true,
    keyHelpUrl: "https://openrouter.ai/keys",
    keyPlaceholder: "sk-or-v1-...",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    shortLabel: "DeepSeek",
    protocol: "openai_compatible",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    envKeyName: "DEEPSEEK_API_KEY",
    requiresKey: true,
    keyHelpUrl: "https://platform.deepseek.com/api_keys",
    keyPlaceholder: "sk-...",
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    shortLabel: "Grok",
    protocol: "openai_compatible",
    defaultBaseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-3-mini-fast",
    envKeyName: "XAI_API_KEY",
    requiresKey: true,
    keyHelpUrl: "https://console.x.ai/",
    keyPlaceholder: "xai-...",
  },
  {
    id: "mistral",
    label: "Mistral AI",
    shortLabel: "Mistral",
    protocol: "openai_compatible",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    envKeyName: "MISTRAL_API_KEY",
    requiresKey: true,
    keyHelpUrl: "https://console.mistral.ai/api-keys/",
    keyPlaceholder: "Mistral API anahtarı",
  },
  {
    id: "together",
    label: "Together AI",
    shortLabel: "Together",
    protocol: "openai_compatible",
    defaultBaseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    envKeyName: "TOGETHER_API_KEY",
    requiresKey: true,
    keyHelpUrl: "https://api.together.xyz/settings/api-keys",
    keyPlaceholder: "Together API anahtarı",
  },
  {
    id: "evren",
    label: "EVREN LLM",
    shortLabel: "EVREN",
    protocol: "evren",
    defaultBaseUrl: "https://evren-llmapi.ssyz.org.tr/v1",
    defaultModel: "deepseek-v4.1-flash",
    envKeyName: "EVREN_API_KEY",
    requiresKey: true,
    keyHelpUrl: "https://evren.ssyz.org.tr",
    keyPlaceholder: "evren_llm_...",
  },
  {
    id: "ollama",
    label: "Ollama (Yerel Ücretsiz)",
    shortLabel: "Ollama",
    protocol: "openai_compatible",
    defaultBaseUrl: "http://127.0.0.1:11434/v1",
    defaultModel: "llama3.1",
    envKeyName: "CUSTOM_AI_API_KEY",
    requiresKey: false,
    keyHelpUrl: "https://ollama.com/",
    keyPlaceholder: "Yerel kullanım (anahtar gerekmez)",
  },
  {
    id: "custom",
    label: "Diğer OpenAI-Uyumlu API (Özel URL)",
    shortLabel: "Özel AI",
    protocol: "openai_compatible",
    defaultBaseUrl: "",
    defaultModel: "gpt-4o-mini",
    envKeyName: "CUSTOM_AI_API_KEY",
    requiresKey: true,
    keyHelpUrl: "",
    keyPlaceholder: "Herhangi bir OpenAI-uyumlu API anahtarı",
  },
];

export const VALID_AI_PROVIDER_IDS: AiProviderId[] = AI_PROVIDER_PRESETS.map(
  (p) => p.id
);

export function isValidAiProviderId(val: unknown): val is AiProviderId {
  return (
    typeof val === "string" &&
    VALID_AI_PROVIDER_IDS.includes(val as AiProviderId)
  );
}

export function getProviderPreset(id: AiProviderId): AiProviderPreset {
  return (
    AI_PROVIDER_PRESETS.find((p) => p.id === id) ??
    AI_PROVIDER_PRESETS[AI_PROVIDER_PRESETS.length - 1]
  );
}

export function detectProviderFromKey(rawKey: string): {
  provider: AiProviderId;
  confident: boolean;
  hint?: string;
} {
  const key = rawKey.trim();
  if (!key) {
    return { provider: "gemini", confident: false };
  }
  if (key.startsWith("evren_llm_")) {
    return { provider: "evren", confident: true };
  }
  if (key.startsWith("AIza") || key.startsWith("AQ.")) {
    return { provider: "gemini", confident: true };
  }
  if (key.startsWith("sk-ant-")) {
    return { provider: "anthropic", confident: true };
  }
  if (key.startsWith("gsk_")) {
    return { provider: "groq", confident: true };
  }
  if (key.startsWith("sk-or-")) {
    return { provider: "openrouter", confident: true };
  }
  if (key.startsWith("xai-")) {
    return { provider: "xai", confident: true };
  }
  if (key.startsWith("sk-proj-") || key.startsWith("sk-svcacct-")) {
    return { provider: "openai", confident: true };
  }
  if (key.startsWith("sk-")) {
    return {
      provider: "openai",
      confident: false,
      hint: "sk- ön eki OpenAI veya DeepSeek anahtarı olabilir; farklıysa sağdan sağlayıcıyı seçebilirsin.",
    };
  }
  return {
    provider: "custom",
    confident: false,
    hint: "Özel sağlayıcı anahtarı; sağlayıcıyı ve gerekiyorsa Base URL / model adını seç.",
  };
}
