import { NextRequest, NextResponse } from "next/server";
import {
  generateStructuredJson,
  getAiStatusSnapshot,
  JsonSchemaNode,
} from "@/lib/ai";
import {
  AiProviderPreference,
  ClientAiOverride,
  ComprehensionFeedbackItem,
  ComprehensionPromptItem,
} from "@/types/coach";

export const maxDuration = 60;

const generatePromptsSchema: JsonSchemaNode = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          topic: { type: "string" },
          question: {
            type: "string",
            description:
              "Öğrencinin kendi cümleleriyle özetleyip açıklamasını isteyen kısa açık uçlu soru",
          },
          expectedPointsHint: {
            type: "string",
            description: "Metinde geçen beklenen anahtar noktalar (kısa ipucu)",
          },
        },
        required: ["topic", "question", "expectedPointsHint"],
      },
    },
  },
  required: ["questions"],
};

const evaluateAnswersSchema: JsonSchemaNode = {
  type: "object",
  additionalProperties: false,
  properties: {
    feedback: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          scoreLabel: {
            type: "string",
            enum: ["tam", "kismi", "eksik"],
          },
          whatWasRight: { type: "string" },
          missingOrWrong: { type: "string" },
          sourceReference: {
            type: "string",
            description: "Ünitedeki dayanak başlık",
          },
        },
        required: [
          "id",
          "scoreLabel",
          "whatWasRight",
          "missingOrWrong",
          "sourceReference",
        ],
      },
    },
  },
  required: ["feedback"],
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      mode?: "generate" | "evaluate";
      courseName?: string;
      unitNumber?: number;
      unitText?: string;
      questions?: Array<ComprehensionPromptItem & { userAnswer: string }>;
      preferredProvider?: AiProviderPreference;
      evrenModel?: string;
      clientAiConfig?: ClientAiOverride;
    };

    const status = getAiStatusSnapshot(body.clientAiConfig);
    if (!status.configured) {
      return NextResponse.json(
        { error: "Hiçbir AI API anahtarı yapılandırılmamış." },
        { status: 503 }
      );
    }

    const courseName = body.courseName?.trim() || "AÖF Dersi";
    const unitNumber = Number(body.unitNumber) || 1;
    const unitText = body.unitText?.trim() || "";

    if (unitText.length < 50) {
      return NextResponse.json(
        { error: "Anlama kontrolü için ünite metni gereklidir." },
        { status: 400 }
      );
    }

    if (body.mode === "evaluate") {
      const submitted = Array.isArray(body.questions) ? body.questions : [];
      if (submitted.length === 0) {
        return NextResponse.json(
          { error: "Değerlendirilecek açık uçlu yanıt bulunamadı." },
          { status: 400 }
        );
      }

      const qaBlock = submitted
        .map(
          (item, i) =>
            `${i + 1}. [id=${item.id}] Konu: ${item.topic}\nSoru: ${item.question}\nÖğrencinin Cevabı: "${item.userAnswer || "(Boş)"}"`
        )
        .join("\n\n");

      const evalRes = await generateStructuredJson<{
        feedback?: ComprehensionFeedbackItem[];
      }>({
        schemaName: "aof_comprehension_evaluate",
        jsonSchema: evaluateAnswersSchema,
        systemInstruction:
          "Sen dürüst ve yapıcı bir AÖF çalışma koçusun. Öğrencinin kendi cümleleriyle verdiği yanıtları YALNIZCA verilen ünite metniyle karşılaştır. Doğru kısımları öv; metne göre eksik veya yanlış kalan noktaları net göster ve ünite başlığını dayanak olarak belirt. Her zaman Türkçe yaz.",
        prompt: `Ders: ${courseName} • Ünite ${unitNumber}\n\n${qaBlock}\n\n=== ÜNİTE METNİ ===\n"""\n${unitText.slice(0, 150000)}\n"""`,
        temperature: 0.25,
        preferredProvider: body.preferredProvider,
        evrenModel: body.evrenModel,
        clientAiConfig: body.clientAiConfig,
      });

      return NextResponse.json({
        feedback: evalRes.data.feedback ?? [],
        aiMeta: evalRes.aiMeta,
      });
    }

    const genRes = await generateStructuredJson<{
      questions?: Array<Omit<ComprehensionPromptItem, "id">>;
    }>({
      schemaName: "aof_comprehension_generate",
      jsonSchema: generatePromptsSchema,
      systemInstruction:
        "Sen bir AÖF çalışma koçusun. Quiz öncesinde öğrencinin konuyu gerçekten anlayıp anlamadığını ölçmek için ünite metninden tam 3 adet kısa, açık uçlu 'kendi cümlelerinle anlat' sorusu üret. Metinde olmayan bilgi sorma. Her zaman Türkçe yaz.",
      prompt: `Ders: ${courseName} • Ünite ${unitNumber}\n\n=== ÜNİTE METNİ ===\n"""\n${unitText.slice(0, 150000)}\n"""`,
      temperature: 0.3,
      preferredProvider: body.preferredProvider,
      evrenModel: body.evrenModel,
      clientAiConfig: body.clientAiConfig,
    });

    const questions: ComprehensionPromptItem[] = (genRes.data.questions ?? [])
      .slice(0, 3)
      .map((q, idx) => ({
        id: `comp-${Date.now().toString(36)}-${idx + 1}`,
        topic: q.topic,
        question: q.question,
        expectedPointsHint: q.expectedPointsHint,
      }));

    return NextResponse.json({ questions, aiMeta: genRes.aiMeta });
  } catch (err) {
    console.error("Anlama kontrolü hatası:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Anlama kontrolü sırasında hata oluştu.",
      },
      { status: 500 }
    );
  }
}
