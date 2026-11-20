import type { Course } from "@/types/coach";

export const MIN_COURSE_UNITS = 1;
export const MAX_COURSE_UNITS = 24;
export const DEFAULT_TOTAL_UNITS = 8;

export interface CourseUnitConfigInput {
  totalUnits?: number;
  vizeUnits?: number[];
  finalUnits?: number[];
}

export interface NormalizedCourseUnits {
  totalUnits: number;
  unitNumbers: number[];
  vizeUnits: number[];
  finalUnits: number[];
  vizeSet: Set<number>;
  finalSet: Set<number>;
  vizeLabel: string;
  finalLabel: string;
}

export interface UnitExamInfo {
  inVize: boolean;
  inFinal: boolean;
  badgeText: string;
  shortText: string;
  tone: "both" | "vize" | "final" | "none";
}

export function clampTotalUnits(value?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_TOTAL_UNITS;
  }
  return Math.max(
    MIN_COURSE_UNITS,
    Math.min(MAX_COURSE_UNITS, Math.floor(value))
  );
}

export function buildUnitRange(start: number, end: number): number[] {
  if (end < start) return [];
  const result: number[] = [];
  for (let u = start; u <= end; u++) {
    result.push(u);
  }
  return result;
}

export function sanitizeUnitList(
  units: number[] | undefined,
  totalUnits: number
): number[] {
  if (!Array.isArray(units)) return [];
  const unique = new Set<number>();
  for (const raw of units) {
    const n = Math.floor(Number(raw));
    if (Number.isInteger(n) && n >= 1 && n <= totalUnits) {
      unique.add(n);
    }
  }
  return Array.from(unique).sort((a, b) => a - b);
}

export function getDefaultVizeUnits(totalUnits: number): number[] {
  const safeTotal = clampTotalUnits(totalUnits);
  const splitPoint = Math.ceil(safeTotal / 2);
  return buildUnitRange(1, splitPoint);
}

export function getDefaultFinalUnits(totalUnits: number): number[] {
  return buildUnitRange(1, clampTotalUnits(totalUnits));
}

/**
 * Bir ünite numarası listesini kısa okunabilir aralıklara dönüştürür (örn. "1–4", "1–2, 5").
 */
export function formatUnitRangeLabel(
  units: number[],
  emptyLabel = "Seçilmedi"
): string {
  if (units.length === 0) return emptyLabel;
  const sorted = Array.from(new Set(units)).sort((a, b) => a - b);
  const parts: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === rangeEnd + 1) {
      rangeEnd = sorted[i];
    } else {
      parts.push(
        rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}–${rangeEnd}`
      );
      rangeStart = sorted[i];
      rangeEnd = sorted[i];
    }
  }
  parts.push(
    rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}–${rangeEnd}`
  );
  return parts.join(", ");
}

/**
 * Eski kayıtlarla %100 geriye uyumlu olarak bir dersin toplam ünite sayısını
 * ve Vize / Final kapsamındaki ünite kümelerini normalize eder.
 */
export function getCourseUnitConfig(
  course?: Pick<Course, "totalUnits" | "vizeUnits" | "finalUnits"> | CourseUnitConfigInput | null
): NormalizedCourseUnits {
  const totalUnits = clampTotalUnits(course?.totalUnits);
  const unitNumbers = buildUnitRange(1, totalUnits);

  const vizeUnits =
    course?.vizeUnits !== undefined
      ? sanitizeUnitList(course.vizeUnits, totalUnits)
      : getDefaultVizeUnits(totalUnits);

  const finalUnits =
    course?.finalUnits !== undefined
      ? sanitizeUnitList(course.finalUnits, totalUnits)
      : getDefaultFinalUnits(totalUnits);

  return {
    totalUnits,
    unitNumbers,
    vizeUnits,
    finalUnits,
    vizeSet: new Set(vizeUnits),
    finalSet: new Set(finalUnits),
    vizeLabel: formatUnitRangeLabel(vizeUnits),
    finalLabel: formatUnitRangeLabel(finalUnits),
  };
}

/**
 * Toplam ünite sayısı değiştirildiğinde Vize/Final ünite seçimlerini akıllı şekilde günceller.
 */
export function resizeCourseUnitDraft(
  current: { totalUnits: number; vizeUnits: number[]; finalUnits: number[] },
  nextTotalRaw: number
): { totalUnits: number; vizeUnits: number[]; finalUnits: number[] } {
  const prevTotal = clampTotalUnits(current.totalUnits);
  const nextTotal = clampTotalUnits(nextTotalRaw);

  const prevVizeWasDefault =
    JSON.stringify(sanitizeUnitList(current.vizeUnits, prevTotal)) ===
    JSON.stringify(getDefaultVizeUnits(prevTotal));
  const prevFinalCoveredAll =
    sanitizeUnitList(current.finalUnits, prevTotal).length === prevTotal;

  let nextVize: number[];
  if (prevVizeWasDefault && prevFinalCoveredAll) {
    nextVize = getDefaultVizeUnits(nextTotal);
  } else {
    nextVize = sanitizeUnitList(current.vizeUnits, nextTotal);
  }

  let nextFinal = sanitizeUnitList(current.finalUnits, nextTotal);
  if (nextTotal > prevTotal && current.finalUnits.includes(prevTotal)) {
    const added = buildUnitRange(prevTotal + 1, nextTotal);
    nextFinal = sanitizeUnitList([...nextFinal, ...added], nextTotal);
  }

  return {
    totalUnits: nextTotal,
    vizeUnits: nextVize,
    finalUnits: nextFinal,
  };
}

export function getUnitExamInfo(
  unitNumber: number,
  vizeSet: Set<number>,
  finalSet: Set<number>
): UnitExamInfo {
  const inVize = vizeSet.has(unitNumber);
  const inFinal = finalSet.has(unitNumber);

  if (inVize && inFinal) {
    return {
      inVize,
      inFinal,
      badgeText: "Vize + Final Kapsamı",
      shortText: "Vize+Final",
      tone: "both",
    };
  }
  if (inVize) {
    return {
      inVize,
      inFinal,
      badgeText: "Sadece Vize Kapsamı",
      shortText: "Vize",
      tone: "vize",
    };
  }
  if (inFinal) {
    return {
      inVize,
      inFinal,
      badgeText: "Final Kapsamı",
      shortText: "Final",
      tone: "final",
    };
  }
  return {
    inVize,
    inFinal,
    badgeText: "Sınav Kapsamı Dışı",
    shortText: "Dışı",
    tone: "none",
  };
}
