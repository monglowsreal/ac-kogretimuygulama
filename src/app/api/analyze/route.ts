import { NextRequest, NextResponse } from "next/server";
import {
  generateStructuredJson,
  getAiStatusSnapshot,
  JsonSchemaNode,
} from "@/lib/ai";
import { classifyCourseCategory } from "@/lib/classifier";
import { detectUnitHeadings, findUncoveredHeadings } from "@/lib/coverage";
import {
  AiProviderPreference,
  ClientAiOverride,
  CourseCategory,
  StudyComparisonTable,
  StudyGuide,
  StudySectionNote,
} from "@/types/coach";

const sectionNoteSchema: JsonSchemaNode = {
  type: "object",
  additionalProperties: false,
  properties: {
    sectionTitle: {
      type: "string",
      description: "Ünitedeki ana veya alt konu başlığı",
    },
    whatToKnow: {
      type: "array",
      items: { type: "string" },
      description:
        "Bu başlık altında metinde geçen TÜM somut sınav bilgileri (kelimesi kelimesine yakın tanımlar, tarihler, yıllar, oranlar, kişi/kurum adları, istisnalar ve 'ancak/yalnızca/hariç/en az-en çok' gibi sınırlayıcı ifadeler). Özetlerken anlamı yumuşatma/genelleme ve 'anlatılır' yazma YASAK.",
    },
    examKeywords: {
      type: "array",
      items: { type: "string" },
      description: "Bu bölümde geçen kilit terim, kişi, tarih, komut veya etiketler",
    },
    likelyQuestionAngle: {
      type: "string",
      description:
        "AÖF sınavında bu bölümden sorunun nasıl ve hangi ayrım/tuzakla gelebileceği (dayanak başlık adıyla)",
    },
  },
  required: [
    "sectionTitle",
    "whatToKnow",
    "examKeywords",
    "likelyQuestionAngle",
  ],
};

const comparisonTableSchema: JsonSchemaNode = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      description: "Karşılaştırma tablosunun başlığı (ör. Simetrik vs Asimetrik Şifreleme)",
    },
    columns: {
      type: "array",
      items: { type: "string" },
      description: "Tablo sütun başlıkları (2-4 sütun)",
    },
    rows: {
      type: "array",
      description: "Karşılaştırılan satır değerleri",
      items: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
  required: ["title", "columns", "rows"],
};

const criticalConceptSchema: JsonSchemaNode = {
  type: "object",
  additionalProperties: false,
  properties: {
    term: { type: "string", description: "Kavram, kişi, komut veya terim adı" },
    definition: {
      type: "string",
      description: "Metindeki ifadeye sadık, eksiksiz ve sınav odaklı net tanım",
    },
    examTip: {
      type: "string",
      description:
        "AÖF sınavı tuzağı, sınırlayıcı istisna ('yalnızca/hariç' vb.) veya dayanak başlık ipucu",
    },
    importance: {
      type: "string",
      enum: ["yuksek", "orta"],
    },
  },
  required: ["term", "definition", "examTip", "importance"],
};

function buildStudyGuideSchema(studyPlan: JsonSchemaNode): JsonSchemaNode {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      unitSummary: {
        type: "string",
        description:
          "Ünitenin öğrenci dostu, metne tam sadık genel çerçeve özeti (2-3 paragraf).",
      },
      sectionNotes: {
        type: "array",
        items: sectionNoteSchema,
        description:
          "Ünitenin başından sonuna TÜM ana başlık ve alt başlıklarını sırayla kapsayan çalışma notları. Bir başlık altında 10-15 madde/tür varsa HER BİRİNİ eksiksiz kapsa; hiçbir türü, adımı veya son sayfalardaki konuyu atlama!",
      },
      comparisonTables: {
        type: "array",
        items: comparisonTableSchema,
        description:
          "Metinde karşılaştırma veya sınıflandırma varsa net tablo kartları (yoksa boş dizi [])",
      },
      criticalDetails: {
        type: "array",
        items: { type: "string" },
        description:
          "Sınavda Çıkabilecek Kritik Ayrıntılar: tarihler, sayılar, istisnalar, 'ancak/yalnızca/hariç/en az-en çok' sınırlamaları ve ince ayrımlar (5-12 madde).",
      },
      criticalConcepts: {
        type: "array",
        items: criticalConceptSchema,
        description:
          "Ünitedeki tüm kritik kavram, kişi ve terimleri kapsayan kartlar (sayı kısıtlaması yok; üniteye göre 6-18 arası).",
      },
      verificationNotes: {
        type: "array",
        items: { type: "string" },
        description:
          "Kitaptan Doğrulanması Gereken Yerler: metinde belirsiz, çelişkili, eksik veya PDF bozukluğu sebebiyle şüpheli noktalar varsa listele; her şey netse tek eleman olarak 'Şüpheli nokta bulunamadı' yaz.",
      },
      studyPlan,
    },
    required: [
      "unitSummary",
      "sectionNotes",
      "comparisonTables",
      "criticalDetails",
      "criticalConcepts",
      "verificationNotes",
      "studyPlan",
    ],
  };
}

const sozelSchema = buildStudyGuideSchema({
  type: "object",
  additionalProperties: false,
  properties: {
    approachTitle: {
      type: "string",
      description: "Sözel ders çalışma stratejisi başlığı",
    },
    actionSteps: {
      type: "array",
      items: { type: "string" },
      description: "Adım adım uygulanabilir 4-6 çalışma adımı",
    },
    keyDefinitionsFocus: {
      type: "array",
      items: { type: "string" },
      description: "Özellikle karşılaştırılarak odaklanılması gereken tanımlar ve farklar",
    },
    memorizationTips: {
      type: "array",
      items: { type: "string" },
      description: "Akılda tutmayı kolaylaştıran ezber / hafıza teknikleri ve ipuçları",
    },
  },
  required: [
    "approachTitle",
    "actionSteps",
    "keyDefinitionsFocus",
    "memorizationTips",
  ],
});

const teknikSchema = buildStudyGuideSchema({
  type: "object",
  additionalProperties: false,
  properties: {
    approachTitle: {
      type: "string",
      description: "Teknik / kodlama / formül odaklı çalışma yaklaşımı başlığı",
    },
    actionSteps: {
      type: "array",
      items: { type: "string" },
      description: "Adım adım teknik çalışma adımları",
    },
    codeBreakdowns: {
      type: "array",
      description:
        "Yalnızca metinde gerçekten geçen kod blokları, sözde kodlar, HTML/CSS yapıları veya Excel/VBA formülleri (metinde doğrudan kod yoksa boş dizi [] döndür, dışarıdan kod uydurma)",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          codeOrFormula: { type: "string" },
          language: { type: "string" },
          stepByStepLogic: {
            type: "array",
            items: { type: "string" },
          },
          commonTrap: {
            type: "string",
            description: "Öğrencilerin sınavda en sık düştüğü sözdizimi/mantık hatası",
          },
        },
        required: [
          "title",
          "codeOrFormula",
          "language",
          "stepByStepLogic",
          "commonTrap",
        ],
      },
    },
    practiceTasks: {
      type: "array",
      description: "Ünitedeki konulara dayalı 2-3 somut mini pratik görev",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          instruction: { type: "string" },
          expectedOutcome: { type: "string" },
        },
        required: ["title", "instruction", "expectedOutcome"],
      },
    },
  },
  required: [
    "approachTitle",
    "actionSteps",
    "codeBreakdowns",
    "practiceTasks",
  ],
});

const completionSchema: JsonSchemaNode = {
  type: "object",
  additionalProperties: false,
  properties: {
    sectionNotes: {
      type: "array",
      items: sectionNoteSchema,
    },
    criticalConcepts: {
      type: "array",
      items: criticalConceptSchema,
    },
  },
  required: ["sectionNotes", "criticalConcepts"],
};

type RawStudyGuidePayload = Partial<
  Omit<StudyGuide, "detectedCategory" | "generatedAt" | "aiMeta" | "coverageReport">
>;

function normalizeSectionNotes(
  rawNotes: StudyGuide["sectionNotes"]
): StudySectionNote[] {
  if (!Array.isArray(rawNotes)) return [];
  return rawNotes
    .filter(
      (item) => item && typeof item.sectionTitle === "string" && item.sectionTitle.trim()
    )
    .slice(0, 40)
    .map((item) => ({
      sectionTitle: item.sectionTitle.trim(),
      whatToKnow: Array.isArray(item.whatToKnow)
        ? item.whatToKnow.filter((w) => typeof w === "string" && w.trim())
        : [],
      examKeywords: Array.isArray(item.examKeywords)
        ? item.examKeywords.filter((k) => typeof k === "string" && k.trim())
        : [],
      likelyQuestionAngle:
        typeof item.likelyQuestionAngle === "string"
          ? item.likelyQuestionAngle.trim()
          : "",
    }));
}

function normalizeComparisonTables(
  rawTables: StudyGuide["comparisonTables"]
): StudyComparisonTable[] | undefined {
  if (!Array.isArray(rawTables) || rawTables.length === 0) return undefined;
  const cleaned = rawTables
    .filter(
      (t) =>
        t &&
        typeof t.title === "string" &&
        t.title.trim() &&
        Array.isArray(t.columns) &&
        t.columns.length >= 2 &&
        Array.isArray(t.rows) &&
        t.rows.length > 0
    )
    .slice(0, 6);
  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeStudyGuide(
  parsed: RawStudyGuidePayload,
  effectiveCategory: CourseCategory
): Omit<StudyGuide, "generatedAt" | "aiMeta" | "coverageReport"> {
  const plan = parsed.studyPlan;
  return {
    unitSummary: parsed.unitSummary?.trim() || "Ünite özeti oluşturuldu.",
    detectedCategory: effectiveCategory,
    sectionNotes: normalizeSectionNotes(parsed.sectionNotes),
    comparisonTables: normalizeComparisonTables(parsed.comparisonTables),
    criticalDetails: Array.isArray(parsed.criticalDetails)
      ? parsed.criticalDetails.filter((d) => typeof d === "string" && d.trim())
      : [],
    criticalConcepts: Array.isArray(parsed.criticalConcepts)
      ? parsed.criticalConcepts.slice(0, 25)
      : [],
    verificationNotes:
      Array.isArray(parsed.verificationNotes) && parsed.verificationNotes.length > 0
        ? parsed.verificationNotes.filter((v) => typeof v === "string" && v.trim())
        : ["Şüpheli nokta bulunamadı"],
    studyPlan: {
      approachTitle:
        plan?.approachTitle?.trim() ||
        (effectiveCategory === "teknik"
          ? "Teknik Çalışma Stratejisi"
          : "Sözel Çalışma Stratejisi"),
      actionSteps: Array.isArray(plan?.actionSteps) ? plan.actionSteps : [],
      memorizationTips: Array.isArray(plan?.memorizationTips)
        ? plan.memorizationTips
        : undefined,
      keyDefinitionsFocus: Array.isArray(plan?.keyDefinitionsFocus)
        ? plan.keyDefinitionsFocus
        : undefined,
      codeBreakdowns: Array.isArray(plan?.codeBreakdowns)
        ? plan.codeBreakdowns
        : undefined,
      practiceTasks: Array.isArray(plan?.practiceTasks)
        ? plan.practiceTasks
        : undefined,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      courseName?: string;
      category?: CourseCategory;
      unitNumber?: number;
      unitText?: string;
      contentMode?: "auto" | "full_unit" | "summary";
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
    const unitNumber = Number(body.unitNumber) || 1;
    const unitText = body.unitText?.trim() || "";

    if (unitText.length < 50) {
      return NextResponse.json(
        { error: "Analiz için en az 50 karakterlik ünite metni gereklidir." },
        { status: 400 }
      );
    }

    const effectiveCategory: CourseCategory =
      body.category === "sozel" || body.category === "teknik"
        ? body.category
        : classifyCourseCategory(courseName, unitText);

    const isFullUnit =
      body.contentMode === "full_unit" ||
      (body.contentMode !== "summary" && unitText.length >= 6000);

    // Büyük tam ünite PDF'lerini kesmeden analiz edebilmek için 300.000 karaktere kadar destekle
    const trimmedText = unitText.slice(0, 300000);
    const detectedHeadings = detectUnitHeadings(trimmedText);
    const checklistHeadings =
      detectedHeadings.length >= 3 && detectedHeadings.length <= 35
        ? detectedHeadings
        : [];

    const coreRules = `
1. KAYNAĞA %100 SADAKAT (EN ÖNEMLİ KURAL):
   - Yalnızca verilen ünite metnine dayan. Metinde olmayan tarihi, kişiyi, kodu, formülü veya dış bilgiyi kendi bilginden ekleme!
   - Metinde bir bilgi eksikse uydurma; zorunlu görürsen [Dış bilgi - kitaptan doğrula] veya "Emin değilim, kitaptan kontrol et" şeklinde açıkça belirt.
   - Hiçbir tarih, isim, sayı veya terimi tahmin etme; metinde nasıl geçiyorsa öyle yaz.

2. EKSİKSİZ NOT ÇIKARMA VE LİSTE KORUMA KURALI:
   - Metnin başından sonuna TÜM ana başlıkları, alt başlıkları, türleri, sınıflandırmaları ve maddeli listeleri eksiksiz işle. ASLA ilk birkaç türü yazıp sonlardaki türleri/bölümleri atlama!
   - Sayılan tüm liste öğelerini (ör. 6 algoritma özelliği, 11 algoritma türü, tüm HTML etiketleri, VBA nesneleri) TEK TEK adıyla ve açıklamasıyla sectionNotes içine al.
   - Aşağıdakileri mutlaka koru: kelimesi kelimesine yakın tanımlar, tarihler/yıllar/sayılar/oranlar, kişi/kurum adları, istisnalar ve "ancak, yalnızca, hariç, en az/en çok" gibi sınırlayıcı ifadeler.
   - Üstünkörü "bu bölümde X anlatılır" ifadesi YASAK; doğrudan öğretici somut bilgiyi yaz. Kısaltırken anlamı yumuşatma veya genelleme.
   - Karşılaştırma varsa comparisonTables içinde tablo olarak çıkar.
   - criticalDetails bölümüne "Sınavda Çıkabilecek Kritik Ayrıntılar" maddelerini ekle.

3. DOĞRULAMA VE DÜRÜSTLÜK:
   - Metindeki tarih, isim, sayı ve tanımları kontrol et. Belirsiz, çelişkili veya bozuk PDF satırı görürsen verificationNotes içine yaz; emin olduğun temiz metinlerde "Şüpheli nokta bulunamadı" yaz.`;

    const categorySpecificRule =
      effectiveCategory === "teknik"
        ? `- Ders TEKNİK/KODLAMA kategorisindedir: Yalnızca metinde geçen gerçek kod bloklarını, sözde kodları, HTML/CSS etiketlerini veya Excel/VBA formüllerini codeBreakdowns içinde parçala (metinde kod bloğu yoksa dışarıdan kod uydurma, codeBreakdowns dizisini boş [] bırak veya metindeki sözdizimi kurallarını sectionNotes içinde öğret). 2-3 pratik görev (practiceTasks) üret.`
        : `- Ders SÖZEL/KAVRAMSAL kategorisindedir: Öğrencinin karşılaştırması gereken ince tanım farklarını (keyDefinitionsFocus) ve kalıcı hafıza tekniklerini (memorizationTips) metindeki somut bilgilere dayanarak ver.`;

    const fullUnitNote = isFullUnit
      ? `\n- TAM ÜNİTE MODU: Uzun tam kitap ünitesi verilmiştir. Basım/ISBN/kaynakça/yan kutu gürültülerini ele ama son sayfalara kadar TÜM konu başlıklarını eksiksiz kapsa.`
      : "";

    const systemInstruction = `Sen AÖF ve üniversite sınavlarına hazırlanan öğrencinin titiz ve dürüst çalışma asistanısın. Her zaman Türkçe yaz.
${coreRules}
${categorySpecificRule}${fullUnitNote}`;

    const checklistBlock =
      checklistHeadings.length > 0
        ? `\n\nTESPiT EDİLEN ÜNİTE BAŞLIKLARI (HİÇBİRİNİ ATLAMADAN TAMAMINI sectionNotes İÇİNDE İŞLE):\n${checklistHeadings
            .map((h, i) => `${i + 1}. ${h}`)
            .join("\n")}`
        : "";

    const prompt = `Ders Adı: ${courseName}
Ünite Numarası: ${unitNumber} (${unitNumber <= 4 ? "Vize + Final Kapsamı" : "Final Kapsamı"})
Kategori: ${effectiveCategory === "teknik" ? "Teknik / Kodlama / Uygulamalı" : "Sözel / Kavramsal"}
İçerik Tipi: ${isFullUnit ? "Tam Ünite Metni (Kapsamlı)" : "Ünite Özeti / Ders Notu"}${checklistBlock}

Ünite İçeriği:
"""
${trimmedText}
"""`;

    const result = await generateStructuredJson<RawStudyGuidePayload>({
      schemaName:
        effectiveCategory === "teknik"
          ? "aof_teknik_study_guide_v3"
          : "aof_sozel_study_guide_v3",
      jsonSchema: effectiveCategory === "teknik" ? teknikSchema : sozelSchema,
      systemInstruction,
      prompt,
      temperature: 0.25,
      thinkingBudget: 0,
      preferredProvider: body.preferredProvider,
      evrenModel: body.evrenModel,
      clientAiConfig: body.clientAiConfig,
    });

    const normalized = normalizeStudyGuide(result.data, effectiveCategory);

    // Otomatik Kapsam Denetimi ve Eksik Başlık Tamamlama (2. Tur)
    let autoCompletedCount = 0;
    let remainingMissing = findUncoveredHeadings(checklistHeadings, normalized);

    if (remainingMissing.length > 0 && remainingMissing.length <= 15) {
      try {
        const repairPrompt = `İlk çalışma rehberinde ünitedeki şu başlıklar/konular eksik kalmış görünüyor:
${remainingMissing.map((h, i) => `${i + 1}. ${h}`).join("\n")}

GÖREVİN: Aşağıdaki ünite metnine %100 sadık kalarak YALNIZCA yukarıdaki eksik başlıklar için ayrıntılı sectionNotes kartları (ve gerekiyorsa criticalConcepts) üret. Metinde yoksa uydurma.

Ünite İçeriği:
"""
${trimmedText}
"""`;

        const repairRes = await generateStructuredJson<{
          sectionNotes?: StudySectionNote[];
          criticalConcepts?: StudyGuide["criticalConcepts"];
        }>({
          schemaName: "aof_study_guide_completion",
          jsonSchema: completionSchema,
          systemInstruction:
            "Sen titiz bir AÖF çalışma koçusun. Eksik kalan konu başlıkları için yalnızca verilen ünite metnine sadık somut Türkçe çalışma notları çıkar.",
          prompt: repairPrompt,
          temperature: 0.2,
          thinkingBudget: 0,
          preferredProvider: body.preferredProvider,
          evrenModel: body.evrenModel,
          clientAiConfig: body.clientAiConfig,
        });

        const addedSections = normalizeSectionNotes(repairRes.data.sectionNotes);
        if (addedSections.length > 0) {
          normalized.sectionNotes = [
            ...(normalized.sectionNotes ?? []),
            ...addedSections,
          ];
          autoCompletedCount = addedSections.length;
        }
        if (Array.isArray(repairRes.data.criticalConcepts)) {
          const existingTerms = new Set(
            normalized.criticalConcepts.map((c) => c.term.toLocaleLowerCase("tr-TR"))
          );
          for (const c of repairRes.data.criticalConcepts) {
            if (
              c?.term &&
              !existingTerms.has(c.term.toLocaleLowerCase("tr-TR")) &&
              normalized.criticalConcepts.length < 25
            ) {
              normalized.criticalConcepts.push(c);
            }
          }
        }

        remainingMissing = findUncoveredHeadings(checklistHeadings, normalized);
      } catch (repairErr) {
        console.warn("Eksik başlık tamamlama turu başarısız:", repairErr);
      }
    }

    const coveredHeadings =
      checklistHeadings.length > 0
        ? checklistHeadings.filter((h) => !remainingMissing.includes(h))
        : (normalized.sectionNotes ?? []).map((s) => s.sectionTitle);

    const guide: StudyGuide = {
      ...normalized,
      coverageReport: {
        coveredHeadings,
        missedHeadings: remainingMissing,
        ...(autoCompletedCount > 0 ? { autoCompletedCount } : {}),
      },
      generatedAt: new Date().toISOString(),
      aiMeta: result.aiMeta,
    };

    return NextResponse.json({ guide, aiMeta: result.aiMeta });
  } catch (err) {
    console.error("Çalışma rehberi üretim hatası:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Çalışma rehberi oluşturulurken sunucu hatası oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
