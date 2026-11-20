import { NextRequest, NextResponse } from "next/server";
import {
  generateStructuredJson,
  getAiStatusSnapshot,
  JsonSchemaNode,
} from "@/lib/ai";
import { classifyCourseCategory } from "@/lib/classifier";
import {
  AiProviderPreference,
  ClientAiOverride,
  CourseCategory,
  QuizDifficulty,
  QuizOptionKey,
  QuizQuestion,
  QuizQuestionType,
  QuizScope,
  StudyGuide,
} from "@/types/coach";

export const maxDuration = 60;

const VALID_KEYS: QuizOptionKey[] = ["A", "B", "C", "D", "E"];
const VALID_TYPES: QuizQuestionType[] = [
  "bilgi",
  "olumsuz",
  "oncul",
  "eslestirme",
  "ayirt_etme",
];
const VALID_DIFFS: QuizDifficulty[] = ["kolay", "orta", "zor"];

const quizSchema: JsonSchemaNode = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          topic: {
            type: "string",
            description: "Sorunun ölçtüğü alt konu başlığı (2-6 kelime)",
          },
          unitNumber: {
            type: "integer",
            description: "Sorunun ait olduğu ünite numarası",
          },
          guideReference: {
            type: "string",
            description:
              "Dayanak: Ünite numarası + Çalışma Rehberindeki bölüm veya kavram başlığı",
          },
          questionType: {
            type: "string",
            enum: ["bilgi", "olumsuz", "oncul", "eslestirme", "ayirt_etme"],
          },
          difficulty: {
            type: "string",
            enum: ["kolay", "orta", "zor"],
          },
          question: {
            type: "string",
            description: "AÖF sınav formatında net Türkçe soru kökü",
          },
          codeSnippet: {
            type: "string",
            description:
              "Varsa metne dayalı kod bloğu, HTML parçası veya Excel formülü; yoksa boş string",
          },
          correctKey: {
            type: "string",
            enum: ["A", "B", "C", "D", "E"],
          },
          distractorStrategy: {
            type: "string",
            description: "Bu sorudaki temel çeldirici mantığı",
          },
          options: {
            type: "array",
            description: "Tam olarak A, B, C, D, E şeklinde 5 şık",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                key: {
                  type: "string",
                  enum: ["A", "B", "C", "D", "E"],
                },
                text: { type: "string" },
                explanation: {
                  type: "string",
                  description:
                    "Şık harfini anmadan kavram üzerinden 1-2 kısa cümleyle neden doğru veya neden yanlış olduğunu açıkla",
                },
              },
              required: ["key", "text", "explanation"],
            },
          },
        },
        required: [
          "topic",
          "unitNumber",
          "guideReference",
          "questionType",
          "difficulty",
          "question",
          "codeSnippet",
          "correctKey",
          "distractorStrategy",
          "options",
        ],
      },
    },
  },
  required: ["questions"],
};

function formatStudyGuideContext(guide: Partial<StudyGuide>): string {
  const parts: string[] = [];

  if (guide.unitSummary?.trim()) {
    parts.push(`ÜNİTE ÖZETİ:\n${guide.unitSummary.trim()}`);
  }

  if (Array.isArray(guide.sectionNotes) && guide.sectionNotes.length > 0) {
    const sectionsText = guide.sectionNotes
      .map((sec, idx) => {
        const bullets = (sec.whatToKnow ?? []).map((w) => `  - ${w}`).join("\n");
        const keywords = (sec.examKeywords ?? []).join(", ");
        return `${idx + 1}. BÖLÜM: ${sec.sectionTitle}\n${bullets}${
          keywords ? `\n  Anahtar Terimler: ${keywords}` : ""
        }${
          sec.likelyQuestionAngle
            ? `\n  Sınav Açısı: ${sec.likelyQuestionAngle}`
            : ""
        }`;
      })
      .join("\n\n");
    parts.push(`BÖLÜM BÖLÜM ÇALIŞMA NOTLARI:\n${sectionsText}`);
  }

  if (
    Array.isArray(guide.criticalDetails) &&
    guide.criticalDetails.length > 0
  ) {
    parts.push(
      `SINAVDA ÇIKABİLECEK KRİTİK AYRINTILAR:\n${guide.criticalDetails
        .map((d) => `- ${d}`)
        .join("\n")}`
    );
  }

  if (
    Array.isArray(guide.criticalConcepts) &&
    guide.criticalConcepts.length > 0
  ) {
    const conceptsText = guide.criticalConcepts
      .map((c) => `- ${c.term}: ${c.definition} (Sınav İpucu: ${c.examTip})`)
      .join("\n");
    parts.push(`KRİTİK KAVRAMLAR:\n${conceptsText}`);
  }

  if (guide.studyPlan?.keyDefinitionsFocus?.length) {
    parts.push(
      `ODAKLANILACAK TANIMLAR VE FARKLAR:\n${guide.studyPlan.keyDefinitionsFocus
        .map((d) => `- ${d}`)
        .join("\n")}`
    );
  }

  if (guide.studyPlan?.codeBreakdowns?.length) {
    const codesText = guide.studyPlan.codeBreakdowns
      .map(
        (b) =>
          `- ${b.title} (${b.language}):\n${b.codeOrFormula}\n  Mantık: ${b.stepByStepLogic.join(
            " | "
          )}\n  Sık Tuzak: ${b.commonTrap}`
      )
      .join("\n\n");
    parts.push(`KOD VE FORMÜL ANALİZLERİ:\n${codesText}`);
  }

  return parts.join("\n\n").slice(0, 70000);
}

/**
 * Aynı doğru şık harfinin art arda gelmesini ve harf yığılmasını önler.
 */
function rebalanceAnswerKeys(questions: QuizQuestion[]): QuizQuestion[] {
  let prevKey: QuizOptionKey | null = null;
  const counts: Record<QuizOptionKey, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  return questions.map((q) => {
    const safeToSwap =
      !/(şık|seçenek)\s+[A-E]/i.test(q.question) &&
      !q.options.some((o) => /\b(A|B|C|D|E)\s+şıkk/i.test(o.explanation));

    if (!safeToSwap || q.options.length !== 5) {
      prevKey = q.correctKey;
      counts[q.correctKey] += 1;
      return q;
    }

    // Aynı harf art arda gelirse veya başka bir harf hiç kullanılmadıysa dengeli hedef seç
    let targetKey = q.correctKey;
    if (targetKey === prevKey || counts[targetKey] > Math.ceil(questions.length / 4)) {
      const sorted = [...VALID_KEYS]
        .filter((k) => k !== prevKey)
        .sort((a, b) => counts[a] - counts[b]);
      if (sorted[0]) targetKey = sorted[0];
    }

    if (targetKey !== q.correctKey) {
      const currentOpt = q.options.find((o) => o.key === q.correctKey);
      const swapOpt = q.options.find((o) => o.key === targetKey);
      if (currentOpt && swapOpt) {
        const swappedOptions = q.options.map((opt) => {
          if (opt.key === q.correctKey) {
            return { ...swapOpt, key: q.correctKey };
          }
          if (opt.key === targetKey) {
            return { ...currentOpt, key: targetKey };
          }
          return opt;
        });
        prevKey = targetKey;
        counts[targetKey] += 1;
        return {
          ...q,
          options: swappedOptions,
          correctKey: targetKey,
        };
      }
    }

    prevKey = q.correctKey;
    counts[q.correctKey] += 1;
    return q;
  });
}

function clampQuestionCount(rawCount?: number): number {
  const n = Number(rawCount) || 5;
  if ([5, 10, 15, 20, 25].includes(n)) return n;
  return Math.min(25, Math.max(5, Math.round(n)));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      courseName?: string;
      category?: CourseCategory;
      unitNumber?: number;
      unitText?: string;
      questionCount?: number;
      contentMode?: "auto" | "full_unit" | "summary";
      quizScope?: QuizScope;
      studyGuide?: Partial<StudyGuide>;
      weakTopics?: string[];
      unitsPayload?: Array<{
        unitNumber: number;
        unitText: string;
        studyGuide?: Partial<StudyGuide>;
      }>;
      preferredProvider?: AiProviderPreference;
      evrenModel?: string;
      clientAiConfig?: ClientAiOverride;
    };

    const status = getAiStatusSnapshot(body.clientAiConfig);
    if (!status.configured) {
      return NextResponse.json(
        {
          error:
            "Hiçbir AI API anahtarı yapılandırılmamış. Lütfen API Ayarları ekranından geçerli bir API anahtarı girin.",
        },
        { status: 503 }
      );
    }

    const courseName = body.courseName?.trim() || "AÖF Dersi";
    const questionCount = clampQuestionCount(body.questionCount);
    const isMultiUnitExam =
      Array.isArray(body.unitsPayload) && body.unitsPayload.length > 0;

    let combinedRawText = "";
    let primaryUnitNumber = Number(body.unitNumber) || 1;
    let combinedGuideContext = "";

    if (isMultiUnitExam) {
      const validUnits = body.unitsPayload!.filter(
        (u) => u && u.unitText && u.unitText.trim().length >= 50
      );
      if (validUnits.length === 0) {
        return NextResponse.json(
          { error: "Deneme sınavı için en az 1 yüklü ünite metni gereklidir." },
          { status: 400 }
        );
      }
      primaryUnitNumber = validUnits[0].unitNumber;
      const perUnitBudget = Math.floor(280000 / validUnits.length);
      combinedRawText = validUnits
        .map(
          (u) =>
            `=== ÜNİTE ${u.unitNumber} METNİ ===\n${u.unitText.trim().slice(0, perUnitBudget)}`
        )
        .join("\n\n");
      const guideParts = validUnits
        .filter((u) => u.studyGuide)
        .map(
          (u) =>
            `=== ÜNİTE ${u.unitNumber} REHBERİ ===\n${formatStudyGuideContext(
              u.studyGuide!
            ).slice(0, Math.floor(60000 / validUnits.length))}`
        );
      combinedGuideContext = guideParts.join("\n\n");
    } else {
      const unitText = body.unitText?.trim() || "";
      if (unitText.length < 50) {
        return NextResponse.json(
          { error: "Quiz üretmek için en az 50 karakterlik ünite metni gereklidir." },
          { status: 400 }
        );
      }
      combinedRawText = unitText.slice(0, 300000);
      if (body.studyGuide) {
        combinedGuideContext = formatStudyGuideContext(body.studyGuide);
      }
    }

    const effectiveCategory: CourseCategory =
      body.category === "sozel" || body.category === "teknik"
        ? body.category
        : classifyCourseCategory(courseName, combinedRawText);

    const isFullUnit =
      body.contentMode === "full_unit" ||
      (body.contentMode !== "summary" && combinedRawText.length >= 6000);

    const hasGuideContext = combinedGuideContext.trim().length > 40;
    const quizScope: QuizScope =
      body.quizScope === "full_text" ? "full_text" : "guide_aligned";
    const useGuideAligned = hasGuideContext && quizScope === "guide_aligned";

    const weakTopics = Array.isArray(body.weakTopics)
      ? body.weakTopics.filter((t) => typeof t === "string" && t.trim())
      : [];

    const weakTopicsRule =
      weakTopics.length > 0
        ? `\n6. ARALIKLI TEKRAR VE ZAYIF KONU ODAĞI:\n   - Soruları ağırlıklı olarak şu zayıf konular üzerine kur: ${weakTopics.join(
            ", "
          )}.\n   - Aynı bilgiyi ezberden sormak yerine farklı senaryo, olumsuz kök veya öncüllü formatla sor.`
        : "";

    const scopeGroundingRule = useGuideAligned
      ? `5. MUTLAK REHBERE VE KAYNAĞA BAĞLILIK KURALI:
   - Her soru MUTLAKA ve YALNIZCA aşağıda verilen Çalışma Rehberi'nde öğretilen bilgileri ölçmelidir (rehberde adı, kuralı veya tanımı geçmeyen gizli satır arası detayları ASLA sorma!).
   - Ünite metni dışından dış bilgi ekleme.
   - guideReference alanına mutlaka "Ünite X • Bölüm/Kavram Adı" şeklinde net dayanak yaz.`
      : `5. MUTLAK KAYNAK SADAKATİ KURALI:
   - Tüm sorular ve doğru yanıtlar YALNIZCA aşağıda verilen ünite metnine dayanmalıdır. Metinde açıkça yer almayan hiçbir bilgiyi sorma!
   - Soruları tek başlığa yığma; ünitenin tüm başlıklarına (ve çoklu üniteyse tüm ünitelere) eşit dağıt.
   - "Kendimizi Sınayalım" testlerini birebir kopyalama; kitaptaki ifadeleri koruyarak özgün sorular kur.
   - guideReference alanına sorunun geçtiği "Ünite X • Alt Başlık" dayanağını yaz.`;

    const systemInstruction = `Sen AÖF ve üniversite sınav formatında soru hazırlayan uzman ölçme-değerlendirme hocasısın.
Görevin: Verilen metne %100 sadık kalarak tam olarak ${questionCount} adet, 5 şıklı (A, B, C, D, E) tek doğru cevaplı AÖF sınav sorusu üretmek.

KRİTİK KURALLAR:
1. SORU ÇEŞİTLİLİĞİ (TÜM TİPLERİ KARIŞTIR):
   - Doğrudan bilgi sorusu ("bilgi")
   - Olumsuz kök: "Aşağıdakilerden hangisi yanlıştır / doğru değildir / ... biri değildir?" ("olumsuz")
   - Öncüllü soru: "I. ... II. ... III. ... Yukarıdakilerden hangileri doğrudur?" ("oncul")
   - Eşleştirme / sıralama / adım mantığı ("eslestirme")
   - Kavram ve tanım ayırt etme ("ayirt_etme")
2. ZORLUK VE ŞIK DAĞILIMI:
   - Zorluk dağılımı yaklaşık %30 kolay, %50 orta, %20 zor olsun.
   - Çeldiriciler açıkça saçma olmasın; metindeki gerçek kavramlardan üretilmiş mantıklı ve yakın tuzaklar olsun.
   - Doğru cevap harfleri (A, B, C, D, E) dengeli dağılsın ve aynı harf art arda tekrarlanmasın.
3. KENDİ KENDİNE DOĞRULAMA:
   - Her soruyu yazarken kontrol et: Gerçekten tek doğru cevap var mı ve metinle birebir uyumlu mu? Emin değilsen o soruyu üretme.
4. TEKNİK/SÖZEL STRATEJİ VE GEREKÇE:
   - ${
     effectiveCategory === "teknik"
       ? "TEKNİK derslerde döngü sınır hatası (< vs <=), yanlış HTML etiketi/özniteliği, Excel ';' vs ',' farkı, 'Set' anahtar sözcüğü gibi gerçek tuzakları kullan; kod içeren sorularda codeSnippet alanını metne sadık doldur."
       : "SÖZEL derslerde yakın kavram farkları, sınırlayıcı kelimeler ('yalnızca, hariç, ilk') ve ince tanım ayrımları üzerine kur."
   }
   - Tüm metinler Türkçe olmalıdır (Yabancı Dil I dersinde İngilizce cümle içerebilir ama soru kökü ve gerekçeler Türkçe olsun).
   - Her şıkkın explanation alanında "A şıkkı" diye harf anmadan 1-2 net cümleyle neden doğru veya yanlış olduğunu açıkla.
${scopeGroundingRule}${weakTopicsRule}`;

    const prompt = useGuideAligned
      ? `Ders: ${courseName}
Mod: ${
          isMultiUnitExam
            ? "Çoklu Ünite Deneme Sınavı (Rehber Odaklı)"
            : `Ünite ${primaryUnitNumber} • Rehbere Birebir Uyumlu`
        }
Kategori: ${effectiveCategory === "teknik" ? "Teknik / Kodlama" : "Sözel / Kavramsal"}
İstenen Soru Sayısı: ${questionCount}

=== ÇALIŞMA REHBERİ (TEMEL SORU HAVUZU) ===
${combinedGuideContext}

=== HAM ÜNİTE METNİ (YALNIZCA BAĞLAM DOĞRULAMA REFERANSI — REHBER DIŞI DETAY SORMA) ===
"""
${combinedRawText.slice(0, 140000)}
"""`
      : `Ders: ${courseName}
Mod: ${
          isMultiUnitExam
            ? "Çoklu Ünite Deneme Sınavı"
            : `Ünite ${primaryUnitNumber} • ${isFullUnit ? "Tam Ünite" : "Ünite Özeti"}`
        }
Kategori: ${effectiveCategory === "teknik" ? "Teknik / Kodlama" : "Sözel / Kavramsal"}
İstenen Soru Sayısı: ${questionCount}

Ünite İçeriği:
"""
${combinedRawText}
"""`;

    const result = await generateStructuredJson<{
      questions?: Array<Omit<QuizQuestion, "id">>;
    }>({
      schemaName: "aof_quiz_questions_v3",
      jsonSchema: quizSchema,
      systemInstruction,
      prompt,
      temperature: 0.35,
      preferredProvider: body.preferredProvider,
      evrenModel: body.evrenModel,
      clientAiConfig: body.clientAiConfig,
    });

    const rawQuestions = Array.isArray(result.data.questions)
      ? result.data.questions
      : [];

    const normalizedRaw: QuizQuestion[] = rawQuestions
      .slice(0, questionCount)
      .map((q, index) => {
        const opts = Array.isArray(q.options) ? q.options : [];
        const optionMap = new Map(opts.map((o) => [o.key, o]));
        const options = VALID_KEYS.map((key, oIdx) => {
          const matched = optionMap.get(key) ?? opts[oIdx];
          return {
            key,
            text: matched?.text || `Seçenek ${key}`,
            explanation:
              matched?.explanation || "Bu seçenek için açıklama sağlanmadı.",
          };
        });

        const correctKey: QuizOptionKey = VALID_KEYS.includes(q.correctKey)
          ? q.correctKey
          : "A";

        const unitNum =
          typeof q.unitNumber === "number" && q.unitNumber >= 1
            ? q.unitNumber
            : primaryUnitNumber;

        return {
          id: `q-${Date.now().toString(36)}-${index + 1}`,
          topic: q.topic?.trim() || `Ünite ${unitNum} Konusu`,
          unitNumber: unitNum,
          guideReference: q.guideReference?.trim() || `Ünite ${unitNum}`,
          questionType:
            q.questionType && VALID_TYPES.includes(q.questionType)
              ? q.questionType
              : "bilgi",
          difficulty:
            q.difficulty && VALID_DIFFS.includes(q.difficulty)
              ? q.difficulty
              : "orta",
          question: q.question,
          codeSnippet: q.codeSnippet?.trim() ? q.codeSnippet : undefined,
          options,
          correctKey,
          distractorStrategy:
            q.distractorStrategy?.trim() || "AÖF Çeldirici Analizi",
        };
      });

    if (normalizedRaw.length === 0) {
      throw new Error("Quiz soruları beklenen formatta üretilemedi.");
    }

    const normalized = rebalanceAnswerKeys(normalizedRaw);

    return NextResponse.json({ questions: normalized, aiMeta: result.aiMeta });
  } catch (err) {
    console.error("Quiz üretim hatası:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Quiz oluşturulurken sunucu hatası oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
