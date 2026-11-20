/**
 * Model yanıtından olası <think> veya Markdown kod bloğu sarmalayıcılarını temizleyip
 * geçerli JSON nesnesini ayrıştırır.
 */
export function extractJsonObject<T>(rawText: string): T {
  let cleaned = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const sliced = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(sliced) as T;
    }
    throw new Error("Yanıtta geçerli JSON nesnesi bulunamadı.");
  }
}
