import { CourseCategory, QuizAttempt, QuizOptionKey, QuizQuestion } from "@/types/coach";

const TECHNICAL_KEYWORDS = [
  "algoritma",
  "kod",
  "programlama",
  "web",
  "html",
  "css",
  "javascript",
  "python",
  "java",
  "c#",
  "sql",
  "veritabanı",
  "veri tabanı",
  "excel",
  "işlem tablosu",
  "formül",
  "döngü",
  "değişken",
  "fonksiyon",
  "pseudocode",
  "akış şeması",
  "array",
  "dizi",
  "linux",
  "ağ",
  "php",
  "react",
];

/**
 * Ders adı ve/veya ünite metnine göre dersin Sözel mi Teknik mi olduğunu otomatik tespit eder.
 */
export function classifyCourseCategory(
  courseName: string,
  sampleText = ""
): CourseCategory {
  const combined = `${courseName} ${sampleText}`.toLocaleLowerCase("tr-TR");
  let techScore = 0;

  for (const keyword of TECHNICAL_KEYWORDS) {
    if (combined.includes(keyword)) {
      techScore += 1;
    }
  }

  // Kod sembolleri yoğunluğu kontrolü (parantez, etiket, Excel eşittir vb.)
  if (/(<[^>]+>|=\s*[A-ZÇĞİÖŞÜ]+\(|for\s*\(|while\s*\(|if\s*\()/i.test(sampleText)) {
    techScore += 2;
  }

  return techScore >= 1 ? "teknik" : "sozel";
}

/**
 * AÖF 4 yanlışın 1 doğruyu götürdüğü net puan hesaplama motoru.
 */
export function calculateAofNet(
  questions: QuizQuestion[],
  answers: Record<string, QuizOptionKey | "BOS">
): Pick<
  QuizAttempt,
  "correctCount" | "wrongCount" | "blankCount" | "netScore" | "estimatedPoints"
> {
  let correctCount = 0;
  let wrongCount = 0;
  let blankCount = 0;

  for (const q of questions) {
    const selected = answers[q.id];
    if (!selected || selected === "BOS") {
      blankCount += 1;
    } else if (selected === q.correctKey) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }
  }

  // Resmi AÖF kuralı: 4 yanlış 1 doğruyu götürür (her 1 yanlış = -0,25 net)
  const netScore = Number((correctCount - wrongCount / 4).toFixed(2));
  const total = questions.length || 1;
  const estimatedPoints = Math.max(0, Math.round((netScore / total) * 100));

  return {
    correctCount,
    wrongCount,
    blankCount,
    netScore,
    estimatedPoints,
  };
}

/** İki tarih arasındaki kalan gün sayısını hesaplar */
export function getDaysRemaining(targetIsoDate: string): number {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, day] = targetIsoDate.split("-").map(Number);
  if (!year || !month || !day) return 0;
  const target = new Date(year, month - 1, day);
  const diffMs = target.getTime() - todayMidnight.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/** Unit key helper */
export function makeUnitKey(courseId: string, unitNumber: number): string {
  return `${courseId}::${unitNumber}`;
}
