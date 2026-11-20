import { StudyGuide } from "@/types/coach";

const BOILERPLATE_HEADING_RE =
  /^(giriş|amaçlarımız|amaç|özet|kaynakça|kendimizi sınayalım|yanıt anahtarı|cevap anahtarı|sıra sizde|anahtar sözcükler|okuma parçası|öğrenme çıktısı|araştır|ilişkilendir|anlat\/paylaş|yaşamla ilişkilendir|birlikte düşünelim|neler öğreneceğiz|üniteye hazırlık|internet|kitabınızın|şekil\s+\d|tablo\s+\d|ünite\s+\d+|bölüm\s+\d+|unit\s+\d+|lesson\s+[a-z]|before you begin|discussion|grammar|vocabulary|speaking|reading|writing|listening|http|\d+)/i;

const QUIZ_OPTION_RE = /^[A-E]\.\s+/;

const GLUED_PAGE_NUM_RE = /[a-zçğıöşü]{2,}\d{1,3}$/;

const CITATION_LINE_RE = /\(\d{4}\)/;

const CODE_LINE_RE =
  /(^(Sub|Function|Dim|Set|End|If|Else|For|Next|While|Do|Loop|Return|Public|Private|Option|On Error|Exit Sub|Exit Function|MsgBox)\b|[={};<>_]|\(\))/;

const COURSE_CODE_HEADER_RE = /^[A-ZÇĞİÖŞÜ]{2,5}\d{2,4}[A-Z]?-|\bÜnite\s+\d+:/i;

const GENERIC_TOPIC_WORDS = new Set([
  "algoritma",
  "algoritmalar",
  "algoritması",
  "algoritmaları",
  "algoritmasının",
  "algoritmaların",
  "kavramı",
  "kavramlar",
  "özellikleri",
  "türleri",
  "yapısı",
  "yapıları",
  "yöntemleri",
  "temelleri",
  "gelişimi",
  "doğuşu",
  "yükselişi",
  "geleceği",
  "nedir",
  "genel",
  "temel",
  "bilgisi",
  "örnek",
  "örnekleri",
  "teknolojisi",
  "teknolojileri",
  "teknolojisinin",
  "teknolojilerinin",
  "yönetimi",
  "iletişim",
  "sistemleri",
  "sunucuları",
  "programlama",
]);

/**
 * AÖF PDF veya metin içindeki müstakil bölüm/alt başlık satırlarını tespit eder.
 */
export function detectUnitHeadings(unitText: string): string[] {
  const lines = unitText.split(/\r?\n/).map((l) => l.trim());
  const seen = new Set<string>();
  const headings: string[] = [];

  for (const line of lines) {
    if (line.length < 6 || line.length > 75) continue;
    if (!/^[A-ZÇĞİÖŞÜ]/.test(line)) continue;
    if (/[.!?;,•\-–—:]$/.test(line)) continue;
    if (BOILERPLATE_HEADING_RE.test(line)) continue;
    if (QUIZ_OPTION_RE.test(line)) continue;
    if (GLUED_PAGE_NUM_RE.test(line)) continue;
    if (CITATION_LINE_RE.test(line)) continue;
    if (CODE_LINE_RE.test(line)) continue;
    if (COURSE_CODE_HEADER_RE.test(line)) continue;
    // Yarım kalmış parantez veya listelenen öbekler genelde başlık değil cümle parçasıdır
    const openParens = (line.match(/\(/g) ?? []).length;
    const closeParens = (line.match(/\)/g) ?? []).length;
    if (openParens !== closeParens) continue;
    if ((line.match(/,/g) ?? []).length >= 2) continue;

    if (/^[A-ZÇĞİÖŞÜ\s\d]{5,}$/.test(line) && line.split(/\s+/).length < 2) {
      continue;
    }

    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 9) continue;

    const capitalizedCount = words.filter((w) =>
      /^[A-ZÇĞİÖŞÜ(]/.test(w)
    ).length;
    if (capitalizedCount / words.length < 0.7) continue;

    const normKey = line.toLocaleLowerCase("tr-TR");
    if (!seen.has(normKey)) {
      seen.add(normKey);
      headings.push(line);
    }
  }

  return headings;
}

function buildGuideSearchBlob(guide: Pick<StudyGuide, "sectionNotes">): string {
  const parts: string[] = [];

  for (const sec of guide.sectionNotes ?? []) {
    parts.push(sec.sectionTitle || "");
    parts.push(...(sec.whatToKnow ?? []));
    parts.push(...(sec.examKeywords ?? []));
    parts.push(sec.likelyQuestionAngle || "");
  }

  return parts.join("\n").toLocaleLowerCase("tr-TR");
}

function extractDistinctiveStem(word: string): string {
  const lower = word.toLocaleLowerCase("tr-TR");
  // Türkçe ekli kelimelerde kök eşleşmesi için makul ön ek uzunluğu
  return lower.length > 6 ? lower.slice(0, 6) : lower;
}

/**
 * Ünite metnindeki başlıklardan, oluşturulan çalışma rehberinde hiç geçmeyenleri döndürür.
 */
export function findUncoveredHeadings(
  headings: string[],
  guide: Pick<StudyGuide, "unitSummary" | "sectionNotes" | "criticalConcepts" | "studyPlan">
): string[] {
  if (headings.length === 0) return [];
  const blob = buildGuideSearchBlob(guide);
  const missing: string[] = [];

  for (const heading of headings) {
    const tokens = heading
      .replace(/[()'"“”‘’.,:/–—-]/g, " ")
      .split(/\s+/)
      .map((t) => t.toLocaleLowerCase("tr-TR"))
      .filter((t) => t.length >= 4 && !GENERIC_TOPIC_WORDS.has(t));

    if (tokens.length === 0) continue;

    const matchedCount = tokens.filter((tok) =>
      blob.includes(extractDistinctiveStem(tok))
    ).length;

    // Ayırt edici kelimelerden hiçbiri geçmiyorsa başlık rehberde eksik kalmış demektir
    if (matchedCount === 0) {
      missing.push(heading);
    }
  }

  return missing;
}
