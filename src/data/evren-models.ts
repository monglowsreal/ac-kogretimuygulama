export interface EvrenModelSpec {
  id: string;
  label: string;
  contextLength: number;
  maxContextChars: number;
  defaultMaxOutputTokens: number;
  supportsResponseFormat: boolean;
  supportsThinkingToggle: boolean;
}

export const EVREN_DEFAULT_MODEL = "deepseek-v4.1-flash";

/**
 * EVREN /v1/models üzerinden doğrulanan sohbet ve analiz modelleri.
 */
export const EVREN_CHAT_MODELS: EvrenModelSpec[] = [
  {
    id: "deepseek-v4.1-flash",
    label: "DeepSeek V4.1 Flash (1M Bağlam • Önerilen)",
    contextLength: 1048576,
    maxContextChars: 302000,
    defaultMaxOutputTokens: 16384,
    supportsResponseFormat: true,
    supportsThinkingToggle: true,
  },
  {
    id: "qwen3.8-flash-next",
    label: "Qwen 3.8 Flash Next (256K Bağlam • Çok Hızlı)",
    contextLength: 262144,
    maxContextChars: 240000,
    defaultMaxOutputTokens: 16384,
    supportsResponseFormat: true,
    supportsThinkingToggle: true,
  },
  {
    id: "gemma-4-31b",
    label: "Gemma 4 31B (256K Bağlam • Hızlı)",
    contextLength: 262144,
    maxContextChars: 240000,
    defaultMaxOutputTokens: 16384,
    supportsResponseFormat: true,
    supportsThinkingToggle: true,
  },
  {
    id: "glm-5.3",
    label: "GLM 5.3 (512K Bağlam)",
    contextLength: 524288,
    maxContextChars: 302000,
    defaultMaxOutputTokens: 16384,
    supportsResponseFormat: true,
    supportsThinkingToggle: true,
  },
];
